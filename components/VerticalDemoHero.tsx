'use client'

import { useActiveVerticalSettings } from '@/lib/domain/vertical-settings-context'
import { getVerticalCommercialProfile } from '@/lib/domain/vertical-commercial'
import VerticalDemoNotice from '@/components/VerticalDemoNotice'

export default function VerticalDemoHero() {
  const { vertical } = useActiveVerticalSettings()
  const profile = getVerticalCommercialProfile(vertical)

  return (
    <section
      style={{
        margin: '14px 20px 8px',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '14px',
        padding: '14px',
        background: 'linear-gradient(180deg, rgba(200,245,66,0.08) 0%, rgba(255,255,255,0.02) 100%)',
      }}
    >
      <div style={{ fontSize: '11px', letterSpacing: '0.4px', color: '#c8f542', marginBottom: '6px' }}>Modo demo vertical</div>
      <h2 style={{ margin: 0, fontSize: '20px', lineHeight: 1.2 }}>{profile.headline}</h2>
      <p style={{ margin: '8px 0 0', color: '#c7c7c7', fontSize: '14px' }}>{profile.subtitle}</p>
      <p style={{ margin: '8px 0 0', color: '#a1a1aa', fontSize: '13px' }}>{profile.primaryUseCase}</p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
        {profile.valueProps.map((valueProp) => (
          <span
            key={valueProp}
            style={{
              fontSize: '12px',
              padding: '5px 10px',
              borderRadius: '999px',
              border: '1px solid rgba(200,245,66,0.3)',
              color: '#d9f86f',
              background: 'rgba(200,245,66,0.08)',
            }}
          >
            {valueProp}
          </span>
        ))}
      </div>

      <ul style={{ margin: '10px 0 0', paddingLeft: '18px', color: '#9ca3af', fontSize: '12px' }}>
        {profile.demoNotes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>

      <div style={{ marginTop: '10px' }}>
        <VerticalDemoNotice />
      </div>
    </section>
  )
}
