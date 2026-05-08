'use client'
import Link from 'next/link'
import { useState } from 'react'
import { useAdminData } from '@/features/admin/hooks/useAdminData'
import ActividadesTab from '@/features/admin/components/ActividadesTab'
import HorariosTab from '@/features/admin/components/HorariosTab'
import ClasesPuntualesTab from '@/features/admin/components/ClasesPuntualesTab'
import SociosTab from '@/features/admin/components/SociosTab'
import PagosTab from '@/features/admin/components/PagosTab'
import { supabase } from '@/lib/supabase'
import { TIPOS_MEMBRESIA } from '@/lib/domain/membresias'
import { USER_FACING_ERRORS, normaliseUserFacingError } from '@/lib/ui/user-facing-errors'

const inputStyle = { width: '100%', background: '#181818', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '10px 14px', color: '#f0f0f0', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'system-ui' }

export default function AdminPage() {
  const { socios, gymId, stats, loading, error, loadSocios, logout } = useAdminData()
  const [tab, setTab] = useState('actividades')
  const [nuevoSocio, setNuevoSocio] = useState({ nombre: '', email: '', password: '', tipo_membresia: 'mensual' })
  const [msgSocio, setMsgSocio] = useState('')
  const [loadingSocio, setLoadingSocio] = useState(false)
  const adminTabs = [
    { key: 'actividades', label: 'Actividades' },
    { key: 'horarios', label: 'Horarios' },
    { key: 'puntuales', label: 'Puntuales' },
    { key: 'socios', label: 'Socios' },
    { key: 'pagos', label: 'Pagos' },
    { key: 'nuevo-socio', label: '+ Nuevo socio' },
  ]

  const registrarSocio = async () => {
    setMsgSocio(''); setLoadingSocio(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) { setMsgSocio(`❌ ${USER_FACING_ERRORS.sessionExpired}`); return }
      const res = await fetch('/api/register-socio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ ...nuevoSocio, gym_id: gymId }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setMsgSocio(`❌ ${normaliseUserFacingError(data?.error, 'No se ha podido registrar el socio. Revisa los datos e inténtalo de nuevo.')}`)
      }
      else {
        setMsgSocio('✅ Socio registrado correctamente')
        setNuevoSocio({ nombre: '', email: '', password: '', tipo_membresia: 'mensual' })
        await loadSocios()
      }
    } catch (error) { setMsgSocio(`❌ ${normaliseUserFacingError(error, USER_FACING_ERRORS.network)}`) }
    finally { setLoadingSocio(false) }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#888', fontFamily: 'system-ui' }}>Cargando...</p>
    </div>
  )

  if (error) return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ textAlign: 'center' }}><p style={{ color: '#ff5c5c', fontFamily: 'system-ui', marginBottom: '8px' }}>{USER_FACING_ERRORS.loadAdmin}</p><p style={{ color: '#9ca3af', fontFamily: 'system-ui', fontSize: '13px' }}>Vuelve a intentarlo en unos segundos.</p></div>
    </div>
  )

  const metricCards = [
    { title: 'Socios activos', value: stats.sociosActivos, color: '#c8f542', help: 'Socios con membresía vigente' },
    { title: 'Actividades activas', value: stats.actividadesActivas, color: '#5ca8ff', help: 'Disciplinas publicadas para reservar' },
    { title: 'Horarios activos', value: stats.horariosActivos, color: '#a855f7', help: 'Franjas semanales disponibles' },
    { title: 'Clases puntuales próximas', value: stats.puntualesProximas, color: '#ffb84d', help: 'Sesiones especiales aún por impartir' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', color: '#f0f0f0', fontFamily: 'system-ui' }}>

      {/* HEADER */}
      <div style={{ background: '#181818', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ fontSize: '20px', fontWeight: '800' }}>
          JGS <span style={{ color: '#c8f542' }}>Fight Team</span>
          <span style={{ color: '#888', fontSize: '13px', fontWeight: '500', marginLeft: '8px' }}>Admin</span>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '6px', fontWeight: '400' }}>Panel de gestión del gimnasio</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Link href="/demo" style={{ color: '#7dd3fc', fontSize: '13px', textDecoration: 'none' }}>Ver demo online</Link>
          <button onClick={logout} style={{ background: 'rgba(255,92,92,0.12)', color: '#ff5c5c', border: '1px solid rgba(255,92,92,0.2)', borderRadius: '8px', padding: '6px 14px', fontSize: '13px', cursor: 'pointer', fontFamily: 'system-ui' }}>Salir</button>
        </div>
      </div>

      {/* STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '10px', padding: '16px 20px' }}>
        {metricCards.map((metric) => (
          <div key={metric.title} style={{ background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '14px' }}>
            <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '6px', fontWeight: '500' }}>{metric.title}</div>
            <div style={{ fontSize: '30px', fontWeight: '800', color: metric.color }}>{metric.value}</div>
            <div style={{ fontSize: '12px', color: '#888', marginTop: '6px' }}>{metric.help}</div>
          </div>
        ))}
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '0 20px', overflowX: 'auto' }}>
        {adminTabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '500', color: tab === t.key ? '#c8f542' : '#888', borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderBottom: tab === t.key ? '2px solid #c8f542' : '2px solid transparent', cursor: 'pointer', background: 'none', fontFamily: 'system-ui', whiteSpace: 'nowrap' }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '16px 20px', paddingBottom: '40px' }}>

        {tab === 'actividades' && <ActividadesTab gymId={gymId} />}

        {tab === 'horarios' && <HorariosTab gymId={gymId} />}

        {tab === 'puntuales' && <ClasesPuntualesTab gymId={gymId} />}

        {tab === 'socios' && <SociosTab socios={socios} gymId={gymId} onRefreshSocios={loadSocios} />}

        {tab === 'pagos' && <PagosTab onSociosChange={loadSocios} />}

        {/* NUEVO SOCIO */}
        {tab === 'nuevo-socio' && (
          <div style={{ background: '#1a1a1a', border: '1px solid rgba(200,245,66,0.15)', borderRadius: '14px', padding: '16px' }}>
            <div style={{ marginBottom: '14px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800' }}>Registrar nuevo socio</h2>
              <p style={{ margin: '6px 0 0', color: '#9ca3af', fontSize: '13px' }}>Crea el acceso del socio y asigna su membresía inicial.</p>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', color: '#888', fontSize: '12px', marginBottom: '6px', fontWeight: '500' }}>NOMBRE</label>
              <input style={inputStyle} placeholder="Nombre completo" value={nuevoSocio.nombre} onChange={e => setNuevoSocio({ ...nuevoSocio, nombre: e.target.value })} />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', color: '#888', fontSize: '12px', marginBottom: '6px', fontWeight: '500' }}>EMAIL</label>
              <input type="email" style={inputStyle} placeholder="email@ejemplo.com" value={nuevoSocio.email} onChange={e => setNuevoSocio({ ...nuevoSocio, email: e.target.value })} />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', color: '#888', fontSize: '12px', marginBottom: '6px', fontWeight: '500' }}>CONTRASEÑA</label>
              <input type="password" style={inputStyle} placeholder="Mínimo 8 caracteres" value={nuevoSocio.password} onChange={e => setNuevoSocio({ ...nuevoSocio, password: e.target.value })} />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: '#888', fontSize: '12px', marginBottom: '6px', fontWeight: '500' }}>TIPO DE MEMBRESÍA</label>
              <select style={inputStyle} value={nuevoSocio.tipo_membresia} onChange={e => setNuevoSocio({ ...nuevoSocio, tipo_membresia: e.target.value })}>
                {TIPOS_MEMBRESIA.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            {msgSocio && (
              <div style={{ marginBottom: '12px', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', background: msgSocio.includes('✅') ? 'rgba(200,245,66,0.1)' : 'rgba(255,92,92,0.1)', color: msgSocio.includes('✅') ? '#c8f542' : '#ff5c5c', border: `1px solid ${msgSocio.includes('✅') ? 'rgba(200,245,66,0.2)' : 'rgba(255,92,92,0.2)'}` }}>
                {msgSocio}
              </div>
            )}
            <button onClick={registrarSocio} disabled={loadingSocio}
              style={{ background: '#c8f542', color: '#0f0f0f', border: 'none', borderRadius: '10px', padding: '13px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', width: '100%', fontFamily: 'system-ui', opacity: loadingSocio ? 0.6 : 1 }}>
              {loadingSocio ? 'Registrando...' : 'Registrar socio'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
