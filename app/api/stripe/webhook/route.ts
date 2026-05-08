import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { IMPORTES, MESES_POR_TIPO, isTipoMembresia } from '@/lib/domain/membresias'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null

export async function POST(req: Request) {
  if (!stripe || !stripeWebhookSecret) {
    console.error('[stripe/webhook] Missing webhook config')
    return NextResponse.json({ error: 'Webhook no disponible' }, { status: 500 })
  }

  const rawBody = await req.text()
  const signature = req.headers.get('stripe-signature')
  if (!signature) return NextResponse.json({ error: 'Firma no válida' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, stripeWebhookSecret)
  } catch {
    return NextResponse.json({ error: 'Firma no válida' }, { status: 400 })
  }

  if (event.type !== 'checkout.session.completed') return NextResponse.json({ received: true })

  const session = event.data.object as Stripe.Checkout.Session
  const userId = session.metadata?.supabase_user_id
  const tipoRaw = session.metadata?.tipo_membresia
  const stripeSessionId = session.id
  const stripePaymentId = (session.payment_intent as string) || stripeSessionId
  const stripeEventId = event.id

  if (!userId || !isTipoMembresia(tipoRaw) || !stripeSessionId || !stripePaymentId || !stripeEventId) {
    return NextResponse.json({ error: 'Evento inválido' }, { status: 400 })
  }

  const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc('registrar_pago_stripe_membresia', {
    p_user_id: userId,
    p_tipo_membresia: tipoRaw,
    p_importe: IMPORTES[tipoRaw],
    p_meses: MESES_POR_TIPO[tipoRaw],
    p_stripe_payment_id: stripePaymentId,
    p_stripe_session_id: stripeSessionId,
    p_stripe_event_id: stripeEventId,
  })

  if (rpcError) {
    console.error('[stripe/webhook] RPC failed', rpcError.message)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }

  if (rpcData?.status === 'duplicate') return NextResponse.json({ received: true, duplicate: true })

  return NextResponse.json({ received: true })
}
