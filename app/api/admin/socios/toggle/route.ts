import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { supabaseAdmin } from '@/lib/supabase/admin'

function validarPayload(body: unknown):
  | { ok: true; data: { userId: string; membresia_activa: boolean } }
  | { ok: false; error: string } {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Payload inválido' }
  const b = body as Record<string, unknown>

  if (typeof b.userId !== 'string' || b.userId.trim().length === 0) {
    return { ok: false, error: 'userId es obligatorio' }
  }

  if (typeof b.membresia_activa !== 'boolean') {
    return { ok: false, error: 'membresia_activa debe ser boolean' }
  }

  return {
    ok: true,
    data: {
      userId: b.userId.trim(),
      membresia_activa: b.membresia_activa,
    },
  }
}

export async function PATCH(req: Request) {
  const auth = await requireAdmin(req)
  if (auth.error) return auth.error
  const { gymId } = auth.context

  try {
    const body = await req.json()
    const validacion = validarPayload(body)
    if (!validacion.ok) {
      return NextResponse.json({ error: validacion.error }, { status: 400 })
    }

    const { userId, membresia_activa } = validacion.data

    const { data: perfil, error: findError } = await supabaseAdmin
      .from('perfiles')
      .select('id, gym_id, rol, membresia_activa, membresia_vence, tipo_membresia, nombre, qr_token, telefono')
      .eq('id', userId)
      .single()

    if (findError || !perfil) {
      return NextResponse.json({ error: 'Socio no encontrado' }, { status: 404 })
    }

    if (perfil.rol !== 'socio') {
      return NextResponse.json({ error: 'Prohibido: el perfil no es socio' }, { status: 403 })
    }

    if (perfil.gym_id !== gymId) {
      return NextResponse.json({ error: 'Prohibido: el socio no pertenece a tu gimnasio' }, { status: 403 })
    }

    const { data: socio, error: updateError } = await supabaseAdmin
      .from('perfiles')
      .update({ membresia_activa })
      .eq('id', userId)
      .eq('gym_id', gymId)
      .eq('rol', 'socio')
      .select('id, gym_id, rol, membresia_activa, membresia_vence, tipo_membresia, nombre, qr_token, telefono')
      .single()

    if (updateError || !socio) {
      console.error('[admin/socios/toggle PATCH] Supabase error:', updateError?.message)
      return NextResponse.json({ error: 'Error al actualizar estado del socio' }, { status: 500 })
    }

    return NextResponse.json({ socio })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error interno'
    console.error('[admin/socios/toggle PATCH] Error inesperado:', msg)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
