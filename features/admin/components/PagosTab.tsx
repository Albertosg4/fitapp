'use client'
import { useState, useEffect, useCallback } from 'react'
import type { Pago } from '@/types/domain'

const cardStyle = { background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '14px', marginBottom: '10px' }
const inputStyle = { width: '100%', background: '#181818', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '10px 14px', color: '#f0f0f0', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'system-ui' }

interface Props {
  onSociosChange?: () => void
}

export default function PagosTab({ onSociosChange }: Props) {
  const [pagos, setPagos] = useState<Pago[]>([])
  const [loading, setLoading] = useState(false)
  const [filtroSocio, setFiltroSocio] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroMes, setFiltroMes] = useState('')

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/pagos')
      const data = await res.json()
      setPagos(data.pagos || [])
    } catch (err) {
      console.error('[PagosTab] Error cargando pagos:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargar()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const confirmarPago = async (pagoId: string) => {
    try {
      await fetch('/api/pagos/manual', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pagoId }),
      })
      await cargar()
      onSociosChange?.()
    } catch (err) {
      console.error('[PagosTab] Error confirmando pago:', err)
    }
  }

  const filtrados = pagos.filter(p => {
    const nombre = p.perfiles?.nombre?.toLowerCase() || ''
    if (filtroSocio && !nombre.includes(filtroSocio.toLowerCase())) return false
    if (filtroEstado && p.estado !== filtroEstado) return false
    if (filtroMes) {
      const mes = new Date(p.fecha_pago).toISOString().slice(0, 7)
      if (mes !== filtroMes) return false
    }
    return true
  })

  const totalCobrado = filtrados.filter(p => p.estado === 'pagado').reduce((s, p) => s + Number(p.importe), 0)
  const totalPendiente = filtrados.filter(p => p.estado === 'pendiente').reduce((s, p) => s + Number(p.importe), 0)

  const metodoLabel = (metodo: string) => {
    if (metodo === 'stripe') return '💳 Tarjeta'
    if (metodo === 'efectivo') return '💵 Efectivo'
    if (metodo === 'transferencia') return '🏦 Transferencia'
    return '🎁 Cortesía'
  }

  return (
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
        <input placeholder="Buscar socio..." value={filtroSocio} onChange={e => setFiltroSocio(e.target.value)}
          style={{ ...inputStyle, flex: 1, minWidth: '120px', padding: '8px 12px', fontSize: '13px' }} />
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
          style={{ ...inputStyle, width: 'auto', padding: '8px 12px', fontSize: '13px' }}>
          <option value="">Todos</option>
          <option value="pagado">Pagado</option>
          <option value="pendiente">Pendiente</option>
        </select>
        <input type="month" value={filtroMes} onChange={e => setFiltroMes(e.target.value)}
          style={{ ...inputStyle, width: 'auto', padding: '8px 12px', fontSize: '13px', colorScheme: 'dark' }} />
      </div>
      {loading ? (
        <p style={{ color: '#888', textAlign: 'center', padding: '20px 0', fontSize: '13px' }}>Cargando...</p>
      ) : filtrados.length === 0 ? (
        <p style={{ color: '#888', textAlign: 'center', padding: '20px 0', fontSize: '13px' }}>Sin pagos registrados</p>
      ) : filtrados.map(p => (
        <div key={p.id} style={{ ...cardStyle, borderLeft: p.estado === 'pendiente' ? '3px solid #ffb84d' : p.metodo === 'cortesia' ? '3px solid #a855f7' : '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '700' }}>{p.perfiles?.nombre || 'Sin nombre'}</div>
              <div style={{ fontSize: '12px', color: '#888', marginTop: '2px', textTransform: 'capitalize' }}>
                {p.tipo_membresia} · {metodoLabel(p.metodo)}
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
            <button onClick={() => confirmarPago(p.id)} style={{ marginTop: '10px', width: '100%', background: 'rgba(200,245,66,0.08)', border: '1px solid rgba(200,245,66,0.2)', borderRadius: '8px', padding: '8px', color: '#c8f542', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'system-ui' }}>
              ✓ Confirmar pago recibido
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
