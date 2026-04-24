'use client'
import CalendarioMes from '@/components/CalendarioMes'
import type { HorarioSocio, ReservaLocal } from '@/features/socio/hooks/useSocioData'
import type { Socio } from '@/types/domain'
import { getEstadoMembresiaAdmin } from '@/lib/domain/membresias'

interface Props {
  perfil: Socio | null
  horarios: HorarioSocio[]
  reservas: ReservaLocal[]
  ocupacion: Record<string, { sesionId: string; count: number }>
  modalFecha: string
  horariosDelDia: HorarioSocio[]
  onSeleccionarDia: (fecha: string, horariosDelDia: HorarioSocio[]) => void
  onAbrirModal: (horario: HorarioSocio & { fecha: string }) => void
}

export default function SocioClasesTab({
  perfil, horarios, reservas, ocupacion,
  modalFecha, horariosDelDia,
  onSeleccionarDia, onAbrirModal,
}: Props) {
  const estadoMembresia = perfil ? getEstadoMembresiaAdmin(perfil) : 'ok'

  // Marcadores: fechas con reserva confirmada
  const marcadores: Record<string, 'reservada' | 'disponible' | 'llena'> = {}
  reservas.forEach(r => { if (r.fecha) marcadores[r.fecha] = 'reservada' })

  const estaReservado = (horarioId: string, fecha: string) =>
    reservas.some(r => r.horario_id === horarioId && r.fecha === fecha)

  return (
    <div>
      {/* Header */}
      <div style={{ background: 'linear-gradient(160deg, #1a2a0a 0%, #0f0f0f 60%)', padding: '28px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ fontSize: '13px', color: '#888' }}>Buenos días,</div>
        <div style={{ fontSize: '22px', fontWeight: '800' }}>{perfil?.nombre || 'Socio'} <span style={{ color: '#c8f542' }}>👋</span></div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '10px', background: estadoMembresia === 'caducada' ? 'rgba(255,92,92,0.1)' : 'rgba(200,245,66,0.1)', border: `1px solid ${estadoMembresia === 'caducada' ? 'rgba(255,92,92,0.2)' : 'rgba(200,245,66,0.2)'}`, borderRadius: '20px', padding: '4px 12px', fontSize: '12px', color: estadoMembresia === 'caducada' ? '#ff5c5c' : '#c8f542' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: estadoMembresia === 'caducada' ? '#ff5c5c' : '#c8f542', display: 'inline-block' }}></span>
          {perfil?.tipo_membresia || 'Básica'} · {estadoMembresia === 'caducada' ? 'Caducada' : 'Activa'}
        </div>
      </div>

      <div style={{ padding: '20px' }}>
        <CalendarioMes horarios={horarios} onSeleccionarDia={onSeleccionarDia} marcadores={marcadores} />

        {modalFecha && horariosDelDia.length === 0 && (
          <p style={{ color: '#888', textAlign: 'center', padding: '20px 0', fontSize: '13px' }}>Sin clases este día</p>
        )}

        {modalFecha && horariosDelDia.map(h => {
          const key = `${h.id}_${modalFecha}`
          const reservado = estaReservado(h.id, modalFecha)
          const ocupadas = ocupacion[key]?.count ?? 0
          const libres = h.aforo_max - ocupadas
          const llena = libres <= 0 && !reservado
          const porcentaje = Math.min((ocupadas / h.aforo_max) * 100, 100)
          const colorBarra = porcentaje >= 90 ? '#ff5c5c' : porcentaje >= 60 ? '#ffb84d' : '#c8f542'
          const colorAccent = h.actividad_color || '#c8f542'
          return (
            <div key={h.id} onClick={() => onAbrirModal({ ...h, fecha: modalFecha })}
              style={{ background: '#1e1e1e', border: `1px solid ${reservado ? 'rgba(200,245,66,0.4)' : llena ? 'rgba(255,92,92,0.2)' : 'rgba(255,255,255,0.07)'}`, borderLeft: `3px solid ${reservado ? '#c8f542' : llena ? '#ff5c5c' : colorAccent}`, borderRadius: '12px', padding: '16px', marginBottom: '12px', cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div>
                  <div style={{ fontSize: '17px', fontWeight: '700' }}>{h.actividad_nombre}</div>
                  <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
                    {h.hora_inicio} · {h.duracion_min} min
                    {h.profesor && <span style={{ color: '#5ca8ff' }}> · {h.profesor}</span>}
                  </div>
                </div>
                <span style={{ fontSize: '11px', fontWeight: '600', borderRadius: '20px', padding: '3px 10px', background: reservado ? 'rgba(200,245,66,0.15)' : llena ? 'rgba(255,92,92,0.15)' : 'rgba(255,255,255,0.07)', color: reservado ? '#c8f542' : llena ? '#ff5c5c' : '#888' }}>
                  {reservado ? '✓ Reservada' : llena ? 'Llena' : `${libres}/${h.aforo_max} libres`}
                </span>
              </div>
              <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${porcentaje}%`, background: reservado ? '#c8f542' : colorBarra, borderRadius: '2px', transition: 'width 0.3s' }}></div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
