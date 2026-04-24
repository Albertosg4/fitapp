import type { TipoMembresia } from '@/lib/domain/membresias'

// ─── Clase (LEGACY) ───────────────────────────────────────────────────────────
// LEGACY: representa horarios recurrentes antiguos. No usar en nuevas pantallas.
// Mantenida para compatibilidad con admin/socio existentes hasta que se complete
// la migración al modelo actividades + horarios_clase + sesiones.
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

// ─── Actividad ────────────────────────────────────────────────────────────────
// Define qué es una clase: nombre, descripción, color, etc.
// Una actividad puede tener múltiples horarios recurrentes o clases puntuales.
export interface Actividad {
  id: string
  gym_id: string
  nombre: string
  descripcion: string | null
  color: string | null        // hex o nombre para UI
  activa: boolean
  created_at: string
}

// ─── HorarioClase ─────────────────────────────────────────────────────────────
// Define una recurrencia semanal: "Boxeo los lunes a las 18:00".
// Genera sesiones materializadas bajo demanda o por cron.
export interface HorarioClase {
  id: string
  gym_id: string
  actividad_id: string
  dia_semana: number          // 0=Lunes … 6=Domingo
  hora_inicio: string         // 'HH:MM'
  duracion_min: number
  aforo_max: number
  profesor: string | null
  fecha_inicio: string        // 'YYYY-MM-DD' — desde cuándo aplica
  fecha_fin: string | null    // 'YYYY-MM-DD' — null = sin fin
  activo: boolean
  created_at: string
}

// ─── Sesion (ampliada) ────────────────────────────────────────────────────────
// Representa una clase concreta en una fecha específica.
// Puede venir de un HorarioClase recurrente o ser una clase puntual.
// Las reservas siempre van contra sesiones.id.
//
// Nota BD real: la columna de cancelación se llama `cancelada boolean` (legacy).
// Los campos nuevos (horario_id, actividad_id, etc.) se añaden en Fase B.
export interface Sesion {
  id: string
  // --- Campos legacy ---
  clase_id: string | null     // FK a clases (legacy)
  cancelada: boolean | null   // campo original en BD — true = no visible al socio
  created_at: string | null
  // --- Campos nuevos (Fase B) ---
  horario_id: string | null   // FK a horarios_clase, null si es puntual
  actividad_id: string | null // FK a actividades
  fecha: string               // 'YYYY-MM-DD'
  hora_inicio: string | null  // override de hora si difiere del horario
  duracion_min: number | null // override de duración
  aforo_max: number | null    // override de aforo
  profesor: string | null
  notas: string | null
  es_puntual: boolean         // true si es clase puntual (no recurrente)
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
