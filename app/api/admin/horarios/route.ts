import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { supabaseAdmin } from '@/lib/supabase/admin'

const HORA_REGEX = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/
const FECHA_REGEX = /^\d{4}-\d{2}-\d{2}$/

function validarPostPayload(body: unknown): {
  ok: true
  data: {
    actividad_id: string
    dia_semana: number
    hora_inicio: string
    duracion_min: number
    aforo_max: number
    profesor: string | null
    fecha_inicio: string
    fecha_fin: string | null
  }
} | { ok: false; error: string } {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Payload inválido' }
  const b = body as Record<string, unknown>

  if (typeof b.actividad_id !== 'string' || b.actividad_id.trim().length === 0) {
    return { ok: false, error: 'actividad_id es obligatorio' }
  }

  if (typeof b.dia_semana !== 'number' || !Number.isInteger(b.dia_semana) || b.dia_semana < 0 || b.dia_semana > 6) {
    return { ok: false, error: 'dia_semana debe ser un entero entre 0 y 6' }
  }

  if (typeof b.hora_inicio !== 'string' || !HORA_REGEX.test(b.hora_inicio.trim())) {
    return { ok: false, error: 'hora_inicio debe tener formato HH:MM' }
  }

  if (typeof b.duracion_min !== 'number' || !Number.isInteger(b.duracion_min) || b.duracion_min <= 0 || b.duracion_min > 480) {
    return { ok: false, error: 'duracion_min debe ser un entero entre 1 y 480' }
  }

  if (typeof b.aforo_max !== 'number' || !Number.isInteger(b.aforo_max) || b.aforo_max <= 0 || b.aforo_max > 500) {
    return { ok: false, error: 'aforo_max debe ser un entero entre 1 y 500' }
  }

  let profesor: string | null = null
  if (b.profesor != null) {
    if (typeof b.profesor !== 'string') {
      return { ok: false, error: 'profesor debe ser string o null' }
    }
    const profesorTrim = b.profesor.trim()
    profesor = profesorTrim.length > 0 ? profesorTrim : null
  }

  if (typeof b.fecha_inicio !== 'string' || !FECHA_REGEX.test(b.fecha_inicio)) {
    return { ok: false, error: 'fecha_inicio debe tener formato YYYY-MM-DD' }
  }

  let fechaFin: string | null = null
  if (b.fecha_fin != null) {
    if (typeof b.fecha_fin !== 'string' || !FECHA_REGEX.test(b.fecha_fin)) {
      return { ok: false, error: 'fecha_fin debe tener formato YYYY-MM-DD o null' }
    }
    fechaFin = b.fecha_fin
  }

  if (fechaFin && fechaFin < b.fecha_inicio) {
    return { ok: false, error: 'fecha_fin no puede ser anterior a fecha_inicio' }
  }

  return {
    ok: true,
    data: {
      actividad_id: b.actividad_id.trim(),
      dia_semana: b.dia_semana,
      hora_inicio: b.hora_inicio.trim(),
      duracion_min: b.duracion_min,
      aforo_max: b.aforo_max,
      profesor,
      fecha_inicio: b.fecha_inicio,
      fecha_fin: fechaFin,
    },
  }
}

function validarPatchPayload(body: unknown): {
  ok: true
  data: { id: string; activo: boolean }
} | { ok: false; error: string } {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Payload inválido' }
  const b = body as Record<string, unknown>

  if (typeof b.id !== 'string' || b.id.trim().length === 0) {
    return { ok: false, error: 'id es obligatorio' }
  }

  if (typeof b.activo !== 'boolean') {
    return { ok: false, error: 'activo debe ser boolean' }
  }

  return { ok: true, data: { id: b.id.trim(), activo: b.activo } }
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

    const { actividad_id, dia_semana, hora_inicio, duracion_min, aforo_max, profesor, fecha_inicio, fecha_fin } = validacion.data

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

    const { data: horario, error } = await supabaseAdmin
      .from('horarios_clase')
      .insert({
        gym_id: gymId,
        actividad_id,
        dia_semana,
        hora_inicio,
        duracion_min,
        aforo_max,
        profesor,
        fecha_inicio,
        fecha_fin,
        activo: true,
      })
      .select('*')
      .single()

    if (error || !horario) {
      console.error('[admin/horarios POST] Supabase error:', error?.message)
      return NextResponse.json({ error: 'Error al crear horario' }, { status: 500 })
    }

    return NextResponse.json({ horario })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error interno'
    console.error('[admin/horarios POST] Error inesperado:', msg)
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

    const { id, activo } = validacion.data

    const { data: horarioExistente, error: findError } = await supabaseAdmin
      .from('horarios_clase')
      .select('id, gym_id')
      .eq('id', id)
      .single()

    if (findError || !horarioExistente) {
      return NextResponse.json({ error: 'Horario no encontrado' }, { status: 404 })
    }

    if (horarioExistente.gym_id !== gymId) {
      return NextResponse.json({ error: 'Prohibido: horario fuera de tu gimnasio' }, { status: 403 })
    }

    const { data: horario, error: updateError } = await supabaseAdmin
      .from('horarios_clase')
      .update({ activo })
      .eq('id', id)
      .eq('gym_id', gymId)
      .select('*')
      .single()

    if (updateError || !horario) {
      console.error('[admin/horarios PATCH] Supabase error:', updateError?.message)
      return NextResponse.json({ error: 'Error al actualizar horario' }, { status: 500 })
    }

    return NextResponse.json({ horario })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error interno'
    console.error('[admin/horarios PATCH] Error inesperado:', msg)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
