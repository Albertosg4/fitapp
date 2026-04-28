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
 * 4. Si la RPC devuelve ok=false, se responde con el status HTTP mapeado.
 * 5. Si la RPC falla técnicamente, se responde 500.
 * 6. Si la RPC confirma/cancela, se devuelve respuesta canónica.
 */
export async function POST(req: Request) {
  // 1. Validar socio y extraer token + contexto
  const authHeader = req.headers.get('Authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

  const socioResult = await requireSocio(req)
  if (socioResult.error) return socioResult.error
  const { userId, membresiaActiva, membresiaVence } = socioResult.context

  if (!token) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

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

  // 4. Ejecutar RPC atómica con cliente autenticado como el usuario real
  console.info('[reservas/toggle] intentando RPC')
  const supabaseUser = createUserClient(token)

  const { data: rpcData, error: rpcError } = await supabaseUser.rpc('toggle_reserva', {
    p_horario_id: horarioId,
    p_fecha: fecha,
  })

  if (rpcError || rpcData === null) {
    console.error('[reservas/toggle] RPC error:', rpcError?.message ?? 'respuesta nula')
    return NextResponse.json({ error: 'Error al procesar la reserva' }, { status: 500 })
  }

  const res = rpcData as { ok: boolean; error?: string; accion?: string; sesion_id?: string }
  if (!res.ok) {
    return NextResponse.json({ error: res.error }, { status: rpcErrorStatus(res.error) })
  }

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
