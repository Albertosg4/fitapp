'use client'
import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import QRCode from 'qrcode'
import type { Clase, Socio, Reserva } from '@/types/domain'

export interface ReservaLocal {
  id: string
  sesion_id: string
  clase_id: string
  fecha: string
}

export function useSocioData() {
  const [perfil, setPerfil] = useState<Socio | null>(null)
  const [clases, setClases] = useState<Clase[]>([])
  const [reservas, setReservas] = useState<ReservaLocal[]>([])
  const [ocupacion, setOcupacion] = useState<Record<string, { sesionId: string; count: number }>>({})
  const [qrUrl, setQrUrl] = useState('')
  const [userId, setUserId] = useState<string>('')
  const [loading, setLoading] = useState(true)

  const cargarReservas = useCallback(async (uid: string) => {
    const { data } = await supabase
      .from('reservas').select('id, sesion_id, sesiones(clase_id, fecha)')
      .eq('user_id', uid).eq('estado', 'confirmada')
    type RawR = { id: string; sesion_id: string; sesiones: unknown }
    setReservas(((data || []) as unknown as RawR[]).map(r => {
      const s = (Array.isArray(r.sesiones) ? r.sesiones[0] : r.sesiones) as { clase_id: string; fecha: string } | null
      return { id: r.id, sesion_id: r.sesion_id, clase_id: s?.clase_id ?? '', fecha: s?.fecha ?? '' }
    }))
  }, [])

  const cargarPerfil = useCallback(async (uid: string) => {
    const { data: p } = await supabase.from('perfiles').select('*').eq('id', uid).single()
    setPerfil(p as Socio)
    if (p?.qr_token) {
      const url = await QRCode.toDataURL(`${window.location.origin}/checkin?token=${p.qr_token}`)
      setQrUrl(url)
    }
  }, [])

  const cargarClases = useCallback(async () => {
    const { data: c } = await supabase.from('clases').select('*').eq('activa', true).order('dia_semana').order('hora_inicio')
    setClases((c as Clase[]) || [])
  }, [])

  const getOcupacionFecha = useCallback(async (claseId: string, fecha: string) => {
    const { data: sesion } = await supabase.from('sesiones').select('id').eq('clase_id', claseId).eq('fecha', fecha).maybeSingle()
    if (!sesion) return { sesionId: null, count: 0 }
    const { count } = await supabase.from('reservas').select('id', { count: 'exact', head: true }).eq('sesion_id', sesion.id).eq('estado', 'confirmada')
    return { sesionId: sesion.id, count: count || 0 }
  }, [])

  const actualizarOcupacion = useCallback(async (fecha: string, clasesDelDia: Clase[]) => {
    const nuevaOcupacion: Record<string, { sesionId: string; count: number }> = {}
    for (const clase of clasesDelDia) {
      const key = `${clase.id}_${fecha}`
      const result = await getOcupacionFecha(clase.id, fecha)
      nuevaOcupacion[key] = { sesionId: result.sesionId || '', count: result.count }
    }
    setOcupacion(prev => ({ ...prev, ...nuevaOcupacion }))
  }, [getOcupacionFecha])

  const reservar = useCallback(async (
    claseId: string,
    fecha: string,
    uid: string,
    clasesActuales: Clase[],
    reservasActuales: ReservaLocal[],
    ocupacionActual: Record<string, { sesionId: string; count: number }>
  ) => {
    const reservaExistente = reservasActuales.find(r => r.clase_id === claseId && r.fecha === fecha)
    if (reservaExistente) {
      await supabase.from('reservas').update({ estado: 'cancelada' }).eq('id', reservaExistente.id)
      await cargarReservas(uid)
      const key = `${claseId}_${fecha}`
      const ocup = ocupacionActual[key]
      if (ocup) setOcupacion({ ...ocupacionActual, [key]: { ...ocup, count: Math.max(0, ocup.count - 1) } })
      return
    }
    const clase = clasesActuales.find(c => c.id === claseId)
    if (!clase) return
    // Crear sesión si no existe
    const { data: existing } = await supabase.from('sesiones').select('id').eq('clase_id', claseId).eq('fecha', fecha).maybeSingle()
    let sesionId = existing?.id
    if (!sesionId) {
      const { data: nueva, error } = await supabase.from('sesiones').insert({ clase_id: claseId, fecha }).select('id').single()
      if (error) return
      sesionId = nueva.id
    }
    const key = `${claseId}_${fecha}`
    const ocupActual = ocupacionActual[key]?.count || 0
    if (ocupActual >= clase.aforo_max) return
    const { data: reservaAnterior } = await supabase.from('reservas').select('id').eq('sesion_id', sesionId).eq('user_id', uid).maybeSingle()
    if (reservaAnterior) {
      await supabase.from('reservas').update({ estado: 'confirmada' }).eq('id', (reservaAnterior as Reserva).id)
    } else {
      await supabase.from('reservas').insert({ sesion_id: sesionId, user_id: uid, estado: 'confirmada' })
    }
    await cargarReservas(uid)
    setOcupacion({ ...ocupacionActual, [key]: { sesionId, count: ocupActual + 1 } })
  }, [cargarReservas])

  return {
    perfil, setPerfil,
    clases,
    reservas,
    ocupacion, setOcupacion,
    qrUrl,
    userId, setUserId,
    loading, setLoading,
    cargarReservas,
    cargarPerfil,
    cargarClases,
    actualizarOcupacion,
    reservar,
  }
}
