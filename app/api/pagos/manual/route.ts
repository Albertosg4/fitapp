import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const MESES_POR_TIPO: Record<string, number> = {
  mensual: 1, trimestral: 3, semestral: 6, anual: 12,
}

const IMPORTE_POR_TIPO: Record<string, number> = {
  mensual: 49.99, trimestral: 129.99, semestral: 229.99, anual: 399.99,
}

export async function POST(req: Request) {
  try {
    const { userId, tipoMembresia, metodo, estado, notas, gymId } = await req.json()

    if (!userId || !tipoMembresia || !metodo) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
    }

    const meses = MESES_POR_TIPO[tipoMembresia] || 1
    // Cortesía siempre 0€, resto precio normal
    const importe = metodo === 'cortesia' ? 0 : (IMPORTE_POR_TIPO[tipoMembresia] || 0)

    // Si está pagado O es cortesía → renovar membresía
    if (estado === 'pagado' || metodo === 'cortesia') {
      const { data: perfil } = await supabaseAdmin
        .from('perfiles').select('membresia_vence').eq('id', userId).single()

      const hoy = new Date()
      const venceActual = perfil?.membresia_vence ? new Date(perfil.membresia_vence) : null
      const base = venceActual && venceActual > hoy ? new Date(venceActual) : new Date()
      base.setMonth(base.getMonth() + meses)
      const nuevaFecha = base.toISOString().split('T')[0]

      await supabaseAdmin.from('perfiles').update({
        membresia_activa: true,
        membresia_vence: nuevaFecha,
        tipo_membresia: tipoMembresia,
      }).eq('id', userId)
    }

    // Registrar pago con trazabilidad completa
    const { data: pago, error } = await supabaseAdmin.from('pagos').insert({
      user_id: userId,
      gym_id: gymId || null,
      importe,
      tipo_membresia: tipoMembresia,
      meses,
      metodo,
      estado: metodo === 'cortesia' ? 'pagado' : estado,
      notas: notas || null,
    }).select().single()

    if (error) throw error

    return NextResponse.json({ ok: true, pago })

  } catch (err: any) {
    console.error('Error pago manual:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// Confirmar pago pendiente → renueva membresía
export async function PATCH(req: Request) {
  try {
    const { pagoId } = await req.json()
    if (!pagoId) return NextResponse.json({ error: 'Falta pagoId' }, { status: 400 })

    const { data: pago } = await supabaseAdmin
      .from('pagos').select('*').eq('id', pagoId).single()

    if (!pago) return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 })

    // Marcar como pagado
    await supabaseAdmin.from('pagos')
      .update({ estado: 'pagado', fecha_pago: new Date().toISOString() })
      .eq('id', pagoId)

    // Renovar membresía
    const { data: perfil } = await supabaseAdmin
      .from('perfiles').select('membresia_vence').eq('id', pago.user_id).single()

    const hoy = new Date()
    const venceActual = perfil?.membresia_vence ? new Date(perfil.membresia_vence) : null
    const base = venceActual && venceActual > hoy ? new Date(venceActual) : new Date()
    base.setMonth(base.getMonth() + pago.meses)
    const nuevaFecha = base.toISOString().split('T')[0]

    await supabaseAdmin.from('perfiles').update({
      membresia_activa: true,
      membresia_vence: nuevaFecha,
      tipo_membresia: pago.tipo_membresia,
    }).eq('id', pago.user_id)

    return NextResponse.json({ ok: true, nuevaFecha })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}