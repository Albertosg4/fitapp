import type { BusinessVertical } from '@/lib/domain/verticals'

export type InteractiveDemoRole = 'admin' | 'user'

export interface InteractiveDemoItem {
  id: string
  title: string
  subtitle: string
  scheduledAt: string
  capacityLabel?: string
  status: 'available' | 'booked' | 'cancelled'
}

export interface InteractiveDemoPayment {
  id: string
  concept: string
  amountLabel: string
  status: 'paid' | 'pending'
}

export interface InteractiveDemoProfile {
  vertical: BusinessVertical
  adminTitle: string
  userTitle: string
  adminIntro: string
  userIntro: string
  customerLabel: string
  serviceLabel: string
  bookingLabel: string
  primaryActionLabel: string
  cancelActionLabel: string
  emptyStateLabel: string
  qrDemoLabel: string
  items: InteractiveDemoItem[]
  payments: InteractiveDemoPayment[]
}

export const INTERACTIVE_DEMO_PROFILES: Record<BusinessVertical, InteractiveDemoProfile> = {
  gym: {
    vertical: 'gym', adminTitle: 'Panel admin demo · Gimnasio', userTitle: 'Área socio demo · Gimnasio',
    adminIntro: 'Supervisa clases, reservas y pagos simulados para un gimnasio.', userIntro: 'Prueba cómo un socio reserva clases y revisa su estado.',
    customerLabel: 'Socio', serviceLabel: 'Clase', bookingLabel: 'Reserva', primaryActionLabel: 'Reservar clase', cancelActionLabel: 'Cancelar reserva', emptyStateLabel: 'No hay clases simuladas disponibles.', qrDemoLabel: 'Simular check-in QR',
    items: [
      { id: 'gym-1', title: 'Boxeo iniciación', subtitle: 'Nivel básico con técnica guiada', scheduledAt: 'Lunes · 18:00', capacityLabel: '8/16 plazas', status: 'available' },
      { id: 'gym-2', title: 'Muay Thai', subtitle: 'Sesión mixta de golpes y defensa', scheduledAt: 'Martes · 19:30', capacityLabel: '12/14 plazas', status: 'available' },
      { id: 'gym-3', title: 'Entrenamiento funcional', subtitle: 'Circuito full-body por estaciones', scheduledAt: 'Jueves · 17:00', capacityLabel: '6/12 plazas', status: 'available' },
    ],
    payments: [
      { id: 'gym-pay-1', concept: 'Cuota mensual', amountLabel: '49,00 €', status: 'paid' },
      { id: 'gym-pay-2', concept: 'Bono clases', amountLabel: '29,00 €', status: 'pending' },
    ],
  },
  clinic: {
    vertical: 'clinic', adminTitle: 'Panel admin demo · Clínica', userTitle: 'Portal paciente demo · Clínica',
    adminIntro: 'Visualiza citas y cobros simulados para un centro clínico.', userIntro: 'Prueba cómo un paciente reserva y cancela una cita simulada.',
    customerLabel: 'Paciente', serviceLabel: 'Tratamiento', bookingLabel: 'Cita', primaryActionLabel: 'Reservar cita', cancelActionLabel: 'Cancelar cita', emptyStateLabel: 'No hay tratamientos simulados disponibles.', qrDemoLabel: 'QR no activo para esta vertical',
    items: [
      { id: 'clinic-1', title: 'Fisioterapia', subtitle: 'Sesión de recuperación personalizada', scheduledAt: 'Lunes · 10:00', status: 'available' },
      { id: 'clinic-2', title: 'Consulta revisión', subtitle: 'Seguimiento clínico general', scheduledAt: 'Miércoles · 12:30', status: 'available' },
      { id: 'clinic-3', title: 'Tratamiento deportivo', subtitle: 'Plan específico para lesión deportiva', scheduledAt: 'Viernes · 16:00', status: 'available' },
    ],
    payments: [
      { id: 'clinic-pay-1', concept: 'Sesión fisioterapia', amountLabel: '45,00 €', status: 'paid' },
      { id: 'clinic-pay-2', concept: 'Bono tratamiento', amountLabel: '120,00 €', status: 'pending' },
    ],
  },
  academy: {
    vertical: 'academy', adminTitle: 'Panel admin demo · Academia', userTitle: 'Portal alumno demo · Academia',
    adminIntro: 'Gestiona cursos, inscripciones y pagos simulados por alumno.', userIntro: 'Prueba una inscripción simulada en cursos de academia.',
    customerLabel: 'Alumno', serviceLabel: 'Curso', bookingLabel: 'Inscripción', primaryActionLabel: 'Inscribirme', cancelActionLabel: 'Cancelar inscripción', emptyStateLabel: 'No hay cursos simulados disponibles.', qrDemoLabel: 'Asistencia simulada sin QR',
    items: [
      { id: 'academy-1', title: 'Inglés B1', subtitle: 'Curso trimestral con tutorías', scheduledAt: 'Martes · 17:30', status: 'available' },
      { id: 'academy-2', title: 'Matemáticas ESO', subtitle: 'Refuerzo semanal orientado a exámenes', scheduledAt: 'Jueves · 18:30', status: 'available' },
      { id: 'academy-3', title: 'Programación inicial', subtitle: 'Fundamentos prácticos con proyectos', scheduledAt: 'Sábado · 11:00', status: 'available' },
    ],
    payments: [
      { id: 'academy-pay-1', concept: 'Mensualidad academia', amountLabel: '65,00 €', status: 'paid' },
      { id: 'academy-pay-2', concept: 'Matrícula curso', amountLabel: '35,00 €', status: 'pending' },
    ],
  },
  beauty: {
    vertical: 'beauty', adminTitle: 'Panel admin demo · Peluquería/estética', userTitle: 'Área cliente demo · Peluquería/estética',
    adminIntro: 'Monitorea servicios, citas y pagos simulados de salón.', userIntro: 'Prueba la reserva simulada de servicios de belleza.',
    customerLabel: 'Cliente', serviceLabel: 'Servicio', bookingLabel: 'Cita', primaryActionLabel: 'Reservar cita', cancelActionLabel: 'Cancelar cita', emptyStateLabel: 'No hay servicios simulados disponibles.', qrDemoLabel: 'QR no activo para esta vertical',
    items: [
      { id: 'beauty-1', title: 'Corte y peinado', subtitle: 'Estilo personalizado con asesoría', scheduledAt: 'Lunes · 11:30', status: 'available' },
      { id: 'beauty-2', title: 'Tratamiento facial', subtitle: 'Limpieza y cuidado profundo', scheduledAt: 'Miércoles · 15:00', status: 'available' },
      { id: 'beauty-3', title: 'Manicura', subtitle: 'Servicio completo con acabado premium', scheduledAt: 'Viernes · 18:00', status: 'available' },
    ],
    payments: [
      { id: 'beauty-pay-1', concept: 'Servicio peluquería', amountLabel: '32,00 €', status: 'paid' },
      { id: 'beauty-pay-2', concept: 'Bono estética', amountLabel: '75,00 €', status: 'pending' },
    ],
  },
  generic: {
    vertical: 'generic', adminTitle: 'Panel admin demo · Negocio genérico', userTitle: 'Portal cliente demo · Negocio genérico',
    adminIntro: 'Valida una operación simulada adaptable a distintos negocios.', userIntro: 'Prueba una reserva simulada genérica para servicios.',
    customerLabel: 'Cliente', serviceLabel: 'Servicio', bookingLabel: 'Reserva', primaryActionLabel: 'Reservar servicio', cancelActionLabel: 'Cancelar reserva', emptyStateLabel: 'No hay servicios simulados disponibles.', qrDemoLabel: 'QR opcional no activo en esta demo',
    items: [
      { id: 'generic-1', title: 'Servicio estándar', subtitle: 'Atención general configurable', scheduledAt: 'Lunes · 09:00', status: 'available' },
      { id: 'generic-2', title: 'Sesión personalizada', subtitle: 'Bloque de trabajo a medida', scheduledAt: 'Miércoles · 13:00', status: 'available' },
      { id: 'generic-3', title: 'Reserva especial', subtitle: 'Caso premium con prioridad', scheduledAt: 'Viernes · 19:00', status: 'available' },
    ],
    payments: [
      { id: 'generic-pay-1', concept: 'Servicio mensual', amountLabel: '39,00 €', status: 'paid' },
      { id: 'generic-pay-2', concept: 'Bono reserva', amountLabel: '59,00 €', status: 'pending' },
    ],
  },
}

export function getInteractiveDemoProfile(vertical: BusinessVertical): InteractiveDemoProfile {
  return INTERACTIVE_DEMO_PROFILES[vertical] ?? INTERACTIVE_DEMO_PROFILES.gym
}
