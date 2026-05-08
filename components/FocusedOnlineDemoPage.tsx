'use client'

import Link from 'next/link'
import OnlineDemoAccessGuide from '@/components/OnlineDemoAccessGuide'
import OnlineDemoOverview from '@/components/OnlineDemoOverview'
import VerticalCapabilityCards from '@/components/VerticalCapabilityCards'
import VerticalDemoHero from '@/components/VerticalDemoHero'
import { getOnlineDemoVerticalProfile } from '@/lib/domain/online-demo'
import { VerticalSettingsProvider } from '@/lib/domain/vertical-settings-context'
import type { BusinessVertical } from '@/lib/domain/verticals'

interface FocusedOnlineDemoPageProps {
  vertical: BusinessVertical
}

const FOCUSED_DEMO_LINKS: Array<{ href: string; label: string }> = [
  { href: '/demo/gimnasio', label: 'Gimnasio' },
  { href: '/demo/clinica', label: 'Clínica' },
  { href: '/demo/academia', label: 'Academia' },
  { href: '/demo/peluqueria', label: 'Peluquería/estética' },
  { href: '/demo/generico', label: 'Genérico' },
]

export default function FocusedOnlineDemoPage({ vertical }: FocusedOnlineDemoPageProps) {
  const profile = getOnlineDemoVerticalProfile(vertical)

  return (
    <VerticalSettingsProvider initialVertical={vertical} persistPreview={false}>
      <main style={{ minHeight: '100vh', background: '#020617', color: '#f8fafc', fontFamily: 'system-ui' }}>
        <section style={{ padding: '24px 20px 8px' }}>
          <h1 style={{ marginTop: 0 }}>{profile.title}</h1>
          <p style={{ color: '#cbd5e1' }}>{profile.subtitle}</p>
          <p style={{ color: '#fda4af', fontWeight: 600 }}>
            Demo enfocada para este sector. No modifica datos reales ni configura tenants reales.
          </p>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '8px' }}>
            <Link
              href="/demo"
              style={{ background: '#1f2937', color: '#e5e7eb', border: '1px solid rgba(148,163,184,0.35)', borderRadius: '8px', padding: '8px 12px', textDecoration: 'none' }}
            >
              Ir a demo general
            </Link>
            <button
              type="button"
              disabled
              style={{ background: '#0f172a', color: '#94a3b8', border: '1px dashed rgba(148,163,184,0.45)', borderRadius: '8px', padding: '8px 12px' }}
            >
              Solicitar demo controlada · Próximamente
            </button>
          </div>
        </section>

        <VerticalDemoHero />
        <VerticalCapabilityCards />
        <OnlineDemoOverview />
        <OnlineDemoAccessGuide />

        <section style={{ padding: '8px 20px 24px' }}>
          <h2 style={{ marginTop: 0, fontSize: '16px', color: '#e2e8f0' }}>También disponible para otros sectores</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {FOCUSED_DEMO_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                style={{ fontSize: '13px', padding: '6px 10px', borderRadius: '999px', border: '1px solid rgba(148,163,184,0.35)', color: '#cbd5e1', textDecoration: 'none' }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </section>
      </main>
    </VerticalSettingsProvider>
  )
}
