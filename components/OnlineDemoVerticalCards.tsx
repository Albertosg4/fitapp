'use client'

import Link from 'next/link'
import { BUSINESS_VERTICALS, type BusinessVertical } from '@/lib/domain/verticals'
import { getOnlineDemoVerticalProfile } from '@/lib/domain/online-demo'
import { useActiveVerticalSettings } from '@/lib/domain/vertical-settings-context'

const ACTION_COPY: Record<BusinessVertical, string> = {
  gym: 'Ver demo como gimnasio',
  clinic: 'Ver demo como clínica',
  academy: 'Ver demo como academia',
  beauty: 'Ver demo como peluquería/estética',
  generic: 'Ver demo genérica',
}

const INTERACTIVE_DEMO_ROUTES: Record<BusinessVertical, string> = {
  gym: '/demo/gimnasio/probar',
  clinic: '/demo/clinica/probar',
  academy: '/demo/academia/probar',
  beauty: '/demo/peluqueria/probar',
  generic: '/demo/generico/probar',
}

const FOCUSED_DEMO_ROUTES: Record<BusinessVertical, string> = {
  gym: '/demo/gimnasio',
  clinic: '/demo/clinica',
  academy: '/demo/academia',
  beauty: '/demo/peluqueria',
  generic: '/demo/generico',
}

export default function OnlineDemoVerticalCards() {
  const { vertical, setPreviewVertical } = useActiveVerticalSettings()

  return (
    <section style={{ padding: '20px' }}>
      <h2 style={{ marginTop: 0, color: '#f8fafc' }}>Verticales disponibles para demo online</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
        {BUSINESS_VERTICALS.map((candidate) => {
          const profile = getOnlineDemoVerticalProfile(candidate)
          const isActive = candidate === vertical

          return (
            <article key={candidate} style={{ background: '#111827', border: `1px solid ${isActive ? '#7dd3fc' : 'rgba(148,163,184,0.2)'}`, borderRadius: '12px', padding: '14px' }}>
              <h3 style={{ marginTop: 0, color: '#e2e8f0' }}>{profile.title}</h3>
              <p style={{ color: '#cbd5e1', fontSize: '14px' }}>{profile.subtitle}</p>
              <button
                type="button"
                onClick={() => setPreviewVertical(candidate)}
                style={{
                  marginTop: '8px',
                  background: isActive ? '#7dd3fc' : '#1f2937',
                  color: isActive ? '#0f172a' : '#e5e7eb',
                  border: '1px solid rgba(148,163,184,0.35)',
                  borderRadius: '8px',
                  padding: '8px 10px',
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                {ACTION_COPY[candidate]}
              </button>
              <Link
                href={FOCUSED_DEMO_ROUTES[candidate]}
                style={{ display: 'inline-block', marginTop: '10px', color: '#7dd3fc', fontSize: '13px' }}
              >
                Abrir demo enfocada
              </Link>
              <Link
                href={INTERACTIVE_DEMO_ROUTES[candidate]}
                style={{ display: 'inline-block', marginTop: '6px', marginLeft: '10px', color: '#bae6fd', fontSize: '12px' }}
              >
                Probar interactiva
              </Link>
            </article>
          )
        })}
      </div>
    </section>
  )
}
