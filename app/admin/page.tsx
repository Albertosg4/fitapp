'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const [clases, setClases] = useState<any[]>([])
  const [socios, setSocios] = useState<any[]>([])
  const [tab, setTab] = useState('clases')
  const [loading, setLoading] = useState(true)
  const [gymId, setGymId] = useState('')
  const [nueva, setNueva] = useState({
    nombre: '',
    dia_semana: 0,
    hora_inicio: '07:00',
    duracion_min: 60,
    aforo_max: 15
  })
  const router = useRouter()

  useEffect(() => { init() }, [])

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }
    const { data: gym } = await supabase.from('gimnasios').select('id').single()
    if (gym) {
      setGymId(gym.id)
      await loadClases(gym.id)
    }
    await loadSocios()
    setLoading(false)
  }

  const loadClases = async (gid: string) => {
    const { data } = await supabase
      .from('clases')
      .select('*')
      .eq('gym_id', gid)
      .eq('activa', true)
      .order('dia_semana')
    setClases(data || [])
  }

  const loadSocios = async () => {
    const { data } = await supabase
      .from('perfiles')
      .select('*')
      .eq('rol', 'socio')
    setSocios(data || [])
  }

  const crearClase = async () => {
    if (!nueva.nombre.trim()) return
    await supabase.from('clases').insert({ ...nueva, gym_id: gymId })
    setNueva({ nombre: '', dia_semana: 0, hora_inicio: '07:00', duracion_min: 60, aforo_max: 15 })
    await loadClases(gymId)
    setTab('clases')
  }

  const eliminarClase = async (id: string) => {
    await supabase.from('clases').update({ activa: false }).eq('id', id)
    await loadClases(gymId)
  }

  const logout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

  const inputStyle = {
    width: '100%',
    background: '#181818',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '10px',
    padding: '10px 14px',
    color: '#f0f0f0',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box' as const,
    fontFamily: 'system-ui'
  }

  const cardStyle = {
    background: '#1e1e1e',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '12px',
    padding: '14px',
    marginBottom: '10px'
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#888', fontFamily: 'system-ui' }}>Cargando...</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', color: '#f0f0f0', fontFamily: 'system-ui' }}>

      <div style={{ background: '#181818', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '20px', fontWeight: '800' }}>
          Fit<span style={{ color: '#c8f542' }}>App</span>
          <span style={{ color: '#888', fontSize: '13px', fontWeight: '400', marginLeft: '8px' }}>Admin</span>
        </div>
        <button onClick={logout} style={{ background: 'rgba(255,92,92,0.12)', color: '#ff5c5c', border: '1px solid rgba(255,92,92,0.2)', borderRadius: '8px', padding: '6px 14px', fontSize: '13px', cursor: 'pointer', fontFamily: 'system-ui' }}>
          Salir
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', padding: '16px 20px' }}>
        <div style={cardStyle}>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#c8f542' }}>{socios.length}</div>
          <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>Socios activos</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#5ca8ff' }}>{clases.length}</div>
          <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>Clases activas</div>
        </div>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '0 20px' }}>
        {[
          { key: 'clases', label: 'Clases' },
          { key: 'socios', label: 'Socios' },
          { key: 'nueva', label: '+ Nueva clase' }
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '12px 16px',
              fontSize: '13px',
              fontWeight: '500',
              color: tab === t.key ? '#c8f542' : '#888',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              borderBottom: tab === t.key ? '2px solid #c8f542' : '2px solid transparent',
              cursor: 'pointer',
              background: 'none',
              fontFamily: 'system-ui'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '16px 20px', paddingBottom: '40px' }}>

        {tab === 'clases' && (
          <>
            {clases.length === 0 ? (
              <p style={{ color: '#888', textAlign: 'center', padding: '40px 0' }}>No hay clases. Añade una.</p>
            ) : clases.map(c => (
              <div key={c.id} style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: '700' }}>{c.nombre}</div>
                    <div style={{ fontSize: '12px', color: '#888', marginTop: '3px' }}>
                      {dias[c.dia_semana]} · {c.hora_inicio} · {c.duracion_min} min · Aforo: {c.aforo_max}
                    </div>
                  </div>
                  <button onClick={() => eliminarClase(c.id)} style={{ background: 'rgba(255,92,92,0.1)', border: '1px solid rgba(255,92,92,0.2)', borderRadius: '8px', padding: '6px 10px', fontSize: '13px', cursor: 'pointer', color: '#ff5c5c' }}>
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </>
        )}

        {tab === 'socios' && (
          <>
            {socios.length === 0 ? (
              <p style={{ color: '#888', textAlign: 'center', padding: '40px 0' }}>No hay socios registrados.</p>
            ) : socios.map(s => (
              <div key={s.id} style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: '600' }}>{s.nombre || 'Sin nombre'}</div>
                    <div style={{ fontSize: '12px', color: '#888', marginTop: '3px' }}>
                      {s.tipo_membresia} · vence {s.membresia_vence || 'N/A'}
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', background: s.membresia_activa ? 'rgba(200,245,66,0.12)' : 'rgba(255,255,255,0.06)', color: s.membresia_activa ? '#c8f542' : '#888' }}>
                    {s.membresia_activa ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>
            ))}
          </>
        )}

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
                  {dias.map((d, i) => <option key={i} value={i}>{d}</option>)}
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
            <button onClick={crearClase} style={{ background: '#c8f542', color: '#0f0f0f', border: 'none', borderRadius: '10px', padding: '13px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', width: '100%', fontFamily: 'system-ui' }}>
              Añadir clase
            </button>
          </div>
        )}

      </div>
    </div>
  )
}