import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase/admin'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const PRECIOS: Record<string, { amount: number; label: string }> = {
  mensual:    { amount: 4999,  label: 'Membresía Mensual' },
  trimestral: { amount: 12999, label: 'Membresía Trimestral' },
  semestral:  { amount: 22999, label: 'Membresía Semestral' },
  anual:      { amount: 39999, label: 'Membresía Anual' },
}

export async function POST(req: Request) {
  try {
    const { userId, tipoMembresia, successUrl, cancelUrl } = await req.json()

    if (!userId || !tipoMembresia) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
    }

    const precio = PRECIOS[tipoMembresia]
    if (!precio) {
      return NextResponse.json({ error: 'Tipo de membresía inválido' }, { status: 400 })
    }

    const { data: perfil } = await supabaseAdmin
      .from('perfiles').select('stripe_customer_id, nombre').eq('id', userId).single()

    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId)
    const email = authUser?.user?.email || ''

    let customerId = perfil?.stripe_customer_id as string | undefined

    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        name: perfil?.nombre || '',
        metadata: { supabase_user_id: userId },
      })
      customerId = customer.id
      await supabaseAdmin.from('perfiles').update({ stripe_customer_id: customerId }).eq('id', userId)
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price_data: { currency: 'eur', product_data: { name: precio.label }, unit_amount: precio.amount }, quantity: 1 }],
      mode: 'payment',
      success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/socio?pago=ok`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/socio?pago=cancel`,
      metadata: { supabase_user_id: userId, tipo_membresia: tipoMembresia },
    })

    return NextResponse.json({ url: session.url })

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error interno'
    console.error('[stripe/checkout]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
