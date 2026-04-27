import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { supabaseAdmin } from '@/lib/supabase/admin'

const FECHA_REGEX = /^\d{4}-\d{2}-\d{2}$/
const HORA_REGEX = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/

function validarPostPayload(body: unknown): {
  ok: true
  data: {
    actividad_id: string
    fecha: string
    hora_inicio: string | null
    duracion_min: number | null
    aforo_max: number | null
    profesor: string | null
    notas: string | null
  }
} | { ok: false; error: string } {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Payload inválido' }
  const b = body as Record<string, unknown>

  if (typeof b.actividad_id !== 'string' || b.actividad_id.trim().length === 0) {
    return { ok: false, error: 'actividad_id es obligatorio' }
  }

  if (typeof b.fecha !== 'string' || !FECHA_REGEX.test(b.fecha)) {
    return { ok: false, error: 'fecha debe tener formato YYYY-MM-DD' }
  }

  let horaInicio: string | null = null
  if (b.hora_inicio != null) {
    if (typeof b.hora_inicio !== 'string' || !HORA_REGEX.test(b.hora_inicio.trim())) {
      return { ok: false, error: 'hora_inicio debe tener formato HH:MM o HH:MM:SS' }
    }
    horaInicio = b.hora_inicio.trim()
  }

  let duracionMin: number | null = null
  if (b.duracion_min != null) {
    if (typeof b.duracion_min !== 'number' || !Number.isInteger(b.duracion_min) || b.duracion_min <= 0 || b.duracion_min > 480) {
      return { ok: false, error: 'duracion_min debe ser un entero entre 1 y 480 o null' }
    }
    duracionMin = b.duracion_min
  }

  let aforoMax: number | null = null
  if (b.aforo_max != null) {
    if (typeof b.aforo_max !== 'number' || !Number.isInteger(b.aforo_max) || b.aforo_max <= 0 || b.aforo_max > 500) {
      return { ok: false, error: 'aforo_max debe ser un entero entre 1 y 500 o null' }
    }
    aforoMax = b.aforo_max
  }

  let profesor: string | null = null
  if (b.profesor != null) {
    if (typeof b.profesor !== 'string') return { ok: false, error: 'profesor debe ser string o null' }
    const profesorTrim = b.profesor.trim()
    profesor = profesorTrim.length > 0 ? profesorTrim : null
  }

  let notas: string | null = null
  if (b.notas != null) {
    if (typeof b.notas !== 'string') return { ok: false, error: 'notas debe ser string o null' }
    const notasTrim = b.notas.trim()
    notas = notasTrim.length > 0 ? notasTrim : null
  }

  return {
    ok: true,
    data: {
      actividad_id: b.actividad_id.trim(),
      fecha: b.fecha,
      hora_inicio: horaInicio,
      duracion_min: duracionMin,
      aforo_max: aforoMax,
      profesor,
      notas,
    },
  }
}

function validarPatchPayload(body: unknown): {
  ok: true
  data: { id: string; cancelada: boolean }
} | { ok: false; error: string } {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Payload inválido' }
  const b = body as Record<string, unknown>

  if (typeof b.id !== 'string' || b.id.trim().length === 0) {
    return { ok: false, error: 'id es obligatorio' }
  }

  if (typeof b.cancelada !== 'boolean') {
    return { ok: false, error: 'cancelada debe ser boolean' }
  }

  return { ok: true, data: { id: b.id.trim(), cancelada: b.cancelada } }
}

export async function POST(req: Request) {
  const auth = await requireAdmin(req)
  if (auth.error) return auth.error
  const { gymId } = auth.context

  try {
    const body = await req.json()
    const validacion = validarPostPayload(body)
    if (!validacion.ok) {
      return NextResponse.json({ error: validacion.error }, { status: 400 })
    }

    const { actividad_id, fecha, hora_inicio, duracion_min, aforo_max, profesor, notas } = validacion.data

    const { data: actividad, error: actividadError } = await supabaseAdmin
      .from('actividades')
      .select('id, gym_id, activa')
      .eq('id', actividad_id)
      .single()

    if (actividadError || !actividad) {
      return NextResponse.json({ error: 'Actividad no encontrada' }, { status: 404 })
    }

    if (actividad.gym_id !== gymId) {
      return NextResponse.json({ error: 'Prohibido: actividad fuera de tu gimnasio' }, { status: 403 })
    }

    if (!actividad.activa) {
      return NextResponse.json({ error: 'La actividad está inactiva' }, { status: 400 })
    }

    const { data: sesion, error } = await supabaseAdmin
      .from('sesiones')
      .insert({
        actividad_id,
        fecha,
        hora_inicio,
        duracion_min,
        aforo_max,
        profesor,
        notas,
        es_puntual: true,
        cancelada: false,
      })
      .select('*')
      .single()

    if (error || !sesion) {
      console.error('[admin/sesiones POST] Supabase error:', error?.message)
      return NextResponse.json({ error: 'Error al crear sesión puntual' }, { status: 500 })
    }

    return NextResponse.json({ sesion })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error interno'
    console.error('[admin/sesiones POST] Error inesperado:', msg)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  const auth = await requireAdmin(req)
  if (auth.error) return auth.error
  const { gymId } = auth.context

  try {
    const body = await req.json()
    const validacion = validarPatchPayload(body)
    if (!validacion.ok) {
      return NextResponse.json({ error: validacion.error }, { status: 400 })
    }

    const { id, cancelada } = validacion.data

    const { data: sesionExistente, error: findError } = await supabaseAdmin
      .from('sesiones')
      .select('id, actividad_id, es_puntual, cancelada')
      .eq('id', id)
      .single()

    if (findError || !sesionExistente) {
      return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 })
    }

    if (sesionExistente.es_puntual !== true) {
      return NextResponse.json({ error: 'Solo se pueden modificar sesiones puntuales' }, { status: 403 })
    }

    if (!sesionExistente.actividad_id) {
      return NextResponse.json({ error: 'No se puede modificar esta sesión: falta actividad_id para aislar por gym_id' }, { status: 403 })
    }

    const { data: actividad, error: actividadError } = await supabaseAdmin
      .from('actividades')
      .select('id, gym_id')
      .eq('id', sesionExistente.actividad_id)
      .single()

    if (actividadError || !actividad) {
      return NextResponse.json({ error: 'Actividad asociada no encontrada' }, { status: 404 })
    }

    if (actividad.gym_id !== gymId) {
      return NextResponse.json({ error: 'Prohibido: sesión fuera de tu gimnasio' }, { status: 403 })
    }

    const { data: sesion, error: updateError } = await supabaseAdmin
      .from('sesiones')
      .update({ cancelada })
      .eq('id', id)
      .select('*')
      .single()

    if (updateError || !sesion) {
      console.error('[admin/sesiones PATCH] Supabase error:', updateError?.message)
      return NextResponse.json({ error: 'Error al actualizar sesión puntual' }, { status: 500 })
    }

    return NextResponse.json({ sesion })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error interno'
    console.error('[admin/sesiones PATCH] Error inesperado:', msg)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
