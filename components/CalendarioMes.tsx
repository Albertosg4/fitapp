import { useState } from 'react'
import type { Clase } from '@/types/domain'

interface Props {
  clases: Clase[]
  onSeleccionarDia: (fecha: string, clasesDelDia: Clase[]) => void
  marcadores?: Record<string, 'reservada' | 'disponible' | 'llena'>
}

const DIAS_CORTO = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const MESES_CORTO = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

export default function CalendarioMes({ clases, onSeleccionarDia, marcadores = {} }: Props) {
  const hoy = new Date()

  const getLunes = (fecha: Date) => {
    const d = new Date(fecha)
    const dia = (d.getDay() + 6) % 7
    d.setDate(d.getDate() - dia)
    d.setHours(0, 0, 0, 0)
    return d
  }

  const [lunesSemana, setLunesSemana] = useState(getLunes(hoy))
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>(hoy.toISOString().split('T')[0])

  const semana = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(lunesSemana)
    d.setDate(lunesSemana.getDate() + i)
    return d
  })

  const irSemanaAnterior = () => {
    const nueva = new Date(lunesSemana)
    nueva.setDate(nueva.getDate() - 7)
    setLunesSemana(nueva)
  }

  const irSemanaSiguiente = () => {
    const nueva = new Date(lunesSemana)
    nueva.setDate(nueva.getDate() + 7)
    setLunesSemana(nueva)
  }

  const getFecha = (d: Date) => d.toISOString().split('T')[0]

  const getClasesDelDia = (d: Date): Clase[] => {
    const diaSemanaIdx = (d.getDay() + 6) % 7
    return clases.filter(c => c.dia_semana === diaSemanaIdx)
  }

  const seleccionar = (d: Date) => {
    const fecha = getFecha(d)
    setFechaSeleccionada(fecha)
    onSeleccionarDia(fecha, getClasesDelDia(d))
  }

  const esHoy = (d: Date) => getFecha(d) === getFecha(hoy)
  const esSeleccionado = (d: Date) => getFecha(d) === fechaSeleccionada

  const mesInicio = semana[0]
  const mesFin = semana[6]
  const labelMes = mesInicio.getMonth() === mesFin.getMonth()
    ? `${MESES_CORTO[mesInicio.getMonth()]} ${mesInicio.getFullYear()}`
    : `${MESES_CORTO[mesInicio.getMonth()]} - ${MESES_CORTO[mesFin.getMonth()]} ${mesFin.getFullYear()}`

  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <button onClick={irSemanaAnterior} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '8px', padding: '6px 12px', color: '#888', cursor: 'pointer', fontSize: '16px', fontFamily: 'system-ui' }}>‹</button>
        <span style={{ fontSize: '13px', color: '#888', fontWeight: '600' }}>{labelMes}</span>
        <button onClick={irSemanaSiguiente} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '8px', padding: '6px 12px', color: '#888', cursor: 'pointer', fontSize: '16px', fontFamily: 'system-ui' }}>›</button>
      </div>
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {semana.map((d, i) => {
          const fecha = getFecha(d)
          const seleccionado = esSeleccionado(d)
          const hoyDia = esHoy(d)
          const tieneClases = getClasesDelDia(d).length > 0
          const marcador = marcadores[fecha]
          return (
            <button key={i} onClick={() => seleccionar(d)} style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '10px 12px', borderRadius: '12px', border: '1px solid', borderColor: seleccionado ? '#c8f542' : hoyDia ? 'rgba(200,245,66,0.2)' : 'rgba(255,255,255,0.07)', background: seleccionado ? '#c8f542' : hoyDia ? 'rgba(200,245,66,0.06)' : '#1e1e1e', cursor: 'pointer', fontFamily: 'system-ui', minWidth: '44px' }}>
              <span style={{ fontSize: '10px', fontWeight: '600', color: seleccionado ? '#0f0f0f' : '#888' }}>{DIAS_CORTO[i]}</span>
              <span style={{ fontSize: '18px', fontWeight: '800', color: seleccionado ? '#0f0f0f' : '#f0f0f0' }}>{d.getDate()}</span>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: seleccionado ? '#0f0f0f' : marcador === 'reservada' ? '#c8f542' : tieneClases ? 'rgba(255,255,255,0.2)' : 'transparent' }} />
            </button>
          )
        })}
      </div>
    </div>
  )
}
