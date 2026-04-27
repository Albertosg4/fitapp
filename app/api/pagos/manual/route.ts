import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import {
  TIPOS_MEMBRESIA_VALUES,
  METODOS_PAGO_VALUES,
  ESTADOS_PAGO_VALUES,
  IMPORTES,
  MESES_POR_TIPO,
  calcularNuevaFechaVencimiento,
  type TipoMembresia,
  type MetodoPago,
  type EstadoPago,
} from '@/lib/domain/membresias'

export async function POST(req: Request) {
  const result = await requireAdmin(req)
  if (result.error) return result.error
  const { gymId } = result.context

  try {
    const body = await req.json()
    const { userId, tipoMembresia, metodo, estado, notas } = body as {
      userId: string
      tipoMembresia: string
      metodo: string
      estado: string
      notas?: string
    }

    // Validaciones estrictas — sin defaults silenciosos
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'userId requerido' }, { status: 400 })
    }
    if (!TIPOS_MEMBRESIA_VALUES.includes(tipoMembresia as TipoMembresia)) {
      return NextResponse.json(
        { error: `tipoMembresia inválido. Valores permitidos: ${TIPOS_MEMBRESIA_VALUES.join(', ')}` },
        { status: 400 }
      )
    }
    if (!METODOS_PAGO_VALUES.includes(metodo as MetodoPago)) {
      return NextResponse.json(
        { error: `metodo inválido. Valores permitidos: ${METODOS_PAGO_VALUES.join(', ')}` },
        { status: 400 }
      )
    }
    // Si es cortesía, forzar estado pagado; si no, validar estado recibido
    const esCortesia = metodo === 'cortesia'
    const estadoFinal: EstadoPago = esCortesia
      ? 'pagado'
      : ESTADOS_PAGO_VALUES.includes(estado as EstadoPago)
        ? (estado as EstadoPago)
        : (() => { throw new Error(`estado inválido. Valores permitidos: ${ESTADOS_PAGO_VALUES.join(', ')}`) })()

    // Verificar que el socio pertenece al mismo gymId del admin
    const { data: socioPerfil, error: socioError } = await supabaseAdmin
      .from('perfiles')
      .select('id, gym_id, membresia_vence')
      .eq('id', userId)
      .single()

    if (socioError || !socioPerfil) {
      return NextResponse.json({ error: 'Socio no encontrado' }, { status: 404 })
    }
    if (socioPerfil.gym_id !== gymId) {
      return NextResponse.json({ error: 'Prohibido: el socio no pertenece a tu gimnasio' }, { status: 403 })
    }

    // Importes y duración desde fuente única
    const tipo = tipoMembresia as TipoMembresia
    const meses = MESES_POR_TIPO[tipo]
    const importe = esCortesia ? 0 : IMPORTES[tipo]

    let nuevaFecha: string | null = null
    if (estadoFinal === 'pagado') {
      nuevaFecha = calcularNuevaFechaVencimiento(tipo, socioPerfil.membresia_vence)
      await supabaseAdmin.from('perfiles').update({
        membresia_activa: true,
        membresia_vence: nuevaFecha,
        tipo_membresia: tipo,
      }).eq('id', userId)
    }

    const { data: pago, error } = await supabaseAdmin.from('pagos').insert({
      user_id: userId,
      gym_id: gymId,      // siempre del token
      importe,
      tipo_membresia: tipo,
      meses,
      metodo,
      estado: estadoFinal,
      notas: notas || null,
    }).select().single()

    if (error) throw error
    return NextResponse.json({
      ok: true,
      pago,
      membresiaActualizada: estadoFinal === 'pagado',
      nuevaFecha,
      tipoMembresia: estadoFinal === 'pagado' ? tipo : null,
    })

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error interno'
    console.error('[pagos/manual POST]', msg)
    // Distinguir errores de validación (400) de errores de servidor (500)
    const isValidationError = msg.includes('inválido') || msg.includes('permitidos')
    return NextResponse.json({ error: msg }, { status: isValidationError ? 400 : 500 })
  }
}

export async function PATCH(req: Request) {
  const result = await requireAdmin(req)
  if (result.error) return result.error
  const { gymId } = result.context

  try {
    const { pagoId } = await req.json()
    if (!pagoId || typeof pagoId !== 'string') {
      return NextResponse.json({ error: 'pagoId requerido' }, { status: 400 })
    }

    // Verificar que el pago pertenece al gymId del admin
    const { data: pago } = await supabaseAdmin
      .from('pagos')
      .select('*')
      .eq('id', pagoId)
      .single()

    if (!pago) return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 })
    if (pago.gym_id !== gymId) {
      return NextResponse.json({ error: 'Prohibido: el pago no pertenece a tu gimnasio' }, { status: 403 })
    }

    await supabaseAdmin
      .from('pagos')
      .update({ estado: 'pagado', fecha_pago: new Date().toISOString() })
      .eq('id', pagoId)

    const { data: perfil } = await supabaseAdmin
      .from('perfiles').select('membresia_vence').eq('id', pago.user_id).single()

    const tipoPago = pago.tipo_membresia as TipoMembresia
    const nuevaFecha = calcularNuevaFechaVencimiento(tipoPago, perfil?.membresia_vence)

    await supabaseAdmin.from('perfiles').update({
      membresia_activa: true,
      membresia_vence: nuevaFecha,
      tipo_membresia: tipoPago,
    }).eq('id', pago.user_id)

    return NextResponse.json({
      ok: true,
      nuevaFecha,
      tipoMembresia: tipoPago,
      membresiaActualizada: true,
    })

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error interno'
    console.error('[pagos/manual PATCH]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
