'use client'
import { useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import QRCode from 'qrcode'
import type { Socio } from '@/types/domain'
import { getDiaSemanaLunesPrimero, parseLocalDate } from '@/lib/domain/fechas'

export interface HorarioSocio {
  id: string
  actividad_id: string
  actividad_nombre: string
  actividad_color: string | null
  dia_semana: number
  hora_inicio: string
  duracion_min: number
  aforo_max: number
  profesor: string | null
}

export interface ReservaLocal {
  id: string
  sesion_id: string
  horario_id: string | null
  actividad_id: string | null
  fecha: string
}

type ReservaAction = 'confirmada' | 'cancelada'

export function useSocioData() {
  const [perfil, setPerfil] = useState<Socio | null>(null)
  const [horarios, setHorarios] = useState<HorarioSocio[]>([])
  const [reservas, setReservas] = useState<ReservaLocal[]>([])
  const [ocupacion, setOcupacion] = useState<Record<string, { sesionId: string; count: number }>>({})
  const [qrUrl, setQrUrl] = useState('')
  const [userId, setUserId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [reservaError, setReservaError] = useState<string>('')
  const [reservasEnCurso, setReservasEnCurso] = useState<Record<string, boolean>>({})
  const reservasEnCursoRef = useRef<Set<string>>(new Set())

  const getReservaKey = useCallback((horarioId: string, fecha: string) => `${horarioId}_${fecha}`, [])

  const isReservaEnCurso = useCallback((horarioId: string, fecha: string) => {
    return reservasEnCurso[getReservaKey(horarioId, fecha)] === true
  }, [reservasEnCurso, getReservaKey])

  const normalizarErrorReserva = useCallback((status: number, rawError?: string): string => {
    const message = (rawError || '').toLowerCase()
    if (message.includes('caduc')) return 'Tu membresía está caducada o inactiva. Renuévala para reservar.'
    if (message.includes('aforo') || status === 409) return 'La clase está completa. No quedan plazas disponibles.'
    if (status === 401 || message.includes('sin sesión') || message.includes('token')) {
      return 'Tu sesión ha caducado. Cierra sesión y vuelve a entrar.'
    }
    if (status >= 500) return 'No se pudo procesar la reserva ahora. Inténtalo de nuevo en unos segundos.'
    return rawError || `Error ${status}`
  }, [])

  const cargarReservas = useCallback(async (
    uid: string,
    options?: { updateState?: boolean }
  ): Promise<{ ok: boolean; reservas: ReservaLocal[]; error?: string }> => {
    const updateState = options?.updateState ?? true
    const { data, error } = await supabase
      .from('reservas')
      .select('id, sesion_id, estado, sesiones(horario_id, actividad_id, fecha)')
      .eq('user_id', uid)
      .eq('estado', 'confirmada')

    if (error) {
      console.error('[useSocioData] cargarReservas error:', error.message)
      return { ok: false, reservas: [], error: error.message }
    }

    type RawR = { id: string; sesion_id: string; sesiones: unknown }
    const base = ((data || []) as RawR[]).map(r => {
      const s = (Array.isArray(r.sesiones) ? r.sesiones[0] : r.sesiones) as {
        horario_id: string | null
        actividad_id: string | null
        fecha: string
      } | null

      return {
        id: r.id,
        sesion_id: String(r.sesion_id),
        horario_id: s?.horario_id ? String(s.horario_id) : null,
        actividad_id: s?.actividad_id ? String(s.actividad_id) : null,
        fecha: String(s?.fecha ?? '').slice(0, 10),
      }
    })

    const faltanSesiones = base.filter(r => !r.horario_id || !r.fecha).map(r => r.sesion_id)
    let completas = base

    if (faltanSesiones.length > 0) {
      const { data: sesionesData, error: sesionesError } = await supabase
        .from('sesiones')
        .select('id, horario_id, actividad_id, fecha')
        .in('id', faltanSesiones)

      if (sesionesError) {
        console.error('[useSocioData] cargarReservas sesiones fallback error:', sesionesError.message)
      } else if (sesionesData) {
        const sesionesMap = new Map(
          sesionesData.map(s => [
            String(s.id),
            {
              horario_id: s.horario_id ? String(s.horario_id) : null,
              actividad_id: s.actividad_id ? String(s.actividad_id) : null,
              fecha: String(s.fecha ?? '').slice(0, 10),
            },
          ])
        )

        completas = base.map(r => {
          if (r.horario_id && r.fecha) return r
          const fallback = sesionesMap.get(r.sesion_id)
          if (!fallback) return r
          return {
            ...r,
            horario_id: fallback.horario_id,
            actividad_id: fallback.actividad_id,
            fecha: fallback.fecha,
          }
        })
      }
    }

    if (updateState) {
      setReservas(completas)
    }
    return { ok: true, reservas: completas }
  }, [])

  const cargarPerfil = useCallback(async (uid: string) => {
    const { data: p } = await supabase.from('perfiles').select('*').eq('id', uid).single()
    setPerfil(p as Socio)
    if (p?.qr_token) {
      const url = await QRCode.toDataURL(`${window.location.origin}/checkin?token=${p.qr_token}`)
      setQrUrl(url)
    }
  }, [])

  const cargarHorarios = useCallback(async (gymId?: string) => {
    let query = supabase
      .from('horarios_clase')
      .select('id, actividad_id, dia_semana, hora_inicio, duracion_min, aforo_max, profesor, actividad:actividades(nombre, color)')
      .eq('activo', true)
      .order('dia_semana')
      .order('hora_inicio')

    if (gymId) query = query.eq('gym_id', gymId)

    const { data, error } = await query
    if (error) {
      console.error('[useSocioData] cargarHorarios:', error.message)
      return
    }

    type RawH = {
      id: string
      actividad_id: string
      dia_semana: number
      hora_inicio: string
      duracion_min: number
      aforo_max: number
      profesor: string | null
      actividad: { nombre: string; color: string | null } | { nombre: string; color: string | null }[] | null
    }

    setHorarios(((data || []) as RawH[]).map(h => {
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

  const getOcupacionFecha = useCallback(async (horarioId: string, fecha: string) => {
    const { data: sesion } = await supabase
      .from('sesiones')
      .select('id')
      .eq('horario_id', horarioId)
      .eq('fecha', fecha)
      .maybeSingle()

    if (!sesion) return { sesionId: null, count: 0 }

    const { count } = await supabase
      .from('reservas')
      .select('id', { count: 'exact', head: true })
      .eq('sesion_id', sesion.id)
      .eq('estado', 'confirmada')

    return { sesionId: sesion.id, count: count || 0 }
  }, [])

  const actualizarOcupacion = useCallback(async (fecha: string, horariosDelDia: HorarioSocio[]) => {
    const nuevaOcupacion: Record<string, { sesionId: string; count: number }> = {}
    for (const h of horariosDelDia) {
      const key = `${h.id}_${fecha}`
      const result = await getOcupacionFecha(h.id, fecha)
      nuevaOcupacion[key] = { sesionId: result.sesionId || '', count: result.count }
    }
    setOcupacion(prev => ({ ...prev, ...nuevaOcupacion }))
  }, [getOcupacionFecha])

  const reservar = useCallback(async (
    horarioId: string,
    fecha: string,
    uid: string,
    horariosDiaActuales: HorarioSocio[]
  ): Promise<{ ok: boolean; error?: string; accion?: ReservaAction; sesionId?: string; reservasActualizadas?: ReservaLocal[] }> => {
    const key = getReservaKey(horarioId, fecha)
    if (reservasEnCursoRef.current.has(key)) return { ok: false, error: 'Ya estamos procesando esta reserva.' }

    reservasEnCursoRef.current.add(key)
    setReservasEnCurso(prev => ({ ...prev, [key]: true }))
    setReservaError('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        const msg = 'Sin sesión activa. Vuelve a iniciar sesión.'
        setReservaError(msg)
        return { ok: false, error: msg }
      }

      const res = await fetch('/api/reservas/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ horarioId, fecha }),
      })

      const data = await res.json()
      if (!res.ok) {
        const msg = normalizarErrorReserva(res.status, data.error)
        setReservaError(msg)
        console.error('[useSocioData] reservar:', msg)
        return { ok: false, error: msg }
      }

      const sesionId = data.sesionId ? String(data.sesionId) : undefined
      const reservaCanonica = data.reserva
        ? {
          id: String(data.reserva.id),
          sesion_id: String(data.reserva.sesion_id),
          horario_id: data.reserva.horario_id ? String(data.reserva.horario_id) : null,
          actividad_id: data.reserva.actividad_id ? String(data.reserva.actividad_id) : null,
          fecha: String(data.reserva.fecha ?? '').slice(0, 10),
        }
        : null

      if (data.accion === 'confirmada' && reservaCanonica) {
        setReservas(prev => {
          const filtradas = prev.filter(r =>
            r.sesion_id !== reservaCanonica.sesion_id
            && !(r.horario_id === reservaCanonica.horario_id && String(r.fecha).slice(0, 10) === reservaCanonica.fecha)
          )
          return [...filtradas, reservaCanonica]
        })
      } else if (data.accion === 'cancelada') {
        setReservas(prev => prev.filter(r =>
          !(sesionId && r.sesion_id === sesionId)
          && !(r.horario_id === horarioId && String(r.fecha).slice(0, 10) === fecha)
        ))
      }

      const tieneOcupacionCanonica = typeof data.ocupacion === 'number'
      if (tieneOcupacionCanonica) {
        const keyOcupacion = `${horarioId}_${fecha}`
        setOcupacion(prev => ({
          ...prev,
          [keyOcupacion]: {
            sesionId: sesionId ?? prev[keyOcupacion]?.sesionId ?? '',
            count: data.ocupacion,
          },
        }))
      }

      const cargaReservasResult = await cargarReservas(uid, { updateState: false })
      if (!cargaReservasResult.ok) {
        console.error('[useSocioData] reservar: no se pudieron recargar reservas:', cargaReservasResult.error)
      }

      if (!tieneOcupacionCanonica) {
        const horariosRecarga = horariosDiaActuales.length > 0
          ? horariosDiaActuales
          : horarios.filter(h => h.dia_semana === getDiaSemanaLunesPrimero(parseLocalDate(fecha)))
        await actualizarOcupacion(fecha, horariosRecarga)
      }

      return {
        ok: true,
        accion: data.accion as ReservaAction | undefined,
        sesionId,
        reservasActualizadas: cargaReservasResult.reservas,
      }
    } catch {
      const msg = 'Error de conexión. Comprueba tu red.'
      setReservaError(msg)
      return { ok: false, error: msg }
    } finally {
      reservasEnCursoRef.current.delete(key)
      setReservasEnCurso(prev => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    }
  }, [actualizarOcupacion, cargarReservas, getReservaKey, horarios, normalizarErrorReserva])

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
    reservasEnCurso,
    isReservaEnCurso,
    cargarReservas,
    cargarPerfil,
    cargarHorarios,
    actualizarOcupacion,
    reservar,
    getHorariosDelDia,
  }
}
