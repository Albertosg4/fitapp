/**
 * lib/domain/fechas.ts
 * Helper de fechas seguro para calendario, clases, sesiones y reservas.
 *
 * Regla fundamental: nunca usar Date.toISOString() para fechas de calendario
 * porque toISOString() devuelve UTC y puede cambiar el día en zonas UTC+X.
 * Todas las funciones aquí operan en hora local.
 *
 * Convención de días: lunes=0, martes=1, ..., domingo=6
 */

/**
 * Formatea una fecha local como 'YYYY-MM-DD'.
 * Seguro en cualquier zona horaria.
 */
export function formatLocalDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Parsea una fecha 'YYYY-MM-DD' a las 12:00:00 hora local.
 * Usar T12:00:00 evita el problema de medianoche UTC que desplaza el día.
 */
export function parseLocalDate(fecha: string): Date {
  return new Date(`${fecha}T12:00:00`)
}

/**
 * Devuelve el día de la semana con lunes=0 ... domingo=6.
 * getDay() nativo devuelve domingo=0, aquí lo convertimos.
 */
export function getDiaSemanaLunesPrimero(date: Date): number {
  return (date.getDay() + 6) % 7
}

/**
 * Suma N días a una fecha. Devuelve una nueva instancia sin mutar la original.
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

/**
 * Devuelve el lunes de la semana a la que pertenece la fecha dada.
 * La fecha devuelta tiene hora 00:00:00.
 */
export function getLunesSemana(date: Date): Date {
  const d = new Date(date)
  const diaSemana = getDiaSemanaLunesPrimero(d)
  d.setDate(d.getDate() - diaSemana)
  d.setHours(0, 0, 0, 0)
  return d
}
