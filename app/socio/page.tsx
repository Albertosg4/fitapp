'use client'
import { useEffect, useState, useCallback, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import CalendarioMes from '@/components/CalendarioMes'
import HistorialAsistencia from '@/components/HistorialAsistencia'
import HistorialPagos from '@/components/HistorialPagos'
import { getEstadoMembresiaAdmin, getDiasRestantes, TIPOS_MEMBRESIA } from '@/lib/domain/membresias'
import { useSocioData } from '@/features/socio/hooks/useSocioData'
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

  const estaReservadaEnFecha = (claseId: string, fecha: string) =>
    reservas.some(r => r.clase_id === claseId && r.fecha === fecha)

  const handleReservar = async (claseId: string, fecha: string) => {
    if (!userId) return
    await reservar(claseId, fecha, userId, clases, reservas, ocupacion)
    setModal(null)
  }

  const pagarMembresia = async (tipoMembresia: string) => {
    if (!userId) return
    setPagando(true)
    try {
      // Obtener token de sesión — el userId y las URLs se derivan en servidor
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        console.error('Sin sesión activa')
        return
      }
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
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

  const estadoMembresia = perfil ? getEstadoMembresiaAdmin(perfil) : 'ok'
  const diasRestantes = perfil?.membresia_vence ? getDiasRestantes(perfil.membresia_vence) : 0
  const marcadores: Record<string, 'reservada' | 'disponible' | 'llena'> = {}
  reservas.forEach(r => { if (r.fecha) marcadores[r.fecha] = 'reservada' })
  const logout = async () => { await supabase.auth.signOut(); router.push('/') }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#888', fontFamily: 'system-ui' }}>Cargando...</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', color: '#f0f0f0', fontFamily: 'system-ui', paddingBottom: '80px' }}>
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

      {tab === 'clases' && (
        <div style={{ background: 'linear-gradient(160deg, #1a2a0a 0%, #0f0f0f 60%)', padding: '28px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ fontSize: '13px', color: '#888' }}>Buenos días,</div>
          <div style={{ fontSize: '22px', fontWeight: '800' }}>{perfil?.nombre || 'Socio'} <span style={{ color: '#c8f542' }}>👋</span></div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '10px', background: estadoMembresia === 'caducada' ? 'rgba(255,92,92,0.1)' : 'rgba(200,245,66,0.1)', border: `1px solid ${estadoMembresia === 'caducada' ? 'rgba(255,92,92,0.2)' : 'rgba(200,245,66,0.2)'}`, borderRadius: '20px', padding: '4px 12px', fontSize: '12px', color: estadoMembresia === 'caducada' ? '#ff5c5c' : '#c8f542' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: estadoMembresia === 'caducada' ? '#ff5c5c' : '#c8f542', display: 'inline-block' }}></span>
            {perfil?.tipo_membresia || 'Básica'} · {estadoMembresia === 'caducada' ? 'Caducada' : 'Activa'}
          </div>
        </div>
      )}
      {tab === 'historial' && <div style={{ background: '#181818', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '16px 20px' }}><div style={{ fontSize: '18px', fontWeight: '800' }}>Mi historial</div></div>}
      {tab === 'pagos' && <div style={{ background: '#181818', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '16px 20px' }}><div style={{ fontSize: '18px', fontWeight: '800' }}>Mis pagos</div></div>}
      {tab === 'qr' && <div style={{ background: '#181818', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '16px 20px' }}><div style={{ fontSize: '18px', fontWeight: '800' }}>Mi acceso</div></div>}
      {tab === 'perfil' && (
        <div style={{ background: '#181818', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: '800' }}>Mi perfil</div>
          <button onClick={logout} style={{ background: 'rgba(255,92,92,0.12)', color: '#ff5c5c', border: '1px solid rgba(255,92,92,0.2)', borderRadius: '8px', padding: '6px 14px', fontSize: '13px', cursor: 'pointer', fontFamily: 'system-ui' }}>Salir</button>
        </div>
      )}

      {tab === 'clases' && (
        <div style={{ padding: '20px' }}>
          <CalendarioMes clases={clases} onSeleccionarDia={seleccionarDia} marcadores={marcadores} />
          {modalFecha && clasesDelDia.length === 0 && <p style={{ color: '#888', textAlign: 'center', padding: '20px 0', fontSize: '13px' }}>Sin clases este día</p>}
          {modalFecha && clasesDelDia.map(c => {
            const key = `${c.id}_${modalFecha}`
            const reservada = estaReservadaEnFecha(c.id, modalFecha)
            const ocupadas = ocupacion[key]?.count ?? 0
            const libres = c.aforo_max - ocupadas
            const llena = libres <= 0 && !reservada
            const porcentaje = Math.min((ocupadas / c.aforo_max) * 100, 100)
            const colorBarra = porcentaje >= 90 ? '#ff5c5c' : porcentaje >= 60 ? '#ffb84d' : '#c8f542'
            return (
              <div key={c.id} onClick={() => setModal({ ...c, fecha: modalFecha })} style={{ background: '#1e1e1e', border: `1px solid ${reservada ? 'rgba(200,245,66,0.4)' : llena ? 'rgba(255,92,92,0.2)' : 'rgba(255,255,255,0.07)'}`, borderLeft: reservada ? '3px solid #c8f542' : llena ? '3px solid #ff5c5c' : '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '16px', marginBottom: '12px', cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <div style={{ fontSize: '17px', fontWeight: '700' }}>{c.nombre}</div>
                    <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{c.hora_inicio} · {c.duracion_min} min</div>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: '600', borderRadius: '20px', padding: '3px 10px', background: reservada ? 'rgba(200,245,66,0.15)' : llena ? 'rgba(255,92,92,0.15)' : 'rgba(255,255,255,0.07)', color: reservada ? '#c8f542' : llena ? '#ff5c5c' : '#888' }}>
                    {reservada ? '✓ Reservada' : llena ? 'Llena' : `${libres}/${c.aforo_max} libres`}
                  </span>
                </div>
                <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${porcentaje}%`, background: reservada ? '#c8f542' : colorBarra, borderRadius: '2px', transition: 'width 0.3s' }}></div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'historial' && userId && (
        <div style={{ padding: '20px' }}>
          <HistorialAsistencia userId={userId} limit={50} compact={false} />
        </div>
      )}

      {tab === 'pagos' && userId && (
        <div style={{ padding: '20px' }}>
          <HistorialPagos userId={userId} compact={false} />
          <div style={{ marginTop: '24px' }}>
            <div style={{ fontSize: '11px', color: '#888', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>Renovar membresía</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {TIPOS_MEMBRESIA.map(t => (
                <button key={t.value} onClick={() => pagarMembresia(t.value)} disabled={pagando}
                  style={{ background: '#1e1e1e', border: '1px solid rgba(200,245,66,0.2)', borderRadius: '12px', padding: '12px', cursor: 'pointer', fontFamily: 'system-ui', textAlign: 'left', opacity: pagando ? 0.6 : 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#c8f542' }}>{t.label}</div>
                </button>
              ))}
            </div>
            {pagando && <p style={{ color: '#888', fontSize: '12px', textAlign: 'center', marginTop: '8px' }}>Redirigiendo a pago...</p>}
          </div>
        </div>
      )}

      {tab === 'qr' && (
        <div style={{ padding: '32px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: '#888', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '20px' }}>Tu acceso</div>
          {qrUrl ? (
            <div style={{ background: 'white', borderRadius: '20px', padding: '24px', margin: '0 auto 20px', width: '200px', display: 'inline-block' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrUrl} alt="QR de acceso" style={{ width: '200px', height: '200px', display: 'block' }} />
            </div>
          ) : (
            <div style={{ background: '#1e1e1e', borderRadius: '20px', padding: '24px', margin: '0 auto 20px', width: '200px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#888', fontSize: '13px' }}>Generando QR...</span>
            </div>
          )}
          <div style={{ fontSize: '13px', color: '#888', marginBottom: '4px' }}>Tu identificador</div>
          <div style={{ fontFamily: 'monospace', fontSize: '22px', fontWeight: '800', color: '#c8f542', letterSpacing: '3px' }}>
            FIT-{perfil?.qr_token?.slice(0, 4).toUpperCase() || '0000'}
          </div>
          <p style={{ fontSize: '13px', color: '#888', marginTop: '16px', lineHeight: '1.6' }}>
            Muestra este QR al entrar al gym<br />o al hacer check-in en una clase
          </p>
        </div>
      )}

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
          <div style={{ margin: '16px 20px', background: estadoMembresia === 'caducada' ? 'linear-gradient(135deg, #2a0a0a, #1a0808)' : estadoMembresia === 'pronto' ? 'linear-gradient(135deg, #2a1a0a, #1a1208)' : 'linear-gradient(135deg, #1a2a0a, #162210)', border: `1px solid ${estadoMembresia === 'caducada' ? 'rgba(255,92,92,0.2)' : estadoMembresia === 'pronto' ? 'rgba(255,184,77,0.2)' : 'rgba(200,245,66,0.2)'}`, borderRadius: '14px', padding: '18px' }}>
            <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Membresía</div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: estadoMembresia === 'caducada' ? '#ff5c5c' : estadoMembresia === 'pronto' ? '#ffb84d' : '#c8f542' }}>{perfil?.tipo_membresia || 'Básica'}</div>
            <div style={{ fontSize: '12px', color: estadoMembresia === 'caducada' ? '#ff5c5c' : estadoMembresia === 'pronto' ? '#ffb84d' : '#42f5b3', marginTop: '8px' }}>
              {estadoMembresia === 'caducada' ? '❌ Caducada' : estadoMembresia === 'pronto' ? `⚠️ Vence en ${diasRestantes} días` : `✓ Válida hasta ${perfil?.membresia_vence || 'N/A'}`}
            </div>
          </div>
          <div style={{ padding: '0 20px 20px' }}>
            <button onClick={() => setTab('pagos')} style={{ width: '100%', background: 'rgba(200,245,66,0.08)', border: '1px solid rgba(200,245,66,0.2)', borderRadius: '12px', padding: '12px', color: '#c8f542', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: 'system-ui' }}>
              💳 Ver mis pagos y renovar membresía
            </button>
          </div>
          <div style={{ padding: '0 20px' }}>
            <div style={{ fontSize: '11px', color: '#888', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>Clases reservadas</div>
            {reservas.length === 0 ? (
              <p style={{ color: '#888', fontSize: '13px' }}>No tienes reservas activas.</p>
            ) : reservas.map(r => {
              const c = clases.find(x => x.id === r.clase_id)
              if (!c) return null
              return (
                <div key={r.id} style={{ background: '#1e1e1e', border: '1px solid rgba(200,245,66,0.2)', borderRadius: '10px', padding: '12px 14px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '14px' }}>{c.nombre}</div>
                    <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{r.fecha} · {c.hora_inicio}</div>
                  </div>
                  <span style={{ fontSize: '11px', background: 'rgba(200,245,66,0.12)', color: '#c8f542', padding: '3px 10px', borderRadius: '20px' }}>✓</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

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
                <button onClick={() => !llena && handleReservar(modal.id, modal.fecha)} disabled={llena} style={{ width: '100%', border: 'none', borderRadius: '12px', padding: '14px', fontSize: '15px', fontWeight: '700', cursor: llena ? 'not-allowed' : 'pointer', fontFamily: 'system-ui', background: llena ? 'rgba(255,255,255,0.06)' : estaReservadaEnFecha(modal.id, modal.fecha) ? 'rgba(255,92,92,0.12)' : '#c8f542', color: llena ? '#555' : estaReservadaEnFecha(modal.id, modal.fecha) ? '#ff5c5c' : '#0f0f0f' }}>
                  {llena ? 'Clase completa' : estaReservadaEnFecha(modal.id, modal.fecha) ? 'Cancelar reserva' : 'Reservar plaza'}
                </button>
              )
            })()}
          </div>
        </div>
      )}

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
