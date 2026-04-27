import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/requireAdmin'

const MESES_POR_TIPO: Record<string, number> = {
  mensual: 1, trimestral: 3, semestral: 6, anual: 12,
}
const IMPORTE_POR_TIPO: Record<string, number> = {
  mensual: 49.99, trimestral: 129.99, semestral: 229.99, anual: 399.99,
}

export async function POST(req: Request) {
  // Validar admin — gymId viene del token, no del cliente
  const result = await requireAdmin(req)
  if (result.error) return result.error
  const { gymId } = result.context

  try {
    const { userId, tipoMembresia, metodo, estado, notas } = await req.json()
    if (!userId || !tipoMembresia || !metodo) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
    }

    // Verificar que el socio pertenece al mismo gymId del admin
    const { data: socioPerfil, error: socioError } = await supabaseAdmin
      .from('perfiles')
      .select('id, gym_id')
      .eq('id', userId)
      .single()

    if (socioError || !socioPerfil) {
      return NextResponse.json({ error: 'Socio no encontrado' }, { status: 404 })
    }

    if (socioPerfil.gym_id !== gymId) {
      return NextResponse.json({ error: 'Prohibido: el socio no pertenece a tu gimnasio' }, { status: 403 })
    }

    const meses = MESES_POR_TIPO[tipoMembresia] || 1
    const importe = metodo === 'cortesia' ? 0 : (IMPORTE_POR_TIPO[tipoMembresia] || 0)
    const estadoFinal = metodo === 'cortesia' ? 'pagado' : estado

    if (estadoFinal === 'pagado') {
      const { data: perfil } = await supabaseAdmin
        .from('perfiles').select('membresia_vence').eq('id', userId).single()
      const hoy = new Date()
      const venceActual = perfil?.membresia_vence ? new Date(perfil.membresia_vence) : null
      const base = venceActual && venceActual > hoy ? new Date(venceActual) : new Date()
      base.setMonth(base.getMonth() + meses)
      const nuevaFecha = base.toISOString().split('T')[0]
      await supabaseAdmin.from('perfiles').update({
        membresia_activa: true, membresia_vence: nuevaFecha, tipo_membresia: tipoMembresia,
      }).eq('id', userId)
    }

    const { data: pago, error } = await supabaseAdmin.from('pagos').insert({
      user_id: userId,
      gym_id: gymId,       // siempre del token, nunca del cliente
      importe,
      tipo_membresia: tipoMembresia,
      meses,
      metodo,
      estado: estadoFinal,
      notas: notas || null,
    }).select().single()

    if (error) throw error
    return NextResponse.json({ ok: true, pago })

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error interno'
    console.error('[pagos/manual POST]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  // Validar admin
  const result = await requireAdmin(req)
  if (result.error) return result.error
  const { gymId } = result.context

  try {
    const { pagoId } = await req.json()
    if (!pagoId) return NextResponse.json({ error: 'Falta pagoId' }, { status: 400 })

    // Verificar que el pago pertenece al gymId del admin
    const { data: pago } = await supabaseAdmin
      .from('pagos')
      .select('*')
      .eq('id', pagoId)
      .single()

    if (!pago) return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 })

    if (pago.gym_id !== gymId) {
      return NextResponse.json({ error: 'Prohibido: el pago no pertenece a tu gimnasio' }, { status: 403 })
    }

    await supabaseAdmin
      .from('pagos')
      .update({ estado: 'pagado', fecha_pago: new Date().toISOString() })
      .eq('id', pagoId)

    const { data: perfil } = await supabaseAdmin
      .from('perfiles').select('membresia_vence').eq('id', pago.user_id).single()

    const hoy = new Date()
    const venceActual = perfil?.membresia_vence ? new Date(perfil.membresia_vence) : null
    const base = venceActual && venceActual > hoy ? new Date(venceActual) : new Date()
    base.setMonth(base.getMonth() + pago.meses)
    const nuevaFecha = base.toISOString().split('T')[0]

    await supabaseAdmin.from('perfiles').update({
      membresia_activa: true, membresia_vence: nuevaFecha, tipo_membresia: pago.tipo_membresia,
    }).eq('id', pago.user_id)

    return NextResponse.json({ ok: true, nuevaFecha })

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error interno'
    console.error('[pagos/manual PATCH]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
