'use client'
import type { Socio } from '@/types/domain'
import type { ReservaLocal } from '@/features/socio/hooks/useSocioData'
import { getEstadoMembresiaAdmin, getDiasRestantes } from '@/lib/domain/membresias'

interface Props {
  perfil: Socio | null
  reservas: ReservaLocal[]
  clases: { id: string; nombre: string; hora_inicio: string }[]
  onVerPagos: () => void
  onLogout: () => void
}

export default function SocioPerfilTab({ perfil, reservas, clases, onVerPagos, onLogout }: Props) {
  const estadoMembresia = perfil ? getEstadoMembresiaAdmin(perfil) : 'ok'
  const diasRestantes = perfil?.membresia_vence ? getDiasRestantes(perfil.membresia_vence) : 0

  return (
    <div>
      <div style={{ background: '#181818', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '18px', fontWeight: '800' }}>Mi perfil</div>
        <button onClick={onLogout} style={{ background: 'rgba(255,92,92,0.12)', color: '#ff5c5c', border: '1px solid rgba(255,92,92,0.2)', borderRadius: '8px', padding: '6px 14px', fontSize: '13px', cursor: 'pointer', fontFamily: 'system-ui' }}>Salir</button>
      </div>

      <div style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, #c8f542, #42f5b3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '800', color: '#0f0f0f', flexShrink: 0 }}>
          {(perfil?.nombre || 'S').charAt(0).toUpperCase()}
        </div>
        <div>
          <div style={{ fontSize: '18px', fontWeight: '800' }}>{perfil?.nombre || 'Socio'}</div>
          <div style={{ fontSize: '13px', color: '#888', marginTop: '2px' }}>{perfil?.telefono || 'Sin teléfono'}</div>
        </div>
      </div>

      <div style={{ margin: '16px 20px', background: estadoMembresia === 'caducada' ? 'linear-gradient(135deg, #2a0a0a, #1a0808)' : estadoMembresia === 'pronto' ? 'linear-gradient(135deg, #2a1a0a, #1a1208)' : 'linear-gradient(135deg, #1a2a0a, #162210)', border: `1px solid ${estadoMembresia === 'caducada' ? 'rgba(255,92,92,0.2)' : estadoMembresia === 'pronto' ? 'rgba(255,184,77,0.2)' : 'rgba(200,245,66,0.2)'}`, borderRadius: '14px', padding: '18px' }}>
        <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Membresía</div>
        <div style={{ fontSize: '20px', fontWeight: '800', color: estadoMembresia === 'caducada' ? '#ff5c5c' : estadoMembresia === 'pronto' ? '#ffb84d' : '#c8f542' }}>{perfil?.tipo_membresia || 'Básica'}</div>
        <div style={{ fontSize: '12px', color: estadoMembresia === 'caducada' ? '#ff5c5c' : estadoMembresia === 'pronto' ? '#ffb84d' : '#42f5b3', marginTop: '8px' }}>
          {estadoMembresia === 'caducada' ? '❌ Caducada' : estadoMembresia === 'pronto' ? `⚠️ Vence en ${diasRestantes} días` : `✓ Válida hasta ${perfil?.membresia_vence || 'N/A'}`}
        </div>
      </div>

      <div style={{ padding: '0 20px 20px' }}>
        <button onClick={onVerPagos} style={{ width: '100%', background: 'rgba(200,245,66,0.08)', border: '1px solid rgba(200,245,66,0.2)', borderRadius: '12px', padding: '12px', color: '#c8f542', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: 'system-ui' }}>
          💳 Ver mis pagos y renovar membresía
        </button>
      </div>

      <div style={{ padding: '0 20px' }}>
        <div style={{ fontSize: '11px', color: '#888', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>Clases reservadas</div>
        {reservas.length === 0 ? (
          <p style={{ color: '#888', fontSize: '13px' }}>No tienes reservas activas.</p>
        ) : reservas.map(r => {
          const c = clases.find(x => x.id === r.clase_id)
          if (!c) return null
          return (
            <div key={r.id} style={{ background: '#1e1e1e', border: '1px solid rgba(200,245,66,0.2)', borderRadius: '10px', padding: '12px 14px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: '600', fontSize: '14px' }}>{c.nombre}</div>
                <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{r.fecha} · {c.hora_inicio}</div>
              </div>
              <span style={{ fontSize: '11px', background: 'rgba(200,245,66,0.12)', color: '#c8f542', padding: '3px 10px', borderRadius: '20px' }}>✓</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
