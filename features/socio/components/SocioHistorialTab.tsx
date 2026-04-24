'use client'
import HistorialAsistencia from '@/components/HistorialAsistencia'

interface Props {
  userId: string
}

export default function SocioHistorialTab({ userId }: Props) {
  return (
    <div>
      <div style={{ background: '#181818', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '16px 20px' }}>
        <div style={{ fontSize: '18px', fontWeight: '800' }}>Mi historial</div>
      </div>
      <div style={{ padding: '20px' }}>
        <HistorialAsistencia userId={userId} limit={50} compact={false} />
      </div>
    </div>
  )
}
