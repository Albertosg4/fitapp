'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui'
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
}

export default function HistorialPagos({ userId }: Props) {
  const [pagos, setPagos] = useState<Pago[]>([])
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)

  const cargarPagos = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('pagos').select('*')
        .eq('user_id', userId)
        .order('fecha_pago', { ascending: false })
      if (error) throw error
      setPagos(data || [])
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

  const formatearFecha = (fecha: string) => new Date(fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })

  const formatearImporte = (importe: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(importe)

  const labelMetodo = (metodo: string) => {
    if (metodo === 'stripe') return '💳 Tarjeta'
    if (metodo === 'efectivo') return '💵 Efectivo'
    return '🏦 Transferencia'
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>Cargando pagos...</div>

  if (pagos.length === 0) return (
    <div style={{ textAlign: 'center', padding: '24px', color: '#888', fontSize: '13px', border: '1px dashed rgba(255,255,255,0.12)', borderRadius: '12px' }}>
      <p style={{ fontSize: '24px', marginBottom: '8px' }}>💳</p>
      Aún no hay pagos registrados.
    </div>
  )

  const pagosParaMostrar = showAll ? pagos : pagos.slice(0, 1)
  const shouldShowToggle = pagos.length > 1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {pagosParaMostrar.map(p => {
        const c = colorMetodo(p.metodo)
        return (
          <div key={p.id} style={{ background: '#1e1e1e', border: `1px solid ${p.estado === 'pendiente' ? 'rgba(255,184,77,0.2)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '12px', padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '15px', fontWeight: '700', color: '#f0f0f0', textTransform: 'capitalize' }}>{p.tipo_membresia} · {p.meses} {p.meses === 1 ? 'mes' : 'meses'}</div>
                <div style={{ fontSize: '12px', color: '#888', marginTop: '3px' }}>{formatearFecha(p.fecha_pago)}</div>
                {p.notas && <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>{p.notas}</div>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#c8f542' }}>{formatearImporte(Number(p.importe))}</div>
                <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '20px', background: c.bg, color: c.color }}>{labelMetodo(p.metodo)}</span>
              </div>
            </div>
            <div style={{ marginTop: '8px' }}>
              <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: p.estado === 'pagado' ? 'rgba(200,245,66,0.1)' : 'rgba(255,184,77,0.1)', color: p.estado === 'pagado' ? '#c8f542' : '#ffb84d' }}>
                {p.estado === 'pagado' ? '✓ Pagado' : '⏳ Pendiente'}
              </span>
            </div>
          </div>
        )
      })}

      {shouldShowToggle && (
        <Button
          onClick={() => setShowAll(prev => !prev)}
          variant="ghost"
          className="w-full !border !border-lime-300/20 !bg-[#1e1e1e] !text-lime-300 hover:!bg-zinc-800/80 hover:!text-lime-200"
        >
          {showAll ? 'Ver menos' : 'Ver historial completo'}
        </Button>
      )}
    </div>
  )
}
