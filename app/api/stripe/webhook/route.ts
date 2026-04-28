import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase/admin'
import {
  TIPOS_MEMBRESIA_VALUES,
  IMPORTES,
  MESES_POR_TIPO,
  calcularNuevaFechaVencimiento,
  type TipoMembresia,
} from '@/lib/domain/membresias'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null

export async function POST(req: Request) {
  if (!stripeSecretKey || !stripe) {
    console.error('[stripe/webhook] Missing env: STRIPE_SECRET_KEY')
    return NextResponse.json({ error: 'Configuración Stripe incompleta' }, { status: 500 })
  }

  if (!stripeWebhookSecret) {
    console.error('[stripe/webhook] Missing env: STRIPE_WEBHOOK_SECRET')
    return NextResponse.json({ error: 'Webhook de Stripe no configurado' }, { status: 500 })
  }

  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    console.error('[stripe/webhook] Missing stripe-signature header')
    return NextResponse.json({ error: 'Missing signature header' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, stripeWebhookSecret)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Invalid signature'
    console.error('[stripe/webhook] Signature error:', msg)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const userId = session.metadata?.supabase_user_id
    const tipoRaw = session.metadata?.tipo_membresia

    if (!userId || typeof userId !== 'string') {
      console.error('[stripe/webhook] Invalid metadata: missing supabase_user_id')
      return NextResponse.json({ error: 'Metadata incompleta: userId' }, { status: 400 })
    }

    if (!TIPOS_MEMBRESIA_VALUES.includes(tipoRaw as TipoMembresia)) {
      console.error('[stripe/webhook] Invalid metadata: tipo_membresia', tipoRaw)
      return NextResponse.json({ error: 'Metadata inválida: tipo_membresia' }, { status: 400 })
    }

    const tipo = tipoRaw as TipoMembresia

    // Idempotencia: ignorar evento si el pago ya fue registrado
    const stripePaymentId = (session.payment_intent as string) || session.id
    if (!stripePaymentId || typeof stripePaymentId !== 'string') {
      console.error('[stripe/webhook] Missing payment identifier')
      return NextResponse.json({ error: 'Payment id inválido' }, { status: 400 })
    }

    const { data: pagoExistente, error: pagoExistenteError } = await supabaseAdmin
      .from('pagos')
      .select('id')
      .eq('stripe_payment_id', stripePaymentId)
      .maybeSingle()

    if (pagoExistenteError) {
      console.error('[stripe/webhook] Error checking idempotency:', pagoExistenteError.message)
      return NextResponse.json({ error: 'Error verificando idempotencia' }, { status: 500 })
    }

    if (pagoExistente) {
      console.log(`[stripe/webhook] Evento duplicado ignorado: ${stripePaymentId}`)
      return NextResponse.json({ received: true })
    }

    const { data: perfil, error: perfilError } = await supabaseAdmin
      .from('perfiles')
      .select('membresia_vence, gym_id')
      .eq('id', userId)
      .single()

    if (perfilError || !perfil) {
      console.error('[stripe/webhook] Error loading profile:', perfilError?.message || 'Perfil no encontrado')
      return NextResponse.json({ error: 'Perfil no encontrado para el pago' }, { status: 404 })
    }

    if (!perfil.gym_id) {
      console.error(`[stripe/webhook] Missing gym_id for user ${userId}`)
      return NextResponse.json({ error: 'Perfil sin gym_id; no se puede registrar pago' }, { status: 500 })
    }

    const meses = MESES_POR_TIPO[tipo]
    const importe = IMPORTES[tipo]
    const nuevaFecha = calcularNuevaFechaVencimiento(tipo, perfil.membresia_vence)

    const { error: updateError } = await supabaseAdmin
      .from('perfiles')
      .update({
        membresia_activa: true,
        membresia_vence: nuevaFecha,
        tipo_membresia: tipo,
      })
      .eq('id', userId)

    if (updateError) {
      console.error('[stripe/webhook] Error updating profile:', updateError.message)
      return NextResponse.json({ error: 'No se pudo actualizar la membresía' }, { status: 500 })
    }

    const { error: insertError } = await supabaseAdmin.from('pagos').insert({
      user_id: userId,
      gym_id: perfil.gym_id,
      importe,
      tipo_membresia: tipo,
      meses,
      metodo: 'stripe',
      estado: 'pagado',
      stripe_payment_id: stripePaymentId,
    })

    if (insertError) {
      console.error('[stripe/webhook] Error inserting payment:', insertError.message)
      return NextResponse.json({ error: 'No se pudo registrar el pago' }, { status: 500 })
    }

    console.log(`[stripe/webhook] Pago registrado: ${userId} → ${tipo} hasta ${nuevaFecha}`)
  }

  return NextResponse.json({ received: true })
}
