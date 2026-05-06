import {
  type BusinessVertical,
  DEFAULT_VERTICAL,
  type VerticalLabels,
  getVerticalLabels,
  resolveBusinessVertical,
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
  return DEFAULT_VERTICAL_FEATURES[resolvedVertical] ?? DEFAULT_VERTICAL_FEATURES[DEFAULT_VERTICAL]
}

export function resolveVerticalSettings(
  input: VerticalSettingsInput = {},
): EffectiveVerticalSettings {
  const vertical = resolveBusinessVertical(input.vertical)
  const baseLabels = getVerticalLabels(vertical)
  const baseFeatures = getDefaultVerticalFeatures(vertical)

  return {
    vertical,
    labels: {
      ...baseLabels,
      ...(input.labels ?? {}),
    },
    features: {
      ...baseFeatures,
      ...(input.features ?? {}),
    },
  }
}

export function getDefaultVerticalSettings(): EffectiveVerticalSettings {
  return resolveVerticalSettings({ vertical: DEFAULT_VERTICAL })
}
