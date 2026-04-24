'use client'
import HistorialPagos from '@/components/HistorialPagos'
import { TIPOS_MEMBRESIA } from '@/lib/domain/membresias'

interface Props {
  userId: string
  pagando: boolean
  onPagar: (tipoMembresia: string) => void
}

export default function SocioPagosTab({ userId, pagando, onPagar }: Props) {
  return (
    <div>
      <div style={{ background: '#181818', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '16px 20px' }}>
        <div style={{ fontSize: '18px', fontWeight: '800' }}>Mis pagos</div>
      </div>
      <div style={{ padding: '20px' }}>
        <HistorialPagos userId={userId} compact={false} />
        <div style={{ marginTop: '24px' }}>
          <div style={{ fontSize: '11px', color: '#888', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>Renovar membresía</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {TIPOS_MEMBRESIA.map(t => (
              <button key={t.value} onClick={() => onPagar(t.value)} disabled={pagando}
                style={{ background: '#1e1e1e', border: '1px solid rgba(200,245,66,0.2)', borderRadius: '12px', padding: '12px', cursor: 'pointer', fontFamily: 'system-ui', textAlign: 'left', opacity: pagando ? 0.6 : 1 }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#c8f542' }}>{t.label}</div>
              </button>
            ))}
          </div>
          {pagando && <p style={{ color: '#888', fontSize: '12px', textAlign: 'center', marginTop: '8px' }}>Redirigiendo a pago...</p>}
        </div>
      </div>
    </div>
  )
}
