'use client'

import { useMemo, useState } from 'react'
import {
  getInteractiveDemoProfile,
  type InteractiveDemoItem,
  type InteractiveDemoRole,
} from '@/lib/domain/interactive-demo'
import {
  useActiveVerticalSettings,
  VerticalSettingsProvider,
} from '@/lib/domain/vertical-settings-context'
import type { BusinessVertical } from '@/lib/domain/verticals'

interface InteractiveDemoPageProps {
  vertical: BusinessVertical
}

function InteractiveDemoContent({ vertical }: InteractiveDemoPageProps) {
  const { settings } = useActiveVerticalSettings()
  const profile = getInteractiveDemoProfile(vertical)
  const [role, setRole] = useState<InteractiveDemoRole>('admin')
  const [demoItems, setDemoItems] = useState<InteractiveDemoItem[]>(profile.items)
  const [checkinDone, setCheckinDone] = useState(false)

  const bookedCount = useMemo(() => demoItems.filter((item) => item.status === 'booked').length, [demoItems])

  const handleBook = (itemId: string) => {
    setDemoItems((current) => current.map((item) => (item.id === itemId ? { ...item, status: 'booked' } : item)))
  }

  const handleCancel = (itemId: string) => {
    setDemoItems((current) => current.map((item) => (item.id === itemId ? { ...item, status: 'available' } : item)))
  }

  const handleResetDemo = () => {
    setRole('admin')
    setDemoItems(profile.items)
    setCheckinDone(false)
  }

  return (
    <main style={{ minHeight: '100vh', padding: '24px', background: '#020617', color: '#f8fafc', fontFamily: 'system-ui' }}>
      <h1 style={{ marginTop: 0 }}>Simulación interactiva · {profile.serviceLabel}</h1>
      <p style={{ background: '#1e293b', border: '1px solid rgba(148,163,184,0.4)', borderRadius: '8px', padding: '10px 12px' }}>
        Simulación interactiva: no usa datos reales ni modifica la configuración.
      </p>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <button type="button" onClick={() => setRole('admin')}>Vista admin</button>
        <button type="button" onClick={() => setRole('user')}>Vista usuario</button>
        <button type="button" onClick={handleResetDemo}>Reset demo</button>
      </div>

      {role === 'admin' ? (
        <section>
          <h2>{profile.adminTitle}</h2>
          <p>{profile.adminIntro}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '8px' }}>
            <article style={{ background: '#111827', padding: '12px', borderRadius: '8px' }}>Total {profile.customerLabel.toLowerCase()}s: 128</article>
            <article style={{ background: '#111827', padding: '12px', borderRadius: '8px' }}>{profile.serviceLabel}s activas: {demoItems.length}</article>
            <article style={{ background: '#111827', padding: '12px', borderRadius: '8px' }}>{profile.bookingLabel}s simuladas: {bookedCount}</article>
            <article style={{ background: '#111827', padding: '12px', borderRadius: '8px' }}>Pagos simulados: {profile.payments.length}</article>
          </div>
          <h3>Servicios simulados</h3>
          <ul>{demoItems.map((item) => <li key={item.id}>{item.title} · {item.scheduledAt} · {item.status}</li>)}</ul>
          <h3>Pagos mock</h3>
          <ul>{profile.payments.map((payment) => <li key={payment.id}>{payment.concept} · {payment.amountLabel} · {payment.status}</li>)}</ul>
          <p>Esta vista admin es simulada. No crea ni modifica registros reales.</p>
        </section>
      ) : (
        <section>
          <h2>{profile.userTitle}</h2>
          <p>{profile.userIntro}</p>
          {demoItems.length === 0 ? <p>{profile.emptyStateLabel}</p> : null}
          {demoItems.map((item) => (
            <article key={item.id} style={{ background: '#111827', borderRadius: '8px', padding: '12px', marginBottom: '10px' }}>
              <strong>{item.title}</strong>
              <p>{item.subtitle}</p>
              <p>{item.scheduledAt}</p>
              {item.capacityLabel ? <p>{item.capacityLabel}</p> : null}
              <p>Estado: {item.status}</p>
              {item.status !== 'booked' ? (
                <button type="button" onClick={() => handleBook(item.id)}>{profile.primaryActionLabel}</button>
              ) : (
                <button type="button" onClick={() => handleCancel(item.id)}>{profile.cancelActionLabel}</button>
              )}
            </article>
          ))}
          <h3>Pagos mock</h3>
          <ul>{profile.payments.map((payment) => <li key={payment.id}>{payment.concept} · {payment.amountLabel} · {payment.status}</li>)}</ul>
          {settings.features.qrCheckinEnabled ? (
            <div>
              <button type="button" onClick={() => setCheckinDone(true)}>{profile.qrDemoLabel}</button>
              {checkinDone ? <p>Check-in simulado completado</p> : null}
            </div>
          ) : (
            <p>{profile.qrDemoLabel}</p>
          )}
        </section>
      )}
    </main>
  )
}

export default function InteractiveDemoPage({ vertical }: InteractiveDemoPageProps) {
  return (
    <VerticalSettingsProvider initialVertical={vertical} persistPreview={false}>
      <InteractiveDemoContent vertical={vertical} />
    </VerticalSettingsProvider>
  )
}
