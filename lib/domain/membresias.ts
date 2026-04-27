// ─── Fuente única de verdad: tipos, constantes y lógica de membresías ────────

export const TIPOS_MEMBRESIA_VALUES = ['mensual', 'trimestral', 'semestral', 'anual'] as const
export type TipoMembresia = typeof TIPOS_MEMBRESIA_VALUES[number]

export const TIPOS_MEMBRESIA: { value: TipoMembresia; label: string }[] = [
  { value: 'mensual',    label: 'Mensual' },
  { value: 'trimestral', label: 'Trimestral' },
  { value: 'semestral',  label: 'Semestral' },
  { value: 'anual',      label: 'Anual' },
]

export const IMPORTES: Record<TipoMembresia, number> = {
  mensual:    49.99,
  trimestral: 129.99,
  semestral:  229.99,
  anual:      399.99,
}

/** Meses de vigencia por tipo — fuente única para APIs de pagos */
export const MESES_POR_TIPO: Record<TipoMembresia, number> = {
  mensual:    1,
  trimestral: 3,
  semestral:  6,
  anual:      12,
}

export const METODOS_PAGO: { value: string; label: string }[] = [
  { value: 'efectivo',      label: '💵 Efectivo' },
  { value: 'transferencia', label: '🏦 Transferencia' },
  { value: 'cortesia',      label: '🎁 Cortesía (0€)' },
]

/** Valores válidos de método de pago para validación server-side */
export const METODOS_PAGO_VALUES = ['efectivo', 'transferencia', 'cortesia'] as const
export type MetodoPago = typeof METODOS_PAGO_VALUES[number]

/** Valores válidos de estado de pago para validación server-side */
export const ESTADOS_PAGO_VALUES = ['pagado', 'pendiente'] as const
export type EstadoPago = typeof ESTADOS_PAGO_VALUES[number]

export const DURACION_MEMBRESIA: Record<TipoMembresia, number> = {
  mensual:    30,
  trimestral: 90,
  semestral:  180,
  anual:      365,
}

export function calcularFechaVencimiento(tipo: TipoMembresia, desde?: Date): string {
  const base = desde ?? new Date()
  const dias = DURACION_MEMBRESIA[tipo]
  const vence = new Date(base)
  vence.setDate(vence.getDate() + dias)
  return vence.toISOString().split('T')[0]
}

// ─── Estado de membresía ──────────────────────────────────────────────────────
export type EstadoMembresia = 'activa' | 'por_vencer' | 'caducada' | 'inactiva'
export type EstadoMembresiaAdmin = 'ok' | 'pronto' | 'caducada'

export function getEstadoMembresia(perfil: {
  membresia_activa: boolean
  membresia_vence: string | null
}): EstadoMembresia {
  if (!perfil.membresia_activa) return 'inactiva'
  if (!perfil.membresia_vence) return 'inactiva'
  const diff = getDiasRestantes(perfil.membresia_vence)
  if (diff < 0) return 'caducada'
  if (diff <= 7) return 'por_vencer'
  return 'activa'
}

export function getEstadoMembresiaAdmin(perfil: {
  membresia_activa: boolean
  membresia_vence: string | null
}): EstadoMembresiaAdmin {
  if (!perfil.membresia_activa) return 'caducada'
  if (!perfil.membresia_vence) return 'ok'
  const diff = getDiasRestantes(perfil.membresia_vence)
  if (diff < 0) return 'caducada'
  if (diff <= 7) return 'pronto'
  return 'ok'
}

export function isMembresiaValida(perfil: {
  membresia_activa: boolean
  membresia_vence: string | null
}): boolean {
  const estado = getEstadoMembresia(perfil)
  return estado === 'activa' || estado === 'por_vencer'
}

export function getDiasRestantes(membresia_vence: string | null): number {
  if (!membresia_vence) return 0
  const hoy = new Date()
  const vence = new Date(membresia_vence)
  return Math.ceil((vence.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
}
