import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/requireAdmin'

export async function GET(req: Request) {
  // Validar admin y obtener gymId desde el token — nunca desde el cliente
  const result = await requireAdmin(req)
  if (result.error) return result.error
  const { gymId } = result.context

  try {
    const { data: pagos, error } = await supabaseAdmin
      .from('pagos')
      .select('*')
      .eq('gym_id', gymId)
      .order('fecha_pago', { ascending: false })

    if (error) throw error

    if (!pagos || pagos.length === 0) {
      return NextResponse.json({ pagos: [] })
    }

    // Traer nombres de perfiles por separado (evita problema de FK no declarada)
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

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error interno'
    console.error('[pagos GET] Error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
