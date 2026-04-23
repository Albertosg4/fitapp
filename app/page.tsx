'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email o contraseña incorrectos')
      setLoading(false)
      return
    }

    // Obtener rol del usuario
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', data.user.id)
      .single()

    if (perfil?.rol === 'admin') {
      router.push('/admin')
    } else {
      router.push('/socio')
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#0f0f0f', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '20px'
    }}>
      <div style={{
        background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '20px', padding: '40px 32px', width: '100%', maxWidth: '380px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{
            fontFamily: 'system-ui', fontSize: '28px', fontWeight: '800',
            color: '#f0f0f0', letterSpacing: '-1px'
          }}>
            JGS<span style={{ color: '#c8f542' }}>Fight Team</span>
          </h1>
          <p style={{ color: '#888', fontSize: '14px', marginTop: '6px' }}>
            Accede a tu cuenta
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', color: '#888', fontSize: '12px', marginBottom: '6px', fontWeight: '500' }}>
              EMAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{
                width: '100%', background: '#181818', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '10px', padding: '12px 14px', color: '#f0f0f0',
                fontSize: '14px', outline: 'none', boxSizing: 'border-box'
              }}
              placeholder="tu@email.com"
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', color: '#888', fontSize: '12px', marginBottom: '6px', fontWeight: '500' }}>
              CONTRASEÑA
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{
                width: '100%', background: '#181818', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '10px', padding: '12px 14px', color: '#f0f0f0',
                fontSize: '14px', outline: 'none', boxSizing: 'border-box'
              }}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p style={{
              background: 'rgba(255,92,92,0.1)', border: '1px solid rgba(255,92,92,0.2)',
              borderRadius: '8px', padding: '10px 14px', color: '#ff5c5c',
              fontSize: '13px', marginBottom: '16px'
            }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', background: loading ? '#888' : '#c8f542',
              color: '#0f0f0f', border: 'none', borderRadius: '10px',
              padding: '13px', fontSize: '14px', fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}