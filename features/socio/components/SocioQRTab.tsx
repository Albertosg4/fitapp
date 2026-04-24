'use client'
import type { Socio } from '@/types/domain'

interface Props {
  perfil: Socio | null
  qrUrl: string
}

export default function SocioQRTab({ perfil, qrUrl }: Props) {
  return (
    <div>
      <div style={{ background: '#181818', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '16px 20px' }}>
        <div style={{ fontSize: '18px', fontWeight: '800' }}>Mi acceso</div>
      </div>
      <div style={{ padding: '32px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: '11px', color: '#888', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '20px' }}>Tu acceso</div>
        {qrUrl ? (
          <div style={{ background: 'white', borderRadius: '20px', padding: '24px', margin: '0 auto 20px', width: '200px', display: 'inline-block' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrUrl} alt="QR de acceso" style={{ width: '200px', height: '200px', display: 'block' }} />
          </div>
        ) : (
          <div style={{ background: '#1e1e1e', borderRadius: '20px', padding: '24px', margin: '0 auto 20px', width: '200px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#888', fontSize: '13px' }}>Generando QR...</span>
          </div>
        )}
        <div style={{ fontSize: '13px', color: '#888', marginBottom: '4px' }}>Tu identificador</div>
        <div style={{ fontFamily: 'monospace', fontSize: '22px', fontWeight: '800', color: '#c8f542', letterSpacing: '3px' }}>
          FIT-{perfil?.qr_token?.slice(0, 4).toUpperCase() || '0000'}
        </div>
        <p style={{ fontSize: '13px', color: '#888', marginTop: '16px', lineHeight: '1.6' }}>
          Muestra este QR al entrar al gym<br />o al hacer check-in en una clase
        </p>
      </div>
    </div>
  )
}
