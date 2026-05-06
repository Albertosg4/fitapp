import {
  type BusinessVertical,
  DEFAULT_VERTICAL,
  type VerticalLabels,
  getVerticalLabels,
  resolveBusinessVertical,
  getActiveBusinessVertical,
} from './verticals'

export interface VerticalFeatureFlags {
  attendanceEnabled: boolean
  qrCheckinEnabled: boolean
  paymentsEnabled: boolean
  capacityEnabled: boolean
  recurringScheduleEnabled: boolean
}

export type VerticalLabelOverrides = Partial<VerticalLabels>

export interface VerticalSettingsInput {
  vertical?: unknown
  labels?: VerticalLabelOverrides | null
  features?: Partial<VerticalFeatureFlags> | null
}

export interface EffectiveVerticalSettings {
  vertical: BusinessVertical
  labels: VerticalLabels
  features: VerticalFeatureFlags
}

export const DEFAULT_VERTICAL_FEATURES: Record<BusinessVertical, VerticalFeatureFlags> = {
  gym: {
    attendanceEnabled: true,
    qrCheckinEnabled: true,
    paymentsEnabled: true,
    capacityEnabled: true,
    recurringScheduleEnabled: true,
  },
  clinic: {
    attendanceEnabled: true,
    qrCheckinEnabled: false,
    paymentsEnabled: true,
    capacityEnabled: false,
    recurringScheduleEnabled: true,
  },
  academy: {
    attendanceEnabled: true,
    qrCheckinEnabled: false,
    paymentsEnabled: true,
    capacityEnabled: true,
    recurringScheduleEnabled: true,
  },
  beauty: {
    attendanceEnabled: false,
    qrCheckinEnabled: false,
    paymentsEnabled: true,
    capacityEnabled: false,
    recurringScheduleEnabled: true,
  },
  generic: {
    attendanceEnabled: false,
    qrCheckinEnabled: false,
    paymentsEnabled: true,
    capacityEnabled: false,
    recurringScheduleEnabled: true,
  },
}

export function getDefaultVerticalFeatures(
  vertical: unknown = DEFAULT_VERTICAL,
): VerticalFeatureFlags {
  const resolvedVertical = resolveBusinessVertical(vertical)
  const defaults =
    DEFAULT_VERTICAL_FEATURES[resolvedVertical] ?? DEFAULT_VERTICAL_FEATURES[DEFAULT_VERTICAL]

  return {
    ...defaults,
  }
}

function resolveFeatureOverrides(
  features: Partial<VerticalFeatureFlags> | null | undefined,
): Partial<VerticalFeatureFlags> {
  if (!features) return {}

  const resolved: Partial<VerticalFeatureFlags> = {}

  if (typeof features.attendanceEnabled === 'boolean') {
    resolved.attendanceEnabled = features.attendanceEnabled
  }

  if (typeof features.qrCheckinEnabled === 'boolean') {
    resolved.qrCheckinEnabled = features.qrCheckinEnabled
  }

  if (typeof features.paymentsEnabled === 'boolean') {
    resolved.paymentsEnabled = features.paymentsEnabled
  }

  if (typeof features.capacityEnabled === 'boolean') {
    resolved.capacityEnabled = features.capacityEnabled
  }

  if (typeof features.recurringScheduleEnabled === 'boolean') {
    resolved.recurringScheduleEnabled = features.recurringScheduleEnabled
  }

  return resolved
}

export function resolveVerticalSettings(
  input: VerticalSettingsInput = {},
): EffectiveVerticalSettings {
  const vertical = resolveBusinessVertical(input.vertical)
  const baseLabels = getVerticalLabels(vertical)
  const baseFeatures = getDefaultVerticalFeatures(vertical)
  const featureOverrides = resolveFeatureOverrides(input.features)

  return {
    vertical,
    labels: {
      ...baseLabels,
      ...(input.labels ?? {}),
    },
    features: {
      ...baseFeatures,
      ...featureOverrides,
    },
  }
}


// Fase 6I: los active settings siguen resolviendo `gym` como default efectivo.
// En fases futuras podrán resolverse desde tenant/location/settings.
// No hay persistencia ni lecturas externas en esta fase.
export function getActiveVerticalSettings(): EffectiveVerticalSettings {
  return resolveVerticalSettings({ vertical: getActiveBusinessVertical() })
}

export function getDefaultVerticalSettings(): EffectiveVerticalSettings {
  return resolveVerticalSettings({ vertical: DEFAULT_VERTICAL })
}
