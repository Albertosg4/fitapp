'use client'
import { useEffect, useState, useCallback, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import { getEstadoMembresiaAdmin, getDiasRestantes } from '@/lib/domain/membresias'
import { useSocioData } from '@/features/socio/hooks/useSocioData'
import SocioClasesTab from '@/features/socio/components/SocioClasesTab'
import SocioHistorialTab from '@/features/socio/components/SocioHistorialTab'
import SocioPagosTab from '@/features/socio/components/SocioPagosTab'
import SocioQRTab from '@/features/socio/components/SocioQRTab'
import SocioPerfilTab from '@/features/socio/components/SocioPerfilTab'
import type { Clase } from '@/types/domain'

function SocioPageInner() {
  const {
    perfil,
    clases,
    reservas,
    ocupacion,
    qrUrl,
    userId, setUserId,
    loading, setLoading,
    cargarReservas,
    cargarPerfil,
    cargarClases,
    actualizarOcupacion,
    reservar,
  } = useSocioData()

  const [tab, setTab] = useState('clases')
  const [modal, setModal] = useState<(Clase & { fecha: string }) | null>(null)
  const [modalFecha, setModalFecha] = useState<string>('')
  const [clasesDelDia, setClasesDelDia] = useState<Clase[]>([])
  const [pagando, setPagando] = useState(false)
  const [msgPago, setMsgPago] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  const init = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }
    setUserId(user.id)
    await cargarPerfil(user.id)
    await cargarClases()
    await cargarReservas(user.id)
    setLoading(false)
  }, [router, setUserId, cargarPerfil, cargarClases, cargarReservas, setLoading])

  useEffect(() => {
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const procesarResultadoPago = useCallback((pago: string) => {
    if (pago === 'ok') {
      setMsgPago('✅ Pago completado. Membresía renovada.')
      setTab('pagos')
    } else if (pago === 'cancel') {
      setMsgPago('❌ Pago cancelado.')
    }
  }, [])

  useEffect(() => {
    const pago = searchParams.get('pago')
    if (!pago) return
    procesarResultadoPago(pago)
  }, [searchParams, procesarResultadoPago])

  const seleccionarDia = async (fecha: string, clasesD: Clase[]) => {
    setClasesDelDia(clasesD)
    setModalFecha(fecha)
    await actualizarOcupacion(fecha, clasesD)
  }

  const handleReservar = async (claseId: string, fecha: string) => {
    if (!userId) return
    await reservar(claseId, fecha, userId, clases, reservas, ocupacion)
    setModal(null)
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
    } catch (err) {
      console.error('Error pago:', err)
    } finally {
      setPagando(false)
    }
  }

  const logout = async () => { await supabase.auth.signOut(); router.push('/') }

  const estadoMembresia = perfil ? getEstadoMembresiaAdmin(perfil) : 'ok'
  const diasRestantes = perfil?.membresia_vence ? getDiasRestantes(perfil.membresia_vence) : 0

  const estaReservadaEnFecha = (claseId: string, fecha: string) =>
    reservas.some(r => r.clase_id === claseId && r.fecha === fecha)

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#888', fontFamily: 'system-ui' }}>Cargando...</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', color: '#f0f0f0', fontFamily: 'system-ui', paddingBottom: '80px' }}>

      {/* Banners de estado */}
      {estadoMembresia === 'caducada' && (
        <div style={{ background: 'rgba(255,92,92,0.15)', borderBottom: '1px solid rgba(255,92,92,0.3)', padding: '10px 20px', fontSize: '13px', color: '#ff5c5c' }}>
          ❌ Tu membresía ha caducado. Renuévala desde la pestaña Perfil.
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

      {/* Tabs */}
      {tab === 'clases' && (
        <SocioClasesTab
          perfil={perfil}
          clases={clases}
          reservas={reservas}
          ocupacion={ocupacion}
          modalFecha={modalFecha}
          clasesDelDia={clasesDelDia}
          onSeleccionarDia={seleccionarDia}
          onAbrirModal={setModal}
        />
      )}
      {tab === 'historial' && userId && <SocioHistorialTab userId={userId} />}
      {tab === 'pagos' && userId && <SocioPagosTab userId={userId} pagando={pagando} onPagar={pagarMembresia} />}
      {tab === 'qr' && <SocioQRTab perfil={perfil} qrUrl={qrUrl} />}
      {tab === 'perfil' && (
        <SocioPerfilTab
          perfil={perfil}
          reservas={reservas}
          clases={clases}
          onVerPagos={() => setTab('pagos')}
          onLogout={logout}
        />
      )}

      {/* Modal reserva */}
      {modal && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setModal(null) }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '24px 24px 0 0', padding: '24px 20px 36px', width: '100%', maxWidth: '480px' }}>
            <div style={{ width: '36px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', margin: '0 auto 20px' }}></div>
            <div style={{ fontSize: '22px', fontWeight: '800', marginBottom: '4px' }}>{modal.nombre}</div>
            <div style={{ fontSize: '13px', color: '#888', marginBottom: '20px' }}>{modal.fecha} · {modal.hora_inicio} · {modal.duracion_min} min</div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '13px' }}>
                <span style={{ color: '#888' }}>Ocupación</span>
                <span>{ocupacion[`${modal.id}_${modal.fecha}`]?.count ?? 0} / {modal.aforo_max} plazas</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '13px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                <span style={{ color: '#888' }}>Estado</span>
                <span style={{ color: estaReservadaEnFecha(modal.id, modal.fecha) ? '#c8f542' : '#888' }}>
                  {estaReservadaEnFecha(modal.id, modal.fecha) ? '✓ Reservada' : 'No reservada'}
                </span>
              </div>
            </div>
            {(() => {
              const key = `${modal.id}_${modal.fecha}`
              const llena = (ocupacion[key]?.count ?? 0) >= modal.aforo_max && !estaReservadaEnFecha(modal.id, modal.fecha)
              return (
                <button onClick={() => !llena && handleReservar(modal.id, modal.fecha)} disabled={llena}
                  style={{ width: '100%', border: 'none', borderRadius: '12px', padding: '14px', fontSize: '15px', fontWeight: '700', cursor: llena ? 'not-allowed' : 'pointer', fontFamily: 'system-ui', background: llena ? 'rgba(255,255,255,0.06)' : estaReservadaEnFecha(modal.id, modal.fecha) ? 'rgba(255,92,92,0.12)' : '#c8f542', color: llena ? '#555' : estaReservadaEnFecha(modal.id, modal.fecha) ? '#ff5c5c' : '#0f0f0f' }}>
                  {llena ? 'Clase completa' : estaReservadaEnFecha(modal.id, modal.fecha) ? 'Cancelar reserva' : 'Reservar plaza'}
                </button>
              )
            })()}
          </div>
        </div>
      )}

      {/* Nav inferior */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(18,18,18,0.95)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-around', padding: '10px 0 20px' }}>
        {[
          { key: 'clases',    icon: '🗓',  label: 'Clases' },
          { key: 'historial', icon: '📋',  label: 'Historial' },
          { key: 'pagos',     icon: '💳',  label: 'Pagos' },
          { key: 'qr',        icon: '⬛',  label: 'Mi QR' },
          { key: 'perfil',    icon: '👤',  label: 'Perfil' },
        ].map(n => (
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
