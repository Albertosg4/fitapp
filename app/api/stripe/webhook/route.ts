import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const MESES_POR_TIPO: Record<string, number> = {
  mensual: 1,
  trimestral: 3,
  semestral: 6,
  anual: 12,
}

const IMPORTE_POR_TIPO: Record<string, number> = {
  mensual: 49.99,
  trimestral: 129.99,
  semestral: 229.99,
  anual: 399.99,
}

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    console.error('Webhook signature error:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    const userId = session.metadata?.supabase_user_id
    const tipoMembresia = session.metadata?.tipo_membresia

    if (!userId || !tipoMembresia) {
      return NextResponse.json({ error: 'Metadata incompleta' }, { status: 400 })
    }

    const meses = MESES_POR_TIPO[tipoMembresia] || 1
    const importe = IMPORTE_POR_TIPO[tipoMembresia] || (session.amount_total ? session.amount_total / 100 : 0)

    // 1. Calcular nueva fecha de vencimiento
    const { data: perfil } = await supabaseAdmin
      .from('perfiles')
      .select('membresia_vence, gym_id')
      .eq('id', userId)
      .single()

    const hoy = new Date()
    const venceActual = perfil?.membresia_vence ? new Date(perfil.membresia_vence) : null
    const base = venceActual && venceActual > hoy ? new Date(venceActual) : new Date()
    base.setMonth(base.getMonth() + meses)
    const nuevaFecha = base.toISOString().split('T')[0]

    // 2. Actualizar membresía
    await supabaseAdmin
      .from('perfiles')
      .update({
        membresia_activa: true,
        membresia_vence: nuevaFecha,
        tipo_membresia: tipoMembresia,
      })
      .eq('id', userId)

    // 3. Registrar pago en tabla pagos
    await supabaseAdmin.from('pagos').insert({
      user_id: userId,
      gym_id: perfil?.gym_id || null,
      importe,
      tipo_membresia: tipoMembresia,
      meses,
      metodo: 'stripe',
      estado: 'pagado',
      stripe_payment_id: session.payment_intent as string || session.id,
    })

    console.log(`✅ Pago registrado: ${userId} → ${tipoMembresia} hasta ${nuevaFecha}`)
  }

  return NextResponse.json({ received: true })
}