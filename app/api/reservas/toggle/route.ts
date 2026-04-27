import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireSocio } from '@/lib/auth/requireSocio'
import { isMembresiaValida } from '@/lib/domain/membresias'

export async function POST(req: Request) {
  // 1. Validar socio autenticado y obtener contexto
  const result = await requireSocio(req)
  if (result.error) return result.error
  const { userId, gymId, membresiaActiva, membresiaVence } = result.context

  // 2. Validar membresía activa
  if (!isMembresiaValida({ membresia_activa: membresiaActiva, membresia_vence: membresiaVence })) {
    return NextResponse.json(
      { error: 'Tu membresía ha caducado o no está activa. Renuévala para reservar.' },
      { status: 403 }
    )
  }

  // 3. Leer y validar payload
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

  // 4. Validar que el horario pertenece al mismo gym_id del socio
  const { data: horario, error: horarioError } = await supabaseAdmin
    .from('horarios_clase')
    .select('id, gym_id, actividad_id, hora_inicio, duracion_min, aforo_max, profesor, activo')
    .eq('id', horarioId)
    .single()

  if (horarioError || !horario) {
    return NextResponse.json({ error: 'Horario no encontrado' }, { status: 404 })
  }
  if (horario.gym_id !== gymId) {
    return NextResponse.json({ error: 'No puedes reservar clases de otro gimnasio' }, { status: 403 })
  }
  if (!horario.activo) {
    return NextResponse.json({ error: 'Este horario no está activo' }, { status: 400 })
  }

  // 5. Buscar sesión materializada para este horario+fecha
  const { data: sesionExistente } = await supabaseAdmin
    .from('sesiones')
    .select('id, cancelada')
    .eq('horario_id', horarioId)
    .eq('fecha', fecha)
    .maybeSingle()

  // Si la sesión existe pero está cancelada, no permitir reserva
  if (sesionExistente?.cancelada) {
    return NextResponse.json({ error: 'Esta sesión está cancelada' }, { status: 400 })
  }

  // 6. Buscar reserva existente del socio para esta sesión (si hay sesión)
  if (sesionExistente) {
    const { data: reservaExistente } = await supabaseAdmin
      .from('reservas')
      .select('id, estado')
      .eq('sesion_id', sesionExistente.id)
      .eq('user_id', userId)
      .maybeSingle()

    if (reservaExistente?.estado === 'confirmada') {
      // ─── CANCELAR ────────────────────────────────────────────────────────────
      const { error: cancelError } = await supabaseAdmin
        .from('reservas')
        .update({ estado: 'cancelada' })
        .eq('id', reservaExistente.id)

      if (cancelError) {
        console.error('[reservas/toggle] cancelar:', cancelError.message)
        return NextResponse.json({ error: 'Error al cancelar la reserva' }, { status: 500 })
      }

      console.log(`[reservas/toggle] Cancelada: user=${userId} horario=${horarioId} fecha=${fecha}`)
      return NextResponse.json({ ok: true, accion: 'cancelada' })
    }
  }

  // ─── CREAR RESERVA ──────────────────────────────────────────────────────────

  // 7. Materializar sesión si no existe
  let sesionId: string
  if (sesionExistente) {
    sesionId = sesionExistente.id
  } else {
    const { data: nuevaSesion, error: sesionError } = await supabaseAdmin
      .from('sesiones')
      .insert({
        horario_id: horarioId,
        actividad_id: horario.actividad_id,
        fecha,
        hora_inicio: horario.hora_inicio,
        duracion_min: horario.duracion_min,
        aforo_max: horario.aforo_max,
        profesor: horario.profesor,
        es_puntual: false,
        cancelada: false,
      })
      .select('id')
      .single()

    if (sesionError || !nuevaSesion) {
      console.error('[reservas/toggle] crear sesión:', sesionError?.message)
      return NextResponse.json({ error: 'Error al preparar la sesión' }, { status: 500 })
    }
    sesionId = nuevaSesion.id
  }

  // 8. Verificar aforo — contar reservas confirmadas en esta sesión
  const { count: ocupadas, error: aforoError } = await supabaseAdmin
    .from('reservas')
    .select('id', { count: 'exact', head: true })
    .eq('sesion_id', sesionId)
    .eq('estado', 'confirmada')

  if (aforoError) {
    console.error('[reservas/toggle] contar aforo:', aforoError.message)
    return NextResponse.json({ error: 'Error al verificar aforo' }, { status: 500 })
  }

  if ((ocupadas ?? 0) >= horario.aforo_max) {
    return NextResponse.json({ error: 'Aforo completo. No hay plazas disponibles.' }, { status: 409 })
  }

  // 9. Crear o reactivar reserva — evitar duplicados
  const { data: reservaAnterior } = await supabaseAdmin
    .from('reservas')
    .select('id, estado')
    .eq('sesion_id', sesionId)
    .eq('user_id', userId)
    .maybeSingle()

  if (reservaAnterior) {
    // Reactivar reserva cancelada anterior
    const { error: reactivarError } = await supabaseAdmin
      .from('reservas')
      .update({ estado: 'confirmada' })
      .eq('id', reservaAnterior.id)

    if (reactivarError) {
      console.error('[reservas/toggle] reactivar:', reactivarError.message)
      return NextResponse.json({ error: 'Error al reactivar la reserva' }, { status: 500 })
    }
  } else {
    const { error: insertError } = await supabaseAdmin
      .from('reservas')
      .insert({ sesion_id: sesionId, user_id: userId, estado: 'confirmada' })

    if (insertError) {
      // Manejar posible violación de unique constraint (race condition)
      if (insertError.code === '23505') {
        return NextResponse.json({ error: 'Ya tienes una reserva para esta clase' }, { status: 409 })
      }
      console.error('[reservas/toggle] insertar:', insertError.message)
      return NextResponse.json({ error: 'Error al crear la reserva' }, { status: 500 })
    }
  }

  console.log(`[reservas/toggle] Creada: user=${userId} horario=${horarioId} fecha=${fecha}`)
  return NextResponse.json({ ok: true, accion: 'confirmada', sesionId })
}
