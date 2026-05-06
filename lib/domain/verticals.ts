export type BusinessVertical = 'gym' | 'clinic' | 'academy' | 'beauty' | 'generic'

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

export function getVerticalLabels(vertical: BusinessVertical = DEFAULT_VERTICAL): VerticalLabels {
  return VERTICAL_LABELS[vertical] ?? VERTICAL_LABELS[DEFAULT_VERTICAL]
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
