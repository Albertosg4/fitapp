export type UserFacingErrorKey =
  | 'sessionExpired'
  | 'network'
  | 'loadAdmin'
  | 'loadMember'
  | 'loadClasses'
  | 'loadBookings'
  | 'booking'
  | 'payment'
  | 'profile'
  | 'qr'
  | 'generic'

export const USER_FACING_ERRORS: Record<UserFacingErrorKey, string> = {
  sessionExpired: 'Tu sesión ha caducado. Vuelve a iniciar sesión.',
  network: 'No se ha podido conectar. Revisa tu conexión e inténtalo de nuevo.',
  loadAdmin: 'No se ha podido cargar el panel de administración.',
  loadMember: 'No se ha podido cargar tu área de socio.',
  loadClasses: 'No se han podido cargar las clases.',
  loadBookings: 'No se han podido cargar tus reservas.',
  booking: 'No se ha podido completar la reserva. Inténtalo de nuevo.',
  payment: 'No se ha podido iniciar el pago. Inténtalo de nuevo.',
  profile: 'No se ha podido cargar tu perfil.',
  qr: 'No se ha podido cargar tu QR.',
  generic: 'Ha ocurrido un problema. Inténtalo de nuevo.',
}

const SENSITIVE_TERMS = [
  'supabase', 'jwt', 'token', 'bearer', 'payload', 'service_role', 'sql', 'rpc', 'relation', 'column',
  'schema', 'permission denied', 'duplicate key', 'foreign key', 'stack', 'trace', 'raw',
]

export function getUserFacingErrorMessage(key: UserFacingErrorKey): string {
  return USER_FACING_ERRORS[key]
}

export function normaliseUserFacingError(error: unknown, fallback?: string): string {
  const safeFallback = fallback || USER_FACING_ERRORS.generic
  const raw = typeof error === 'string' ? error : error instanceof Error ? error.message : ''
  const message = raw.trim()
  if (!message) return safeFallback

  const lower = message.toLowerCase()
  if (lower.includes('failed to fetch') || lower.includes('fetch failed') || lower.includes('networkerror')) {
    return USER_FACING_ERRORS.network
  }
  if (lower.includes('jwt expired') || lower.includes('sin sesión') || lower.includes('unauthorized') || lower.includes('401')) {
    return USER_FACING_ERRORS.sessionExpired
  }
  if (SENSITIVE_TERMS.some((term) => lower.includes(term))) {
    return safeFallback
  }

  return message.length > 160 ? safeFallback : message
}
