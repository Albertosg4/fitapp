'use client'

import OnlineDemoAccessGuide from '@/components/OnlineDemoAccessGuide'
import OnlineDemoOverview from '@/components/OnlineDemoOverview'
import OnlineDemoVerticalCards from '@/components/OnlineDemoVerticalCards'
import VerticalCapabilityCards from '@/components/VerticalCapabilityCards'
import VerticalDemoHero from '@/components/VerticalDemoHero'
import VerticalPreviewSwitcher from '@/components/VerticalPreviewSwitcher'
import { VerticalSettingsProvider } from '@/lib/domain/vertical-settings-context'

export default function DemoPage() {
  return (
    <VerticalSettingsProvider>
      <main style={{ minHeight: '100vh', background: '#020617', color: '#f8fafc', fontFamily: 'system-ui' }}>
        <section style={{ padding: '24px 20px 8px' }}>
          <h1 style={{ marginTop: 0 }}>Demo online FITAPP</h1>
          <p style={{ color: '#cbd5e1' }}>Prueba la plataforma por vertical antes de una implantación real.</p>
          <p style={{ color: '#fda4af', fontWeight: 600 }}>
            Esta demo no modifica datos reales ni configura tenants reales.
          </p>
          <div style={{ maxWidth: '360px' }}>
            <VerticalPreviewSwitcher />
          </div>
        </section>
        <OnlineDemoVerticalCards />
        <OnlineDemoOverview />
        <VerticalDemoHero />
        <VerticalCapabilityCards />
        <OnlineDemoAccessGuide />
      </main>
    </VerticalSettingsProvider>
  )
}
