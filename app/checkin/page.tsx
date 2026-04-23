'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

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
    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: qrToken }),
      })

      const data = await res.json()

      if (!res.ok) {
        setNombre(data.nombre || '')
        setEstado('error')
        setMsg(data.error || 'Error al procesar el check-in')
        return
      }

      setNombre(data.nombre || '')
      setEstado('ok')
      setMsg(data.msg || 'Check-in registrado ✅')

    } catch (err) {
      setEstado('error')
      setMsg('Error de conexión')
    }
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