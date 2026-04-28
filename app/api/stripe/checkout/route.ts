import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@supabase/supabase-js'
import {
  TIPOS_MEMBRESIA_VALUES,
  IMPORTES,
  type TipoMembresia,
} from '@/lib/domain/membresias'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const appUrl = process.env.NEXT_PUBLIC_APP_URL
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null

export async function POST(req: Request) {
  try {
    if (!stripeSecretKey || !stripe) {
      console.error('[stripe/checkout] Missing env: STRIPE_SECRET_KEY')
      return NextResponse.json({ error: 'Configuración Stripe incompleta' }, { status: 500 })
    }
    if (!appUrl) {
      console.error('[stripe/checkout] Missing env: NEXT_PUBLIC_APP_URL')
      return NextResponse.json({ error: 'Configuración de app incompleta' }, { status: 500 })
    }
    if (!supabaseUrl) {
      console.error('[stripe/checkout] Missing env: NEXT_PUBLIC_SUPABASE_URL')
      return NextResponse.json({ error: 'Configuración Supabase incompleta' }, { status: 500 })
    }
    if (!supabaseAnonKey) {
      console.error('[stripe/checkout] Missing env: NEXT_PUBLIC_SUPABASE_ANON_KEY')
      return NextResponse.json({ error: 'Configuración Supabase incompleta' }, { status: 500 })
    }

    // 1. Validar Authorization: Bearer <token>
    const authHeader = req.headers.get('authorization') || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // 2. Validar token con Supabase y obtener userId de la sesión
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Token inválido o expirado' }, { status: 401 })
    }
    const userId = user.id

    // 3. Validar payload — solo tipoMembresia viene del cliente
    const body = await req.json()
    const { tipoMembresia } = body as { tipoMembresia?: string }

    if (!TIPOS_MEMBRESIA_VALUES.includes(tipoMembresia as TipoMembresia)) {
      return NextResponse.json(
        { error: `Tipo de membresía inválido. Valores permitidos: ${TIPOS_MEMBRESIA_VALUES.join(', ')}` },
        { status: 400 }
      )
    }

    const tipo = tipoMembresia as TipoMembresia
    const amount = Math.round(IMPORTES[tipo] * 100)
    const productName = `Membresía ${tipo.charAt(0).toUpperCase()}${tipo.slice(1)}`

    // 4. Leer perfil y email desde servidor — nunca del cliente
    const { data: perfil, error: perfilError } = await supabaseAdmin
      .from('perfiles').select('stripe_customer_id, nombre').eq('id', userId).single()

    if (perfilError || !perfil) {
      console.error('[stripe/checkout] Error loading profile:', perfilError?.message || 'Perfil no encontrado')
      return NextResponse.json({ error: 'No se pudo cargar el perfil del usuario' }, { status: 500 })
    }

    const { data: authUser, error: authUserError } = await supabaseAdmin.auth.admin.getUserById(userId)
    if (authUserError) {
      console.error('[stripe/checkout] Error loading auth user:', authUserError.message)
      return NextResponse.json({ error: 'No se pudo cargar la cuenta del usuario' }, { status: 500 })
    }

    const email = authUser?.user?.email || ''
    let customerId = perfil.stripe_customer_id as string | null

    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        name: perfil.nombre || '',
        metadata: { supabase_user_id: userId },
      })

      customerId = customer.id
      const { error: customerSaveError } = await supabaseAdmin
        .from('perfiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId)

      if (customerSaveError) {
        console.error('[stripe/checkout] Error saving stripe_customer_id:', customerSaveError.message)
        return NextResponse.json({ error: 'No se pudo vincular el cliente de Stripe' }, { status: 500 })
      }
    }

    // 5. Construir URLs en servidor — nunca aceptarlas del cliente
    const successUrl = `${appUrl}/socio?pago=ok`
    const cancelUrl = `${appUrl}/socio?pago=cancel`

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: { name: productName },
          unit_amount: amount,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { supabase_user_id: userId, tipo_membresia: tipo },
    })

    return NextResponse.json({ url: session.url })

  } catch (err: unknown) {
    console.error('[stripe/checkout]', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
