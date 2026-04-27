import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function GET(req: Request) {
  const result = await requireAdmin(req)
  if (result.error) return result.error
  const { gymId } = result.context

  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    // Si se pasa userId, verificar que pertenece al mismo gymId del admin
    if (userId) {
      const { data: perfil, error: perfilError } = await supabaseAdmin
        .from('perfiles')
        .select('gym_id')
        .eq('id', userId)
        .single()

      if (perfilError || !perfil) {
        return NextResponse.json({ error: 'Socio no encontrado' }, { status: 404 })
      }
      if (perfil.gym_id !== gymId) {
        return NextResponse.json({ error: 'Prohibido: el socio no pertenece a tu gimnasio' }, { status: 403 })
      }
    }

    // Construir query base filtrando siempre por gymId del token
    let query = supabaseAdmin
      .from('pagos')
      .select('*')
      .eq('gym_id', gymId)
      .order('fecha_pago', { ascending: false })

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data: pagos, error } = await query
    if (error) throw error

    if (!pagos || pagos.length === 0) {
      return NextResponse.json({ pagos: [] })
    }

    // Enriquecer con nombre del perfil solo en modo global (sin userId)
    if (!userId) {
      const userIds = [...new Set(pagos.map(p => p.user_id))]
      const { data: perfiles } = await supabaseAdmin
        .from('perfiles')
        .select('id, nombre')
        .in('id', userIds)

      const perfilesMap = Object.fromEntries((perfiles || []).map(p => [p.id, p]))
      const resultado = pagos.map(p => ({
        ...p,
        perfiles: perfilesMap[p.user_id] || null,
      }))
      return NextResponse.json({ pagos: resultado })
    }

    return NextResponse.json({ pagos })

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error interno'
    console.error('[pagos GET] Error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
