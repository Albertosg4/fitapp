'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

type EstadoActividad =
  | 'reservada'
  | 'asistida'
  | 'ausencia'
  | 'cancelada'
  | 'cancelada_gym'
  | 'asistida_sin_reserva'
  | 'estado_no_disponible'

interface ReservaRaw {
  id: string
  estado: string | null
  sesiones: {
    id: string
    fecha: string | null
    hora_inicio: string | null
    cancelada: boolean | null
    clases: { nombre: string | null } | null
  } | null
}

interface AsistenciaRaw {
  id: string
  check_in_at: string
  reserva_id: string | null
  metodo: string | null
  reservas: {
    id: string
    sesiones: {
      id: string
      fecha: string | null
      hora_inicio: string | null
      cancelada: boolean | null
      clases: { nombre: string | null } | null
    } | null
  } | null
}

interface ActividadItem {
  id: string
  fechaHora: Date
  clase: string
  estado: EstadoActividad
  subtitulo?: string
}

const MESES_ES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

function rangoMes(date: Date): { from: Date; to: Date } {
  const from = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0))
  const to = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1, 0, 0, 0))
  return { from, to }
}

function estadoBadge(estado: EstadoActividad): { label: string; icon: string; color: string; border: string; bg: string } {
  switch (estado) {
    case 'reservada':
      return { label: 'Reservada', icon: '📅', color: '#9cc8ff', border: 'rgba(156,200,255,0.35)', bg: 'rgba(156,200,255,0.12)' }
    case 'asistida':
      return { label: 'Asistida', icon: '🥊', color: '#c8f542', border: 'rgba(200,245,66,0.35)', bg: 'rgba(200,245,66,0.12)' }
    case 'ausencia':
      return { label: 'No asististe', icon: '⚠️', color: '#ffb86b', border: 'rgba(255,184,107,0.35)', bg: 'rgba(255,184,107,0.12)' }
    case 'cancelada':
      return { label: 'Cancelada', icon: '✕', color: '#a8a8a8', border: 'rgba(168,168,168,0.35)', bg: 'rgba(168,168,168,0.12)' }
    case 'cancelada_gym':
      return { label: 'Cancelada por el gimnasio', icon: '⚠️', color: '#ffd479', border: 'rgba(255,212,121,0.35)', bg: 'rgba(255,212,121,0.12)' }
    case 'asistida_sin_reserva':
      return { label: 'Asistida sin reserva previa', icon: '✅', color: '#c8f542', border: 'rgba(200,245,66,0.35)', bg: 'rgba(200,245,66,0.12)' }
    default:
      return { label: 'Estado no disponible', icon: '⚠️', color: '#b8b8b8', border: 'rgba(184,184,184,0.35)', bg: 'rgba(184,184,184,0.12)' }
  }
}

export default function HistorialActividadSocio({ userId }: { userId: string }) {
  const [mesCursor, setMesCursor] = useState(new Date())
  const [estadoFiltro, setEstadoFiltro] = useState<'todo' | EstadoActividad>('todo')
  const [items, setItems] = useState<ActividadItem[]>([])
  const [loading, setLoading] = useState(true)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const { from, to } = rangoMes(mesCursor)

      const [{ data: reservasData, error: reservasError }, { data: asistenciaData, error: asistenciaError }] = await Promise.all([
        supabase
          .from('reservas')
          .select('id, estado, sesiones(id, fecha, hora_inicio, cancelada, clases(nombre))')
          .eq('user_id', userId)
          .gte('sesiones.fecha', from.toISOString().slice(0, 10))
          .lt('sesiones.fecha', to.toISOString().slice(0, 10)),
        supabase
          .from('asistencia')
          .select('id, check_in_at, reserva_id, metodo, reservas(id, sesiones(id, fecha, hora_inicio, cancelada, clases(nombre)))')
          .eq('user_id', userId)
          .gte('check_in_at', from.toISOString())
          .lt('check_in_at', to.toISOString()),
      ])

      if (reservasError) throw reservasError
      if (asistenciaError) throw asistenciaError

      const reservas = (reservasData ?? []) as unknown as ReservaRaw[]
      const asistencias = (asistenciaData ?? []) as unknown as AsistenciaRaw[]

      const asistenciasPorReserva = new Set(asistencias.map(a => a.reserva_id).filter(Boolean) as string[])
      const base: ActividadItem[] = reservas.map(r => {
        const sesion = r.sesiones
        const fechaBase = sesion?.fecha ? `${sesion.fecha}T${(sesion.hora_inicio ?? '00:00:00').slice(0, 8)}` : null
        const fechaHora = fechaBase ? new Date(fechaBase) : new Date('1970-01-01T00:00:00Z')
        const nombreClase = sesion?.clases?.nombre?.trim() || 'Clase no disponible'

        let estado: EstadoActividad = 'estado_no_disponible'
        let subtitulo: string | undefined

        if (!sesion) {
          estado = 'estado_no_disponible'
          subtitulo = 'La clase original ya no está disponible'
        } else if (sesion.cancelada === true) {
          estado = 'cancelada_gym'
        } else if (r.estado === 'cancelada') {
          estado = 'cancelada'
        } else if (asistenciasPorReserva.has(r.id)) {
          estado = 'asistida'
        } else if (r.estado === 'confirmada') {
          estado = fechaHora.getTime() > Date.now() ? 'reservada' : 'ausencia'
        }

        return { id: `res-${r.id}`, fechaHora, clase: nombreClase, estado, subtitulo }
      })

      const asistenciaSinReserva: ActividadItem[] = asistencias
        .filter(a => !a.reserva_id)
        .map(a => ({
          id: `asis-${a.id}`,
          fechaHora: new Date(a.check_in_at),
          clase: a.reservas?.sesiones?.clases?.nombre?.trim() || 'Clase no disponible',
          estado: 'asistida_sin_reserva',
          subtitulo: a.reservas?.sesiones?.clases?.nombre ? undefined : 'La clase original ya no está disponible',
        }))

      setItems([...base, ...asistenciaSinReserva].sort((a, b) => b.fechaHora.getTime() - a.fechaHora.getTime()))
    } catch (error) {
      console.error('[HistorialActividadSocio] error:', error)
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [mesCursor, userId])

  useEffect(() => {
    if (userId) cargar()
  }, [userId, cargar])

  const itemsFiltrados = useMemo(() => estadoFiltro === 'todo' ? items : items.filter(i => i.estado === estadoFiltro), [items, estadoFiltro])

  const resumen = useMemo(() => {
    const ahora = new Date()
    return {
      asistidas: items.filter(i => i.estado === 'asistida' || i.estado === 'asistida_sin_reserva').length,
      esteMes: items.length,
      ausencias: items.filter(i => i.estado === 'ausencia').length,
      proximas: items.filter(i => i.estado === 'reservada' && i.fechaHora.getTime() > ahora.getTime()).length,
    }
  }, [items])

  const mesLabel = `${MESES_ES[mesCursor.getUTCMonth()]} ${mesCursor.getUTCFullYear()}`

  return (
    <div>
      <div style={{ background: '#181818', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '16px 20px' }}>
        <div style={{ fontSize: '20px', fontWeight: 800, color: '#f4f4f5' }}>Mi historial</div>
        <div style={{ color: '#a1a1aa', marginTop: 4, fontSize: 14 }}>Consulta tus reservas, asistencias y ausencias.</div>
      </div>
      <div style={{ padding: 20 }}>
        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', marginBottom: 18 }}>
          {[
            ['Asistidas', resumen.asistidas],
            ['Este mes', resumen.esteMes],
            ['Ausencias', resumen.ausencias],
            ['Próximas', resumen.proximas],
          ].map(([k, v]) => (
            <div key={String(k)} style={{ background: '#181818', border: '1px solid rgba(200,245,66,0.18)', borderRadius: 12, padding: 14 }}>
              <div style={{ color: '#f4f4f5', fontSize: 28, fontWeight: 800 }}>{v}</div>
              <div style={{ color: '#a1a1aa', fontSize: 12 }}>{k}</div>
            </div>
          ))}
        </div>

        <div style={{ background: '#181818', border: '1px solid rgba(200,245,66,0.18)', borderRadius: 12, padding: 14, marginBottom: 12 }}>
          <div style={{ color: '#f4f4f5', fontWeight: 700, marginBottom: 8 }}>Actividad</div>
          <label style={{ color: '#a1a1aa', fontSize: 13 }}>Mes:</label>
          <input
            type="month"
            value={`${mesCursor.getUTCFullYear()}-${String(mesCursor.getUTCMonth() + 1).padStart(2, '0')}`}
            onChange={(e) => setMesCursor(new Date(`${e.target.value}-01T00:00:00Z`))}
            style={{ marginLeft: 8, background: '#111', color: '#f4f4f5', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '6px 8px' }}
          />
          <div style={{ color: '#71717a', fontSize: 12, marginTop: 6 }}>{mesLabel}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
            {[
              ['todo', 'Todo'],
              ['reservada', 'Reservadas'],
              ['asistida', 'Asistidas'],
              ['ausencia', 'Ausencias'],
              ['cancelada', 'Canceladas'],
            ].map(([value, label]) => {
              const active = estadoFiltro === value
              return (
                <button
                  key={value}
                  onClick={() => setEstadoFiltro(value as 'todo' | EstadoActividad)}
                  style={{
                    background: active ? 'rgba(200,245,66,0.18)' : '#111',
                    border: `1px solid ${active ? 'rgba(200,245,66,0.45)' : 'rgba(255,255,255,0.15)'}`,
                    color: active ? '#c8f542' : '#d4d4d8', borderRadius: 999, padding: '6px 10px', fontSize: 12,
                  }}
                >{label}</button>
              )
            })}
          </div>
        </div>

        {loading ? <div style={{ color: '#a1a1aa' }}>Cargando actividad...</div> : itemsFiltrados.length === 0 ? (
          <div style={{ color: '#a1a1aa', textAlign: 'center', padding: '24px 0' }}>No hay actividad registrada en este mes.</div>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {itemsFiltrados.map(item => {
              const badge = estadoBadge(item.estado)
              return (
                <div key={item.id} style={{ background: '#181818', border: '1px solid rgba(200,245,66,0.18)', borderRadius: 12, padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <div>
                      <div style={{ color: '#f4f4f5', fontWeight: 700 }}>{badge.icon} {item.clase}</div>
                      {item.subtitulo && <div style={{ color: '#a1a1aa', fontSize: 12 }}>{item.subtitulo}</div>}
                      <div style={{ color: '#71717a', fontSize: 12, marginTop: 4 }}>
                        {item.fechaHora.toLocaleDateString('es-ES')} · {item.fechaHora.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <span style={{ alignSelf: 'flex-start', fontSize: 12, color: badge.color, border: `1px solid ${badge.border}`, background: badge.bg, borderRadius: 999, padding: '4px 10px' }}>{badge.label}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
