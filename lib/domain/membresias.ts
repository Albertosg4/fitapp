// Fuente única de verdad para tipos y lógica de membresías

export const TIPOS_MEMBRESIA = ['mensual', 'trimestral', 'semestral', 'anual'] as const
export type TipoMembresia = typeof TIPOS_MEMBRESIA[number]

// Duración en días de cada tipo
export const DURACION_MEMBRESIA: Record<TipoMembresia, number> = {
  mensual: 30,
  trimestral: 90,
  semestral: 180,
  anual: 365,
}

export function calcularFechaVencimiento(tipo: TipoMembresia, desde?: Date): string {
  const base = desde ?? new Date()
  const dias = DURACION_MEMBRESIA[tipo]
  const vence = new Date(base)
  vence.setDate(vence.getDate() + dias)
  return vence.toISOString().split('T')[0]
}

export type EstadoMembresia = 'activa' | 'por_vencer' | 'caducada' | 'inactiva'

export function getEstadoMembresia(perfil: {
  membresia_activa: boolean
  membresia_vence: string | null
}): EstadoMembresia {
  if (!perfil.membresia_activa) return 'inactiva'
  if (!perfil.membresia_vence) return 'inactiva'

  const hoy = new Date()
  const vence = new Date(perfil.membresia_vence)
  const diffDias = Math.ceil((vence.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDias < 0) return 'caducada'
  if (diffDias <= 7) return 'por_vencer'
  return 'activa'
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
