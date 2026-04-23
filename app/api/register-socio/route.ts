import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { TIPOS_MEMBRESIA, calcularFechaVencimiento, type TipoMembresia } from '@/lib/domain/membresias'

// ─── Validación del payload ───────────────────────────────────────────────────
function validarPayload(body: unknown): {
  ok: true
  data: { email: string; password: string; nombre: string; tipo_membresia: TipoMembresia; gym_id: string }
} | { ok: false; error: string } {
  if (!body || typeof body !== 'object') return { ok: false, error: 'Payload inválido' }
  const b = body as Record<string, unknown>

  if (!b.email || typeof b.email !== 'string' || !b.email.includes('@'))
    return { ok: false, error: 'Email inválido' }
  if (!b.password || typeof b.password !== 'string' || (b.password as string).length < 8)
    return { ok: false, error: 'Password mínimo 8 caracteres' }
  if (!b.nombre || typeof b.nombre !== 'string' || (b.nombre as string).trim().length < 2)
    return { ok: false, error: 'Nombre inválido' }
  if (!b.gym_id || typeof b.gym_id !== 'string')
    return { ok: false, error: 'gym_id requerido' }
  if (!b.tipo_membresia || !TIPOS_MEMBRESIA.includes(b.tipo_membresia as TipoMembresia))
    return { ok: false, error: `tipo_membresia debe ser: ${TIPOS_MEMBRESIA.join(', ')}` }

  return {
    ok: true,
    data: {
      email: b.email.toLowerCase().trim(),
      password: b.password as string,
      nombre: (b.nombre as string).trim(),
      tipo_membresia: b.tipo_membresia as TipoMembresia,
      gym_id: b.gym_id as string,
    },
  }
}

export async function POST(req: Request) {
  try {
    // ─── 1. Autenticar al llamante (debe ser admin con sesión válida) ───────────
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')

    // Crear cliente con el token del usuario llamante para verificar su sesión
    const supabaseUser = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 })
    }

    // ─── 2. Verificar que el llamante es admin ──────────────────────────────────
    const { data: perfil_admin, error: perfilError } = await supabaseAdmin
      .from('perfiles')
      .select('rol, gym_id')
      .eq('id', user.id)
      .single()

    if (perfilError || !perfil_admin) {
      return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 403 })
    }

    if (perfil_admin.rol !== 'admin') {
      return NextResponse.json({ error: 'Acceso denegado: se requiere rol admin' }, { status: 403 })
    }

    // ─── 3. Validar payload ─────────────────────────────────────────────────────
    const body = await req.json()
    const validacion = validarPayload(body)
    if (!validacion.ok) {
      return NextResponse.json({ error: validacion.error }, { status: 400 })
    }
    const { email, password, nombre, tipo_membresia, gym_id } = validacion.data

    // ─── 4. Verificar que el gym_id pertenece al admin ──────────────────────────
    if (perfil_admin.gym_id !== gym_id) {
      return NextResponse.json({ error: 'gym_id no autorizado' }, { status: 403 })
    }

    // ─── 5. Crear usuario auth ──────────────────────────────────────────────────
    const { data, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (createError || !data.user) {
      return NextResponse.json(
        { error: createError?.message || 'Error al crear usuario' },
        { status: 400 }
      )
    }

    // ─── 6. Crear perfil (rollback si falla) ────────────────────────────────────
    const membresia_vence = calcularFechaVencimiento(tipo_membresia)

    const { error: insertError } = await supabaseAdmin.from('perfiles').insert({
      id: data.user.id,
      gym_id,
      nombre,
      rol: 'socio',
      tipo_membresia,
      membresia_activa: true,
      membresia_vence,
    })

    if (insertError) {
      // Rollback: eliminar el usuario auth creado
      await supabaseAdmin.auth.admin.deleteUser(data.user.id)
      console.error('[register-socio] Rollback activado:', insertError.message)
      return NextResponse.json({ error: 'Error al crear perfil. Usuario revertido.' }, { status: 500 })
    }

    console.log(`[register-socio] Socio creado: ${email} | gym: ${gym_id} | por admin: ${user.id}`)
    return NextResponse.json({ ok: true, user_id: data.user.id })

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error interno'
    console.error('[register-socio] Error inesperado:', msg)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
