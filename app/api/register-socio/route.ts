import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { TIPOS_MEMBRESIA_VALUES, calcularFechaVencimiento, type TipoMembresia } from '@/lib/domain/membresias'

function validarPayload(body: unknown): {
  ok: true
  data: { email: string; password: string; nombre: string; tipo_membresia: TipoMembresia }
} | { ok: false; error: string } {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Payload inválido' }
  const b = body as Record<string, unknown>

  if (!b.email || typeof b.email !== 'string' || !b.email.includes('@'))
    return { ok: false, error: 'Email inválido' }
  if (!b.password || typeof b.password !== 'string' || (b.password as string).length < 8)
    return { ok: false, error: 'Password mínimo 8 caracteres' }
  if (!b.nombre || typeof b.nombre !== 'string' || (b.nombre as string).trim().length < 2)
    return { ok: false, error: 'Nombre inválido' }
  if (!b.tipo_membresia || !TIPOS_MEMBRESIA_VALUES.includes(b.tipo_membresia as TipoMembresia))
    return { ok: false, error: `tipo_membresia debe ser: ${TIPOS_MEMBRESIA_VALUES.join(', ')}` }

  return {
    ok: true,
    data: {
      email: (b.email as string).toLowerCase().trim(),
      password: b.password as string,
      nombre: (b.nombre as string).trim(),
      tipo_membresia: b.tipo_membresia as TipoMembresia,
      // gym_id ignorado intencionadamente — se obtiene del token via requireAdmin
    },
  }
}

export async function POST(req: Request) {
  // Validación de admin y obtención de gymId desde el token (nunca del cliente)
  const result = await requireAdmin(req)
  if (result.error) return result.error
  const { gymId } = result.context

  try {
    const body = await req.json()
    const validacion = validarPayload(body)
    if (!validacion.ok) {
      return NextResponse.json({ error: validacion.error }, { status: 400 })
    }
    const { email, password, nombre, tipo_membresia } = validacion.data

    const { data, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email, password, email_confirm: true,
    })
    if (createError || !data.user) {
      return NextResponse.json({ error: createError?.message || 'Error al crear usuario' }, { status: 400 })
    }

    const membresia_vence = calcularFechaVencimiento(tipo_membresia)
    const { error: insertError } = await supabaseAdmin.from('perfiles').insert({
      id: data.user.id,
      gym_id: gymId,   // siempre del token
      nombre,
      rol: 'socio',
      tipo_membresia,
      membresia_activa: true,
      membresia_vence,
    })

    if (insertError) {
      await supabaseAdmin.auth.admin.deleteUser(data.user.id)
      console.error('[register-socio] Rollback activado:', insertError.message)
      return NextResponse.json({ error: 'Error al crear perfil. Usuario revertido.' }, { status: 500 })
    }

    console.log(`[register-socio] Socio creado: ${email} | gym: ${gymId}`)
    return NextResponse.json({ ok: true, user_id: data.user.id })

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error interno'
    console.error('[register-socio] Error inesperado:', msg)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
