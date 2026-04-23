'use client'
import HistorialAsistencia from '@/components/HistorialAsistencia'
import { supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'

const cardStyle = { background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '14px', marginBottom: '10px' }
const inputStyle = { width: '100%', background: '#181818', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '10px 14px', color: '#f0f0f0', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'system-ui' }

const TIPOS_MEMBRESIA = [
  { value: 'mensual', label: 'Mensual' },
  { value: 'trimestral', label: 'Trimestral' },
  { value: 'semestral', label: 'Semestral' },
  { value: 'anual', label: 'Anual' },
]
const METODOS = [
  { value: 'efectivo', label: '💵 Efectivo' },
  { value: 'transferencia', label: '🏦 Transferencia' },
  { value: 'cortesia', label: '🎁 Cortesía (0€)' },
]
const IMPORTES: Record<string, number> = {
  mensual: 49.99, trimestral: 129.99, semestral: 229.99, anual: 399.99,
}

function getEstadoMembresia(socio: any) {
  if (!socio.membresia_activa) return 'caducada'
  if (!socio.membresia_vence) return 'ok'
  const diff = Math.ceil((new Date(socio.membresia_vence).getTime() - Date.now()) / 86400000)
  if (diff < 0) return 'caducada'
  if (diff <= 7) return 'pronto'
  return 'ok'
}

// ── Subcomponente: pagos de un socio ─────────────────────────────────────────
function SocioPagosAdmin({ userId, onRefresh }: { userId: string; onRefresh: () => void }) {
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

// ── Props principales ────────────────────────────────────────────────────────
interface Props {
  socios: any[]
  gymId: string
  onRefreshSocios: () => void
}

export default function SociosTab({ socios, gymId, onRefreshSocios }: Props) {
  const [modalSocio, setModalSocio] = useState<any>(null)
  const [tabModal, setTabModal] = useState<'info' | 'historial' | 'pagos'>('info')
  const [modalPago, setModalPago] = useState<any>(null)
  const [formPago, setFormPago] = useState({ tipoMembresia: 'mensual', metodo: 'efectivo', estado: 'pagado', notas: '' })
  const [guardandoPago, setGuardandoPago] = useState(false)
  const [msgPago, setMsgPago] = useState('')

  const abrirModalSocio = (socio: any) => { setModalSocio(socio); setTabModal('info') }

  const toggleActivar = async () => {
    if (!modalSocio) return
    const nuevoEstado = !modalSocio.membresia_activa
    await supabase.from('perfiles').update({ membresia_activa: nuevoEstado }).eq('id', modalSocio.id)
    setModalSocio({ ...modalSocio, membresia_activa: nuevoEstado })
    onRefreshSocios()
  }

  const abrirModalPago = (socio: any) => {
    setModalPago(socio)
    setFormPago({ tipoMembresia: 'mensual', metodo: 'efectivo', estado: 'pagado', notas: '' })
    setMsgPago('')
  }

  const guardarPago = async () => {
    if (!modalPago) return
    setGuardandoPago(true); setMsgPago('')
    try {
      const res = await fetch('/api/pagos/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: modalPago.id, gymId,
          tipoMembresia: formPago.tipoMembresia,
          metodo: formPago.metodo,
          estado: formPago.metodo === 'cortesia' ? 'pagado' : formPago.estado,
          notas: formPago.notas,
        }),
      })
      const data = await res.json()
      if (data.ok) {
        const esCortesia = formPago.metodo === 'cortesia'
        setMsgPago(formPago.estado === 'pagado' || esCortesia
          ? `✅ ${esCortesia ? 'Cortesía registrada' : 'Pago registrado'}. Membresía renovada.`
          : '✅ Pago pendiente registrado.')
        onRefreshSocios()
      } else {
        setMsgPago('❌ Error: ' + data.error)
      }
    } catch { setMsgPago('❌ Error de conexión') }
    finally { setGuardandoPago(false) }
  }

  const importeFormPago = formPago.metodo === 'cortesia' ? 0 : (IMPORTES[formPago.tipoMembresia] || 0)

  return (
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
              {([['info', '⚙️ Gestión'], ['historial', '📋 Asistencia'], ['pagos', '💳 Pagos']] as const).map(([key, label]) => (
                <button key={key} onClick={() => setTabModal(key)}
                  style={{ flex: 1, padding: '8px 4px', fontSize: '12px', fontWeight: '500', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'system-ui', background: tabModal === key ? '#2a2a2a' : 'transparent', color: tabModal === key ? '#c8f542' : '#888' }}>
                  {label}
                </button>
              ))}
            </div>

            {tabModal === 'info' && (
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
                <button onClick={toggleActivar}
                  style={{ width: '100%', border: `1px solid ${modalSocio.membresia_activa ? 'rgba(255,92,92,0.3)' : 'rgba(200,245,66,0.3)'}`, borderRadius: '10px', padding: '12px', background: 'transparent', color: modalSocio.membresia_activa ? '#ff5c5c' : '#c8f542', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: 'system-ui' }}>
                  {modalSocio.membresia_activa ? 'Dar de baja' : 'Reactivar socio'}
                </button>
              </div>
            )}
            {tabModal === 'historial' && <HistorialAsistencia userId={modalSocio.id} limit={100} compact={true} />}
            {tabModal === 'pagos' && <SocioPagosAdmin userId={modalSocio.id} onRefresh={onRefreshSocios} />}

            <button onClick={() => setModalSocio(null)} style={{ width: '100%', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '12px', background: 'transparent', color: '#888', fontSize: '14px', cursor: 'pointer', fontFamily: 'system-ui', marginTop: '10px' }}>
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* MODAL PAGO */}
      {modalPago && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setModalPago(null) }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '24px 24px 0 0', padding: '24px 20px 36px', width: '100%', maxWidth: '480px' }}>
            <div style={{ width: '36px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', margin: '0 auto 20px' }}></div>
            <div style={{ fontSize: '18px', fontWeight: '800', marginBottom: '2px' }}>Registrar pago</div>
            <div style={{ fontSize: '13px', color: '#888', marginBottom: '20px' }}>{modalPago.nombre}</div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', color: '#888', fontSize: '12px', marginBottom: '6px', fontWeight: '500', textTransform: 'uppercase' }}>Tipo de membresía</label>
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
              <label style={{ display: 'block', color: '#888', fontSize: '12px', marginBottom: '6px', fontWeight: '500', textTransform: 'uppercase' }}>Método</label>
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
                <label style={{ display: 'block', color: '#888', fontSize: '12px', marginBottom: '6px', fontWeight: '500', textTransform: 'uppercase' }}>Estado</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  <button onClick={() => setFormPago({ ...formPago, estado: 'pagado' })}
                    style={{ padding: '10px', borderRadius: '10px', border: `1px solid ${formPago.estado === 'pagado' ? 'rgba(200,245,66,0.5)' : 'rgba(255,255,255,0.07)'}`, background: formPago.estado === 'pagado' ? 'rgba(200,245,66,0.1)' : '#181818', color: formPago.estado === 'pagado' ? '#c8f542' : '#888', cursor: 'pointer', fontFamily: 'system-ui', fontSize: '13px', fontWeight: '600' }}>✓ Pagado</button>
                  <button onClick={() => setFormPago({ ...formPago, estado: 'pendiente' })}
                    style={{ padding: '10px', borderRadius: '10px', border: `1px solid ${formPago.estado === 'pendiente' ? 'rgba(255,184,77,0.5)' : 'rgba(255,255,255,0.07)'}`, background: formPago.estado === 'pendiente' ? 'rgba(255,184,77,0.1)' : '#181818', color: formPago.estado === 'pendiente' ? '#ffb84d' : '#888', cursor: 'pointer', fontFamily: 'system-ui', fontSize: '13px', fontWeight: '600' }}>⏳ Pendiente</button>
                </div>
              </div>
            )}

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: '#888', fontSize: '12px', marginBottom: '6px', fontWeight: '500', textTransform: 'uppercase' }}>Notas (opcional)</label>
              <input value={formPago.notas} onChange={e => setFormPago({ ...formPago, notas: e.target.value })}
                placeholder={formPago.metodo === 'cortesia' ? 'Ej: Mes gratis por referido' : 'Ej: Pagó en recepción'}
                style={{ ...inputStyle }} />
            </div>

            <div style={{ padding: '12px 16px', background: formPago.metodo === 'cortesia' ? 'rgba(168,85,247,0.08)' : 'rgba(200,245,66,0.06)', border: `1px solid ${formPago.metodo === 'cortesia' ? 'rgba(168,85,247,0.2)' : 'rgba(200,245,66,0.15)'}`, borderRadius: '10px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#888', fontSize: '13px' }}>Importe</span>
                <span style={{ color: formPago.metodo === 'cortesia' ? '#a855f7' : '#c8f542', fontWeight: '800', fontSize: '20px' }}>
                  {formPago.metodo === 'cortesia' ? '0€' : `${importeFormPago}€`}
                </span>
              </div>
            </div>

            {msgPago && (
              <div style={{ marginBottom: '12px', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', background: msgPago.includes('✅') ? 'rgba(200,245,66,0.1)' : 'rgba(255,92,92,0.1)', color: msgPago.includes('✅') ? '#c8f542' : '#ff5c5c' }}>
                {msgPago}
              </div>
            )}

            <button onClick={guardarPago} disabled={guardandoPago}
              style={{ width: '100%', background: formPago.metodo === 'cortesia' ? '#a855f7' : '#c8f542', color: '#0f0f0f', border: 'none', borderRadius: '10px', padding: '13px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: 'system-ui', opacity: guardandoPago ? 0.6 : 1, marginBottom: '10px' }}>
              {guardandoPago ? 'Guardando...' : formPago.metodo === 'cortesia' ? '🎁 Aplicar cortesía' : formPago.estado === 'pagado' ? '✅ Confirmar pago' : '⏳ Registrar pendiente'}
            </button>
            <button onClick={() => setModalPago(null)} style={{ width: '100%', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '12px', background: 'transparent', color: '#888', fontSize: '14px', cursor: 'pointer', fontFamily: 'system-ui' }}>Cancelar</button>
          </div>
        </div>
      )}
    </>
  )
}
