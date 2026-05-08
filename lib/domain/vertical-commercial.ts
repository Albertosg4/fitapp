import type { BusinessVertical } from '@/lib/domain/verticals'

export interface VerticalCommercialProfile {
  headline: string
  subtitle: string
  adminSummary: string
  memberSummary: string
  primaryUseCase: string
  customerNoun: string
  serviceNoun: string
  bookingNoun: string
  valueProps: string[]
  demoNotes: string[]
}

export const VERTICAL_COMMERCIAL_PROFILES: Record<BusinessVertical, VerticalCommercialProfile> = {
  gym: {
    headline: 'Gestión completa para gimnasios y centros deportivos',
    subtitle: 'Clases, socios, reservas, pagos y check-in en una sola plataforma.',
    adminSummary: 'Controla socios, actividades, horarios, reservas, pagos y asistencia desde un único panel.',
    memberSummary: 'Consulta tus clases, reservas, pagos, perfil y QR de acceso.',
    primaryUseCase: 'Centro deportivo con clases, aforo y check-in.',
    customerNoun: 'socios',
    serviceNoun: 'clases',
    bookingNoun: 'reservas',
    valueProps: ['Reservas con aforo', 'Check-in por QR', 'Gestión de pagos', 'Historial de asistencia'],
    demoNotes: ['Vertical por defecto actual.', 'Mantiene todos los módulos visibles.'],
  },
  clinic: {
    headline: 'Gestión de citas para clínicas y centros sanitarios',
    subtitle: 'Pacientes, tratamientos, citas, visitas y pagos con una experiencia adaptada.',
    adminSummary: 'Organiza pacientes, tratamientos, citas y pagos sin depender del lenguaje de gimnasio.',
    memberSummary: 'Consulta tus citas, pagos y datos personales desde tu área privada.',
    primaryUseCase: 'Clínica con agenda de citas y seguimiento de visitas.',
    customerNoun: 'pacientes',
    serviceNoun: 'tratamientos',
    bookingNoun: 'citas',
    valueProps: ['Agenda de citas', 'Historial de visitas', 'Pagos por servicio', 'Sin QR obligatorio'],
    demoNotes: ['QR/check-in queda desactivado en preview.', 'Capacidad/aforo no es protagonista.'],
  },
  academy: {
    headline: 'Gestión para academias, escuelas y formación',
    subtitle: 'Alumnos, cursos, clases, inscripciones, pagos y asistencia.',
    adminSummary: 'Gestiona alumnos, cursos, horarios, inscripciones, pagos y asistencia desde un panel común.',
    memberSummary: 'Consulta tus clases/cursos, inscripciones, pagos y perfil.',
    primaryUseCase: 'Academia con grupos, cursos recurrentes y control de asistencia.',
    customerNoun: 'alumnos',
    serviceNoun: 'clases/cursos',
    bookingNoun: 'inscripciones',
    valueProps: ['Cursos recurrentes', 'Control de asistencia', 'Capacidad por grupo', 'Pagos centralizados'],
    demoNotes: ['QR queda desactivado en preview.', 'Asistencia y capacidad siguen activas.'],
  },
  beauty: {
    headline: 'Agenda y reservas para peluquerías y centros de estética',
    subtitle: 'Clientes, servicios, citas y pagos con una experiencia simple y comercial.',
    adminSummary: 'Gestiona clientes, servicios, citas y pagos sin módulos deportivos innecesarios.',
    memberSummary: 'Consulta tus citas, pagos y datos desde tu área de cliente.',
    primaryUseCase: 'Centro de servicios con agenda de citas.',
    customerNoun: 'clientes',
    serviceNoun: 'servicios',
    bookingNoun: 'citas',
    valueProps: ['Agenda de servicios', 'Citas por cliente', 'Pagos visibles', 'Sin check-in ni asistencia'],
    demoNotes: ['QR/check-in desactivado.', 'Asistencia desactivada.', 'Capacidad no protagonista.'],
  },
  generic: {
    headline: 'Plataforma flexible para negocios con reservas',
    subtitle: 'Clientes, servicios, reservas y pagos adaptables a distintos sectores.',
    adminSummary: 'Base común para negocios que necesitan gestionar clientes, servicios, reservas y pagos.',
    memberSummary: 'Consulta tus reservas, pagos y datos desde tu área privada.',
    primaryUseCase: 'Negocio genérico con reservas y pagos.',
    customerNoun: 'clientes',
    serviceNoun: 'servicios',
    bookingNoun: 'reservas',
    valueProps: ['Clientes y servicios', 'Reservas online', 'Pagos centralizados', 'Configuración adaptable'],
    demoNotes: ['Base neutra para sectores futuros.', 'Sin módulos específicos activados.'],
  },
}

export function getVerticalCommercialProfile(vertical: BusinessVertical): VerticalCommercialProfile {
  return VERTICAL_COMMERCIAL_PROFILES[vertical] ?? VERTICAL_COMMERCIAL_PROFILES.gym
}
