import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export interface AdminContext {
  userId: string
  gymId: string
}

/**
 * Valida que la request lleva un Bearer token válido,
 * que el usuario existe, que su rol es 'admin' y devuelve
 * { userId, gymId } del gimnasio al que pertenece.
 *
 * Uso en una ruta API:
 *   const result = await requireAdmin(req)
 *   if (result.error) return result.error
 *   const { gymId } = result.context
 */
export async function requireAdmin(
  req: Request
): Promise<{ context: AdminContext; error: null } | { context: null; error: NextResponse }> {
  // 1. Extraer token del header Authorization
  const authHeader = req.headers.get('Authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) {
    return {
      context: null,
      error: NextResponse.json({ error: 'No autorizado: falta token' }, { status: 401 }),
    }
  }

  // 2. Verificar token con Supabase Auth
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
  if (authError || !user) {
    return {
      context: null,
      error: NextResponse.json({ error: 'No autorizado: token inválido' }, { status: 401 }),
    }
  }

  // 3. Leer perfil y comprobar rol
  const { data: perfil, error: perfilError } = await supabaseAdmin
    .from('perfiles')
    .select('rol, gym_id')
    .eq('id', user.id)
    .single()

  if (perfilError || !perfil) {
    return {
      context: null,
      error: NextResponse.json({ error: 'No autorizado: perfil no encontrado' }, { status: 403 }),
    }
  }

  if (perfil.rol !== 'admin') {
    return {
      context: null,
      error: NextResponse.json({ error: 'Prohibido: se requiere rol admin' }, { status: 403 }),
    }
  }

  if (!perfil.gym_id) {
    return {
      context: null,
      error: NextResponse.json({ error: 'Error de configuración: admin sin gym_id' }, { status: 500 }),
    }
  }

  return {
    context: { userId: user.id, gymId: perfil.gym_id },
    error: null,
  }
}
