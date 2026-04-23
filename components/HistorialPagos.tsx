'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface Pago {
  id: string
  importe: number
  tipo_membresia: string
  meses: number
  fecha_pago: string
  metodo: string
  estado: string
  notas: string | null
}

interface Props {
  userId: string
  compact?: boolean
}

export default function HistorialPagos({ userId, compact = false }: Props) {
  const [pagos, setPagos] = useState<Pago[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)

  const cargarPagos = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('pagos').select('*')
        .eq('user_id', userId)
        .order('fecha_pago', { ascending: false })
      if (error) throw error
      setPagos(data || [])
      setTotal((data || []).reduce((sum, p) => sum + Number(p.importe), 0))
    } catch (err) {
      console.error('Error cargando pagos:', err)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (!userId) return
    cargarPagos()
  }, [userId, cargarPagos])

  const colorMetodo = (metodo: string) => {
    if (metodo === 'stripe') return { bg: 'rgba(92,168,255,0.12)', color: '#5ca8ff' }
    if (metodo === 'efectivo') return { bg: 'rgba(200,245,66,0.12)', color: '#c8f542' }
    return { bg: 'rgba(255,184,77,0.12)', color: '#ffb84d' }
  }

  const labelMetodo = (metodo: string) => {
    if (metodo === 'stripe') return '💳 Tarjeta'
    if (metodo === 'efectivo') return '💵 Efectivo'
    return '🏦 Transferencia'
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
      <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid #c8f542', borderTopColor: 'transparent' }} />
    </div>
  )

  if (pagos.length === 0) return (
    <div style={{ textAlign: 'center', padding: '24px', color: '#888', fontSize: '13px' }}>
      <p style={{ fontSize: '24px', marginBottom: '8px' }}>💳</p>
      Sin pagos registrados
    </div>
  )

  if (compact) return (
    <div>
      <p style={{ fontSize: '12px', color: '#888', marginBottom: '12px' }}>{pagos.length} pagos · Total: {total.toFixed(2)}€</p>
      <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', textAlign: 'left' }}>
            {['Fecha', 'Tipo', 'Importe', 'Método', 'Estado'].map(h => (
              <th key={h} style={{ paddingBottom: '8px', color: '#888', fontWeight: '500', paddingRight: '12px' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pagos.map(p => {
            const c = colorMetodo(p.metodo)
            return (
              <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '8px 12px 8px 0', color: '#aaa' }}>{new Date(p.fecha_pago).toLocaleDateString('es-ES')}</td>
                <td style={{ padding: '8px 12px 8px 0', fontWeight: '600', color: '#f0f0f0', textTransform: 'capitalize' }}>{p.tipo_membresia}</td>
                <td style={{ padding: '8px 12px 8px 0', color: '#c8f542', fontWeight: '700' }}>{Number(p.importe).toFixed(2)}€</td>
                <td style={{ padding: '8px 12px 8px 0' }}>
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: c.bg, color: c.color }}>{labelMetodo(p.metodo)}</span>
                </td>
                <td style={{ padding: '8px 0' }}>
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: p.estado === 'pagado' ? 'rgba(200,245,66,0.1)' : 'rgba(255,184,77,0.1)', color: p.estado === 'pagado' ? '#c8f542' : '#ffb84d' }}>
                    {p.estado === 'pagado' ? '✓ Pagado' : '⏳ Pendiente'}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
        <div style={{ background: 'rgba(200,245,66,0.08)', border: '1px solid rgba(200,245,66,0.15)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#c8f542' }}>{pagos.length}</div>
          <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>Pagos realizados</div>
        </div>
        <div style={{ background: 'rgba(92,168,255,0.08)', border: '1px solid rgba(92,168,255,0.15)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#5ca8ff' }}>{total.toFixed(0)}€</div>
          <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>Total pagado</div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {pagos.map(p => {
          const c = colorMetodo(p.metodo)
          return (
            <div key={p.id} style={{ background: '#1e1e1e', border: `1px solid ${p.estado === 'pendiente' ? 'rgba(255,184,77,0.2)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '12px', padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#f0f0f0', textTransform: 'capitalize' }}>{p.tipo_membresia} · {p.meses} {p.meses === 1 ? 'mes' : 'meses'}</div>
                  <div style={{ fontSize: '12px', color: '#888', marginTop: '3px' }}>{new Date(p.fecha_pago).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                  {p.notas && <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>{p.notas}</div>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: '#c8f542' }}>{Number(p.importe).toFixed(2)}€</div>
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: c.bg, color: c.color }}>{labelMetodo(p.metodo)}</span>
                </div>
              </div>
              {p.estado === 'pendiente' && (
                <div style={{ marginTop: '8px', padding: '6px 10px', background: 'rgba(255,184,77,0.08)', borderRadius: '8px', fontSize: '12px', color: '#ffb84d' }}>⏳ Pago pendiente de confirmar</div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
