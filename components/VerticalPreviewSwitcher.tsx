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
  const { vertical, setPreviewVertical, resetPreviewVertical } = useActiveVerticalSettings()

  return (
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
  )
}
