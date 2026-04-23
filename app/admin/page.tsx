'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import CalendarioMes from '@/components/CalendarioMes'

const TIPOS_MEMBRESIA = [
  { value: 'mensual', label: 'Mensual', meses: 1 },
  { value: 'trimestral', label: 'Trimestral', meses: 3 },
  { value: 'semestral', label: 'Semestral', meses: 6 },
  { value: 'anual', label: 'Anual', meses: 12 },
]

export default function AdminPage() {
  const [clases, setClases] = useState<any[]>([])
  const [socios, setSocios] = useState<any[]>([])
  const [tab, setTab] = useState('clases')
  const [loading, setLoading] = useState(true)
  const [gymId, setGymId] = useState('')
  const [nueva, setNueva] = useState({ nombre: '', dia_semana: 0, hora_inicio: '07:00', duracion_min: 60, aforo_max: 15 })
  const [nuevoSocio, setNuevoSocio] = useState({ nombre: '', email: '', password: '', tipo_membresia: 'mensual' })
  const [msgSocio, setMsgSocio] = useState('')
  const [loadingSocio, setLoadingSocio] = useState(false)
  const [modalSocio, setModalSocio] = useState<any>(null)
  const [mesesRenovar, setMesesRenovar] = useState(1)
  const [renovando, setRenovando] = useState(false)
  const [msgRenovar, setMsgRenovar] = useState('')
  const [tipoEditando, setTipoEditando] = useState('')
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>('')
  const [clasesDelDia, setClasesDelDia] = useState<any[]>([])
  const [modalClase, setModalClase] = useState<any>(null)
  const [reservasClase, setReservasClase] = useState<any[]>([])
  const [loadingReservas, setLoadingReservas] = useState(false)
  const router = useRouter()

  const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

  const inputStyle = {
    width: '100%', background: '#181818', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '10px', padding: '10px 14px', color: '#f0f0f0', fontSize: '14px',
    outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'system-ui'
  }

  const cardStyle = {
    background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '12px', padding: '14px', marginBottom: '10px'
  }

  useEffect(() => { init() }, [])

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }
    const { data: gym } = await supabase.from('gimnasios').select('id').single()
    if (gym) { setGymId(gym.id); await loadClases(gym.id) }
    await loadSocios()
    setLoading(false)
  }

  const loadClases = async (gid: string) => {
    const { data } = await supabase.from('clases').select('*').eq('gym_id', gid).eq('activa', true).order('dia_semana')
    setClases(data || [])
  }

  const loadSocios = async () => {
    const { data } = await supabase.from('perfiles').select('*').eq('rol', 'socio').order('nombre')
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

  const seleccionarDia = (fecha: string, clasesD: any[]) => {
    setFechaSeleccionada(fecha)
    setClasesDelDia(clasesD)
  }

  const abrirModalClase = async (clase: any, fecha: string) => {
    setModalClase({ ...clase, fecha })
    setLoadingReservas(true)
    setReservasClase([])

    const { data: sesion } = await supabase
      .from('sesiones').select('id').eq('clase_id', clase.id).eq('fecha', fecha).maybeSingle()

    if (!sesion) { setLoadingReservas(false); return }

    const { data: reservas } = await supabase
      .from('reservas').select('id, user_id, estado').eq('sesion_id', sesion.id).eq('estado', 'confirmada')

    if (!reservas || reservas.length === 0) { setReservasClase([]); setLoadingReservas(false); return }

    const userIds = reservas.map((r: any) => r.user_id)
    const { data: perfiles } = await supabase
      .from('perfiles').select('id, nombre, tipo_membresia').in('id', userIds)

    setReservasClase(reservas.map((r: any) => ({
      ...r,
      perfil: (perfiles || []).find((p: any) => p.id === r.user_id)
    })))
    setLoadingReservas(false)
  }

  const registrarSocio = async () => {
    setMsgSocio('')
    setLoadingSocio(true)
    const res = await fetch('/api/register-socio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...nuevoSocio, gym_id: gymId })
    })
    const data = await res.json()
    if (data.error) {
      setMsgSocio('Error: ' + data.error)
    } else {
      setMsgSocio('✅ Socio registrado correctamente')
      setNuevoSocio({ nombre: '', email: '', password: '', tipo_membresia: 'mensual' })
      await loadSocios()
    }
    setLoadingSocio(false)
  }

  const abrirModalSocio = (socio: any) => {
    setModalSocio(socio)
    setMesesRenovar(1)
    setMsgRenovar('')
    setTipoEditando(socio.tipo_membresia)
  }

  const renovarMembresia = async () => {
    if (!modalSocio) return
    setRenovando(true)
    setMsgRenovar('')
    const hoy = new Date()
    const vence = modalSocio.membresia_vence ? new Date(modalSocio.membresia_vence) : null
    const base = vence && vence > hoy ? new Date(vence) : new Date()
    base.setMonth(base.getMonth() + mesesRenovar)
    const nuevaFecha = base.toISOString().split('T')[0]
    await supabase.from('perfiles').update({ membresia_vence: nuevaFecha, membresia_activa: true, tipo_membresia: tipoEditando }).eq('id', modalSocio.id)
    await loadSocios()
    setModalSocio({ ...modalSocio, membresia_vence: nuevaFecha, membresia_activa: true, tipo_membresia: tipoEditando })
    setMsgRenovar(`✅ Renovada hasta ${new Date(nuevaFecha).toLocaleDateString('es-ES')}`)
    setRenovando(false)
  }

  const toggleActivarSocio = async () => {
    if (!modalSocio) return
    const nuevoEstado = !modalSocio.membresia_activa
    await supabase.from('perfiles').update({ membresia_activa: nuevoEstado }).eq('id', modalSocio.id)
    await loadSocios()
    setModalSocio({ ...modalSocio, membresia_activa: nuevoEstado })
    setMsgRenovar(nuevoEstado ? '✅ Socio activado' : '⚠️ Socio desactivado')
  }

  const getEstadoMembresia = (socio: any) => {
    if (!socio.membresia_activa) return 'caducada'
    if (!socio.membresia_vence) return 'ok'
    const diff = Math.ceil((new Date(socio.membresia_vence).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    if (diff < 0) return 'caducada'
    if (diff <= 7) return 'pronto'
    return 'ok'
  }

  const logout = async () => {
    await supabase.auth.signOut()
    router.push('/')
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
          JGS <span style={{ color: '#c8f542' }}>Fight Team</span>
          <span style={{ color: '#888', fontSize: '13px', fontWeight: '400', marginLeft: '8px' }}>Admin</span>
        </div>
        <button onClick={logout} style={{ background: 'rgba(255,92,92,0.12)', color: '#ff5c5c', border: '1px solid rgba(255,92,92,0.2)', borderRadius: '8px', padding: '6px 14px', fontSize: '13px', cursor: 'pointer', fontFamily: 'system-ui' }}>
          Salir
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', padding: '16px 20px' }}>
        <div style={cardStyle}>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#c8f542' }}>{socios.filter(s => s.membresia_activa).length}</div>
          <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>Socios activos</div>
        </div>
        <div style={cardStyle}>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#5ca8ff' }}>{clases.length}</div>
          <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>Clases activas</div>
        </div>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '0 20px', overflowX: 'auto' }}>
        {[
          { key: 'clases', label: 'Clases' },
          { key: 'socios', label: 'Socios' },
          { key: 'nueva', label: '+ Clase' },
          { key: 'nuevo-socio', label: '+ Socio' }
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '12px 16px', fontSize: '13px', fontWeight: '500',
            color: tab === t.key ? '#c8f542' : '#888',
            borderTop: 'none', borderLeft: 'none', borderRight: 'none',
            borderBottom: tab === t.key ? '2px solid #c8f542' : '2px solid transparent',
            cursor: 'pointer', background: 'none', fontFamily: 'system-ui', whiteSpace: 'nowrap'
          }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '16px 20px', paddingBottom: '40px' }}>

        {tab === 'clases' && (
          <>
            <CalendarioMes clases={clases} onSeleccionarDia={seleccionarDia} />

            {fechaSeleccionada && (
              <div>
                <div style={{ fontSize: '12px', color: '#888', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>
                  {fechaSeleccionada}
                </div>
                {clasesDelDia.length === 0 ? (
                  <p style={{ color: '#888', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>Sin clases este día</p>
                ) : clasesDelDia.map(c => (
                  <div key={c.id} style={{ ...cardStyle, cursor: 'pointer' }} onClick={() => abrirModalClase(c, fechaSeleccionada)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: '700' }}>{c.nombre}</div>
                        <div style={{ fontSize: '12px', color: '#888', marginTop: '3px' }}>
                          {c.hora_inicio} · {c.duracion_min} min · Aforo: {c.aforo_max}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <span style={{ fontSize: '11px', color: '#888', padding: '3px 8px', background: 'rgba(255,255,255,0.06)', borderRadius: '8px' }}>Ver reservas</span>
                        <button onClick={(e) => { e.stopPropagation(); eliminarClase(c.id) }} style={{ background: 'rgba(255,92,92,0.1)', border: '1px solid rgba(255,92,92,0.2)', borderRadius: '8px', padding: '6px 10px', fontSize: '13px', cursor: 'pointer', color: '#ff5c5c' }}>
                          🗑
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!fechaSeleccionada && (
              <p style={{ color: '#888', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>
                Toca un día del calendario para ver las clases
              </p>
            )}
          </>
        )}

        {tab === 'socios' && (
          <>
            {socios.length === 0 ? (
              <p style={{ color: '#888', textAlign: 'center', padding: '40px 0' }}>No hay socios registrados.</p>
            ) : socios.map(s => {
              const estado = getEstadoMembresia(s)
              return (
                <div key={s.id} onClick={() => abrirModalSocio(s)} style={{
                  ...cardStyle, cursor: 'pointer',
                  opacity: s.membresia_activa ? 1 : 0.5,
                  borderLeft: estado === 'caducada' ? '3px solid #ff5c5c' : estado === 'pronto' ? '3px solid #ffb84d' : '1px solid rgba(255,255,255,0.07)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: '600' }}>{s.nombre || 'Sin nombre'}</div>
                      <div style={{ fontSize: '12px', color: '#888', marginTop: '3px' }}>
                        {s.tipo_membresia} · vence {s.membresia_vence || 'N/A'}
                      </div>
                    </div>
                    <span style={{
                      fontSize: '11px', padding: '3px 10px', borderRadius: '20px',
                      background: !s.membresia_activa ? 'rgba(255,255,255,0.06)' : estado === 'caducada' ? 'rgba(255,92,92,0.12)' : estado === 'pronto' ? 'rgba(255,184,77,0.12)' : 'rgba(200,245,66,0.12)',
                      color: !s.membresia_activa ? '#555' : estado === 'caducada' ? '#ff5c5c' : estado === 'pronto' ? '#ffb84d' : '#c8f542'
                    }}>
                      {!s.membresia_activa ? 'Baja' : estado === 'caducada' ? 'Caducada' : estado === 'pronto' ? 'Vence pronto' : 'Activo'}
                    </span>
                  </div>
                </div>
              )
            })}
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
              <input type="password" style={inputStyle} placeholder="Mínimo 6 caracteres" value={nuevoSocio.password} onChange={e => setNuevoSocio({ ...nuevoSocio, password: e.target.value })} />
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

      {/* Modal clase — reservas */}
      {modalClase && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setModalClase(null) }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '24px 24px 0 0', padding: '24px 20px 36px', width: '100%', maxWidth: '480px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ width: '36px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', margin: '0 auto 20px' }}></div>
            <div style={{ fontSize: '20px', fontWeight: '800', marginBottom: '4px' }}>{modalClase.nombre}</div>
            <div style={{ fontSize: '13px', color: '#888', marginBottom: '20px' }}>{modalClase.fecha} · {modalClase.hora_inicio}</div>
            <div style={{ fontSize: '12px', color: '#888', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>
              Reservas — {loadingReservas ? '...' : `${reservasClase.length} / ${modalClase.aforo_max}`}
            </div>
            {loadingReservas ? (
              <p style={{ color: '#888', fontSize: '13px' }}>Cargando...</p>
            ) : reservasClase.length === 0 ? (
              <p style={{ color: '#888', fontSize: '13px' }}>Sin reservas para este día</p>
            ) : reservasClase.map((r: any) => (
              <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: '14px' }}>{r.perfil?.nombre || 'Sin nombre'}</span>
                <span style={{ fontSize: '11px', color: '#888' }}>{r.perfil?.tipo_membresia}</span>
              </div>
            ))}
            <button onClick={() => setModalClase(null)} style={{ width: '100%', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '12px', background: 'transparent', color: '#888', fontSize: '14px', cursor: 'pointer', fontFamily: 'system-ui', marginTop: '20px' }}>
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Modal socio */}
      {modalSocio && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setModalSocio(null) }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '24px 24px 0 0', padding: '24px 20px 36px', width: '100%', maxWidth: '480px' }}>
            <div style={{ width: '36px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', margin: '0 auto 20px' }}></div>
            <div style={{ fontSize: '20px', fontWeight: '800', marginBottom: '4px' }}>{modalSocio.nombre}</div>
            <div style={{ fontSize: '13px', color: '#888', marginBottom: '20px' }}>
              Vence: {modalSocio.membresia_vence || 'N/A'} · {modalSocio.membresia_activa ? '🟢 Activo' : '🔴 Baja'}
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: '#888', fontSize: '12px', marginBottom: '6px', fontWeight: '500', letterSpacing: '1px', textTransform: 'uppercase' }}>Tipo de membresía</label>
              <select value={tipoEditando} onChange={e => setTipoEditando(e.target.value)}
                style={{ width: '100%', background: '#181818', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 14px', color: '#f0f0f0', fontSize: '14px', outline: 'none', fontFamily: 'system-ui' }}>
                {TIPOS_MEMBRESIA.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '16px', marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: '#888', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>Renovar membresía</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <select value={mesesRenovar} onChange={e => setMesesRenovar(parseInt(e.target.value))}
                  style={{ flex: 1, background: '#181818', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 14px', color: '#f0f0f0', fontSize: '14px', outline: 'none', fontFamily: 'system-ui' }}>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <option key={m} value={m}>{m} {m === 1 ? 'mes' : 'meses'}</option>
                  ))}
                </select>
                <button onClick={renovarMembresia} disabled={renovando} style={{ background: '#c8f542', color: '#0f0f0f', border: 'none', borderRadius: '10px', padding: '10px 20px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: 'system-ui', opacity: renovando ? 0.6 : 1, whiteSpace: 'nowrap' }}>
                  {renovando ? '...' : 'Renovar'}
                </button>
              </div>
              {msgRenovar && (
                <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', background: msgRenovar.includes('✅') ? 'rgba(200,245,66,0.1)' : 'rgba(255,184,77,0.1)', color: msgRenovar.includes('✅') ? '#c8f542' : '#ffb84d', border: `1px solid ${msgRenovar.includes('✅') ? 'rgba(200,245,66,0.2)' : 'rgba(255,184,77,0.2)'}` }}>
                  {msgRenovar}
                </div>
              )}
            </div>
            <button onClick={toggleActivarSocio} style={{ width: '100%', border: `1px solid ${modalSocio.membresia_activa ? 'rgba(255,92,92,0.3)' : 'rgba(200,245,66,0.3)'}`, borderRadius: '10px', padding: '12px', background: 'transparent', color: modalSocio.membresia_activa ? '#ff5c5c' : '#c8f542', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: 'system-ui', marginBottom: '10px' }}>
              {modalSocio.membresia_activa ? 'Dar de baja' : 'Reactivar socio'}
            </button>
            <button onClick={() => setModalSocio(null)} style={{ width: '100%', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '12px', background: 'transparent', color: '#888', fontSize: '14px', cursor: 'pointer', fontFamily: 'system-ui' }}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}