import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { supabaseAdmin } from '@/lib/supabase/admin'

function validarPostPayload(body: unknown): {
  ok: true
  data: { nombre: string; descripcion: string | null; color: string | null }
} | { ok: false; error: string } {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Payload inválido' }
  const b = body as Record<string, unknown>

  if (typeof b.nombre !== 'string' || b.nombre.trim().length === 0) {
    return { ok: false, error: 'nombre es obligatorio' }
  }

  const descripcion = typeof b.descripcion === 'string'
    ? b.descripcion.trim() || null
    : b.descripcion == null
      ? null
      : undefined

  if (descripcion === undefined) {
    return { ok: false, error: 'descripcion debe ser string o null' }
  }

  let color: string | null = null
  if (b.color != null) {
    if (typeof b.color !== 'string') return { ok: false, error: 'color debe ser string' }
    const colorTrim = b.color.trim()
    if (!colorTrim || colorTrim.length > 32) {
      return { ok: false, error: 'color inválido' }
    }
    color = colorTrim
  }

  return {
    ok: true,
    data: {
      nombre: b.nombre.trim(),
      descripcion,
      color,
    },
  }
}

function validarPatchPayload(body: unknown): {
  ok: true
  data: { id: string; activa: boolean }
} | { ok: false; error: string } {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Payload inválido' }
  const b = body as Record<string, unknown>

  if (typeof b.id !== 'string' || b.id.trim().length === 0) {
    return { ok: false, error: 'id es obligatorio' }
  }

  if (typeof b.activa !== 'boolean') {
    return { ok: false, error: 'activa debe ser boolean' }
  }

  return { ok: true, data: { id: b.id.trim(), activa: b.activa } }
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

    const { nombre, descripcion, color } = validacion.data
    const payload: {
      gym_id: string
      nombre: string
      descripcion: string | null
      color?: string | null
      activa: boolean
    } = {
      gym_id: gymId,
      nombre,
      descripcion,
      activa: true,
    }

    if (color !== null) payload.color = color

    const { data: actividad, error } = await supabaseAdmin
      .from('actividades')
      .insert(payload)
      .select('*')
      .single()

    if (error || !actividad) {
      console.error('[admin/actividades POST] Supabase error:', error?.message)
      return NextResponse.json({ error: 'Error al crear actividad' }, { status: 500 })
    }

    return NextResponse.json({ actividad })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error interno'
    console.error('[admin/actividades POST] Error inesperado:', msg)
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

    const { id, activa } = validacion.data

    const { data: actividadExistente, error: findError } = await supabaseAdmin
      .from('actividades')
      .select('id, gym_id')
      .eq('id', id)
      .single()

    if (findError || !actividadExistente) {
      return NextResponse.json({ error: 'Actividad no encontrada' }, { status: 404 })
    }

    if (actividadExistente.gym_id !== gymId) {
      return NextResponse.json({ error: 'Prohibido: actividad fuera de tu gimnasio' }, { status: 403 })
    }

    const { data: actividad, error: updateError } = await supabaseAdmin
      .from('actividades')
      .update({ activa })
      .eq('id', id)
      .eq('gym_id', gymId)
      .select('*')
      .single()

    if (updateError || !actividad) {
      console.error('[admin/actividades PATCH] Supabase error:', updateError?.message)
      return NextResponse.json({ error: 'Error al actualizar actividad' }, { status: 500 })
    }

    return NextResponse.json({ actividad })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error interno'
    console.error('[admin/actividades PATCH] Error inesperado:', msg)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
