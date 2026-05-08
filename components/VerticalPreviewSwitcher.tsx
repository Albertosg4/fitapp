'use client'

import { BUSINESS_VERTICALS, type BusinessVertical, DEFAULT_VERTICAL } from '@/lib/domain/verticals'
import { useActiveVerticalSettings } from '@/lib/domain/vertical-settings-context'

const VERTICAL_LABELS: Record<BusinessVertical, string> = {
  gym: 'Gimnasio',
  clinic: 'Clínica',
  academy: 'Academia',
  beauty: 'Peluquería/estética',
  generic: 'Genérico',
}

export default function VerticalPreviewSwitcher() {
  const { vertical, settings, setPreviewVertical, resetPreviewVertical } = useActiveVerticalSettings()
  const { features } = settings
  const featureSummary = [
    { label: 'QR', enabled: features.qrCheckinEnabled },
    { label: 'Asistencia', enabled: features.attendanceEnabled },
    { label: 'Pagos', enabled: features.paymentsEnabled },
    { label: 'Capacidad', enabled: features.capacityEnabled },
    { label: 'Horarios', enabled: features.recurringScheduleEnabled },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '11px', color: '#888' }}>Modo demo vertical</span>
        <select
          value={vertical}
          onChange={(e) => setPreviewVertical(e.target.value as BusinessVertical)}
          style={{ background: '#111', color: '#ddd', border: '1px solid rgba(255,255,255,0.16)', borderRadius: '8px', padding: '4px 8px', fontSize: '12px' }}
        >
          {BUSINESS_VERTICALS.map((option) => (
            <option key={option} value={option}>
              {VERTICAL_LABELS[option]}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={resetPreviewVertical}
          disabled={vertical === DEFAULT_VERTICAL}
          style={{ background: 'transparent', color: '#999', border: '1px solid rgba(255,255,255,0.16)', borderRadius: '8px', padding: '4px 8px', fontSize: '12px', cursor: vertical === DEFAULT_VERTICAL ? 'default' : 'pointer', opacity: vertical === DEFAULT_VERTICAL ? 0.6 : 1 }}
        >
          Reset gym
        </button>
      </div>
      <div style={{ fontSize: '10px', color: '#777', textAlign: 'right' }}>Solo afecta a esta demo local.</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: '6px', maxWidth: '360px' }}>
        {featureSummary.map((feature) => (
          <span
            key={feature.label}
            style={{
              fontSize: '10px',
              padding: '3px 7px',
              borderRadius: '999px',
              border: `1px solid ${feature.enabled ? 'rgba(200,245,66,0.35)' : 'rgba(255,255,255,0.18)'}`,
              color: feature.enabled ? '#c8f542' : '#aaa',
              background: feature.enabled ? 'rgba(200,245,66,0.08)' : 'rgba(255,255,255,0.04)',
            }}
          >
            {feature.label}: {feature.enabled ? 'ON' : 'OFF'}
          </span>
        ))}
      </div>
    </div>
  )
}
