'use client'
import { useEffect, useState, useCallback, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import { getEstadoMembresiaAdmin, getDiasRestantes } from '@/lib/domain/membresias'
import { useSocioData } from '@/features/socio/hooks/useSocioData'
import type { HorarioSocio } from '@/features/socio/hooks/useSocioData'
import SocioClasesTab from '@/features/socio/components/SocioClasesTab'
import SocioHistorialTab from '@/features/socio/components/SocioHistorialTab'
import SocioPagosTab from '@/features/socio/components/SocioPagosTab'
import SocioQRTab from '@/features/socio/components/SocioQRTab'
import SocioPerfilTab from '@/features/socio/components/SocioPerfilTab'

function SocioPageInner() {
  const {
    perfil,
    horarios,
    reservas,
    ocupacion,
    qrUrl,
    userId, setUserId,
    loading, setLoading,
    reservaError, setReservaError,
    isReservaEnCurso,
    cargarReservas,
    cargarPerfil,
    cargarHorarios,
    actualizarOcupacion,
    reservar,
  } = useSocioData()

  const [tab, setTab] = useState('clases')
  const [modal, setModal] = useState<(HorarioSocio & { fecha: string }) | null>(null)
  const [modalFecha, setModalFecha] = useState<string>('')
  const [horariosDelDia, setHorariosDelDia] = useState<HorarioSocio[]>([])
  const [pagando, setPagando] = useState(false)
  const [msgPago, setMsgPago] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const navTabs = [
    { key: 'clases', icon: '🗓', label: 'Clases' },
    { key: 'historial', icon: '📋', label: 'Historial' },
    { key: 'pagos', icon: '💳', label: 'Pagos' },
    { key: 'qr', icon: '⬛', label: 'Mi QR' },
    { key: 'perfil', icon: '👤', label: 'Perfil' },
  ]

  const init = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }
    setUserId(user.id)
    await cargarPerfil(user.id)
    // Leer gym_id del perfil para filtrar horarios por gimnasio
    const { data: perfilData } = await supabase
      .from('perfiles').select('gym_id').eq('id', user.id).single()
    await cargarHorarios(perfilData?.gym_id ?? undefined)
    await cargarReservas(user.id)
    setLoading(false)
  }, [router, setUserId, cargarPerfil, cargarHorarios, cargarReservas, setLoading])

  useEffect(() => {
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const procesarResultadoPago = useCallback((pago: string) => {
    if (pago === 'ok') { setMsgPago('✅ Pago completado. Membresía renovada.'); setTab('pagos') }
    else if (pago === 'cancel') { setMsgPago('❌ Pago cancelado.') }
  }, [])

  useEffect(() => {
    const pago = searchParams.get('pago')
    if (!pago) return
    procesarResultadoPago(pago)
  }, [searchParams, procesarResultadoPago])

  const seleccionarDia = async (fecha: string, horariosD: HorarioSocio[]) => {
    setHorariosDelDia(horariosD)
    setModalFecha(fecha)
    await actualizarOcupacion(fecha, horariosD)
  }

  const handleReservar = async (horarioId: string, fecha: string) => {
    if (!userId) return
    setReservaError('')
    const result = await reservar(horarioId, fecha, userId, horariosDelDia)
    if (!result.ok) return
    if (result.accion === 'confirmada' || result.accion === 'cancelada') setModal(null)
  }

  const pagarMembresia = async (tipoMembresia: string) => {
    if (!userId) return
    setPagando(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) { console.error('Sin sesión activa'); return }
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ tipoMembresia }),
      })
      const data = await res.json()
      if (data.url) window.location.assign(data.url as string)
    } catch (err) { console.error('Error pago:', err) }
    finally { setPagando(false) }
  }

  const logout = async () => { await supabase.auth.signOut(); router.push('/') }

  const estadoMembresia = perfil ? getEstadoMembresiaAdmin(perfil) : 'ok'
  const diasRestantes = perfil?.membresia_vence ? getDiasRestantes(perfil.membresia_vence) : 0

  const normalizarFechaReserva = (value: string) => String(value).slice(0, 10)

  const estaReservadoEnFecha = (horarioId: string, fecha: string) =>
    reservas.some(r => r.horario_id === horarioId && normalizarFechaReserva(r.fecha) === fecha)

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#888', fontFamily: 'system-ui' }}>Cargando...</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', color: '#f0f0f0', fontFamily: 'system-ui', paddingBottom: '80px' }}>

      {/* Banners de estado */}
      {estadoMembresia === 'caducada' && (
        <div style={{ background: 'rgba(255,92,92,0.15)', borderBottom: '1px solid rgba(255,92,92,0.3)', padding: '10px 20px', fontSize: '13px', color: '#ff5c5c', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
          <span>
            ❌ Tu membresía ha caducado. {tab === 'pagos' ? 'Puedes renovarla más abajo.' : 'Renuévala desde la pestaña Pagos.'}
          </span>
          {tab !== 'pagos' && (
            <button
              onClick={() => setTab('pagos')}
              style={{ border: '1px solid rgba(255,92,92,0.4)', background: 'rgba(255,92,92,0.12)', color: '#ff9a9a', borderRadius: '8px', padding: '4px 10px', fontSize: '12px', cursor: 'pointer' }}
            >
              Ir a Pagos
            </button>
          )}
        </div>
      )}
      {estadoMembresia === 'pronto' && (
        <div style={{ background: 'rgba(255,184,77,0.12)', borderBottom: '1px solid rgba(255,184,77,0.3)', padding: '10px 20px', fontSize: '13px', color: '#ffb84d' }}>
          ⚠️ Tu membresía vence en {diasRestantes} día{diasRestantes !== 1 ? 's' : ''}. Renuévala pronto.
        </div>
      )}
      {msgPago && (
        <div style={{ background: msgPago.includes('✅') ? 'rgba(200,245,66,0.1)' : 'rgba(255,92,92,0.1)', borderBottom: `1px solid ${msgPago.includes('✅') ? 'rgba(200,245,66,0.2)' : 'rgba(255,92,92,0.2)'}`, padding: '10px 20px', fontSize: '13px', color: msgPago.includes('✅') ? '#c8f542' : '#ff5c5c' }}>
          {msgPago}
        </div>
      )}


      <div style={{ padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#a1a1aa', fontSize: '12px' }}>
        JGS Fight Team - Área de socio
      </div>

      {/* Tabs */}
      {tab === 'clases' && (
        <SocioClasesTab
          perfil={perfil}
          horarios={horarios}
          reservas={reservas}
          ocupacion={ocupacion}
          modalFecha={modalFecha}
          horariosDelDia={horariosDelDia}
          onSeleccionarDia={seleccionarDia}
          onAbrirModal={setModal}
        />
      )}
      {tab === 'historial' && userId && <SocioHistorialTab userId={userId} />}
      {tab === 'pagos' && userId && <SocioPagosTab userId={userId} perfil={perfil} pagando={pagando} onPagar={pagarMembresia} />}
      {tab === 'qr' && <SocioQRTab perfil={perfil} qrUrl={qrUrl} />}
      {tab === 'perfil' && (
        <SocioPerfilTab
          perfil={perfil}
          reservas={reservas}
          horarios={horarios}
          onVerPagos={() => setTab('pagos')}
          onLogout={logout}
        />
      )}

      {/* Modal reserva */}
      {modal && (
        <div onClick={(e) => { if (e.target === e.currentTarget) { setModal(null); setReservaError('') } }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '24px 24px 0 0', padding: '24px 20px 36px', width: '100%', maxWidth: '480px' }}>
            <div style={{ width: '36px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', margin: '0 auto 20px' }}></div>
            <div style={{ fontSize: '22px', fontWeight: '800', marginBottom: '4px' }}>{modal.actividad_nombre}</div>
            <div style={{ fontSize: '13px', color: '#888', marginBottom: '20px' }}>
              {modal.fecha} · {modal.hora_inicio} · {modal.duracion_min} min
              {modal.profesor && <span style={{ color: '#5ca8ff' }}> · {modal.profesor}</span>}
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '13px' }}>
                <span style={{ color: '#888' }}>Ocupación</span>
                <span>
                  {`${ocupacion[`${modal.id}_${modal.fecha}`]?.count ?? 0} / ${modal.aforo_max} plazas`}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '13px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                <span style={{ color: '#888' }}>Estado</span>
                <span style={{ color: estaReservadoEnFecha(modal.id, modal.fecha) ? '#c8f542' : '#888' }}>
                  {estaReservadoEnFecha(modal.id, modal.fecha) ? '✓ Reservada' : 'No reservada'}
                </span>
              </div>
            </div>

            {/* Mensaje de error de reserva */}
            {reservaError && (
              <div style={{ marginBottom: '12px', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', background: 'rgba(255,92,92,0.1)', border: '1px solid rgba(255,92,92,0.2)', color: '#ff5c5c' }}>
                {reservaError}
              </div>
            )}

            {(() => {
              const key = `${modal.id}_${modal.fecha}`
              const llena = (ocupacion[key]?.count ?? 0) >= modal.aforo_max && !estaReservadoEnFecha(modal.id, modal.fecha)
              const procesando = isReservaEnCurso(modal.id, modal.fecha)
              const deshabilitado = llena || procesando
              return (
                <button onClick={() => !deshabilitado && handleReservar(modal.id, modal.fecha)} disabled={deshabilitado}
                  style={{ width: '100%', border: 'none', borderRadius: '12px', padding: '14px', fontSize: '15px', fontWeight: '700', cursor: deshabilitado ? 'not-allowed' : 'pointer', fontFamily: 'system-ui', background: deshabilitado ? 'rgba(255,255,255,0.06)' : estaReservadoEnFecha(modal.id, modal.fecha) ? 'rgba(255,92,92,0.12)' : '#c8f542', color: deshabilitado ? '#555' : estaReservadoEnFecha(modal.id, modal.fecha) ? '#ff5c5c' : '#0f0f0f' }}>
                  {procesando ? 'Procesando...' : llena ? 'Clase completa' : estaReservadoEnFecha(modal.id, modal.fecha) ? 'Cancelar reserva' : 'Reservar plaza'}
                </button>
              )
            })()}
          </div>
        </div>
      )}

      {/* Nav inferior */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(18,18,18,0.95)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-around', padding: '10px 0 20px' }}>
        {navTabs.map(n => (
          <button key={n.key} onClick={() => setTab(n.key)}
            style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '3px', cursor: 'pointer', padding: '4px 10px', borderRadius: '10px', border: 'none', background: 'transparent', fontFamily: 'system-ui', color: tab === n.key ? '#c8f542' : '#888' }}>
            <span style={{ fontSize: '20px' }}>{n.icon}</span>
            <span style={{ fontSize: '10px', fontWeight: '500' }}>{n.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default function SocioPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#888', fontFamily: 'system-ui' }}>Cargando...</p>
      </div>
    }>
      <SocioPageInner />
    </Suspense>
  )
}
