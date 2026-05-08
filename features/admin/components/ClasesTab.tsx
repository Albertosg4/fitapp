'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Clase, Reserva } from '@/types/domain'
import type { TipoMembresia } from '@/lib/domain/membresias'
import { parseLocalDate, getDiaSemanaLunesPrimero, formatLocalDate } from '@/lib/domain/fechas'

// LEGACY: componente no visible en UI. Mantenido para compatibilidad TypeScript.
// No usar en nuevas pantallas.

const cardStyle = { background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '14px', marginBottom: '10px' }

interface ReservaConPerfil extends Reserva {
  perfil: { id: string; nombre: string; tipo_membresia: TipoMembresia } | null
}

interface Props {
  clases: Clase[]
  onEliminarClase: (id: string) => Promise<void>
}

export default function ClasesTab({ clases, onEliminarClase }: Props) {
  const [fechaSeleccionada, setFechaSeleccionada] = useState('')
  const [clasesDelDia, setClasesDelDia] = useState<Clase[]>([])
  const [modalClase, setModalClase] = useState<(Clase & { fecha: string }) | null>(null)
  const [reservasClase, setReservasClase] = useState<ReservaConPerfil[]>([])
  const [loadingReservas, setLoadingReservas] = useState(false)
  const [eliminando, setEliminando] = useState<string | null>(null) // ID de clase en proceso de eliminar

  // Recalcular clasesDelDia cuando cambie props.clases y haya fecha seleccionada
  useEffect(() => {
    if (!fechaSeleccionada) return
    const idx = getDiaSemanaLunesPrimero(parseLocalDate(fechaSeleccionada))
    setClasesDelDia(clases.filter(c => c.dia_semana === idx))
  }, [clases, fechaSeleccionada])

  const seleccionarDia = (fecha: string) => {
    setFechaSeleccionada(fecha)
    const idx = getDiaSemanaLunesPrimero(parseLocalDate(fecha))
    setClasesDelDia(clases.filter(c => c.dia_semana === idx))
  }

  const handleEliminar = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (eliminando) return // evitar doble click
    setEliminando(id)
    try {
      await onEliminarClase(id)
      // clasesDelDia se actualizará via useEffect cuando props.clases cambie
    } catch (err) {
      console.error('[ClasesTab] Error eliminando clase:', err)
    } finally {
      setEliminando(null)
    }
  }

  const abrirModalClase = async (clase: Clase, fecha: string) => {
    setModalClase({ ...clase, fecha })
    setLoadingReservas(true)
    setReservasClase([])

    const { data: sesion } = await supabase
      .from('sesiones').select('id')
      .eq('clase_id', clase.id).eq('fecha', fecha).maybeSingle()
    if (!sesion) { setLoadingReservas(false); return }

    const { data: reservas } = await supabase
      .from('reservas').select('id, user_id, estado')
      .eq('sesion_id', sesion.id).eq('estado', 'confirmada')
    if (!reservas || reservas.length === 0) { setReservasClase([]); setLoadingReservas(false); return }

    const userIds = reservas.map(r => r.user_id as string)
    const { data: perfiles } = await supabase
      .from('perfiles').select('id, nombre, tipo_membresia').in('id', userIds)

    setReservasClase(reservas.map(r => ({
      ...r,
      sesion_id: sesion.id,
      perfil: (perfiles || []).find(p => p.id === r.user_id) ?? null,
    } as ReservaConPerfil)))
    setLoadingReservas(false)
  }

  return (
    <>
      {/* Selector de fecha simple — reemplaza CalendarioMes legacy */}
      <div style={{ marginBottom: '16px' }}>
        <input type="date" value={fechaSeleccionada} onChange={e => seleccionarDia(e.target.value)}
          defaultValue={formatLocalDate(new Date())}
          style={{ background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '10px 14px', color: '#f0f0f0', fontSize: '14px', fontFamily: 'system-ui', outline: 'none' }} />
      </div>

      {fechaSeleccionada && (
        <div>
          <div style={{ fontSize: '12px', color: '#888', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>{fechaSeleccionada}</div>
          {clasesDelDia.length === 0 ? (
            <p style={{ color: '#888', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>Sin clases este día</p>
          ) : clasesDelDia.map(c => (
            <div key={c.id} style={{ ...cardStyle, cursor: 'pointer', opacity: eliminando === c.id ? 0.5 : 1 }} onClick={() => abrirModalClase(c, fechaSeleccionada)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '700' }}>{c.nombre}</div>
                  <div style={{ fontSize: '12px', color: '#888', marginTop: '3px' }}>{c.hora_inicio} · {c.duracion_min} min · Aforo: {c.aforo_max}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#888', padding: '3px 8px', background: 'rgba(255,255,255,0.06)', borderRadius: '8px' }}>Ver reservas</span>
                  <button
                    onClick={(e) => handleEliminar(e, c.id)}
                    disabled={!!eliminando}
                    style={{ background: 'rgba(255,92,92,0.1)', border: '1px solid rgba(255,92,92,0.2)', borderRadius: '8px', padding: '6px 10px', fontSize: '13px', cursor: eliminando ? 'not-allowed' : 'pointer', color: '#ff5c5c', opacity: eliminando === c.id ? 0.5 : 1 }}>
                    {eliminando === c.id ? '...' : '🗑'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!fechaSeleccionada && (
        <p style={{ color: '#888', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>Toca un día del calendario para ver las clases</p>
      )}

      {modalClase && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setModalClase(null) }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '24px 24px 0 0', padding: '24px 20px 36px', width: '100%', maxWidth: '480px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ width: '36px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', margin: '0 auto 20px' }}></div>
            <div style={{ fontSize: '20px', fontWeight: '800', marginBottom: '4px' }}>{modalClase.nombre}</div>
            <div style={{ fontSize: '13px', color: '#888', marginBottom: '20px' }}>{modalClase.fecha} · {modalClase.hora_inicio}</div>
            <div style={{ fontSize: '12px', color: '#888', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>
              Reservas — {loadingReservas ? '...' : `${reservasClase.length} / ${modalClase.aforo_max}`}
            </div>
            {loadingReservas
              ? <p style={{ color: '#888', fontSize: '13px' }}>Cargando...</p>
              : reservasClase.length === 0
                ? <p style={{ color: '#888', fontSize: '13px' }}>Sin reservas para este día</p>
                : reservasClase.map(r => (
                  <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: '14px' }}>{r.perfil?.nombre || 'Sin nombre'}</span>
                    <span style={{ fontSize: '11px', color: '#888' }}>{r.perfil?.tipo_membresia}</span>
                  </div>
                ))
            }
            <button onClick={() => setModalClase(null)} style={{ width: '100%', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '12px', background: 'transparent', color: '#888', fontSize: '14px', cursor: 'pointer', fontFamily: 'system-ui', marginTop: '20px' }}>Cerrar</button>
          </div>
        </div>
      )}
    </>
  )
}
