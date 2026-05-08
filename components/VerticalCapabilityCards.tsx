'use client'

import { getVerticalCommercialProfile } from '@/lib/domain/vertical-commercial'
import { useActiveVerticalSettings } from '@/lib/domain/vertical-settings-context'

export default function VerticalCapabilityCards() {
  const { vertical, settings } = useActiveVerticalSettings()
  const { labels, features } = settings
  const profile = getVerticalCommercialProfile(vertical)

  const cards = [
    {
      name: labels.bookingLabelPlural,
      enabled: true,
      text: `Gestión de ${profile.bookingNoun} disponible en preview visual para ${profile.customerNoun}.`,
    },
    {
      name: labels.paymentLabelPlural,
      enabled: features.paymentsEnabled,
      text: features.paymentsEnabled ? 'Flujo de pagos visible en UI.' : 'Pagos ocultos para esta demo vertical.',
    },
    {
      name: 'QR / check-in',
      enabled: features.qrCheckinEnabled,
      text: features.qrCheckinEnabled ? 'Acceso con QR activo en la experiencia demo.' : 'Check-in no protagonista en esta vertical.',
    },
    {
      name: 'Asistencia / visitas',
      enabled: features.attendanceEnabled,
      text: features.attendanceEnabled ? 'Seguimiento de asistencia/visitas visible.' : 'Asistencia no visible para esta demo vertical.',
    },
    {
      name: 'Capacidad / aforo',
      enabled: features.capacityEnabled,
      text: features.capacityEnabled ? 'Control de capacidad mostrado en reservas.' : 'Aforo no protagonista para este sector.',
    },
    {
      name: 'Horarios recurrentes',
      enabled: features.recurringScheduleEnabled,
      text: features.recurringScheduleEnabled ? 'Bloques recurrentes activos en la UI.' : 'Recurrencia desactivada en preview visual.',
    },
  ]

  return (
    <section style={{ margin: '0 20px 16px' }}>
      <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>
        Capacidades por vertical (preview visual)
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
        {cards.map((card) => (
          <article
            key={card.name}
            style={{
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              padding: '10px',
              background: 'rgba(255,255,255,0.02)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
              <strong style={{ fontSize: '13px' }}>{card.name}</strong>
              <span style={{ color: card.enabled ? '#c8f542' : '#a1a1aa', fontSize: '11px' }}>{card.enabled ? 'ON' : 'OFF'}</span>
            </div>
            <p style={{ margin: '8px 0 0', color: '#a1a1aa', fontSize: '12px' }}>{card.text}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
