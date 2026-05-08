import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { IMPORTES, MESES_POR_TIPO, calcularNuevaFechaVencimiento, isTipoMembresia } from '@/lib/domain/membresias'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null

export async function POST(req: Request) {
  if (!stripe || !stripeWebhookSecret) {
    console.error('[stripe/webhook] Missing webhook config')
    return NextResponse.json({ error: 'Webhook no disponible' }, { status: 500 })
  }

  const rawBody = await req.text()
  const sig = req.headers.get('stripe-signature')
  if (!sig) return NextResponse.json({ error: 'Firma no válida' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, stripeWebhookSecret)
  } catch {
    return NextResponse.json({ error: 'Firma no válida' }, { status: 400 })
  }

  if (event.type !== 'checkout.session.completed') return NextResponse.json({ received: true })

  const session = event.data.object as Stripe.Checkout.Session
  const userId = session.metadata?.supabase_user_id
  const gymId = session.metadata?.gym_id
  const tipoRaw = session.metadata?.tipo_membresia
  const stripeSessionId = session.id
  const stripePaymentId = (session.payment_intent as string) || stripeSessionId

  if (!userId || !stripeSessionId || !stripePaymentId || !isTipoMembresia(tipoRaw)) {
    return NextResponse.json({ error: 'Evento inválido' }, { status: 400 })
  }

  const duplicateQuery = await supabaseAdmin.from('pagos').select('id').or(`stripe_payment_id.eq.${stripePaymentId},stripe_session_id.eq.${stripeSessionId}`).maybeSingle()
  if (duplicateQuery.error) return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  if (duplicateQuery.data) return NextResponse.json({ received: true })

  const { data: perfil, error: perfilError } = await supabaseAdmin.from('perfiles').select('membresia_vence, gym_id').eq('id', userId).single()
  if (perfilError || !perfil?.gym_id) return NextResponse.json({ error: 'Perfil inválido para pago' }, { status: 400 })

  const finalGymId = gymId || perfil.gym_id
  const nuevaFecha = calcularNuevaFechaVencimiento(tipoRaw, perfil.membresia_vence)
  const { error: perfilUpdateError } = await supabaseAdmin.from('perfiles').update({ membresia_activa: true, membresia_vence: nuevaFecha, tipo_membresia: tipoRaw }).eq('id', userId)
  if (perfilUpdateError) return NextResponse.json({ error: 'Error interno' }, { status: 500 })

  const { error: insertError } = await supabaseAdmin.from('pagos').insert({
    user_id: userId,
    gym_id: finalGymId,
    importe: IMPORTES[tipoRaw],
    tipo_membresia: tipoRaw,
    meses: MESES_POR_TIPO[tipoRaw],
    metodo: 'stripe',
    estado: 'pagado',
    stripe_payment_id: stripePaymentId,
    stripe_session_id: stripeSessionId,
    stripe_event_id: event.id,
  })
  if (insertError) return NextResponse.json({ error: 'Error interno' }, { status: 500 })

  return NextResponse.json({ received: true })
}
