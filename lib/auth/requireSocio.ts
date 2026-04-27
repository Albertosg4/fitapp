import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export interface SocioContext {
  userId: string
  gymId: string
  membresiaActiva: boolean
  membresiaVence: string | null
}

/**
 * Valida Bearer token, comprueba que el perfil existe y devuelve
 * { userId, gymId, membresiaActiva, membresiaVence }.
 * NO valida membresía — deja esa decisión a la ruta que lo llama.
 *
 * Uso:
 *   const result = await requireSocio(req)
 *   if (result.error) return result.error
 *   const { userId, gymId } = result.context
 */
export async function requireSocio(
  req: Request
): Promise<{ context: SocioContext; error: null } | { context: null; error: NextResponse }> {
  const authHeader = req.headers.get('Authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) {
    return {
      context: null,
      error: NextResponse.json({ error: 'No autorizado: falta token' }, { status: 401 }),
    }
  }

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) {
    return {
      context: null,
      error: NextResponse.json({ error: 'No autorizado: token inválido' }, { status: 401 }),
    }
  }

  const { data: perfil, error: perfilError } = await supabaseAdmin
    .from('perfiles')
    .select('gym_id, membresia_activa, membresia_vence')
    .eq('id', user.id)
    .single()

  if (perfilError || !perfil) {
    return {
      context: null,
      error: NextResponse.json({ error: 'Perfil no encontrado' }, { status: 403 }),
    }
  }

  if (!perfil.gym_id) {
    return {
      context: null,
      error: NextResponse.json({ error: 'Error de configuración: usuario sin gym_id' }, { status: 500 }),
    }
  }

  return {
    context: {
      userId: user.id,
      gymId: perfil.gym_id,
      membresiaActiva: perfil.membresia_activa ?? false,
      membresiaVence: perfil.membresia_vence ?? null,
    },
    error: null,
  }
}
