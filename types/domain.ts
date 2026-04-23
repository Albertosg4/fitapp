import type { TipoMembresia } from '@/lib/domain/membresias'

// ─── Clase ────────────────────────────────────────────────────────────────────
export interface Clase {
  id: string
  gym_id: string
  nombre: string
  dia_semana: number       // 0=Lunes … 6=Domingo
  hora_inicio: string      // 'HH:MM'
  duracion_min: number
  aforo_max: number
  activa: boolean
}

// ─── Socio (perfil con rol=socio) ────────────────────────────────────────────
export interface Socio {
  id: string
  gym_id: string
  nombre: string
  rol: 'socio' | 'admin'
  tipo_membresia: TipoMembresia
  membresia_activa: boolean
  membresia_vence: string | null   // 'YYYY-MM-DD'
  qr_token: string | null
  telefono?: string | null
}

// ─── Pago ────────────────────────────────────────────────────────────────────
export interface Pago {
  id: string
  user_id: string
  gym_id: string | null
  importe: number
  tipo_membresia: TipoMembresia
  meses: number
  metodo: 'efectivo' | 'transferencia' | 'cortesia' | 'stripe'
  estado: 'pagado' | 'pendiente'
  notas: string | null
  fecha_pago: string
  created_at: string
  perfiles?: { nombre: string } | null   // join opcional desde /api/pagos
}

// ─── Reserva ─────────────────────────────────────────────────────────────────
export interface Reserva {
  id: string
  sesion_id: string
  user_id: string
  estado: 'confirmada' | 'cancelada'
  perfil?: {
    id: string
    nombre: string
    tipo_membresia: TipoMembresia
  } | null
}

// ─── Sesión ──────────────────────────────────────────────────────────────────
export interface Sesion {
  id: string
  clase_id: string
  fecha: string   // 'YYYY-MM-DD'
}
