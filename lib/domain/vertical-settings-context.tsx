'use client'

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
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

interface VerticalSettingsProviderProps {
  children: ReactNode
  initialVertical?: BusinessVertical
  persistPreview?: boolean
}

export function VerticalSettingsProvider({
  children,
  initialVertical,
  persistPreview = true,
}: VerticalSettingsProviderProps) {
  const fallbackVertical = resolveBusinessVertical(initialVertical ?? DEFAULT_VERTICAL)
  const [vertical, setVertical] = useState<BusinessVertical>(fallbackVertical)

  useEffect(() => {
    if (!persistPreview) return

    const stored = window.localStorage.getItem(VERTICAL_PREVIEW_STORAGE_KEY)
    if (!stored) return

    setVertical(resolveBusinessVertical(stored))
  }, [persistPreview])

  const setPreviewVertical = (nextVertical: BusinessVertical) => {
    const resolved = resolveBusinessVertical(nextVertical)
    setVertical(resolved)

    if (!persistPreview) return
    window.localStorage.setItem(VERTICAL_PREVIEW_STORAGE_KEY, resolved)
  }

  const resetPreviewVertical = () => {
    setVertical(fallbackVertical)

    if (!persistPreview) return
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
