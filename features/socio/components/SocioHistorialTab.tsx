'use client'
import HistorialAsistencia from '@/components/HistorialAsistencia'
import { useActiveVerticalSettings } from '@/lib/domain/vertical-settings-context'

interface Props {
  userId: string
}

export default function SocioHistorialTab({ userId }: Props) {
  const { settings } = useActiveVerticalSettings()
  const { labels, features } = settings

  if (!features.attendanceEnabled) {
    return (
      <div style={{ padding: '20px' }}>
        <div style={{ background: '#181818', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '12px', padding: '14px', color: '#999', fontSize: '13px' }}>
          Historial de asistencia no activo para esta vertical en modo demo.
        </div>
      </div>
    )
  }
  return (
    <div>
      <div style={{ background: '#181818', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '16px 20px' }}>
        <div style={{ fontSize: '18px', fontWeight: '800' }}>{`Mi historial de ${labels.attendanceLabel.toLowerCase()}`}</div>
      </div>
      <div style={{ padding: '20px' }}>
        <HistorialAsistencia userId={userId} limit={50} compact={false} />
      </div>
    </div>
  )
}
