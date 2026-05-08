'use client'

import { useActiveVerticalSettings } from '@/lib/domain/vertical-settings-context'
import { getOnlineDemoVerticalProfile } from '@/lib/domain/online-demo'

export default function OnlineDemoOverview() {
  const { vertical } = useActiveVerticalSettings()
  const profile = getOnlineDemoVerticalProfile(vertical)

  return (
    <section style={{ padding: '20px', display: 'grid', gap: '12px' }}>
      <div style={{ fontSize: '12px', fontWeight: 700, color: '#7dd3fc', textTransform: 'uppercase' }}>Demo online</div>
      <h2 style={{ margin: 0, color: '#f8fafc' }}>{profile.title}</h2>
      <p style={{ margin: 0, color: '#cbd5e1' }}>{profile.subtitle}</p>
      <p style={{ margin: 0, color: '#94a3b8' }}><strong>Ideal para:</strong> {profile.idealFor}</p>

      <div style={{ background: '#111827', border: '1px solid rgba(148,163,184,0.25)', borderRadius: '12px', padding: '14px' }}>
        <h3 style={{ marginTop: 0, color: '#e2e8f0' }}>Qué puedes probar ahora</h3>
        <ul style={{ margin: 0, paddingLeft: '18px', color: '#cbd5e1' }}>
          {profile.whatYouCanTry.map((item) => (
            <li key={item} style={{ marginBottom: '6px' }}>{item}</li>
          ))}
        </ul>
      </div>

      <div style={{ background: '#111827', border: '1px solid rgba(148,163,184,0.25)', borderRadius: '12px', padding: '14px' }}>
        <h3 style={{ marginTop: 0, color: '#e2e8f0' }}>Flujos demo</h3>
        <ul style={{ margin: 0, paddingLeft: '18px', color: '#cbd5e1' }}>
          {profile.flows.map((flow) => (
            <li key={flow.title} style={{ marginBottom: '8px' }}>
              <strong>{flow.title}:</strong> {flow.description} ({flow.available ? 'Disponible en preview' : 'No protagonista en esta vertical'})
              {flow.note ? <div style={{ color: '#94a3b8', fontSize: '13px' }}>{flow.note}</div> : null}
            </li>
          ))}
        </ul>
      </div>

      <div style={{ background: '#0f172a', border: '1px solid rgba(125,211,252,0.3)', borderRadius: '12px', padding: '14px' }}>
        <h3 style={{ marginTop: 0, color: '#bae6fd' }}>Seguridad de la demo</h3>
        <p style={{ marginTop: 0, color: '#e2e8f0' }}>No usa datos reales y los accesos demo se preparan de forma controlada.</p>
        <ul style={{ margin: 0, paddingLeft: '18px', color: '#cbd5e1' }}>
          {profile.safetyNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </div>
    </section>
  )
}
