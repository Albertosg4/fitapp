import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const PRECIOS: Record<string, { amount: number; label: string }> = {
  mensual:    { amount: 4999,  label: 'Membresía Mensual' },
  trimestral: { amount: 12999, label: 'Membresía Trimestral' },
  semestral:  { amount: 22999, label: 'Membresía Semestral' },
  anual:      { amount: 39999, label: 'Membresía Anual' },
}

export async function POST(req: Request) {
  try {
    // 1. Validar Authorization: Bearer <token>
    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // 2. Validar token con Supabase y obtener userId de la sesión
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 401 })
    }
    const userId = user.id

    // 3. Validar payload — solo tipoMembresia viene del cliente
    const body = await req.json()
    const { tipoMembresia } = body

    if (!tipoMembresia) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
    }

    const precio = PRECIOS[tipoMembresia]
    if (!precio) {
      return NextResponse.json({ error: 'Tipo de membresía inválido' }, { status: 400 })
    }

    // 4. Leer perfil y email desde servidor — nunca del cliente
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

    // 5. Construir URLs en servidor — nunca aceptarlas del cliente
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
    const successUrl = `${appUrl}/socio?pago=ok`
    const cancelUrl  = `${appUrl}/socio?pago=cancel`

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price_data: { currency: 'eur', product_data: { name: precio.label }, unit_amount: precio.amount }, quantity: 1 }],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { supabase_user_id: userId, tipo_membresia: tipoMembresia },
    })

    return NextResponse.json({ url: session.url })

  } catch (err: unknown) {
    console.error('[stripe/checkout]', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
