import type { BusinessVertical } from '@/lib/domain/verticals'

export interface OnlineDemoFlow {
  title: string
  description: string
  available: boolean
  note?: string
}

export interface OnlineDemoVerticalProfile {
  vertical: BusinessVertical
  title: string
  subtitle: string
  idealFor: string
  whatYouCanTry: string[]
  flows: OnlineDemoFlow[]
  safetyNotes: string[]
}

export const ONLINE_DEMO_VERTICAL_PROFILES: Record<BusinessVertical, OnlineDemoVerticalProfile> = {
  gym: {
    vertical: 'gym',
    title: 'Demo online para gimnasios',
    subtitle: 'Prueba gestión de socios, clases, reservas, pagos y check-in.',
    idealFor: 'Gimnasios, boxes, escuelas deportivas y centros con clases.',
    whatYouCanTry: [
      'Vista admin de socios, actividades, horarios y pagos.',
      'Vista socio con reservas, pagos, perfil y QR.',
      'Preview de check-in y asistencia.',
    ],
    flows: [
      { title: 'Admin demo', description: 'Panel de gestión para operaciones del centro.', available: true, note: 'Requiere cuenta demo controlada en fase posterior.' },
      { title: 'Usuario demo', description: 'Área de socio para revisar perfil y acciones principales.', available: true, note: 'Requiere cuenta demo controlada en fase posterior.' },
      { title: 'Reservas', description: 'Flujo de reserva/cancelación de clases y servicios.', available: true },
      { title: 'Pagos', description: 'Vista de pagos y estado de cobros del socio.', available: true, note: 'Sin cobros reales en entorno demo.' },
      { title: 'QR/check-in', description: 'Simulación de acceso y asistencia por QR.', available: true },
    ],
    safetyNotes: [
      'La demo no debe usar datos reales de clientes.',
      'Los accesos demo se prepararán en una fase separada.',
    ],
  },
  clinic: {
    vertical: 'clinic',
    title: 'Demo online para clínicas',
    subtitle: 'Prueba pacientes, tratamientos, citas, pagos y visitas.',
    idealFor: 'Clínicas, consultas privadas y centros sanitarios.',
    whatYouCanTry: [
      'Preview de pacientes, tratamientos y citas.',
      'Vista de pagos y perfil del paciente.',
      'Flujo de reservas/citas adaptado al lenguaje clínico.',
    ],
    flows: [
      { title: 'Admin demo', description: 'Vista de agenda, pacientes y servicios clínicos.', available: true, note: 'Requiere cuenta demo controlada en fase posterior.' },
      { title: 'Paciente demo', description: 'Área privada para consultar citas y pagos.', available: true, note: 'Requiere cuenta demo controlada en fase posterior.' },
      { title: 'Citas', description: 'Reserva y seguimiento de citas por paciente.', available: true },
      { title: 'Pagos', description: 'Revisión de pagos asociados a tratamientos.', available: true },
      { title: 'QR/check-in', description: 'Módulo de check-in QR en esta vertical.', available: false, note: 'No es protagonista en esta vertical.' },
    ],
    safetyNotes: [
      'La demo no debe usar datos reales de pacientes.',
      'Los accesos demo se prepararán en una fase separada.',
    ],
  },
  academy: {
    vertical: 'academy',
    title: 'Demo online para academias',
    subtitle: 'Prueba alumnos, cursos, inscripciones, pagos y asistencia.',
    idealFor: 'Academias, escuelas y centros de formación.',
    whatYouCanTry: [
      'Vista admin de alumnos, cursos, grupos y horarios.',
      'Vista alumno con inscripciones, pagos y perfil.',
      'Seguimiento de asistencia y disponibilidad por grupo.',
    ],
    flows: [
      { title: 'Admin demo', description: 'Gestión de alumnos, cursos e inscripciones.', available: true, note: 'Requiere cuenta demo controlada en fase posterior.' },
      { title: 'Alumno demo', description: 'Área del alumno para ver cursos y pagos.', available: true, note: 'Requiere cuenta demo controlada en fase posterior.' },
      { title: 'Inscripciones', description: 'Flujo de inscripción y baja en cursos/clases.', available: true },
      { title: 'Pagos', description: 'Panel de pagos con estados y seguimiento.', available: true },
      { title: 'QR/check-in', description: 'Control de acceso vía QR.', available: false, note: 'Asistencia disponible sin foco en QR.' },
    ],
    safetyNotes: [
      'La demo no debe usar datos reales de alumnos.',
      'Los accesos demo se prepararán en una fase separada.',
    ],
  },
  beauty: {
    vertical: 'beauty',
    title: 'Demo online para peluquerías y estética',
    subtitle: 'Prueba clientes, servicios, citas y pagos.',
    idealFor: 'Peluquerías, barberías y centros de estética.',
    whatYouCanTry: [
      'Vista admin de clientes, servicios y agenda de citas.',
      'Vista cliente con próximas citas, historial y pagos.',
      'Flujo de citas adaptado a servicios de belleza.',
    ],
    flows: [
      { title: 'Admin demo', description: 'Operación diaria de agenda y servicios.', available: true, note: 'Requiere cuenta demo controlada en fase posterior.' },
      { title: 'Cliente demo', description: 'Área de cliente para consultar citas y pagos.', available: true, note: 'Requiere cuenta demo controlada en fase posterior.' },
      { title: 'Citas', description: 'Reservas/cancelaciones de servicios por cliente.', available: true },
      { title: 'Pagos', description: 'Revisión de pagos por servicio.', available: true, note: 'Sin cobros reales en entorno demo.' },
      { title: 'QR/check-in', description: 'Módulo de acceso por QR.', available: false, note: 'No aplica como flujo principal.' },
    ],
    safetyNotes: [
      'La demo no debe usar datos reales de clientes.',
      'Los accesos demo se prepararán en una fase separada.',
    ],
  },
  generic: {
    vertical: 'generic',
    title: 'Demo online para negocios con reservas',
    subtitle: 'Prueba clientes, servicios, reservas y pagos en una base flexible.',
    idealFor: 'Negocios de servicios que necesitan una solución adaptable.',
    whatYouCanTry: [
      'Vista admin genérica de clientes, servicios y reservas.',
      'Vista cliente con reservas, pagos y perfil.',
      'Adaptación rápida del lenguaje y capacidad por sector.',
    ],
    flows: [
      { title: 'Admin demo', description: 'Operación general del negocio desde el panel.', available: true, note: 'Requiere cuenta demo controlada en fase posterior.' },
      { title: 'Usuario demo', description: 'Área de cliente para autoservicio básico.', available: true, note: 'Requiere cuenta demo controlada en fase posterior.' },
      { title: 'Reservas', description: 'Reserva/cancelación de servicios de forma flexible.', available: true },
      { title: 'Pagos', description: 'Seguimiento de pagos del cliente.', available: true, note: 'Sin cobros reales en entorno demo.' },
      { title: 'QR/check-in', description: 'Flujo QR/check-in en configuración genérica.', available: false, note: 'Opcional según caso de uso futuro.' },
    ],
    safetyNotes: [
      'La demo no debe usar datos reales de clientes.',
      'Los accesos demo se prepararán en una fase separada.',
    ],
  },
}

export function getOnlineDemoVerticalProfile(vertical: BusinessVertical): OnlineDemoVerticalProfile {
  return ONLINE_DEMO_VERTICAL_PROFILES[vertical] ?? ONLINE_DEMO_VERTICAL_PROFILES.gym
}
