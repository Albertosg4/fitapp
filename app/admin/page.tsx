'use client'
import { useState } from 'react'
import { useAdminData } from '@/features/admin/hooks/useAdminData'
import ClasesTab from '@/features/admin/components/ClasesTab'
import SociosTab from '@/features/admin/components/SociosTab'
import PagosTab from '@/features/admin/components/PagosTab'
import ActividadesTab from '@/features/admin/components/ActividadesTab'
import HorariosTab from '@/features/admin/components/HorariosTab'
import ClasesPuntualesTab from '@/features/admin/components/ClasesPuntualesTab'
import { supabase } from '@/lib/supabase'
import { TIPOS_MEMBRESIA } from '@/lib/domain/membresias'
import type { Clase } from '@/types/domain'

const inputStyle = { width: '100%', background: '#181818', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '10px 14px', color: '#f0f0f0', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'system-ui' }
const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

export default function AdminPage() {
  const { clases, socios, gymId, loading, error, loadSocios, crearClase, eliminarClase, logout } = useAdminData()
  const [tab, setTab] = useState('clases')

  const [nueva, setNueva] = useState<Omit<Clase, 'id' | 'gym_id' | 'activa'>>({
    nombre: '', dia_semana: 0, hora_inicio: '07:00', duracion_min: 60, aforo_max: 15,
  })
  const [nuevoSocio, setNuevoSocio] = useState({ nombre: '', email: '', password: '', tipo_membresia: 'mensual' })
  const [msgSocio, setMsgSocio] = useState('')
  const [loadingSocio, setLoadingSocio] = useState(false)

  const handleCrearClase = async () => {
    await crearClase(nueva)
    setNueva({ nombre: '', dia_semana: 0, hora_inicio: '07:00', duracion_min: 60, aforo_max: 15 })
    setTab('clases')
  }

  const registrarSocio = async () => {
    setMsgSocio(''); setLoadingSocio(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) { setMsgSocio('❌ Sin sesión activa.'); return }
      const res = await fetch('/api/register-socio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ ...nuevoSocio, gym_id: gymId }),
      })
      const data = await res.json()
      if (data.error) { setMsgSocio('❌ Error: ' + data.error) }
      else {
        setMsgSocio('✅ Socio registrado correctamente')
        setNuevoSocio({ nombre: '', email: '', password: '', tipo_membresia: 'mensual' })
        await loadSocios()
      }
    } catch { setMsgSocio('❌ Error de conexión') }
    finally { setLoadingSocio(false) }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#888', fontFamily: 'system-ui' }}>Cargando...</p>
    </div>
  )

  if (error) return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <p style={{ color: '#ff5c5c', fontFamily: 'system-ui', textAlign: 'center' }}>Error al cargar: {error}</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', color: '#f0f0f0', fontFamily: 'system-ui' }}>

      {/* HEADER */}
      <div style={{ background: '#181818', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '20px', fontWeight: '800' }}>
          JGS <span style={{ color: '#c8f542' }}>Fight Team</span>
          <span style={{ color: '#888', fontSize: '13px', fontWeight: '400', marginLeft: '8px' }}>Admin</span>
        </div>
        <button onClick={logout} style={{ background: 'rgba(255,92,92,0.12)', color: '#ff5c5c', border: '1px solid rgba(255,92,92,0.2)', borderRadius: '8px', padding: '6px 14px', fontSize: '13px', cursor: 'pointer', fontFamily: 'system-ui' }}>Salir</button>
      </div>

      {/* STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', padding: '16px 20px' }}>
        <div style={{ background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '14px' }}>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#c8f542' }}>{socios.filter(s => s.membresia_activa).length}</div>
          <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>Socios activos</div>
        </div>
        <div style={{ background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '14px' }}>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#5ca8ff' }}>{clases.length}</div>
          <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>Clases activas</div>
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '0 20px', overflowX: 'auto' }}>
        {[
          { key: 'clases', label: 'Clases' },
          { key: 'actividades', label: '🎯 Actividades' },
          { key: 'horarios', label: '🔄 Horarios' },
          { key: 'puntuales', label: '📅 Puntuales' },
          { key: 'socios', label: 'Socios' },
          { key: 'pagos', label: '💳 Pagos' },
          { key: 'nueva', label: '+ Clase' },
          { key: 'nuevo-socio', label: '+ Socio' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '500', color: tab === t.key ? '#c8f542' : '#888', borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderBottom: tab === t.key ? '2px solid #c8f542' : '2px solid transparent', cursor: 'pointer', background: 'none', fontFamily: 'system-ui', whiteSpace: 'nowrap' }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '16px 20px', paddingBottom: '40px' }}>

        {tab === 'clases' && <ClasesTab clases={clases} onEliminarClase={eliminarClase} />}

        {tab === 'actividades' && <ActividadesTab gymId={gymId} />}

        {tab === 'horarios' && <HorariosTab gymId={gymId} />}

        {tab === 'puntuales' && <ClasesPuntualesTab gymId={gymId} />}

        {tab === 'socios' && <SociosTab socios={socios} gymId={gymId} onRefreshSocios={loadSocios} />}

        {/* PagosTab notifica a SociosTab cuando se confirma un pago que afecta membresía */}
        {tab === 'pagos' && <PagosTab onSociosChange={loadSocios} />}

        {/* NUEVA CLASE */}
        {tab === 'nueva' && (
          <div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', color: '#888', fontSize: '12px', marginBottom: '6px', fontWeight: '500' }}>NOMBRE</label>
              <input style={inputStyle} placeholder="Ej: CrossFit Avanzado" value={nueva.nombre} onChange={e => setNueva({ ...nueva, nombre: e.target.value })} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              <div>
                <label style={{ display: 'block', color: '#888', fontSize: '12px', marginBottom: '6px', fontWeight: '500' }}>DÍA</label>
                <select style={inputStyle} value={nueva.dia_semana} onChange={e => setNueva({ ...nueva, dia_semana: parseInt(e.target.value) })}>
                  {DIAS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', color: '#888', fontSize: '12px', marginBottom: '6px', fontWeight: '500' }}>HORA</label>
                <input type="time" style={inputStyle} value={nueva.hora_inicio} onChange={e => setNueva({ ...nueva, hora_inicio: e.target.value })} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', color: '#888', fontSize: '12px', marginBottom: '6px', fontWeight: '500' }}>DURACIÓN (MIN)</label>
                <input type="number" style={inputStyle} value={nueva.duracion_min} onChange={e => setNueva({ ...nueva, duracion_min: parseInt(e.target.value) })} />
              </div>
              <div>
                <label style={{ display: 'block', color: '#888', fontSize: '12px', marginBottom: '6px', fontWeight: '500' }}>AFORO</label>
                <input type="number" style={inputStyle} value={nueva.aforo_max} onChange={e => setNueva({ ...nueva, aforo_max: parseInt(e.target.value) })} />
              </div>
            </div>
            <button onClick={handleCrearClase} style={{ background: '#c8f542', color: '#0f0f0f', border: 'none', borderRadius: '10px', padding: '13px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', width: '100%', fontFamily: 'system-ui' }}>Añadir clase</button>
          </div>
        )}

        {/* NUEVO SOCIO */}
        {tab === 'nuevo-socio' && (
          <div>
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
            <button onClick={registrarSocio} disabled={loadingSocio} style={{ background: '#c8f542', color: '#0f0f0f', border: 'none', borderRadius: '10px', padding: '13px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', width: '100%', fontFamily: 'system-ui', opacity: loadingSocio ? 0.6 : 1 }}>
              {loadingSocio ? 'Registrando...' : 'Registrar socio'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
