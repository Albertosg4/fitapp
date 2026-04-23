'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function CheckinInner() {
  const params = useSearchParams()
  const token = params.get('token')
  const [estado, setEstado] = useState<'loading' | 'ok' | 'error'>('loading')
  const [nombre, setNombre] = useState('')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (!token) { setEstado('error'); setMsg('Token inválido'); return }
    procesarCheckin(token)
  }, [token])

  const procesarCheckin = async (qrToken: string) => {
    // 1. Buscar perfil por qr_token
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('*')
      .eq('qr_token', qrToken)
      .maybeSingle()

    if (!perfil) { setEstado('error'); setMsg('QR no reconocido'); return }
    setNombre(perfil.nombre || 'Socio')

    // 2. Verificar membresía
    if (!perfil.membresia_activa) { setEstado('error'); setMsg('Membresía no activa'); return }

    // 3. Buscar reserva confirmada de hoy
    const hoy = new Date().toISOString().split('T')[0]
    const { data: sesionesHoy } = await supabase
      .from('sesiones')
      .select('id')
      .eq('fecha', hoy)

    const sesionIds = (sesionesHoy || []).map((s: any) => s.id)

    let reservaId = null
    if (sesionIds.length > 0) {
      const { data: reserva } = await supabase
        .from('reservas')
        .select('id')
        .eq('user_id', perfil.id)
        .eq('estado', 'confirmada')
        .in('sesion_id', sesionIds)
        .maybeSingle()

      reservaId = reserva?.id || null
    }

    if (!reservaId) {
      // Sin reserva pero membresía activa → acceso libre
      setEstado('ok')
      setMsg('Acceso permitido · Sin reserva hoy')
      return
    }

    // 4. Comprobar si ya hizo check-in
    const { data: yaCheckin } = await supabase
      .from('asistencia')
      .select('id')
      .eq('reserva_id', reservaId)
      .maybeSingle()

    if (yaCheckin) {
      setEstado('ok')
      setMsg('Check-in ya registrado anteriormente')
      return
    }

    // 5. Registrar asistencia
    await supabase.from('asistencia').insert({ reserva_id: reservaId, metodo: 'qr' })
    setEstado('ok')
    setMsg('Check-in registrado ✅')
  }

  const bg = estado === 'loading' ? '#0f0f0f' : estado === 'ok' ? '#1a2a0a' : '#2a0a0a'
  const color = estado === 'ok' ? '#c8f542' : '#ff5c5c'
  const emoji = estado === 'loading' ? '⏳' : estado === 'ok' ? '✅' : '❌'

  return (
    <div style={{
      minHeight: '100vh', background: bg, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui', padding: '24px', textAlign: 'center'
    }}>
      <div style={{ fontSize: '80px', marginBottom: '24px' }}>{emoji}</div>
      {nombre && <div style={{ fontSize: '28px', fontWeight: '800', color: '#f0f0f0', marginBottom: '8px' }}>{nombre}</div>}
      <div style={{ fontSize: '16px', color, fontWeight: '600' }}>{msg}</div>
    </div>
  )
}

export default function CheckinPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#888', fontFamily: 'system-ui' }}>Cargando...</p>
      </div>
    }>
      <CheckinInner />
    </Suspense>
  )
}