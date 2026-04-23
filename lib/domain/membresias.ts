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

export const METODOS_PAGO: { value: string; label: string }[] = [
  { value: 'efectivo',      label: '💵 Efectivo' },
  { value: 'transferencia', label: '🏦 Transferencia' },
  { value: 'cortesia',      label: '🎁 Cortesía (0€)' },
]

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
// Valores normalizados usados en toda la app admin y socio
export type EstadoMembresia = 'activa' | 'por_vencer' | 'caducada' | 'inactiva'

// Alias legible para el panel admin (mantiene compatibilidad con lógica anterior)
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

// Versión admin con los valores que espera el panel (ok/pronto/caducada)
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
