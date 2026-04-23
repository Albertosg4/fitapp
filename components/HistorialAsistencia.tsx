'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface AsistenciaRow {
  id: string
  check_in_at: string
  metodo: string
  reservas: {
    sesiones: {
      fecha: string
      clases: { nombre: string }
    }
  }
}

interface AsistenciaDisplay {
  id: string
  fecha: string
  hora: string
  clase: string
  metodo: string
}

interface Props {
  userId: string
  limit?: number
  compact?: boolean
}

export default function HistorialAsistencia({ userId, limit = 20, compact = false }: Props) {
  const [historial, setHistorial] = useState<AsistenciaDisplay[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)

  const cargarHistorial = useCallback(async () => {
    setLoading(true)
    try {
      const { count } = await supabase
        .from('asistencia').select('*', { count: 'exact', head: true }).eq('user_id', userId)
      setTotal(count ?? 0)

      const { data, error } = await supabase
        .from('asistencia')
        .select(`id, check_in_at, metodo, reservas(sesiones(fecha, clases(nombre)))`)
        .eq('user_id', userId)
        .order('check_in_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      const rows: AsistenciaDisplay[] = (data as unknown as AsistenciaRow[]).map(row => {
        const dt = new Date(row.check_in_at)
        return {
          id: row.id,
          fecha: dt.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }),
          hora: dt.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          clase: row.reservas?.sesiones?.clases?.nombre ?? 'Clase eliminada',
          metodo: row.metodo ?? 'qr',
        }
      })
      setHistorial(rows)
    } catch (err) {
      console.error('Error cargando historial:', err)
    } finally {
      setLoading(false)
    }
  }, [userId, limit])

  useEffect(() => {
    if (!userId) return
    cargarHistorial()
  }, [userId, cargarHistorial])

  if (loading) return (
    <div className="flex items-center justify-center py-8">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
    </div>
  )

  if (historial.length === 0) return (
    <div className="text-center py-8 text-gray-400">
      <p className="text-2xl mb-2">📋</p>
      <p className="text-sm">Sin asistencias registradas todavía</p>
    </div>
  )

  if (compact) return (
    <div>
      <p className="text-xs text-gray-500 mb-2">Total: {total} asistencias</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
              <th className="pb-2 pr-4">Fecha</th>
              <th className="pb-2 pr-4">Hora</th>
              <th className="pb-2 pr-4">Clase</th>
              <th className="pb-2">Método</th>
            </tr>
          </thead>
          <tbody>
            {historial.map(row => (
              <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-2 pr-4 text-gray-700">{row.fecha}</td>
                <td className="py-2 pr-4 text-gray-500">{row.hora}</td>
                <td className="py-2 pr-4 font-medium text-gray-800">{row.clase}</td>
                <td className="py-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${row.metodo === 'qr' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                    {row.metodo === 'qr' ? '📱 QR' : '✋ Manual'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {total > limit && <p className="text-xs text-gray-400 mt-2 text-right">Mostrando los últimos {limit} de {total}</p>}
    </div>
  )

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-blue-50 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-blue-600">{total}</p>
          <p className="text-xs text-blue-500 mt-1">Asistencias totales</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-green-600">
            {historial.filter(r => {
              const d = new Date(r.fecha.split('/').reverse().join('-'))
              const now = new Date()
              return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
            }).length}
          </p>
          <p className="text-xs text-green-500 mt-1">Este mes</p>
        </div>
      </div>
      <div className="space-y-2">
        {historial.map(row => (
          <div key={row.id} className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-4 py-3 hover:border-blue-200 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-lg">🥊</div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">{row.clase}</p>
                <p className="text-xs text-gray-400">{row.fecha} · {row.hora}</p>
              </div>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.metodo === 'qr' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
              {row.metodo === 'qr' ? '📱 QR' : '✋ Manual'}
            </span>
          </div>
        ))}
      </div>
      {total > limit && <p className="text-xs text-gray-400 mt-4 text-center">Mostrando los últimos {limit} registros de {total}</p>}
    </div>
  )
}
