import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const { email, password, nombre, tipo_membresia, gym_id } = await req.json()

  if (!email || !password || !nombre) {
    return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (error || !data.user) {
    return NextResponse.json({ error: error?.message || 'Error al crear usuario' }, { status: 400 })
  }

  const vence = new Date()
  vence.setDate(vence.getDate() + 30)

  const { error: perfilError } = await supabaseAdmin
    .from('perfiles')
    .insert({
      id: data.user.id,
      gym_id,
      nombre,
      rol: 'socio',
      tipo_membresia: tipo_membresia || 'basica',
      membresia_activa: true,
      membresia_vence: vence.toISOString().split('T')[0]
    })

  if (perfilError) {
    return NextResponse.json({ error: perfilError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}