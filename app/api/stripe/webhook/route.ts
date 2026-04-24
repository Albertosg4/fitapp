import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase/admin'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const MESES_POR_TIPO: Record<string, number> = { mensual: 1, trimestral: 3, semestral: 6, anual: 12 }
const IMPORTE_POR_TIPO: Record<string, number> = { mensual: 49.99, trimestral: 129.99, semestral: 229.99, anual: 399.99 }

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Invalid signature'
    console.error('[stripe/webhook] Signature error:', msg)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const userId = session.metadata?.supabase_user_id
    const tipoMembresia = session.metadata?.tipo_membresia

    if (!userId || !tipoMembresia) {
      return NextResponse.json({ error: 'Metadata incompleta' }, { status: 400 })
    }

    // Idempotencia: ignorar evento si el pago ya fue registrado
    const stripePaymentId = (session.payment_intent as string) || session.id
    const { data: pagoExistente } = await supabaseAdmin
      .from('pagos')
      .select('id')
      .eq('stripe_payment_id', stripePaymentId)
      .maybeSingle()

    if (pagoExistente) {
      console.log(`[stripe/webhook] Evento duplicado ignorado: ${stripePaymentId}`)
      return NextResponse.json({ received: true })
    }

    const meses = MESES_POR_TIPO[tipoMembresia] || 1
    const importe = IMPORTE_POR_TIPO[tipoMembresia] || (session.amount_total ? session.amount_total / 100 : 0)

    const { data: perfil } = await supabaseAdmin
      .from('perfiles').select('membresia_vence, gym_id').eq('id', userId).single()

    const hoy = new Date()
    const venceActual = perfil?.membresia_vence ? new Date(perfil.membresia_vence) : null
    const base = venceActual && venceActual > hoy ? new Date(venceActual) : new Date()
    base.setMonth(base.getMonth() + meses)
    const nuevaFecha = base.toISOString().split('T')[0]

    await supabaseAdmin.from('perfiles').update({
      membresia_activa: true, membresia_vence: nuevaFecha, tipo_membresia: tipoMembresia,
    }).eq('id', userId)

    await supabaseAdmin.from('pagos').insert({
      user_id: userId, gym_id: perfil?.gym_id || null, importe,
      tipo_membresia: tipoMembresia, meses, metodo: 'stripe', estado: 'pagado',
      stripe_payment_id: (session.payment_intent as string) || session.id,
    })

    console.log(`[stripe/webhook] Pago registrado: ${userId} → ${tipoMembresia} hasta ${nuevaFecha}`)
  }

  return NextResponse.json({ received: true })
}
