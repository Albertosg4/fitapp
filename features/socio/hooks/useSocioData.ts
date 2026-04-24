'use client'
import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import QRCode from 'qrcode'
import type { Socio } from '@/types/domain'
import { getDiaSemanaLunesPrimero, parseLocalDate } from '@/lib/domain/fechas'

// Horario enriquecido con datos de actividad — lo que ve el socio
export interface HorarioSocio {
  id: string                  // horarios_clase.id — se usa como clave de UI
  actividad_id: string
  actividad_nombre: string
  actividad_color: string | null
  dia_semana: number          // 0=Lun … 6=Dom
  hora_inicio: string         // 'HH:MM'
  duracion_min: number
  aforo_max: number
  profesor: string | null
}

// Reserva enriquecida para el socio
export interface ReservaLocal {
  id: string
  sesion_id: string
  horario_id: string | null   // para identificar qué horario está reservado en qué fecha
  actividad_id: string | null
  fecha: string
}

export function useSocioData() {
  const [perfil, setPerfil] = useState<Socio | null>(null)
  const [horarios, setHorarios] = useState<HorarioSocio[]>([])
  const [reservas, setReservas] = useState<ReservaLocal[]>([])
  const [ocupacion, setOcupacion] = useState<Record<string, { sesionId: string; count: number }>>({})
  const [qrUrl, setQrUrl] = useState('')
  const [userId, setUserId] = useState<string>('')
  const [loading, setLoading] = useState(true)

  // Carga reservas confirmadas del socio con join a sesiones
  const cargarReservas = useCallback(async (uid: string) => {
    const { data } = await supabase
      .from('reservas')
      .select('id, sesion_id, estado, sesiones(horario_id, actividad_id, fecha)')
      .eq('user_id', uid)
      .eq('estado', 'confirmada')
    type RawR = { id: string; sesion_id: string; sesiones: unknown }
    setReservas(((data || []) as unknown as RawR[]).map(r => {
      const s = (Array.isArray(r.sesiones) ? r.sesiones[0] : r.sesiones) as {
        horario_id: string | null; actividad_id: string | null; fecha: string
      } | null
      return {
        id: r.id,
        sesion_id: r.sesion_id,
        horario_id: s?.horario_id ?? null,
        actividad_id: s?.actividad_id ?? null,
        fecha: s?.fecha ?? '',
      }
    }))
  }, [])

  // Carga perfil y genera QR
  const cargarPerfil = useCallback(async (uid: string) => {
    const { data: p } = await supabase.from('perfiles').select('*').eq('id', uid).single()
    setPerfil(p as Socio)
    if (p?.qr_token) {
      const url = await QRCode.toDataURL(`${window.location.origin}/checkin?token=${p.qr_token}`)
      setQrUrl(url)
    }
  }, [])

  // Carga horarios activos con datos de actividad
  const cargarHorarios = useCallback(async () => {
    const { data, error } = await supabase
      .from('horarios_clase')
      .select('id, actividad_id, dia_semana, hora_inicio, duracion_min, aforo_max, profesor, actividad:actividades(nombre, color)')
      .eq('activo', true)
      .order('dia_semana')
      .order('hora_inicio')
    if (error) { console.error('[useSocioData] cargarHorarios:', error.message); return }
    type RawH = {
      id: string; actividad_id: string; dia_semana: number; hora_inicio: string
      duracion_min: number; aforo_max: number; profesor: string | null
      actividad: { nombre: string; color: string | null } | { nombre: string; color: string | null }[] | null
    }
    setHorarios(((data || []) as unknown as RawH[]).map(h => {
      const act = Array.isArray(h.actividad) ? h.actividad[0] : h.actividad
      return {
        id: h.id,
        actividad_id: h.actividad_id,
        actividad_nombre: act?.nombre ?? '—',
        actividad_color: act?.color ?? null,
        dia_semana: h.dia_semana,
        hora_inicio: String(h.hora_inicio).slice(0, 5),
        duracion_min: h.duracion_min,
        aforo_max: h.aforo_max,
        profesor: h.profesor,
      }
    }))
  }, [])

  // Obtiene ocupación de un horario en una fecha concreta
  // Primero busca sesión materializada; si no existe devuelve 0
  const getOcupacionFecha = useCallback(async (horarioId: string, fecha: string) => {
    const { data: sesion } = await supabase
      .from('sesiones').select('id')
      .eq('horario_id', horarioId).eq('fecha', fecha).maybeSingle()
    if (!sesion) return { sesionId: null, count: 0 }
    const { count } = await supabase
      .from('reservas').select('id', { count: 'exact', head: true })
      .eq('sesion_id', sesion.id).eq('estado', 'confirmada')
    return { sesionId: sesion.id, count: count || 0 }
  }, [])

  // Actualiza ocupación para todos los horarios de un día
  const actualizarOcupacion = useCallback(async (fecha: string, horariosDelDia: HorarioSocio[]) => {
    const nuevaOcupacion: Record<string, { sesionId: string; count: number }> = {}
    for (const h of horariosDelDia) {
      const key = `${h.id}_${fecha}`
      const result = await getOcupacionFecha(h.id, fecha)
      nuevaOcupacion[key] = { sesionId: result.sesionId || '', count: result.count }
    }
    setOcupacion(prev => ({ ...prev, ...nuevaOcupacion }))
  }, [getOcupacionFecha])

  // Reservar o cancelar reserva en un horario para una fecha
  const reservar = useCallback(async (
    horarioId: string,
    fecha: string,
    uid: string,
    horariosActuales: HorarioSocio[],
    reservasActuales: ReservaLocal[],
    ocupacionActual: Record<string, { sesionId: string; count: number }>
  ) => {
    // ¿Ya tiene reserva en este horario+fecha?
    const reservaExistente = reservasActuales.find(
      r => r.horario_id === horarioId && r.fecha === fecha
    )
    if (reservaExistente) {
      // Cancelar reserva existente
      await supabase.from('reservas').update({ estado: 'cancelada' }).eq('id', reservaExistente.id)
      await cargarReservas(uid)
      const key = `${horarioId}_${fecha}`
      const ocup = ocupacionActual[key]
      if (ocup) setOcupacion({ ...ocupacionActual, [key]: { ...ocup, count: Math.max(0, ocup.count - 1) } })
      return
    }

    const horario = horariosActuales.find(h => h.id === horarioId)
    if (!horario) return

    // Buscar o crear sesión materializada para este horario+fecha
    const { data: existing } = await supabase
      .from('sesiones').select('id, cancelada')
      .eq('horario_id', horarioId).eq('fecha', fecha).maybeSingle()

    // Si la sesión existe pero está cancelada, no permitir reserva
    if (existing?.cancelada) return

    let sesionId = existing?.id
    if (!sesionId) {
      // Materializar sesión virtual
      const { data: nueva, error } = await supabase.from('sesiones').insert({
        horario_id: horarioId,
        actividad_id: horario.actividad_id,
        fecha,
        hora_inicio: horario.hora_inicio,
        duracion_min: horario.duracion_min,
        aforo_max: horario.aforo_max,
        profesor: horario.profesor,
        es_puntual: false,
        cancelada: false,
      }).select('id').single()
      if (error) { console.error('[useSocioData] crear sesión:', error.message); return }
      sesionId = nueva.id
    }

    // Verificar aforo
    const key = `${horarioId}_${fecha}`
    const ocupActual = ocupacionActual[key]?.count || 0
    if (ocupActual >= horario.aforo_max) return

    // Crear o reactivar reserva
    const { data: reservaAnterior } = await supabase
      .from('reservas').select('id').eq('sesion_id', sesionId).eq('user_id', uid).maybeSingle()
    if (reservaAnterior) {
      await supabase.from('reservas').update({ estado: 'confirmada' }).eq('id', reservaAnterior.id)
    } else {
      await supabase.from('reservas').insert({ sesion_id: sesionId, user_id: uid, estado: 'confirmada' })
    }
    await cargarReservas(uid)
    setOcupacion({ ...ocupacionActual, [key]: { sesionId, count: ocupActual + 1 } })
  }, [cargarReservas])

  // Devuelve horarios del día de la semana correspondiente a una fecha
  const getHorariosDelDia = useCallback((fecha: string, todosHorarios: HorarioSocio[]): HorarioSocio[] => {
    const diaSemana = getDiaSemanaLunesPrimero(parseLocalDate(fecha))
    return todosHorarios.filter(h => h.dia_semana === diaSemana)
  }, [])

  return {
    perfil, setPerfil,
    horarios,
    reservas,
    ocupacion,
    qrUrl,
    userId, setUserId,
    loading, setLoading,
    cargarReservas,
    cargarPerfil,
    cargarHorarios,
    actualizarOcupacion,
    reservar,
    getHorariosDelDia,
  }
}
