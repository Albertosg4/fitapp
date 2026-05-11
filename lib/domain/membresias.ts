import { formatLocalDate, parseLocalDate } from '@/lib/domain/fechas'

export const TIPOS_MEMBRESIA_VALUES = ['mensual', 'trimestral', 'semestral', 'anual'] as const
export type TipoMembresia = typeof TIPOS_MEMBRESIA_VALUES[number]

export function isTipoMembresia(value: unknown): value is TipoMembresia {
  return typeof value === 'string' && TIPOS_MEMBRESIA_VALUES.includes(value as TipoMembresia)
}

export const TIPOS_MEMBRESIA: { value: TipoMembresia; label: string }[] = [
  { value: 'mensual', label: 'Mensual' },
  { value: 'trimestral', label: 'Trimestral' },
  { value: 'semestral', label: 'Semestral' },
  { value: 'anual', label: 'Anual' },
]

export const IMPORTES: Record<TipoMembresia, number> = { mensual: 49.99, trimestral: 129.99, semestral: 229.99, anual: 399.99 }
export const MESES_POR_TIPO: Record<TipoMembresia, number> = { mensual: 1, trimestral: 3, semestral: 6, anual: 12 }
export const METODOS_PAGO: { value: string; label: string }[] = [
  { value: 'efectivo', label: '💵 Efectivo' },
  { value: 'transferencia', label: '🏦 Transferencia' },
  { value: 'cortesia', label: '🎁 Cortesía (0€)' },
]
export const METODOS_PAGO_VALUES = ['efectivo', 'transferencia', 'cortesia'] as const
export type MetodoPago = typeof METODOS_PAGO_VALUES[number]
export const ESTADOS_PAGO_VALUES = ['pagado', 'pendiente'] as const
export type EstadoPago = typeof ESTADOS_PAGO_VALUES[number]
export const DURACION_MEMBRESIA: Record<TipoMembresia, number> = { mensual: 30, trimestral: 90, semestral: 180, anual: 365 }

function addMonthsClamped(date: Date, months: number): Date {
  const firstDayTargetMonth = new Date(date.getFullYear(), date.getMonth() + months, 1, 12, 0, 0, 0)
  const lastDayTargetMonth = new Date(firstDayTargetMonth.getFullYear(), firstDayTargetMonth.getMonth() + 1, 0, 12, 0, 0, 0).getDate()
  const clampedDay = Math.min(date.getDate(), lastDayTargetMonth)
  return new Date(firstDayTargetMonth.getFullYear(), firstDayTargetMonth.getMonth(), clampedDay, 12, 0, 0, 0)
}

export function calcularNuevaFechaVencimiento(tipo: TipoMembresia, membresiaVenceActual?: string | null, hoy?: string): string {
  const hoyLocal = hoy ? parseLocalDate(hoy) : new Date()
  const baseHoy = new Date(hoyLocal.getFullYear(), hoyLocal.getMonth(), hoyLocal.getDate(), 12, 0, 0, 0)
  const venceActual = membresiaVenceActual ? parseLocalDate(membresiaVenceActual) : null
  const base = venceActual && venceActual > baseHoy ? venceActual : baseHoy
  return formatLocalDate(addMonthsClamped(base, MESES_POR_TIPO[tipo]))
}

export function calcularFechaVencimiento(tipo: TipoMembresia, desde?: Date): string {
  return calcularNuevaFechaVencimiento(tipo, null, desde ? formatLocalDate(desde) : undefined)
}

export type EstadoMembresia = 'activa' | 'por_vencer' | 'caducada' | 'inactiva'
export type EstadoMembresiaAdmin = 'ok' | 'pronto' | 'caducada'

export function getEstadoMembresia(perfil: { membresia_activa: boolean; membresia_vence: string | null }): EstadoMembresia {
  if (!perfil.membresia_activa || !perfil.membresia_vence) return 'inactiva'
  const diff = getDiasRestantes(perfil.membresia_vence)
  if (diff < 0) return 'caducada'
  if (diff <= 7) return 'por_vencer'
  return 'activa'
}

export function getEstadoMembresiaAdmin(perfil: { membresia_activa: boolean; membresia_vence: string | null }): EstadoMembresiaAdmin {
  if (!perfil.membresia_activa) return 'caducada'
  if (!perfil.membresia_vence) return 'ok'
  const diff = getDiasRestantes(perfil.membresia_vence)
  if (diff < 0) return 'caducada'
  if (diff <= 7) return 'pronto'
  return 'ok'
}

export function isMembresiaValida(perfil: { membresia_activa: boolean; membresia_vence: string | null }): boolean {
  const estado = getEstadoMembresia(perfil)
  return estado === 'activa' || estado === 'por_vencer'
}

export function getDiasRestantes(membresia_vence: string | null): number {
  if (!membresia_vence) return 0
  return Math.ceil((new Date(membresia_vence).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
}
