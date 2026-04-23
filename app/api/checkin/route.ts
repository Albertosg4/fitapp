import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Usa service role para saltarse el RLS — igual que register-socio
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const { token } = await req.json()
    if (!token) return NextResponse.json({ error: 'Token requerido' }, { status: 400 })

    // 1. Buscar perfil por qr_token
    const { data: perfil } = await supabaseAdmin
      .from('perfiles')
      .select('*')
      .eq('qr_token', token)
      .maybeSingle()

    if (!perfil) return NextResponse.json({ error: 'QR no reconocido' }, { status: 404 })
    if (!perfil.membresia_activa) return NextResponse.json({ error: 'Membresía no activa', nombre: perfil.nombre }, { status: 403 })

    // 2. Buscar reserva confirmada de hoy
    const hoy = new Date().toISOString().split('T')[0]
    const { data: sesionesHoy } = await supabaseAdmin
      .from('sesiones')
      .select('id')
      .eq('fecha', hoy)

    const sesionIds = (sesionesHoy || []).map((s: any) => s.id)

    let reservaId = null
    if (sesionIds.length > 0) {
      const { data: reserva } = await supabaseAdmin
        .from('reservas')
        .select('id')
        .eq('user_id', perfil.id)
        .eq('estado', 'confirmada')
        .in('sesion_id', sesionIds)
        .maybeSingle()

      reservaId = reserva?.id || null
    }

    // 3. Sin reserva → acceso libre, registrar igualmente
    if (!reservaId) {
      const { data: yaAcceso } = await supabaseAdmin
        .from('asistencia')
        .select('id')
        .eq('user_id', perfil.id)
        .gte('check_in_at', `${hoy}T00:00:00`)
        .maybeSingle()

      if (!yaAcceso) {
        await supabaseAdmin.from('asistencia').insert({
          user_id: perfil.id,
          metodo: 'qr',
        })
      }

      return NextResponse.json({ ok: true, nombre: perfil.nombre, msg: 'Acceso permitido · Sin reserva hoy' })
    }

    // 4. Comprobar si ya hizo check-in
    const { data: yaCheckin } = await supabaseAdmin
      .from('asistencia')
      .select('id')
      .eq('reserva_id', reservaId)
      .maybeSingle()

    if (yaCheckin) {
      return NextResponse.json({ ok: true, nombre: perfil.nombre, msg: 'Check-in ya registrado anteriormente' })
    }

    // 5. Registrar asistencia
    const { error } = await supabaseAdmin.from('asistencia').insert({
      reserva_id: reservaId,
      user_id: perfil.id,
      metodo: 'qr',
    })

    if (error) throw error

    return NextResponse.json({ ok: true, nombre: perfil.nombre, msg: 'Check-in registrado ✅' })

  } catch (err: any) {
    console.error('Error checkin:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}