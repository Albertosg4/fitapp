'use client'
import CalendarioMes from '@/components/CalendarioMes'
import type { Clase } from '@/types/domain'
import type { ReservaLocal } from '@/features/socio/hooks/useSocioData'
import type { Socio } from '@/types/domain'
import { getEstadoMembresiaAdmin } from '@/lib/domain/membresias'

interface Props {
  perfil: Socio | null
  clases: Clase[]
  reservas: ReservaLocal[]
  ocupacion: Record<string, { sesionId: string; count: number }>
  modalFecha: string
  clasesDelDia: Clase[]
  onSeleccionarDia: (fecha: string, clases: Clase[]) => void
  onAbrirModal: (clase: Clase & { fecha: string }) => void
}

export default function SocioClasesTab({
  perfil, clases, reservas, ocupacion,
  modalFecha, clasesDelDia,
  onSeleccionarDia, onAbrirModal,
}: Props) {
  const estadoMembresia = perfil ? getEstadoMembresiaAdmin(perfil) : 'ok'
  const marcadores: Record<string, 'reservada' | 'disponible' | 'llena'> = {}
  reservas.forEach(r => { if (r.fecha) marcadores[r.fecha] = 'reservada' })

  const estaReservada = (claseId: string, fecha: string) =>
    reservas.some(r => r.clase_id === claseId && r.fecha === fecha)

  return (
    <div>
      <div style={{ background: 'linear-gradient(160deg, #1a2a0a 0%, #0f0f0f 60%)', padding: '28px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ fontSize: '13px', color: '#888' }}>Buenos días,</div>
        <div style={{ fontSize: '22px', fontWeight: '800' }}>{perfil?.nombre || 'Socio'} <span style={{ color: '#c8f542' }}>👋</span></div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '10px', background: estadoMembresia === 'caducada' ? 'rgba(255,92,92,0.1)' : 'rgba(200,245,66,0.1)', border: `1px solid ${estadoMembresia === 'caducada' ? 'rgba(255,92,92,0.2)' : 'rgba(200,245,66,0.2)'}`, borderRadius: '20px', padding: '4px 12px', fontSize: '12px', color: estadoMembresia === 'caducada' ? '#ff5c5c' : '#c8f542' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: estadoMembresia === 'caducada' ? '#ff5c5c' : '#c8f542', display: 'inline-block' }}></span>
          {perfil?.tipo_membresia || 'Básica'} · {estadoMembresia === 'caducada' ? 'Caducada' : 'Activa'}
        </div>
      </div>

      <div style={{ padding: '20px' }}>
        <CalendarioMes clases={clases} onSeleccionarDia={onSeleccionarDia} marcadores={marcadores} />
        {modalFecha && clasesDelDia.length === 0 && (
          <p style={{ color: '#888', textAlign: 'center', padding: '20px 0', fontSize: '13px' }}>Sin clases este día</p>
        )}
        {modalFecha && clasesDelDia.map(c => {
          const key = `${c.id}_${modalFecha}`
          const reservada = estaReservada(c.id, modalFecha)
          const ocupadas = ocupacion[key]?.count ?? 0
          const libres = c.aforo_max - ocupadas
          const llena = libres <= 0 && !reservada
          const porcentaje = Math.min((ocupadas / c.aforo_max) * 100, 100)
          const colorBarra = porcentaje >= 90 ? '#ff5c5c' : porcentaje >= 60 ? '#ffb84d' : '#c8f542'
          return (
            <div key={c.id} onClick={() => onAbrirModal({ ...c, fecha: modalFecha })}
              style={{ background: '#1e1e1e', border: `1px solid ${reservada ? 'rgba(200,245,66,0.4)' : llena ? 'rgba(255,92,92,0.2)' : 'rgba(255,255,255,0.07)'}`, borderLeft: reservada ? '3px solid #c8f542' : llena ? '3px solid #ff5c5c' : '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '16px', marginBottom: '12px', cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div>
                  <div style={{ fontSize: '17px', fontWeight: '700' }}>{c.nombre}</div>
                  <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{c.hora_inicio} · {c.duracion_min} min</div>
                </div>
                <span style={{ fontSize: '11px', fontWeight: '600', borderRadius: '20px', padding: '3px 10px', background: reservada ? 'rgba(200,245,66,0.15)' : llena ? 'rgba(255,92,92,0.15)' : 'rgba(255,255,255,0.07)', color: reservada ? '#c8f542' : llena ? '#ff5c5c' : '#888' }}>
                  {reservada ? '✓ Reservada' : llena ? 'Llena' : `${libres}/${c.aforo_max} libres`}
                </span>
              </div>
              <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${porcentaje}%`, background: reservada ? '#c8f542' : colorBarra, borderRadius: '2px', transition: 'width 0.3s' }}></div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
