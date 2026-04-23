'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import CalendarioMes from '@/components/CalendarioMes'

const cardStyle = { background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '14px', marginBottom: '10px' }

interface Props {
  clases: any[]
  onEliminarClase: (id: string) => void
}

export default function ClasesTab({ clases, onEliminarClase }: Props) {
  const [fechaSeleccionada, setFechaSeleccionada] = useState('')
  const [clasesDelDia, setClasesDelDia] = useState<any[]>([])
  const [modalClase, setModalClase] = useState<any>(null)
  const [reservasClase, setReservasClase] = useState<any[]>([])
  const [loadingReservas, setLoadingReservas] = useState(false)

  const seleccionarDia = (fecha: string, clasesD: any[]) => {
    setFechaSeleccionada(fecha)
    setClasesDelDia(clasesD)
  }

  const abrirModalClase = async (clase: any, fecha: string) => {
    setModalClase({ ...clase, fecha })
    setLoadingReservas(true)
    setReservasClase([])
    const { data: sesion } = await supabase.from('sesiones').select('id').eq('clase_id', clase.id).eq('fecha', fecha).maybeSingle()
    if (!sesion) { setLoadingReservas(false); return }
    const { data: reservas } = await supabase.from('reservas').select('id, user_id, estado').eq('sesion_id', sesion.id).eq('estado', 'confirmada')
    if (!reservas || reservas.length === 0) { setReservasClase([]); setLoadingReservas(false); return }
    const userIds = reservas.map((r: any) => r.user_id)
    const { data: perfiles } = await supabase.from('perfiles').select('id, nombre, tipo_membresia').in('id', userIds)
    setReservasClase(reservas.map((r: any) => ({ ...r, perfil: (perfiles || []).find((p: any) => p.id === r.user_id) })))
    setLoadingReservas(false)
  }

  return (
    <>
      <CalendarioMes clases={clases} onSeleccionarDia={seleccionarDia} />

      {fechaSeleccionada && (
        <div>
          <div style={{ fontSize: '12px', color: '#888', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>{fechaSeleccionada}</div>
          {clasesDelDia.length === 0 ? (
            <p style={{ color: '#888', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>Sin clases este día</p>
          ) : clasesDelDia.map(c => (
            <div key={c.id} style={{ ...cardStyle, cursor: 'pointer' }} onClick={() => abrirModalClase(c, fechaSeleccionada)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '700' }}>{c.nombre}</div>
                  <div style={{ fontSize: '12px', color: '#888', marginTop: '3px' }}>{c.hora_inicio} · {c.duracion_min} min · Aforo: {c.aforo_max}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#888', padding: '3px 8px', background: 'rgba(255,255,255,0.06)', borderRadius: '8px' }}>Ver reservas</span>
                  <button onClick={(e) => { e.stopPropagation(); onEliminarClase(c.id) }}
                    style={{ background: 'rgba(255,92,92,0.1)', border: '1px solid rgba(255,92,92,0.2)', borderRadius: '8px', padding: '6px 10px', fontSize: '13px', cursor: 'pointer', color: '#ff5c5c' }}>🗑</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!fechaSeleccionada && (
        <p style={{ color: '#888', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>Toca un día del calendario para ver las clases</p>
      )}

      {/* MODAL CLASE */}
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
                : reservasClase.map((r: any) => (
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
