import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { IMPORTES, isTipoMembresia } from '@/lib/domain/membresias'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const appUrl = process.env.NEXT_PUBLIC_APP_URL
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null
const PAYMENT_ERROR_MESSAGE = 'No se ha podido iniciar el pago. Inténtalo de nuevo.'

export async function POST(req: Request) {
  try {
    if (!stripe || !stripeSecretKey || !appUrl || !supabaseUrl || !supabaseAnonKey) {
      console.error('[stripe/checkout] Missing required env configuration')
      return NextResponse.json({ error: PAYMENT_ERROR_MESSAGE }, { status: 500 })
    }

    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) return NextResponse.json({ error: PAYMENT_ERROR_MESSAGE }, { status: 401 })

    const { data: { user }, error: authError } = await createClient(supabaseUrl, supabaseAnonKey).auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: PAYMENT_ERROR_MESSAGE }, { status: 401 })

    const payload = await req.json().catch(() => null)
    const tipoMembresia = payload?.tipoMembresia
    if (!isTipoMembresia(tipoMembresia)) return NextResponse.json({ error: PAYMENT_ERROR_MESSAGE }, { status: 400 })

    const { data: perfil, error: perfilError } = await supabaseAdmin.from('perfiles').select('stripe_customer_id, nombre, gym_id').eq('id', user.id).single()
    if (perfilError || !perfil) {
      console.error('[stripe/checkout] Failed to load profile', perfilError?.message)
      return NextResponse.json({ error: PAYMENT_ERROR_MESSAGE }, { status: 500 })
    }

    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(user.id)
    const email = authUser?.user?.email || ''
    let customerId = perfil.stripe_customer_id as string | null
    if (!customerId) {
      const customer = await stripe.customers.create({ email, name: perfil.nombre || '', metadata: { supabase_user_id: user.id, source: 'fitapp' } })
      customerId = customer.id
      const { error: saveError } = await supabaseAdmin.from('perfiles').update({ stripe_customer_id: customerId }).eq('id', user.id)
      if (saveError) {
        console.error('[stripe/checkout] Failed to persist customer id', saveError.message)
        return NextResponse.json({ error: PAYMENT_ERROR_MESSAGE }, { status: 500 })
      }
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price_data: { currency: 'eur', product_data: { name: `Membresía ${tipoMembresia}` }, unit_amount: Math.round(IMPORTES[tipoMembresia] * 100) }, quantity: 1 }],
      mode: 'payment',
      success_url: `${appUrl}/socio?pago=ok`,
      cancel_url: `${appUrl}/socio?pago=cancel`,
      metadata: {
        supabase_user_id: user.id,
        gym_id: perfil.gym_id || '',
        tipo_membresia: tipoMembresia,
        source: 'fitapp',
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('[stripe/checkout] Unexpected error', error instanceof Error ? error.message : 'unknown')
    return NextResponse.json({ error: PAYMENT_ERROR_MESSAGE }, { status: 500 })
  }
}
