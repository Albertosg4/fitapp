'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import CalendarioMes from '@/components/CalendarioMes'
import HistorialAsistencia from '@/components/HistorialAsistencia'

const TIPOS_MEMBRESIA = [
  { value: 'mensual', label: 'Mensual', meses: 1 },
  { value: 'trimestral', label: 'Trimestral', meses: 3 },
  { value: 'semestral', label: 'Semestral', meses: 6 },
  { value: 'anual', label: 'Anual', meses: 12 },
]

const IMPORTES: Record<string, number> = {
  mensual: 49.99, trimestral: 129.99, semestral: 229.99, anual: 399.99,
}

const METODOS = [
  { value: 'efectivo', label: '💵 Efectivo' },
  { value: 'transferencia', label: '🏦 Transferencia' },
  { value: 'cortesia', label: '🎁 Cortesía (0€)' },
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
  const [tabModalSocio, setTabModalSocio] = useState<'info' | 'historial' | 'pagos'>('info')
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>('')
  const [clasesDelDia, setClasesDelDia] = useState<any[]>([])
  const [modalClase, setModalClase] = useState<any>(null)
  const [reservasClase, setReservasClase] = useState<any[]>([])
  const [loadingReservas, setLoadingReservas] = useState(false)

  // Pagos globales
  const [todosLosPagos, setTodosLosPagos] = useState<any[]>([])
  const [loadingPagos, setLoadingPagos] = useState(false)
  const [filtroPagoSocio, setFiltroPagoSocio] = useState('')
  const [filtroPagoEstado, setFiltroPagoEstado] = useState('')
  const [filtroPagoMes, setFiltroPagoMes] = useState('')

  // Modal pago manual
  const [modalPago, setModalPago] = useState<any>(null)
  const [formPago, setFormPago] = useState({ tipoMembresia: 'mensual', metodo: 'efectivo', estado: 'pagado', notas: '' })
  const [guardandoPago, setGuardandoPago] = useState(false)
  const [msgPago, setMsgPago] = useState('')

  const router = useRouter()
  const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

  const inputStyle = { width: '100%', background: '#181818', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '10px 14px', color: '#f0f0f0', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'system-ui' }
  const cardStyle = { background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '14px', marginBottom: '10px' }

  useEffect(() => { init() }, [])
  useEffect(() => { if (tab === 'pagos') cargarTodosLosPagos() }, [tab])

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

  const cargarTodosLosPagos = async () => {
    setLoadingPagos(true)
    try {
      const res = await fetch('/api/pagos')
      const data = await res.json()
      setTodosLosPagos(data.pagos || [])
    } catch (err) {
      console.error('Error cargando pagos:', err)
    } finally {
      setLoadingPagos(false)
    }
  }

  const confirmarPagoPendiente = async (pagoId: string) => {
    await fetch('/api/pagos/manual', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pagoId }),
    })
    await cargarTodosLosPagos()
    await loadSocios()
  }

  const abrirModalPago = (socio: any) => {
    setModalPago(socio)
    setFormPago({ tipoMembresia: 'mensual', metodo: 'efectivo', estado: 'pagado', notas: '' })
    setMsgPago('')
  }

  const guardarPago = async () => {
    if (!modalPago) return
    setGuardandoPago(true)
    setMsgPago('')
    try {
      const res = await fetch('/api/pagos/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: modalPago.id,
          gymId,
          tipoMembresia: formPago.tipoMembresia,
          metodo: formPago.metodo,
          estado: formPago.metodo === 'cortesia' ? 'pagado' : formPago.estado,
          notas: formPago.notas,
        }),
      })
      const data = await res.json()
      if (data.ok) {
        const esCortesia = formPago.metodo === 'cortesia'
        const esPagado = formPago.estado === 'pagado' || esCortesia
        setMsgPago(esPagado
          ? `✅ ${esCortesia ? 'Cortesía registrada' : 'Pago registrado'}. Membresía renovada.`
          : '✅ Pago pendiente registrado. La membresía se renovará al confirmar el cobro.')
        await loadSocios()
        await cargarTodosLosPagos()
        const socioActualizado = socios.find(s => s.id === modalPago.id)
        if (socioActualizado) setModalPago(socioActualizado)
      } else {
        setMsgPago('❌ Error: ' + data.error)
      }
    } catch (err) {
      setMsgPago('❌ Error de conexión')
    } finally {
      setGuardandoPago(false)
    }
  }

  const crearClase = async () => {
    if (!nueva.nombre.trim()) return
    await supabase.from('clases').insert({ ...nueva, gym_id: gymId })
    setNueva({ nombre: '', dia_semana: 0, hora_inicio: '07:00', duracion_min: 60, aforo_max: 15 })
    await loadClases(gymId); setTab('clases')
  }

  const eliminarClase = async (id: string) => {
    await supabase.from('clases').update({ activa: false }).eq('id', id)
    await loadClases(gymId)
  }

  const seleccionarDia = (fecha: string, clasesD: any[]) => {
    setFechaSeleccionada(fecha); setClasesDelDia(clasesD)
  }

  const abrirModalClase = async (clase: any, fecha: string) => {
    setModalClase({ ...clase, fecha }); setLoadingReservas(true); setReservasClase([])
    const { data: sesion } = await supabase.from('sesiones').select('id').eq('clase_id', clase.id).eq('fecha', fecha).maybeSingle()
    if (!sesion) { setLoadingReservas(false); return }
    const { data: reservas } = await supabase.from('reservas').select('id, user_id, estado').eq('sesion_id', sesion.id).eq('estado', 'confirmada')
    if (!reservas || reservas.length === 0) { setReservasClase([]); setLoadingReservas(false); return }
    const userIds = reservas.map((r: any) => r.user_id)
    const { data: perfiles } = await supabase.from('perfiles').select('id, nombre, tipo_membresia').in('id', userIds)
    setReservasClase(reservas.map((r: any) => ({ ...r, perfil: (perfiles || []).find((p: any) => p.id === r.user_id) })))
    setLoadingReservas(false)
  }

  // ── REGISTRAR SOCIO — ahora manda token de sesión al endpoint ──────────────
  const registrarSocio = async () => {
    setMsgSocio(''); setLoadingSocio(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        setMsgSocio('❌ Sin sesión activa. Vuelve a iniciar sesión.')
        return
      }
      const res = await fetch('/api/register-socio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ ...nuevoSocio, gym_id: gymId }),
      })
      const data = await res.json()
      if (data.error) {
        setMsgSocio('❌ Error: ' + data.error)
      } else {
        setMsgSocio('✅ Socio registrado correctamente')
        setNuevoSocio({ nombre: '', email: '', password: '', tipo_membresia: 'mensual' })
        await loadSocios()
      }
    } catch {
      setMsgSocio('❌ Error de conexión')
    } finally {
      setLoadingSocio(false)
    }
  }

  const abrirModalSocio = (socio: any) => {
    setModalSocio(socio); setTabModalSocio('info')
  }

  const toggleActivarSocio = async () => {
    if (!modalSocio) return
    const nuevoEstado = !modalSocio.membresia_activa
    await supabase.from('perfiles').update({ membresia_activa: nuevoEstado }).eq('id', modalSocio.id)
    await loadSocios()
    setModalSocio({ ...modalSocio, membresia_activa: nuevoEstado })
  }

  const getEstadoMembresia = (socio: any) => {
    if (!socio.membresia_activa) return 'caducada'
    if (!socio.membresia_vence) return 'ok'
    const diff = Math.ceil((new Date(socio.membresia_vence).getTime() - Date.now()) / 86400000)
    if (diff < 0) return 'caducada'
    if (diff <= 7) return 'pronto'
    return 'ok'
  }

  const logout = async () => { await supabase.auth.signOut(); router.push('/') }

  const pagosFiltrados = todosLosPagos.filter(p => {
    const nombre = p.perfiles?.nombre?.toLowerCase() || ''
    if (filtroPagoSocio && !nombre.includes(filtroPagoSocio.toLowerCase())) return false
    if (filtroPagoEstado && p.estado !== filtroPagoEstado) return false
    if (filtroPagoMes) {
      const mes = new Date(p.fecha_pago).toISOString().slice(0, 7)
      if (mes !== filtroPagoMes) return false
    }
    return true
  })

  const totalCobrado = pagosFiltrados.filter(p => p.estado === 'pagado').reduce((s, p) => s + Number(p.importe), 0)
  const totalPendiente = pagosFiltrados.filter(p => p.estado === 'pendiente').reduce((s, p) => s + Number(p.importe), 0)

  const importeFormPago = formPago.metodo === 'cortesia' ? 0 : (IMPORTES[formPago.tipoMembresia] || 0)

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#888', fontFamily: 'system-ui' }}>Cargando...</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', color: '#f0f0f0', fontFamily: 'system-ui' }}>

      {/* HEADER */}
      <div style={{ background: '#181818', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '20px', fontWeight: '800' }}>JGS <span style={{ color: '#c8f542' }}>Fight Team</span><span style={{ color: '#888', fontSize: '13px', fontWeight: '400', marginLeft: '8px' }}>Admin</span></div>
        <button onClick={logout} style={{ background: 'rgba(255,92,92,0.12)', color: '#ff5c5c', border: '1px solid rgba(255,92,92,0.2)', borderRadius: '8px', padding: '6px 14px', fontSize: '13px', cursor: 'pointer', fontFamily: 'system-ui' }}>Salir</button>
      </div>

      {/* STATS */}
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

      {/* TABS */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '0 20px', overflowX: 'auto' }}>
        {[
          { key: 'clases', label: 'Clases' },
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

        {/* CLASES */}
        {tab === 'clases' && (
          <>
            <CalendarioMes clases={clases} onSeleccionarDia={seleccionarDia} />
            {fechaSeleccionada && (
              <div>
                <div style={{ fontSize: '12px', color: '#888', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>{fechaSeleccionada}</div>
                {clasesDelDia.length === 0 ? (
                  <p style={{ color: '#888', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>Sin clases este día</p>
                ) : clasesDelDia.map(c => (
                  <div key={c.id} style={{ ...cardStyle, cursor: 'pointer' }} onClick={() => abrirModalClase(c, fechaSeleccionada)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: '700' }}>{c.nombre}</div>
                        <div style={{ fontSize: '12px', color: '#888', marginTop: '3px' }}>{c.hora_inicio} · {c.duracion_min} min · Aforo: {c.aforo_max}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <span style={{ fontSize: '11px', color: '#888', padding: '3px 8px', background: 'rgba(255,255,255,0.06)', borderRadius: '8px' }}>Ver reservas</span>
                        <button onClick={(e) => { e.stopPropagation(); eliminarClase(c.id) }} style={{ background: 'rgba(255,92,92,0.1)', border: '1px solid rgba(255,92,92,0.2)', borderRadius: '8px', padding: '6px 10px', fontSize: '13px', cursor: 'pointer', color: '#ff5c5c' }}>🗑</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!fechaSeleccionada && <p style={{ color: '#888', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>Toca un día del calendario para ver las clases</p>}
          </>
        )}

        {/* SOCIOS */}
        {tab === 'socios' && (
          <>
            {socios.length === 0 ? (
              <p style={{ color: '#888', textAlign: 'center', padding: '40px 0' }}>No hay socios registrados.</p>
            ) : socios.map(s => {
              const estado = getEstadoMembresia(s)
              return (
                <div key={s.id} onClick={() => abrirModalSocio(s)} style={{ ...cardStyle, cursor: 'pointer', opacity: s.membresia_activa ? 1 : 0.5, borderLeft: estado === 'caducada' ? '3px solid #ff5c5c' : estado === 'pronto' ? '3px solid #ffb84d' : '1px solid rgba(255,255,255,0.07)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: '600' }}>{s.nombre || 'Sin nombre'}</div>
                      <div style={{ fontSize: '12px', color: '#888', marginTop: '3px' }}>{s.tipo_membresia} · vence {s.membresia_vence || 'N/A'}</div>
                    </div>
                    <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', background: !s.membresia_activa ? 'rgba(255,255,255,0.06)' : estado === 'caducada' ? 'rgba(255,92,92,0.12)' : estado === 'pronto' ? 'rgba(255,184,77,0.12)' : 'rgba(200,245,66,0.12)', color: !s.membresia_activa ? '#555' : estado === 'caducada' ? '#ff5c5c' : estado === 'pronto' ? '#ffb84d' : '#c8f542' }}>
                      {!s.membresia_activa ? 'Baja' : estado === 'caducada' ? 'Caducada' : estado === 'pronto' ? 'Vence pronto' : 'Activo'}
                    </span>
                  </div>
                </div>
              )
            })}
          </>
        )}

        {/* PAGOS GLOBALES */}
        {tab === 'pagos' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
              <div style={{ ...cardStyle, marginBottom: 0 }}>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#c8f542' }}>{totalCobrado.toFixed(0)}€</div>
                <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>Cobrado</div>
              </div>
              <div style={{ ...cardStyle, marginBottom: 0 }}>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#ffb84d' }}>{totalPendiente.toFixed(0)}€</div>
                <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>Pendiente</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' as const }}>
              <input placeholder="Buscar socio..." value={filtroPagoSocio} onChange={e => setFiltroPagoSocio(e.target.value)}
                style={{ ...inputStyle, flex: 1, minWidth: '120px', padding: '8px 12px', fontSize: '13px' }} />
              <select value={filtroPagoEstado} onChange={e => setFiltroPagoEstado(e.target.value)}
                style={{ ...inputStyle, width: 'auto', padding: '8px 12px', fontSize: '13px' }}>
                <option value="">Todos</option>
                <option value="pagado">Pagado</option>
                <option value="pendiente">Pendiente</option>
              </select>
              <input type="month" value={filtroPagoMes} onChange={e => setFiltroPagoMes(e.target.value)}
                style={{ ...inputStyle, width: 'auto', padding: '8px 12px', fontSize: '13px' }} />
            </div>
            {loadingPagos ? (
              <p style={{ color: '#888', textAlign: 'center', padding: '20px 0', fontSize: '13px' }}>Cargando...</p>
            ) : pagosFiltrados.length === 0 ? (
              <p style={{ color: '#888', textAlign: 'center', padding: '20px 0', fontSize: '13px' }}>Sin pagos registrados</p>
            ) : pagosFiltrados.map(p => (
              <div key={p.id} style={{ ...cardStyle, borderLeft: p.estado === 'pendiente' ? '3px solid #ffb84d' : p.metodo === 'cortesia' ? '3px solid #a855f7' : '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '700' }}>{p.perfiles?.nombre || 'Sin nombre'}</div>
                    <div style={{ fontSize: '12px', color: '#888', marginTop: '2px', textTransform: 'capitalize' }}>
                      {p.tipo_membresia} · {p.metodo === 'stripe' ? '💳 Tarjeta' : p.metodo === 'efectivo' ? '💵 Efectivo' : p.metodo === 'transferencia' ? '🏦 Transferencia' : '🎁 Cortesía'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                      {new Date(p.fecha_pago).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                    {p.notas && <div style={{ fontSize: '11px', color: '#888', marginTop: '4px', fontStyle: 'italic' }}>{p.notas}</div>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: p.metodo === 'cortesia' ? '#a855f7' : p.estado === 'pendiente' ? '#ffb84d' : '#c8f542' }}>
                      {p.metodo === 'cortesia' ? '0€' : `${Number(p.importe).toFixed(2)}€`}
                    </div>
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: p.metodo === 'cortesia' ? 'rgba(168,85,247,0.1)' : p.estado === 'pagado' ? 'rgba(200,245,66,0.1)' : 'rgba(255,184,77,0.1)', color: p.metodo === 'cortesia' ? '#a855f7' : p.estado === 'pagado' ? '#c8f542' : '#ffb84d' }}>
                      {p.metodo === 'cortesia' ? '🎁 Cortesía' : p.estado === 'pagado' ? '✓ Pagado' : '⏳ Pendiente'}
                    </span>
                  </div>
                </div>
                {p.estado === 'pendiente' && p.metodo !== 'cortesia' && (
                  <button onClick={() => confirmarPagoPendiente(p.id)} style={{ marginTop: '10px', width: '100%', background: 'rgba(200,245,66,0.08)', border: '1px solid rgba(200,245,66,0.2)', borderRadius: '8px', padding: '8px', color: '#c8f542', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'system-ui' }}>
                    ✓ Confirmar pago recibido
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

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
            <button onClick={crearClase} style={{ background: '#c8f542', color: '#0f0f0f', border: 'none', borderRadius: '10px', padding: '13px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', width: '100%', fontFamily: 'system-ui' }}>Añadir clase</button>
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
            {msgSocio && <div style={{ marginBottom: '12px', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', background: msgSocio.includes('✅') ? 'rgba(200,245,66,0.1)' : 'rgba(255,92,92,0.1)', color: msgSocio.includes('✅') ? '#c8f542' : '#ff5c5c', border: `1px solid ${msgSocio.includes('✅') ? 'rgba(200,245,66,0.2)' : 'rgba(255,92,92,0.2)'}` }}>{msgSocio}</div>}
            <button onClick={registrarSocio} disabled={loadingSocio} style={{ background: '#c8f542', color: '#0f0f0f', border: 'none', borderRadius: '10px', padding: '13px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', width: '100%', fontFamily: 'system-ui', opacity: loadingSocio ? 0.6 : 1 }}>
              {loadingSocio ? 'Registrando...' : 'Registrar socio'}
            </button>
          </div>
        )}
      </div>

      {/* MODAL CLASE */}
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
            {loadingReservas ? <p style={{ color: '#888', fontSize: '13px' }}>Cargando...</p>
              : reservasClase.length === 0 ? <p style={{ color: '#888', fontSize: '13px' }}>Sin reservas para este día</p>
              : reservasClase.map((r: any) => (
                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: '14px' }}>{r.perfil?.nombre || 'Sin nombre'}</span>
                  <span style={{ fontSize: '11px', color: '#888' }}>{r.perfil?.tipo_membresia}</span>
                </div>
              ))}
            <button onClick={() => setModalClase(null)} style={{ width: '100%', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '12px', background: 'transparent', color: '#888', fontSize: '14px', cursor: 'pointer', fontFamily: 'system-ui', marginTop: '20px' }}>Cerrar</button>
          </div>
        </div>
      )}

      {/* MODAL SOCIO */}
      {modalSocio && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setModalSocio(null) }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '24px 24px 0 0', padding: '24px 20px 36px', width: '100%', maxWidth: '480px', maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ width: '36px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', margin: '0 auto 16px' }}></div>
            <div style={{ fontSize: '20px', fontWeight: '800', marginBottom: '4px' }}>{modalSocio.nombre}</div>
            <div style={{ fontSize: '13px', color: '#888', marginBottom: '16px' }}>
              {modalSocio.tipo_membresia} · Vence: {modalSocio.membresia_vence || 'N/A'} · {modalSocio.membresia_activa ? '🟢 Activo' : '🔴 Baja'}
            </div>

            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '3px', marginBottom: '20px' }}>
              {[
                { key: 'info', label: '⚙️ Gestión' },
                { key: 'historial', label: '📋 Asistencia' },
                { key: 'pagos', label: '💳 Pagos' },
              ].map(t => (
                <button key={t.key} onClick={() => setTabModalSocio(t.key as any)}
                  style={{ flex: 1, padding: '8px 4px', fontSize: '12px', fontWeight: '500', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'system-ui', background: tabModalSocio === t.key ? '#2a2a2a' : 'transparent', color: tabModalSocio === t.key ? '#c8f542' : '#888' }}>
                  {t.label}
                </button>
              ))}
            </div>

            {tabModalSocio === 'info' && (
              <div>
                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '14px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Membresía actual</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: '700', textTransform: 'capitalize' }}>{modalSocio.tipo_membresia || '—'}</div>
                      <div style={{ fontSize: '12px', color: '#888', marginTop: '3px' }}>Vence: {modalSocio.membresia_vence || 'Sin fecha'}</div>
                    </div>
                    <span style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', background: !modalSocio.membresia_activa ? 'rgba(255,255,255,0.06)' : getEstadoMembresia(modalSocio) === 'caducada' ? 'rgba(255,92,92,0.12)' : getEstadoMembresia(modalSocio) === 'pronto' ? 'rgba(255,184,77,0.12)' : 'rgba(200,245,66,0.12)', color: !modalSocio.membresia_activa ? '#555' : getEstadoMembresia(modalSocio) === 'caducada' ? '#ff5c5c' : getEstadoMembresia(modalSocio) === 'pronto' ? '#ffb84d' : '#c8f542' }}>
                      {!modalSocio.membresia_activa ? 'Baja' : getEstadoMembresia(modalSocio) === 'caducada' ? 'Caducada' : getEstadoMembresia(modalSocio) === 'pronto' ? 'Vence pronto' : 'Activa'}
                    </span>
                  </div>
                </div>
                <button onClick={() => abrirModalPago(modalSocio)}
                  style={{ width: '100%', background: '#c8f542', color: '#0f0f0f', border: 'none', borderRadius: '10px', padding: '13px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: 'system-ui', marginBottom: '10px' }}>
                  💳 Registrar pago / Renovar membresía
                </button>
                <button onClick={toggleActivarSocio}
                  style={{ width: '100%', border: `1px solid ${modalSocio.membresia_activa ? 'rgba(255,92,92,0.3)' : 'rgba(200,245,66,0.3)'}`, borderRadius: '10px', padding: '12px', background: 'transparent', color: modalSocio.membresia_activa ? '#ff5c5c' : '#c8f542', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: 'system-ui' }}>
                  {modalSocio.membresia_activa ? 'Dar de baja' : 'Reactivar socio'}
                </button>
              </div>
            )}

            {tabModalSocio === 'historial' && (
              <HistorialAsistencia userId={modalSocio.id} limit={100} compact={true} />
            )}

            {tabModalSocio === 'pagos' && (
              <SocioPagosAdmin userId={modalSocio.id} onRefresh={cargarTodosLosPagos} />
            )}

            <button onClick={() => setModalSocio(null)} style={{ width: '100%', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '12px', background: 'transparent', color: '#888', fontSize: '14px', cursor: 'pointer', fontFamily: 'system-ui', marginTop: '10px' }}>
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* MODAL REGISTRAR PAGO */}
      {modalPago && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setModalPago(null) }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '24px 24px 0 0', padding: '24px 20px 36px', width: '100%', maxWidth: '480px' }}>
            <div style={{ width: '36px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', margin: '0 auto 20px' }}></div>
            <div style={{ fontSize: '18px', fontWeight: '800', marginBottom: '2px' }}>Registrar pago</div>
            <div style={{ fontSize: '13px', color: '#888', marginBottom: '20px' }}>{modalPago.nombre}</div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', color: '#888', fontSize: '12px', marginBottom: '6px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tipo de membresía</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {TIPOS_MEMBRESIA.map(t => (
                  <button key={t.value} onClick={() => setFormPago({ ...formPago, tipoMembresia: t.value })}
                    style={{ padding: '10px', borderRadius: '10px', border: `1px solid ${formPago.tipoMembresia === t.value ? 'rgba(200,245,66,0.5)' : 'rgba(255,255,255,0.07)'}`, background: formPago.tipoMembresia === t.value ? 'rgba(200,245,66,0.1)' : '#181818', color: formPago.tipoMembresia === t.value ? '#c8f542' : '#888', cursor: 'pointer', fontFamily: 'system-ui', fontSize: '13px', fontWeight: '600' }}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', color: '#888', fontSize: '12px', marginBottom: '6px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Método</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {METODOS.map(m => (
                  <button key={m.value} onClick={() => setFormPago({ ...formPago, metodo: m.value })}
                    style={{ padding: '10px', borderRadius: '10px', border: `1px solid ${formPago.metodo === m.value ? 'rgba(200,245,66,0.5)' : 'rgba(255,255,255,0.07)'}`, background: formPago.metodo === m.value ? 'rgba(200,245,66,0.1)' : '#181818', color: formPago.metodo === m.value ? '#c8f542' : '#888', cursor: 'pointer', fontFamily: 'system-ui', fontSize: '12px', fontWeight: '500' }}>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {formPago.metodo !== 'cortesia' && (
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', color: '#888', fontSize: '12px', marginBottom: '6px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Estado del pago</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  <button onClick={() => setFormPago({ ...formPago, estado: 'pagado' })}
                    style={{ padding: '10px', borderRadius: '10px', border: `1px solid ${formPago.estado === 'pagado' ? 'rgba(200,245,66,0.5)' : 'rgba(255,255,255,0.07)'}`, background: formPago.estado === 'pagado' ? 'rgba(200,245,66,0.1)' : '#181818', color: formPago.estado === 'pagado' ? '#c8f542' : '#888', cursor: 'pointer', fontFamily: 'system-ui', fontSize: '13px', fontWeight: '600' }}>
                    ✓ Pagado
                  </button>
                  <button onClick={() => setFormPago({ ...formPago, estado: 'pendiente' })}
                    style={{ padding: '10px', borderRadius: '10px', border: `1px solid ${formPago.estado === 'pendiente' ? 'rgba(255,184,77,0.5)' : 'rgba(255,255,255,0.07)'}`, background: formPago.estado === 'pendiente' ? 'rgba(255,184,77,0.1)' : '#181818', color: formPago.estado === 'pendiente' ? '#ffb84d' : '#888', cursor: 'pointer', fontFamily: 'system-ui', fontSize: '13px', fontWeight: '600' }}>
                    ⏳ Pendiente
                  </button>
                </div>
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: '#888', fontSize: '12px', marginBottom: '6px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Notas (opcional)</label>
              <input value={formPago.notas} onChange={e => setFormPago({ ...formPago, notas: e.target.value })}
                placeholder={formPago.metodo === 'cortesia' ? 'Ej: Mes gratis por referido' : 'Ej: Pagó en recepción el lunes'}
                style={{ width: '100%', background: '#181818', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px 14px', color: '#f0f0f0', fontSize: '14px', outline: 'none', fontFamily: 'system-ui', boxSizing: 'border-box' as const }} />
            </div>

            <div style={{ padding: '12px 16px', background: formPago.metodo === 'cortesia' ? 'rgba(168,85,247,0.08)' : 'rgba(200,245,66,0.06)', border: `1px solid ${formPago.metodo === 'cortesia' ? 'rgba(168,85,247,0.2)' : 'rgba(200,245,66,0.15)'}`, borderRadius: '10px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ color: '#888', fontSize: '13px' }}>Importe</span>
                <span style={{ color: formPago.metodo === 'cortesia' ? '#a855f7' : '#c8f542', fontWeight: '800', fontSize: '20px' }}>
                  {formPago.metodo === 'cortesia' ? '0€' : `${importeFormPago}€`}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#888' }}>
                {formPago.metodo === 'cortesia'
                  ? '🎁 Cortesía — membresía se activa sin cargo'
                  : formPago.estado === 'pagado'
                  ? '✅ Membresía se renovará al confirmar'
                  : '⏳ Membresía se renovará cuando confirmes el cobro'}
              </div>
            </div>

            {msgPago && (
              <div style={{ marginBottom: '12px', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', background: msgPago.includes('✅') ? 'rgba(200,245,66,0.1)' : 'rgba(255,92,92,0.1)', color: msgPago.includes('✅') ? '#c8f542' : '#ff5c5c' }}>
                {msgPago}
              </div>
            )}

            <button onClick={guardarPago} disabled={guardandoPago}
              style={{ width: '100%', background: formPago.metodo === 'cortesia' ? '#a855f7' : '#c8f542', color: '#0f0f0f', border: 'none', borderRadius: '10px', padding: '13px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: 'system-ui', opacity: guardandoPago ? 0.6 : 1, marginBottom: '10px' }}>
              {guardandoPago ? 'Guardando...' : formPago.metodo === 'cortesia' ? '🎁 Aplicar cortesía' : formPago.estado === 'pagado' ? '✅ Confirmar pago' : '⏳ Registrar como pendiente'}
            </button>
            <button onClick={() => setModalPago(null)} style={{ width: '100%', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '12px', background: 'transparent', color: '#888', fontSize: '14px', cursor: 'pointer', fontFamily: 'system-ui' }}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  )
}

function SocioPagosAdmin({ userId, onRefresh }: { userId: string, onRefresh: () => void }) {
  const [pagos, setPagos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { cargar() }, [userId])

  const cargar = async () => {
    const { data } = await supabase.from('pagos').select('*').eq('user_id', userId).order('fecha_pago', { ascending: false })
    setPagos(data || [])
    setLoading(false)
  }

  const confirmar = async (pagoId: string) => {
    await fetch('/api/pagos/manual', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pagoId }) })
    await cargar()
    onRefresh()
  }

  if (loading) return <p style={{ color: '#888', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>Cargando...</p>
  if (pagos.length === 0) return <p style={{ color: '#888', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>Sin pagos registrados</p>

  const total = pagos.filter(p => p.estado === 'pagado' && p.metodo !== 'cortesia').reduce((s, p) => s + Number(p.importe), 0)
  const pendiente = pagos.filter(p => p.estado === 'pendiente').reduce((s, p) => s + Number(p.importe), 0)
  const cortesias = pagos.filter(p => p.metodo === 'cortesia').length

  return (
    <div>
      <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
        <div style={{ flex: 1, background: 'rgba(200,245,66,0.08)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
          <div style={{ fontSize: '16px', fontWeight: '800', color: '#c8f542' }}>{total.toFixed(0)}€</div>
          <div style={{ fontSize: '10px', color: '#888' }}>Cobrado</div>
        </div>
        {pendiente > 0 && (
          <div style={{ flex: 1, background: 'rgba(255,184,77,0.08)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '16px', fontWeight: '800', color: '#ffb84d' }}>{pendiente.toFixed(0)}€</div>
            <div style={{ fontSize: '10px', color: '#888' }}>Pendiente</div>
          </div>
        )}
        {cortesias > 0 && (
          <div style={{ flex: 1, background: 'rgba(168,85,247,0.08)', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
            <div style={{ fontSize: '16px', fontWeight: '800', color: '#a855f7' }}>{cortesias}</div>
            <div style={{ fontSize: '10px', color: '#888' }}>Cortesías</div>
          </div>
        )}
      </div>
      {pagos.map(p => (
        <div key={p.id} style={{ padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '600', textTransform: 'capitalize', color: '#f0f0f0' }}>{p.tipo_membresia}</div>
              <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
                {new Date(p.fecha_pago).toLocaleDateString('es-ES')} · {p.metodo === 'stripe' ? '💳' : p.metodo === 'efectivo' ? '💵' : p.metodo === 'transferencia' ? '🏦' : '🎁'} {p.metodo}
              </div>
              {p.notas && <div style={{ fontSize: '11px', color: '#666', fontStyle: 'italic' }}>{p.notas}</div>}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: '700', color: p.metodo === 'cortesia' ? '#a855f7' : p.estado === 'pendiente' ? '#ffb84d' : '#c8f542' }}>
                {p.metodo === 'cortesia' ? '0€' : `${Number(p.importe).toFixed(2)}€`}
              </div>
              <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '10px', background: p.metodo === 'cortesia' ? 'rgba(168,85,247,0.1)' : p.estado === 'pagado' ? 'rgba(200,245,66,0.1)' : 'rgba(255,184,77,0.1)', color: p.metodo === 'cortesia' ? '#a855f7' : p.estado === 'pagado' ? '#c8f542' : '#ffb84d' }}>
                {p.metodo === 'cortesia' ? '🎁' : p.estado === 'pagado' ? '✓' : '⏳'}
              </span>
            </div>
          </div>
          {p.estado === 'pendiente' && (
            <button onClick={() => confirmar(p.id)} style={{ marginTop: '6px', width: '100%', background: 'rgba(200,245,66,0.08)', border: '1px solid rgba(200,245,66,0.2)', borderRadius: '6px', padding: '6px', color: '#c8f542', fontSize: '12px', cursor: 'pointer', fontFamily: 'system-ui' }}>
              ✓ Confirmar pago
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
