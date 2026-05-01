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

function isUndefinedColumnError(error: { code?: string; message?: string } | null | undefined) {
  return (
    error?.code === '42703' ||
    Boolean(
      error?.message?.toLowerCase().includes('column') &&
      error?.message?.toLowerCase().includes('does not exist')
    )
  )
}

type ToggleAccion = 'confirmada' | 'cancelada'

async function buildCanonicalToggleResponse(
  userId: string,
  accion: ToggleAccion,
  sesionId?: string,
  horarioId?: string,
  fecha?: string
) {
  let sesion: { id: string; horario_id: string; actividad_id: string | null; fecha: string } | null = null
  let sesionError: { message: string } | null = null

  if (sesionId) {
    const result = await supabaseAdmin
      .from('sesiones')
      .select('id, horario_id, actividad_id, fecha')
      .eq('id', sesionId)
      .maybeSingle()
    sesion = result.data
    sesionError = result.error
  } else if (horarioId && fecha) {
    const result = await supabaseAdmin
      .from('sesiones')
      .select('id, horario_id, actividad_id, fecha')
      .eq('horario_id', horarioId)
      .eq('fecha', fecha)
      .maybeSingle()
    sesion = result.data
    sesionError = result.error
  }

  if (sesionError || !sesion) {
    return { error: 'No se pudo cargar la sesión tras procesar la reserva' }
  }

  const { count: ocupacion, error: ocupacionError } = await supabaseAdmin
    .from('reservas')
    .select('id', { count: 'exact', head: true })
    .eq('sesion_id', sesion.id)
    .eq('estado', 'confirmada')

  if (ocupacionError) {
    return { error: 'No se pudo calcular la ocupación actual' }
  }

  const { data: reservaConfirmada, error: reservaError } = await supabaseAdmin
    .from('reservas')
    .select('id, sesion_id')
    .eq('sesion_id', sesion.id)
    .eq('user_id', userId)
    .eq('estado', 'confirmada')
    .maybeSingle()

  if (reservaError) {
    return { error: 'No se pudo cargar la reserva confirmada del usuario' }
  }

  const reserva = reservaConfirmada
    ? {
      id: reservaConfirmada.id,
      sesion_id: String(reservaConfirmada.sesion_id),
      horario_id: String(sesion.horario_id),
      actividad_id: sesion.actividad_id ? String(sesion.actividad_id) : null,
      fecha: String(sesion.fecha).slice(0, 10),
    }
    : null

  if (accion === 'confirmada' && !reserva) {
    return { error: 'La reserva se confirmó pero no se encontró en estado confirmada' }
  }

  return {
    ok: true as const,
    accion,
    sesionId: String(sesion.id),
    reserva,
    ocupacion: ocupacion ?? 0,
  }
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
    console.info('[reservas/toggle] intentando RPC')
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
      console.info('[reservas/toggle] RPC ejecutada correctamente')
      const canonico = await buildCanonicalToggleResponse(
        userId,
        res.accion as ToggleAccion,
        res.sesion_id,
        horarioId,
        fecha
      )
      if ('error' in canonico) {
        console.error('[reservas/toggle] canonical RPC:', canonico.error)
        return NextResponse.json({ error: canonico.error }, { status: 500 })
      }
      return NextResponse.json(canonico)
    }

    if (rpcError && !rpcNoExiste) {
      // Error real de BD (no "función no encontrada")
      console.error('[reservas/toggle] RPC error:', rpcError.message)
      return NextResponse.json({ error: 'Error al procesar la reserva' }, { status: 500 })
    }

    // rpcNoExiste → continuar al fallback JS
    console.warn(`[reservas/toggle] usando fallback JS (motivo: ${rpcError?.code ?? 'desconocido'} ${rpcError?.message ?? ''})`)
  } else {
    console.warn('[reservas/toggle] usando fallback JS (motivo: token ausente tras requireSocio)')
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
      const { error: cancelErrorTrace } = await supabaseAdmin
        .from('reservas')
        .update({
          estado: 'cancelada',
          cancelled_at: new Date().toISOString(),
          cancelled_by: userId,
          cancelled_source: 'socio',
          cancellation_reason: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', reservaExistente.id)

      let cancelError = cancelErrorTrace
      if (isUndefinedColumnError(cancelErrorTrace)) {
        console.warn('[reservas/toggle] fallback legacy sin trazabilidad: columnas no disponibles aún')
        const { error: cancelErrorLegacy } = await supabaseAdmin
          .from('reservas')
          .update({ estado: 'cancelada' })
          .eq('id', reservaExistente.id)
        cancelError = cancelErrorLegacy
      }

      if (cancelError) {
        console.error('[reservas/toggle] cancelar:', cancelError.message)
        return NextResponse.json({ error: 'Error al cancelar la reserva' }, { status: 500 })
      }
      const canonico = await buildCanonicalToggleResponse(userId, 'cancelada', sesionExistente.id, horarioId, fecha)
      if ('error' in canonico) {
        console.error('[reservas/toggle] canonical fallback cancelada:', canonico.error)
        return NextResponse.json({ error: canonico.error }, { status: 500 })
      }
      return NextResponse.json(canonico)
    }
  }

  // 8. Materializar sesión
  let sesionId: string
  if (sesionExistente) {
    sesionId = sesionExistente.id
  } else {
    const { data: nuevaSesionTrace, error: sesionErrorTrace } = await supabaseAdmin
      .from('sesiones')
      .insert({
        horario_id: horarioId,
        actividad_id: horario.actividad_id,
        gym_id: gymId,
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

    let nuevaSesion = nuevaSesionTrace
    let sesionError = sesionErrorTrace

    if (isUndefinedColumnError(sesionErrorTrace)) {
      console.warn('[reservas/toggle] fallback legacy al crear sesión: gym_id no disponible aún')
      const { data: nuevaSesionLegacy, error: sesionErrorLegacy } = await supabaseAdmin
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
      nuevaSesion = nuevaSesionLegacy
      sesionError = sesionErrorLegacy
    }

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
    const { error: reactivarErrorTrace } = await supabaseAdmin
      .from('reservas')
      .update({
        estado: 'confirmada',
        cancelled_at: null,
        cancelled_by: null,
        cancelled_source: null,
        cancellation_reason: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reservaAnterior.id)

    let reactivarError = reactivarErrorTrace
    if (isUndefinedColumnError(reactivarErrorTrace)) {
      console.warn('[reservas/toggle] fallback legacy sin trazabilidad: columnas no disponibles aún')
      const { error: reactivarErrorLegacy } = await supabaseAdmin
        .from('reservas')
        .update({ estado: 'confirmada' })
        .eq('id', reservaAnterior.id)
      reactivarError = reactivarErrorLegacy
    }

    if (reactivarError) {
      return NextResponse.json({ error: 'Error al reactivar la reserva' }, { status: 500 })
    }
  } else {
    const { error: insertErrorTrace } = await supabaseAdmin
      .from('reservas')
      .insert({
        sesion_id: sesionId,
        user_id: userId,
        estado: 'confirmada',
        created_by: userId,
        created_source: 'socio',
        cancelled_at: null,
        cancelled_by: null,
        cancelled_source: null,
        cancellation_reason: null,
      })

    let insertError = insertErrorTrace
    if (isUndefinedColumnError(insertErrorTrace)) {
      console.warn('[reservas/toggle] fallback legacy sin trazabilidad: columnas no disponibles aún')
      const { error: insertErrorLegacy } = await supabaseAdmin
        .from('reservas')
        .insert({
          sesion_id: sesionId,
          user_id: userId,
          estado: 'confirmada',
        })
      insertError = insertErrorLegacy
    }

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json({ error: 'Ya tienes una reserva para esta clase' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Error al crear la reserva' }, { status: 500 })
    }
  }

  const canonico = await buildCanonicalToggleResponse(userId, 'confirmada', sesionId, horarioId, fecha)
  if ('error' in canonico) {
    console.error('[reservas/toggle] canonical fallback confirmada:', canonico.error)
    return NextResponse.json({ error: canonico.error }, { status: 500 })
  }
  return NextResponse.json(canonico)
}
