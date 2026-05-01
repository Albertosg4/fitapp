import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { isMembresiaValida } from '@/lib/domain/membresias'

const TOKEN_MAX_LENGTH = 256

const RATE_LIMIT_WINDOW_MS = 30_000
const RATE_LIMIT_MAX_REQUESTS = 12
const RATE_LIMIT_SWEEP_THRESHOLD = 500

const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

function redactToken(raw: string): string {
  const token = raw.trim()
  if (!token) return 'empty'
  if (token.length <= 6) return `${token[0] ?? '*'}***${token[token.length - 1] ?? '*'}`
  return `${token.slice(0, 3)}***${token.slice(-3)}`
}

function getClientIp(req: Request): string {
  const realIp = req.headers.get('x-real-ip')?.trim()
  if (realIp) return realIp

  const vercelForwardedFor = req.headers.get('x-vercel-forwarded-for')?.trim()
  if (vercelForwardedFor) return vercelForwardedFor.split(',')[0]?.trim() || 'unknown'

  return 'unknown'
}

function fingerprintToken(token: string): string {
  // Hash simple y estable para clave interna en memoria (no criptográfico).
  let hash = 2166136261
  for (let i = 0; i < token.length; i += 1) {
    hash ^= token.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(16)
}

function sweepExpiredRateLimitEntries(now: number): void {
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetAt <= now) {
      rateLimitStore.delete(key)
    }
  }
}

function checkRateLimit(key: string): boolean {
  const now = Date.now()
  if (rateLimitStore.size >= RATE_LIMIT_SWEEP_THRESHOLD) {
    sweepExpiredRateLimitEntries(now)
  }

  const record = rateLimitStore.get(key)

  if (!record || record.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false
  }

  record.count += 1
  rateLimitStore.set(key, record)
  return true
}

function isUndefinedColumnError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false

  const candidate = err as { code?: string; message?: string }
  const message = candidate.message?.toLowerCase() ?? ''
  return candidate.code === '42703' || (message.includes('column') && message.includes('does not exist'))
}

function isDuplicateLikeError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false

  const candidate = err as { code?: string; message?: string; details?: string; hint?: string }
  const combined = `${candidate.message ?? ''} ${candidate.details ?? ''} ${candidate.hint ?? ''}`.toLowerCase()

  return candidate.code === '23505'
    || combined.includes('duplicate key')
    || combined.includes('unique constraint')
    || combined.includes('already exists')
}

function isTokenValid(token: string): boolean {
  if (token.length === 0 || token.length > TOKEN_MAX_LENGTH) return false
  return true
}

export async function POST(req: Request) {
  try {
    // ─── 1. Validar payload ─────────────────────────────────────────────────────
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
    }

    const token = (body as { token?: unknown } | null)?.token

    if (typeof token !== 'string') {
      return NextResponse.json({ error: 'Token requerido' }, { status: 400 })
    }

    const tokenNormalized = token.trim()
    if (!isTokenValid(tokenNormalized)) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 400 })
    }

    const tokenRedacted = redactToken(tokenNormalized)
    const tokenFingerprint = fingerprintToken(tokenNormalized)
    const ip = getClientIp(req)
    const rateLimitKey = `${ip}:${tokenFingerprint}`

    if (!checkRateLimit(rateLimitKey)) {
      console.warn(`[checkin] Rate limit excedido ip=${ip} token=${tokenRedacted}`)
      return NextResponse.json({ error: 'Demasiados intentos. Intenta de nuevo en unos segundos.' }, { status: 429 })
    }

    // ─── 2. Buscar perfil por qr_token ─────────────────────────────────────────
    const { data: perfil, error: perfilError } = await supabaseAdmin
      .from('perfiles')
      .select('id, nombre, membresia_activa, membresia_vence, gym_id')
      .eq('qr_token', tokenNormalized)
      .maybeSingle()

    if (perfilError) {
      console.error('[checkin] Error buscando perfil:', perfilError.message)
      return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }

    if (!perfil) {
      return NextResponse.json({ error: 'QR no reconocido' }, { status: 404 })
    }

    // ─── 3. Validar membresía (activa + fecha no vencida) ───────────────────────
    if (!isMembresiaValida(perfil)) {
      console.log(`[checkin] Membresía inválida para user: ${perfil.id}`)
      return NextResponse.json(
        { error: 'Membresía no activa o caducada', nombre: perfil.nombre },
        { status: 403 }
      )
    }

    // Nota: aquí usamos toISOString para obtener la fecha UTC del servidor,
    // que es la que Supabase almacena en timestamps. No es un uso de calendario local.
    const hoy = new Date().toISOString().split('T')[0]

    // ─── 4. Buscar reserva confirmada de hoy ───────────────────────────────────
    const { data: sesionesHoy } = await supabaseAdmin
      .from('sesiones')
      .select('id')
      .eq('fecha', hoy)

    const sesionIds = (sesionesHoy ?? []).map((s: { id: string }) => s.id)

    let reservaId: string | null = null
    let reservaSesionId: string | null = null
    if (sesionIds.length > 0) {
      const { data: reserva } = await supabaseAdmin
        .from('reservas')
        .select('id, sesion_id')
        .eq('user_id', perfil.id)
        .eq('estado', 'confirmada')
        .in('sesion_id', sesionIds)
        .maybeSingle()

      reservaId = reserva?.id ?? null
      reservaSesionId = reserva?.sesion_id ?? null
    }

    // ─── 5. Acceso libre (sin reserva hoy) ─────────────────────────────────────
    if (!reservaId) {
      // Evitar duplicado de acceso libre el mismo día
      const { data: yaAcceso } = await supabaseAdmin
        .from('asistencia')
        .select('id')
        .eq('user_id', perfil.id)
        .gte('check_in_at', `${hoy}T00:00:00`)
        .lte('check_in_at', `${hoy}T23:59:59`)
        .maybeSingle()

      if (yaAcceso) {
        return NextResponse.json({
          ok: true,
          nombre: perfil.nombre,
          msg: 'Acceso ya registrado hoy',
        })
      }

      const { error: insertErrorTrace } = await supabaseAdmin.from('asistencia').insert({
        user_id: perfil.id,
        metodo: 'qr',
        gym_id: perfil.gym_id ?? null,
        sesion_id: null,
      })
      let insertError = insertErrorTrace
      if (isUndefinedColumnError(insertErrorTrace)) {
        console.warn('[checkin] fallback legacy acceso libre: columnas gym_id/sesion_id no disponibles aún')
        const { error: insertErrorLegacy } = await supabaseAdmin.from('asistencia').insert({
          user_id: perfil.id,
          metodo: 'qr',
        })
        insertError = insertErrorLegacy
      }

      if (insertError) {
        if (isDuplicateLikeError(insertError)) {
          const { data: accesoPostConflict } = await supabaseAdmin
            .from('asistencia')
            .select('id')
            .eq('user_id', perfil.id)
            .gte('check_in_at', `${hoy}T00:00:00`)
            .lte('check_in_at', `${hoy}T23:59:59`)
            .maybeSingle()

          if (accesoPostConflict) {
            return NextResponse.json({
              ok: true,
              nombre: perfil.nombre,
              msg: 'Acceso ya registrado hoy',
            })
          }
        }

        console.error('[checkin] Error registrando acceso libre:', insertError.message)
        return NextResponse.json({ error: 'Error al registrar acceso' }, { status: 500 })
      }

      console.log(`[checkin] Acceso libre: user=${perfil.id} | fecha=${hoy}`)
      return NextResponse.json({
        ok: true,
        nombre: perfil.nombre,
        msg: 'Acceso permitido · Sin reserva hoy',
      })
    }

    // ─── 6. Check-in con reserva — evitar duplicado ─────────────────────────────
    const { data: yaCheckin } = await supabaseAdmin
      .from('asistencia')
      .select('id')
      .eq('reserva_id', reservaId)
      .maybeSingle()

    if (yaCheckin) {
      return NextResponse.json({
        ok: true,
        nombre: perfil.nombre,
        msg: 'Check-in ya registrado anteriormente',
      })
    }

    // ─── 7. Registrar asistencia ligada a reserva ───────────────────────────────
    const { error: checkinErrorTrace } = await supabaseAdmin.from('asistencia').insert({
      reserva_id: reservaId,
      user_id: perfil.id,
      metodo: 'qr',
      gym_id: perfil.gym_id ?? null,
      sesion_id: reservaSesionId,
    })
    let checkinError = checkinErrorTrace
    if (isUndefinedColumnError(checkinErrorTrace)) {
      console.warn('[checkin] fallback legacy con reserva: columnas gym_id/sesion_id no disponibles aún')
      const { error: checkinErrorLegacy } = await supabaseAdmin.from('asistencia').insert({
        reserva_id: reservaId,
        user_id: perfil.id,
        metodo: 'qr',
      })
      checkinError = checkinErrorLegacy
    }

    if (checkinError) {
      if (isDuplicateLikeError(checkinError)) {
        const { data: checkinPostConflict } = await supabaseAdmin
          .from('asistencia')
          .select('id')
          .eq('reserva_id', reservaId)
          .maybeSingle()

        if (checkinPostConflict) {
          return NextResponse.json({
            ok: true,
            nombre: perfil.nombre,
            msg: 'Check-in ya registrado anteriormente',
          })
        }
      }

      console.error('[checkin] Error registrando check-in:', checkinError.message)
      return NextResponse.json({ error: 'Error al registrar check-in' }, { status: 500 })
    }

    console.log(`[checkin] Check-in registrado: user=${perfil.id} | reserva=${reservaId}`)
    return NextResponse.json({
      ok: true,
      nombre: perfil.nombre,
      msg: 'Check-in registrado ✅',
    })

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error desconocido'
    console.error('[checkin] Error inesperado:', msg)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
