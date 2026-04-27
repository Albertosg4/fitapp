import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireSocio } from '@/lib/auth/requireSocio'
import { isMembresiaValida } from '@/lib/domain/membresias'

/**
 * Crea un cliente Supabase autenticado como el usuario real.
 *
 * Por qué NO usar supabaseAdmin para la RPC:
 *   supabaseAdmin usa la service_role key, que bypasea auth.
 *   Cuando PostgreSQL ejecuta la RPC con service_role, auth.uid() = NULL.
 *   La función toggle_reserva depende de auth.uid() para identificar al socio.
 *
 * Solución: crear un cliente con la anon key e inyectar el JWT del usuario
 *   en el header Authorization. PostgREST lo reenvía a PostgreSQL, que
 *   lo decodifica y popula auth.uid() con el sub del token.
 *
 * Este cliente tiene los permisos del usuario (RLS activo),
 * NO los permisos de service_role.
 */
function createUserClient(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      auth: {
        persistSession: false,   // servidor: no persistir sesión en memoria
        autoRefreshToken: false, // servidor: no refrescar token automáticamente
      },
    }
  )
}

/**
 * Mapea el mensaje de error de la RPC al HTTP status correcto.
 */
function rpcErrorStatus(msg: string | undefined): number {
  if (!msg) return 500
  if (msg.includes('caducad') || msg.includes('activ') || msg.includes('otro gimnasio')) return 403
  if (msg.includes('Aforo'))       return 409
  if (msg.includes('no encontrad')) return 404
  if (msg.includes('cancelada'))  return 400
  if (msg.includes('Ya tienes'))  return 409
  return 400
}

/**
 * POST /api/reservas/toggle
 *
 * Estrategia:
 * 1. requireSocio valida el Bearer token y devuelve userId/gymId/membresía.
 * 2. Se crea un cliente Supabase con la anon key + JWT del usuario.
 *    Con este cliente, auth.uid() en PostgreSQL = userId real del socio.
 * 3. Se llama a la RPC toggle_reserva con ese cliente autenticado.
 *    Si la RPC no existe (PGRST202 / función no encontrada), se cae al
 *    fallback JS que usa supabaseAdmin pero aplica las mismas validaciones.
 * 4. El fallback NO usa auth.uid() — trabaja con userId extraído del token
 *    via requireSocio, por lo que es seguro aunque use service_role.
 */
export async function POST(req: Request) {
  // 1. Validar socio y extraer token + contexto
  const authHeader = req.headers.get('Authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

  const socioResult = await requireSocio(req)
  if (socioResult.error) return socioResult.error
  const { userId, gymId, membresiaActiva, membresiaVence } = socioResult.context

  // 2. Validar membresía antes de tocar BD
  if (!isMembresiaValida({ membresia_activa: membresiaActiva, membresia_vence: membresiaVence })) {
    return NextResponse.json(
      { error: 'Tu membresía ha caducado o no está activa. Renuévala para reservar.' },
      { status: 403 }
    )
  }

  // 3. Validar payload
  let horarioId: string
  let fecha: string
  try {
    const body = await req.json()
    horarioId = body.horarioId
    fecha = body.fecha
  } catch {
    return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
  }

  if (!horarioId || typeof horarioId !== 'string') {
    return NextResponse.json({ error: 'horarioId requerido' }, { status: 400 })
  }
  if (!fecha || typeof fecha !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return NextResponse.json({ error: 'fecha requerida (YYYY-MM-DD)' }, { status: 400 })
  }

  // 4. Intentar RPC atómica con cliente autenticado como el usuario real
  //    token siempre existe aquí porque requireSocio ya lo validó
  if (token) {
    const supabaseUser = createUserClient(token)

    const { data: rpcData, error: rpcError } = await supabaseUser.rpc('toggle_reserva', {
      p_horario_id: horarioId,
      p_fecha: fecha,
    })

    const rpcNoExiste =
      rpcError != null && (
        rpcError.code === 'PGRST202' ||
        rpcError.message?.includes('toggle_reserva') ||
        rpcError.message?.includes('does not exist') ||
        rpcError.message?.includes('Could not find')
      )

    if (!rpcError && rpcData !== null) {
      // RPC ejecutada — interpretar resultado
      const res = rpcData as { ok: boolean; error?: string; accion?: string; sesion_id?: string }
      if (!res.ok) {
        return NextResponse.json({ error: res.error }, { status: rpcErrorStatus(res.error) })
      }
      return NextResponse.json({ ok: true, accion: res.accion, sesionId: res.sesion_id })
    }

    if (rpcError && !rpcNoExiste) {
      // Error real de BD (no "función no encontrada")
      console.error('[reservas/toggle] RPC error:', rpcError.message)
      return NextResponse.json({ error: 'Error al procesar la reserva' }, { status: 500 })
    }

    // rpcNoExiste → continuar al fallback JS
    console.warn('[reservas/toggle] RPC toggle_reserva no disponible, usando fallback JS')
  }

  // ─── FALLBACK JS ─────────────────────────────────────────────────────────────
  // Usa supabaseAdmin (service_role) pero NO depende de auth.uid():
  // todas las validaciones usan userId/gymId extraídos por requireSocio del JWT.

  // 5. Validar horario
  const { data: horario, error: horarioError } = await supabaseAdmin
    .from('horarios_clase')
    .select('id, gym_id, actividad_id, hora_inicio, duracion_min, aforo_max, profesor, activo')
    .eq('id', horarioId)
    .single()

  if (horarioError || !horario) {
    return NextResponse.json({ error: 'Horario no encontrado' }, { status: 404 })
  }
  if (horario.gym_id !== gymId) {
    return NextResponse.json({ error: 'No puedes reservar clases de otro gimnasio' }, { status: 403 })
  }
  if (!horario.activo) {
    return NextResponse.json({ error: 'Este horario no está activo' }, { status: 400 })
  }

  // 6. Buscar sesión
  const { data: sesionExistente } = await supabaseAdmin
    .from('sesiones')
    .select('id, cancelada')
    .eq('horario_id', horarioId)
    .eq('fecha', fecha)
    .maybeSingle()

  if (sesionExistente?.cancelada) {
    return NextResponse.json({ error: 'Esta sesión está cancelada' }, { status: 400 })
  }

  // 7. Cancelar si reserva confirmada existe
  if (sesionExistente) {
    const { data: reservaExistente } = await supabaseAdmin
      .from('reservas')
      .select('id, estado')
      .eq('sesion_id', sesionExistente.id)
      .eq('user_id', userId)
      .maybeSingle()

    if (reservaExistente?.estado === 'confirmada') {
      const { error: cancelError } = await supabaseAdmin
        .from('reservas')
        .update({ estado: 'cancelada' })
        .eq('id', reservaExistente.id)

      if (cancelError) {
        console.error('[reservas/toggle] cancelar:', cancelError.message)
        return NextResponse.json({ error: 'Error al cancelar la reserva' }, { status: 500 })
      }
      return NextResponse.json({ ok: true, accion: 'cancelada' })
    }
  }

  // 8. Materializar sesión
  let sesionId: string
  if (sesionExistente) {
    sesionId = sesionExistente.id
  } else {
    const { data: nuevaSesion, error: sesionError } = await supabaseAdmin
      .from('sesiones')
      .insert({
        horario_id: horarioId,
        actividad_id: horario.actividad_id,
        fecha,
        hora_inicio: horario.hora_inicio,
        duracion_min: horario.duracion_min,
        aforo_max: horario.aforo_max,
        profesor: horario.profesor,
        es_puntual: false,
        cancelada: false,
      })
      .select('id')
      .single()

    if (sesionError || !nuevaSesion) {
      console.error('[reservas/toggle] crear sesión:', sesionError?.message)
      return NextResponse.json({ error: 'Error al preparar la sesión' }, { status: 500 })
    }
    sesionId = nuevaSesion.id
  }

  // 9. Verificar aforo
  const { count: ocupadas, error: aforoError } = await supabaseAdmin
    .from('reservas')
    .select('id', { count: 'exact', head: true })
    .eq('sesion_id', sesionId)
    .eq('estado', 'confirmada')

  if (aforoError) {
    return NextResponse.json({ error: 'Error al verificar aforo' }, { status: 500 })
  }
  if ((ocupadas ?? 0) >= horario.aforo_max) {
    return NextResponse.json({ error: 'Aforo completo. No hay plazas disponibles.' }, { status: 409 })
  }

  // 10. Crear o reactivar reserva
  const { data: reservaAnterior } = await supabaseAdmin
    .from('reservas')
    .select('id, estado')
    .eq('sesion_id', sesionId)
    .eq('user_id', userId)
    .maybeSingle()

  if (reservaAnterior) {
    const { error: reactivarError } = await supabaseAdmin
      .from('reservas')
      .update({ estado: 'confirmada' })
      .eq('id', reservaAnterior.id)

    if (reactivarError) {
      return NextResponse.json({ error: 'Error al reactivar la reserva' }, { status: 500 })
    }
  } else {
    const { error: insertError } = await supabaseAdmin
      .from('reservas')
      .insert({ sesion_id: sesionId, user_id: userId, estado: 'confirmada' })

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json({ error: 'Ya tienes una reserva para esta clase' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Error al crear la reserva' }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true, accion: 'confirmada', sesionId })
}
