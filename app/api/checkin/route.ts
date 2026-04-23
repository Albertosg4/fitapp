import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { isMembresiaValida } from '@/lib/domain/membresias'

export async function POST(req: Request) {
  try {
    // ─── 1. Validar payload ─────────────────────────────────────────────────────
    const body = await req.json()
    const { token } = body

    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 400 })
    }

    // ─── 2. Buscar perfil por qr_token ─────────────────────────────────────────
    const { data: perfil, error: perfilError } = await supabaseAdmin
      .from('perfiles')
      .select('id, nombre, membresia_activa, membresia_vence')
      .eq('qr_token', token.trim())
      .maybeSingle()

    if (perfilError) {
      console.error('[checkin] Error buscando perfil:', perfilError.message)
      return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }

    if (!perfil) {
      return NextResponse.json({ error: 'QR no reconocido' }, { status: 404 })
    }

    // ─── 3. Validar membresía (activa + fecha no vencida) ───────────────────────
    if (!isMembresiaValida(perfil)) {
      console.log(`[checkin] Membresía inválida para user: ${perfil.id}`)
      return NextResponse.json(
        { error: 'Membresía no activa o caducada', nombre: perfil.nombre },
        { status: 403 }
      )
    }

    const hoy = new Date().toISOString().split('T')[0]

    // ─── 4. Buscar reserva confirmada de hoy ───────────────────────────────────
    const { data: sesionesHoy } = await supabaseAdmin
      .from('sesiones')
      .select('id')
      .eq('fecha', hoy)

    const sesionIds = (sesionesHoy ?? []).map((s: { id: string }) => s.id)

    let reservaId: string | null = null
    if (sesionIds.length > 0) {
      const { data: reserva } = await supabaseAdmin
        .from('reservas')
        .select('id')
        .eq('user_id', perfil.id)
        .eq('estado', 'confirmada')
        .in('sesion_id', sesionIds)
        .maybeSingle()

      reservaId = reserva?.id ?? null
    }

    // ─── 5. Acceso libre (sin reserva hoy) ─────────────────────────────────────
    if (!reservaId) {
      // Evitar duplicado de acceso libre el mismo día
      const { data: yaAcceso } = await supabaseAdmin
        .from('asistencia')
        .select('id')
        .eq('user_id', perfil.id)
        .gte('check_in_at', `${hoy}T00:00:00`)
        .lte('check_in_at', `${hoy}T23:59:59`)
        .maybeSingle()

      if (yaAcceso) {
        return NextResponse.json({
          ok: true,
          nombre: perfil.nombre,
          msg: 'Acceso ya registrado hoy',
        })
      }

      const { error: insertError } = await supabaseAdmin.from('asistencia').insert({
        user_id: perfil.id,
        metodo: 'qr',
      })

      if (insertError) {
        console.error('[checkin] Error registrando acceso libre:', insertError.message)
        return NextResponse.json({ error: 'Error al registrar acceso' }, { status: 500 })
      }

      console.log(`[checkin] Acceso libre: user=${perfil.id} | fecha=${hoy}`)
      return NextResponse.json({
        ok: true,
        nombre: perfil.nombre,
        msg: 'Acceso permitido · Sin reserva hoy',
      })
    }

    // ─── 6. Check-in con reserva — evitar duplicado ─────────────────────────────
    const { data: yaCheckin } = await supabaseAdmin
      .from('asistencia')
      .select('id')
      .eq('reserva_id', reservaId)
      .maybeSingle()

    if (yaCheckin) {
      return NextResponse.json({
        ok: true,
        nombre: perfil.nombre,
        msg: 'Check-in ya registrado anteriormente',
      })
    }

    // ─── 7. Registrar asistencia ligada a reserva ───────────────────────────────
    const { error: checkinError } = await supabaseAdmin.from('asistencia').insert({
      reserva_id: reservaId,
      user_id: perfil.id,
      metodo: 'qr',
    })

    if (checkinError) {
      console.error('[checkin] Error registrando check-in:', checkinError.message)
      return NextResponse.json({ error: 'Error al registrar check-in' }, { status: 500 })
    }

    console.log(`[checkin] Check-in registrado: user=${perfil.id} | reserva=${reservaId}`)
    return NextResponse.json({
      ok: true,
      nombre: perfil.nombre,
      msg: 'Check-in registrado ✅',
    })

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error desconocido'
    console.error('[checkin] Error inesperado:', msg)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
