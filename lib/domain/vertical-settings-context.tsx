'use client'

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  BUSINESS_VERTICALS,
  DEFAULT_VERTICAL,
  resolveBusinessVertical,
  type BusinessVertical,
} from '@/lib/domain/verticals'
import {
  resolveVerticalSettings,
  type EffectiveVerticalSettings,
} from '@/lib/domain/vertical-settings'

export const VERTICAL_PREVIEW_STORAGE_KEY = 'fitapp.verticalPreview'

interface VerticalSettingsContextValue {
  vertical: BusinessVertical
  settings: EffectiveVerticalSettings
  setPreviewVertical: (vertical: BusinessVertical) => void
  resetPreviewVertical: () => void
}

const VerticalSettingsContext = createContext<VerticalSettingsContextValue | null>(null)

export function VerticalSettingsProvider({ children }: { children: ReactNode }) {
  const [vertical, setVertical] = useState<BusinessVertical>(DEFAULT_VERTICAL)

  useEffect(() => {
    const stored = window.localStorage.getItem(VERTICAL_PREVIEW_STORAGE_KEY)
    if (!stored) return

    const resolved = resolveBusinessVertical(stored)
    if (BUSINESS_VERTICALS.includes(resolved)) {
      setVertical(resolved)
    }
  }, [])

  const setPreviewVertical = (nextVertical: BusinessVertical) => {
    const resolved = resolveBusinessVertical(nextVertical)
    setVertical(resolved)
    window.localStorage.setItem(VERTICAL_PREVIEW_STORAGE_KEY, resolved)
  }

  const resetPreviewVertical = () => {
    setVertical(DEFAULT_VERTICAL)
    window.localStorage.removeItem(VERTICAL_PREVIEW_STORAGE_KEY)
  }

  const settings = useMemo(() => resolveVerticalSettings({ vertical }), [vertical])

  return (
    <VerticalSettingsContext.Provider value={{ vertical, settings, setPreviewVertical, resetPreviewVertical }}>
      {children}
    </VerticalSettingsContext.Provider>
  )
}

export function useActiveVerticalSettings(): VerticalSettingsContextValue {
  const context = useContext(VerticalSettingsContext)

  if (context) return context

  const fallbackVertical = DEFAULT_VERTICAL
  return {
    vertical: fallbackVertical,
    settings: resolveVerticalSettings({ vertical: fallbackVertical }),
    setPreviewVertical: () => {},
    resetPreviewVertical: () => {},
  }
}
