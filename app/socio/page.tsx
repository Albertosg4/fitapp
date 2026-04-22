'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function SocioPage() {
  const [perfil, setPerfil] = useState<any>(null)
  const [clases, setClases] = useState<any[]>([])
  const [reservas, setReservas] = useState<string[]>([])
  const [tab, setTab] = useState('clases')
  const [diaIdx, setDiaIdx] = useState(0)
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<any>(null)
  const router = useRouter()

  const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
  const diasCorto = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

  useEffect(() => {
    const today = (new Date().getDay() + 6) % 7
    setDiaIdx(today)
    init()
  }, [])

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }

    const { data: p } = await supabase.from('perfiles').select('*').eq('id', user.id).single()
    setPerfil(p)

    const { data: c } = await supabase.from('clases').select('*').eq('activa', true).order('dia_semana').order('hora_inicio')
    setClases(c || [])

    setLoading(false)
  }

  const reservar = async (claseId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    if (reservas.includes(claseId)) {
      setReservas(reservas.filter(r => r !== claseId))
    } else {
      setReservas([...reservas, claseId])
    }
    setModal(null)
  }

  const logout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const clasesDia = clases.filter(c => c.dia_semana === diaIdx)

  const inputStyle = {
    padding: '10px 16px',
    borderRadius: '40px',
    border: 'none',
    fontSize: '13px',
    fontWeight: '500' as const,
    cursor: 'pointer',
    fontFamily: 'system-ui'
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#888', fontFamily: 'system-ui' }}>Cargando...</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', color: '#f0f0f0', fontFamily: 'system-ui', paddingBottom: '80px' }}>

      {/* Header */}
      {tab === 'clases' && (
        <div style={{ background: 'linear-gradient(160deg, #1a2a0a 0%, #0f0f0f 60%)', padding: '28px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ fontSize: '13px', color: '#888' }}>Buenos días,</div>
          <div style={{ fontSize: '22px', fontWeight: '800' }}>
            {perfil?.nombre || 'Socio'} <span style={{ color: '#c8f542' }}>👋</span>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '10px', background: 'rgba(200,245,66,0.1)', border: '1px solid rgba(200,245,66,0.2)', borderRadius: '20px', padding: '4px 12px', fontSize: '12px', color: '#c8f542' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#c8f542', display: 'inline-block' }}></span>
            {perfil?.tipo_membresia || 'Básica'} · Activa
          </div>
        </div>
      )}

      {tab === 'qr' && (
        <div style={{ background: '#181818', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: '800' }}>Mi acceso</div>
        </div>
      )}

      {tab === 'perfil' && (
        <div style={{ background: '#181818', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: '800' }}>Mi perfil</div>
          <button onClick={logout} style={{ background: 'rgba(255,92,92,0.12)', color: '#ff5c5c', border: '1px solid rgba(255,92,92,0.2)', borderRadius: '8px', padding: '6px 14px', fontSize: '13px', cursor: 'pointer', fontFamily: 'system-ui' }}>Salir</button>
        </div>
      )}

      {/* TAB CLASES */}
      {tab === 'clases' && (
        <div style={{ padding: '20px' }}>
          <div style={{ fontSize: '11px', color: '#888', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>Horario</div>

          {/* Selector días */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', marginBottom: '20px', scrollbarWidth: 'none' }}>
            {diasCorto.map((d, i) => {
              const fecha = new Date()
              const todayIdx = (new Date().getDay() + 6) % 7
              fecha.setDate(fecha.getDate() - todayIdx + i)
              return (
                <button
                  key={i}
                  onClick={() => setDiaIdx(i)}
                  style={{
                    flexShrink: 0,
                    display: 'flex',
                    flexDirection: 'column' as const,
                    alignItems: 'center',
                    gap: '2px',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid',
                    borderColor: diaIdx === i ? '#c8f542' : 'rgba(255,255,255,0.07)',
                    background: diaIdx === i ? '#c8f542' : '#1e1e1e',
                    cursor: 'pointer',
                    fontFamily: 'system-ui'
                  }}
                >
                  <span style={{ fontSize: '11px', color: diaIdx === i ? '#0f0f0f' : '#888', fontWeight: '500' }}>{d}</span>
                  <span style={{ fontSize: '17px', fontWeight: '800', color: diaIdx === i ? '#0f0f0f' : '#f0f0f0' }}>{fecha.getDate()}</span>
                </button>
              )
            })}
          </div>

          {/* Lista clases */}
          {clasesDia.length === 0 ? (
            <p style={{ color: '#888', textAlign: 'center', padding: '40px 0' }}>Sin clases este día</p>
          ) : clasesDia.map(c => {
            const reservada = reservas.includes(c.id)
            return (
              <div
                key={c.id}
                onClick={() => setModal(c)}
                style={{
                  background: '#1e1e1e',
                  border: `1px solid ${reservada ? 'rgba(200,245,66,0.4)' : 'rgba(255,255,255,0.07)'}`,
                  borderLeft: reservada ? '3px solid #c8f542' : '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '12px',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <div style={{ fontSize: '17px', fontWeight: '700' }}>{c.nombre}</div>
                    <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{c.hora_inicio} · {c.duracion_min} min</div>
                  </div>
                  <span style={{
                    fontSize: '11px', fontWeight: '600', borderRadius: '20px', padding: '3px 10px',
                    background: reservada ? 'rgba(200,245,66,0.15)' : 'rgba(255,255,255,0.07)',
                    color: reservada ? '#c8f542' : '#888'
                  }}>
                    {reservada ? '✓ Reservada' : `${c.aforo_max} plazas`}
                  </span>
                </div>
                <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: reservada ? '60%' : '30%', background: '#c8f542', borderRadius: '2px' }}></div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* TAB QR */}
      {tab === 'qr' && (
        <div style={{ padding: '32px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: '#888', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '20px' }}>Tu acceso</div>
          <div style={{ background: 'white', borderRadius: '20px', padding: '24px', margin: '0 auto 20px', width: '200px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="152" height="152" viewBox="0 0 100 100">
              <rect x="5" y="5" width="35" height="35" rx="3" fill="none" stroke="#000" strokeWidth="3"/>
              <rect x="12" y="12" width="21" height="21" rx="1" fill="#000"/>
              <rect x="60" y="5" width="35" height="35" rx="3" fill="none" stroke="#000" strokeWidth="3"/>
              <rect x="67" y="12" width="21" height="21" rx="1" fill="#000"/>
              <rect x="5" y="60" width="35" height="35" rx="3" fill="none" stroke="#000" strokeWidth="3"/>
              <rect x="12" y="67" width="21" height="21" rx="1" fill="#000"/>
              <rect x="45" y="5" width="8" height="8" fill="#000"/><rect x="45" y="17" width="8" height="8" fill="#000"/>
              <rect x="45" y="29" width="8" height="8" fill="#000"/><rect x="57" y="45" width="8" height="8" fill="#000"/>
              <rect x="69" y="45" width="8" height="8" fill="#000"/><rect x="81" y="45" width="8" height="8" fill="#000"/>
              <rect x="45" y="57" width="8" height="8" fill="#000"/><rect x="57" y="57" width="8" height="8" fill="#000"/>
              <rect x="69" y="69" width="8" height="8" fill="#000"/><rect x="81" y="69" width="8" height="8" fill="#000"/>
              <rect x="57" y="81" width="8" height="8" fill="#000"/><rect x="81" y="81" width="8" height="8" fill="#000"/>
              <rect x="45" y="45" width="8" height="8" fill="#c8f542"/>
            </svg>
          </div>
          <div style={{ fontSize: '13px', color: '#888', marginBottom: '4px' }}>Tu identificador</div>
          <div style={{ fontFamily: 'monospace', fontSize: '22px', fontWeight: '800', color: '#c8f542', letterSpacing: '3px' }}>
            FIT-{perfil?.qr_token?.slice(0, 4).toUpperCase() || '0000'}
          </div>
          <p style={{ fontSize: '13px', color: '#888', marginTop: '16px', lineHeight: '1.6' }}>
            Muestra este QR al entrar al gym<br />o al hacer check-in en una clase
          </p>
        </div>
      )}

      {/* TAB PERFIL */}
      {tab === 'perfil' && (
        <div>
          <div style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, #c8f542, #42f5b3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '800', color: '#0f0f0f', flexShrink: 0 }}>
              {(perfil?.nombre || 'S').charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: '800' }}>{perfil?.nombre || 'Socio'}</div>
              <div style={{ fontSize: '13px', color: '#888', marginTop: '2px' }}>{perfil?.telefono || 'Sin teléfono'}</div>
            </div>
          </div>

          <div style={{ margin: '16px 20px', background: 'linear-gradient(135deg, #1a2a0a, #162210)', border: '1px solid rgba(200,245,66,0.2)', borderRadius: '14px', padding: '18px' }}>
            <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Membresía activa</div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#c8f542' }}>{perfil?.tipo_membresia || 'Básica'}</div>
            <div style={{ fontSize: '12px', color: '#42f5b3', marginTop: '8px' }}>
              ✓ Válida hasta {perfil?.membresia_vence || 'N/A'}
            </div>
          </div>

          <div style={{ padding: '0 20px' }}>
            <div style={{ fontSize: '11px', color: '#888', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>Clases reservadas</div>
            {reservas.length === 0 ? (
              <p style={{ color: '#888', fontSize: '13px' }}>No tienes reservas activas.</p>
            ) : reservas.map(rid => {
              const c = clases.find(x => x.id === rid)
              if (!c) return null
              return (
                <div key={rid} style={{ background: '#1e1e1e', border: '1px solid rgba(200,245,66,0.2)', borderRadius: '10px', padding: '12px 14px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '14px' }}>{c.nombre}</div>
                    <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{dias[c.dia_semana]} · {c.hora_inicio}</div>
                  </div>
                  <span style={{ fontSize: '11px', background: 'rgba(200,245,66,0.12)', color: '#c8f542', padding: '3px 10px', borderRadius: '20px' }}>✓</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Modal reserva */}
      {modal && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setModal(null) }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
        >
          <div style={{ background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '24px 24px 0 0', padding: '24px 20px 36px', width: '100%', maxWidth: '480px' }}>
            <div style={{ width: '36px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', margin: '0 auto 20px' }}></div>
            <div style={{ fontSize: '22px', fontWeight: '800', marginBottom: '4px' }}>{modal.nombre}</div>
            <div style={{ fontSize: '13px', color: '#888', marginBottom: '20px' }}>{dias[modal.dia_semana]} · {modal.hora_inicio} · {modal.duracion_min} min</div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '13px' }}>
                <span style={{ color: '#888' }}>Aforo</span><span>{modal.aforo_max} plazas</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '13px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                <span style={{ color: '#888' }}>Estado</span>
                <span style={{ color: reservas.includes(modal.id) ? '#c8f542' : '#888' }}>
                  {reservas.includes(modal.id) ? '✓ Reservada' : 'No reservada'}
                </span>
              </div>
            </div>
            <button
              onClick={() => reservar(modal.id)}
              style={{
                width: '100%', border: 'none', borderRadius: '12px', padding: '14px',
                fontSize: '15px', fontWeight: '700', cursor: 'pointer', fontFamily: 'system-ui',
                background: reservas.includes(modal.id) ? 'rgba(255,92,92,0.12)' : '#c8f542',
                color: reservas.includes(modal.id) ? '#ff5c5c' : '#0f0f0f'
              }}
            >
              {reservas.includes(modal.id) ? 'Cancelar reserva' : 'Reservar plaza'}
            </button>
          </div>
        </div>
      )}

      {/* Bottom nav */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(18,18,18,0.95)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-around', padding: '10px 0 20px' }}>
        {[
          { key: 'clases', icon: '🗓', label: 'Clases' },
          { key: 'qr', icon: '⬛', label: 'Mi QR' },
          { key: 'perfil', icon: '👤', label: 'Perfil' }
        ].map(n => (
          <button
            key={n.key}
            onClick={() => setTab(n.key)}
            style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '3px', cursor: 'pointer', padding: '4px 20px', borderRadius: '10px', border: 'none', background: 'transparent', fontFamily: 'system-ui', color: tab === n.key ? '#c8f542' : '#888' }}
          >
            <span style={{ fontSize: '20px' }}>{n.icon}</span>
            <span style={{ fontSize: '10px', fontWeight: '500' }}>{n.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}