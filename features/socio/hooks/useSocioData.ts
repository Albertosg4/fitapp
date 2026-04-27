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
  const [reservaError, setReservaError] = useState<string>('')

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

  // Carga horarios activos del gym_id del socio — filtrado en servidor vía RLS + gym_id del perfil
  // Nota: el filtro real de gym_id se aplica en la API de reservas; aquí el socio
  // solo ve horarios activos. Si la tabla tiene RLS por gym_id, ya está protegido.
  // Si no, la protección crítica es en /api/reservas/toggle que valida gym_id.
  const cargarHorarios = useCallback(async (gymId?: string) => {
    let query = supabase
      .from('horarios_clase')
      .select('id, actividad_id, dia_semana, hora_inicio, duracion_min, aforo_max, profesor, actividad:actividades(nombre, color)')
      .eq('activo', true)
      .order('dia_semana')
      .order('hora_inicio')

    // Filtrar por gym_id si está disponible para evitar ver clases de otro gimnasio
    if (gymId) {
      query = query.eq('gym_id', gymId)
    }

    const { data, error } = await query
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

  /**
   * Reservar o cancelar una clase vía API segura.
   * Ya no escribe directamente en Supabase — toda la lógica está en /api/reservas/toggle.
   * Actualiza estado local optimistamente y recarga reservas tras la operación.
   */
  const reservar = useCallback(async (
    horarioId: string,
    fecha: string,
    uid: string,
    horariosActuales: HorarioSocio[],
    reservasActuales: ReservaLocal[],
    ocupacionActual: Record<string, { sesionId: string; count: number }>
  ): Promise<{ ok: boolean; error?: string }> => {
    setReservaError('')

    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) {
      const msg = 'Sin sesión activa. Vuelve a iniciar sesión.'
      setReservaError(msg)
      return { ok: false, error: msg }
    }

    let res: Response
    try {
      res = await fetch('/api/reservas/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ horarioId, fecha }),
      })
    } catch {
      const msg = 'Error de conexión. Comprueba tu red.'
      setReservaError(msg)
      return { ok: false, error: msg }
    }

    const data = await res.json()

    if (!res.ok) {
      const msg = data.error || `Error ${res.status}`
      setReservaError(msg)
      console.error('[useSocioData] reservar:', msg)
      return { ok: false, error: msg }
    }

    // Actualización optimista de ocupación en cliente
    const key = `${horarioId}_${fecha}`
    const esCancelacion = data.accion === 'cancelada'

    if (esCancelacion) {
      const ocup = ocupacionActual[key]
      if (ocup) {
        setOcupacion({ ...ocupacionActual, [key]: { ...ocup, count: Math.max(0, ocup.count - 1) } })
      }
    } else {
      const horario = horariosActuales.find(h => h.id === horarioId)
      const ocupActual = ocupacionActual[key]?.count || 0
      const sesionId = data.sesionId || ocupacionActual[key]?.sesionId || ''
      if (horario) {
        setOcupacion({ ...ocupacionActual, [key]: { sesionId, count: ocupActual + 1 } })
      }
    }

    // Recargar reservas reales desde BD
    await cargarReservas(uid)
    return { ok: true }
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
    reservaError, setReservaError,
    cargarReservas,
    cargarPerfil,
    cargarHorarios,
    actualizarOcupacion,
    reservar,
    getHorariosDelDia,
  }
}
