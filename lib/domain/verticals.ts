export type BusinessVertical = 'gym' | 'clinic' | 'academy' | 'beauty' | 'generic'

export const BUSINESS_VERTICALS: readonly BusinessVertical[] = [
  'gym',
  'clinic',
  'academy',
  'beauty',
  'generic',
] as const

export const DEFAULT_VERTICAL: BusinessVertical = 'gym'

export interface VerticalLabels {
  customerLabel: string
  customerLabelPlural: string
  serviceLabel: string
  serviceLabelPlural: string
  bookingLabel: string
  bookingLabelPlural: string
  staffLabel: string
  staffLabelPlural: string
  locationLabel: string
  locationLabelPlural: string
  attendanceLabel: string
  paymentLabel: string
  paymentLabelPlural: string
}

export const VERTICAL_LABELS: Record<BusinessVertical, VerticalLabels> = {
  gym: {
    customerLabel: 'Socio',
    customerLabelPlural: 'Socios',
    serviceLabel: 'Clase',
    serviceLabelPlural: 'Clases',
    bookingLabel: 'Reserva',
    bookingLabelPlural: 'Reservas',
    staffLabel: 'Profesor',
    staffLabelPlural: 'Profesores',
    locationLabel: 'Gimnasio',
    locationLabelPlural: 'Gimnasios',
    attendanceLabel: 'Asistencia',
    paymentLabel: 'Pago',
    paymentLabelPlural: 'Pagos',
  },
  clinic: {
    customerLabel: 'Paciente',
    customerLabelPlural: 'Pacientes',
    serviceLabel: 'Tratamiento',
    serviceLabelPlural: 'Tratamientos',
    bookingLabel: 'Cita',
    bookingLabelPlural: 'Citas',
    staffLabel: 'Profesional',
    staffLabelPlural: 'Profesionales',
    locationLabel: 'Clínica',
    locationLabelPlural: 'Clínicas',
    attendanceLabel: 'Visita',
    paymentLabel: 'Pago',
    paymentLabelPlural: 'Pagos',
  },
  academy: {
    customerLabel: 'Alumno',
    customerLabelPlural: 'Alumnos',
    serviceLabel: 'Clase/curso',
    serviceLabelPlural: 'Clases/cursos',
    bookingLabel: 'Inscripción',
    bookingLabelPlural: 'Inscripciones',
    staffLabel: 'Profesor',
    staffLabelPlural: 'Profesores',
    locationLabel: 'Academia',
    locationLabelPlural: 'Academias',
    attendanceLabel: 'Asistencia',
    paymentLabel: 'Pago',
    paymentLabelPlural: 'Pagos',
  },
  beauty: {
    customerLabel: 'Cliente',
    customerLabelPlural: 'Clientes',
    serviceLabel: 'Servicio',
    serviceLabelPlural: 'Servicios',
    bookingLabel: 'Cita',
    bookingLabelPlural: 'Citas',
    staffLabel: 'Profesional',
    staffLabelPlural: 'Profesionales',
    locationLabel: 'Centro',
    locationLabelPlural: 'Centros',
    attendanceLabel: 'Visita',
    paymentLabel: 'Pago',
    paymentLabelPlural: 'Pagos',
  },
  generic: {
    customerLabel: 'Cliente',
    customerLabelPlural: 'Clientes',
    serviceLabel: 'Servicio',
    serviceLabelPlural: 'Servicios',
    bookingLabel: 'Reserva',
    bookingLabelPlural: 'Reservas',
    staffLabel: 'Profesional',
    staffLabelPlural: 'Profesionales',
    locationLabel: 'Sede',
    locationLabelPlural: 'Sedes',
    attendanceLabel: 'Registro',
    paymentLabel: 'Pago',
    paymentLabelPlural: 'Pagos',
  },
}

// These helpers prepare future settings-based vertical resolution.
// In this phase no external source is read.
// Invalid or unknown values must always fall back to DEFAULT_VERTICAL.
export function isBusinessVertical(value: unknown): value is BusinessVertical {
  return typeof value === 'string' && BUSINESS_VERTICALS.includes(value as BusinessVertical)
}

export function resolveBusinessVertical(value: unknown): BusinessVertical {
  return isBusinessVertical(value) ? value : DEFAULT_VERTICAL
}

export function getVerticalLabels(vertical: BusinessVertical = DEFAULT_VERTICAL): VerticalLabels {
  return VERTICAL_LABELS[resolveBusinessVertical(vertical)] ?? VERTICAL_LABELS[DEFAULT_VERTICAL]
}

// In this phase, the active vertical is static and resolves to gym.
// Future phases may resolve it from tenant/location/settings.
// There is no persistence yet, and no reads from Supabase/localStorage/environment variables.
export function getActiveBusinessVertical(): BusinessVertical {
  return DEFAULT_VERTICAL
}

export function getActiveVerticalLabels(): VerticalLabels {
  return getVerticalLabels(getActiveBusinessVertical())
}

export function getDefaultVerticalLabels(): VerticalLabels {
  return getVerticalLabels(DEFAULT_VERTICAL)
}
