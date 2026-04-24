'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Actividad } from '@/types/domain'
import { formatLocalDate } from '@/lib/domain/fechas'

const cardStyle = { background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '14px', marginBottom: '10px' }
const inputStyle = { width: '100%', background: '#181818', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '10px 14px', color: '#f0f0f0', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'system-ui' }

interface SesionPuntual {
  id: string
  fecha: string
  hora_inicio: string | null
  duracion_min: number | null
  aforo_max: number | null
  profesor: string | null
  notas: string | null
  cancelada: boolean | null
  es_puntual: boolean
  actividad_id: string | null
  actividad?: { nombre: string; color: string | null }
}

interface Props {
  gymId: string
}

export default function ClasesPuntualesTab({ gymId }: Props) {
  const [sesiones, setSesiones] = useState<SesionPuntual[]>([])
  const [actividades, setActividades] = useState<Actividad[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    actividad_id: '',
    nombre_libre: '',
    fecha: formatLocalDate(new Date()),
    hora_inicio: '07:00',
    duracion_min: 60,
    aforo_max: 15,
    profesor: '',
    notas: '',
  })
  const [guardando, setGuardando] = useState(false)
  const [msg, setMsg] = useState('')

  const cargar = useCallback(async () => {
    const [{ data: ses }, { data: act }] = await Promise.all([
      supabase.from('sesiones')
        .select('id, fecha, hora_inicio, duracion_min, aforo_max, profesor, notas, cancelada, es_puntual, actividad_id, actividad:actividades(nombre, color)')
        .eq('es_puntual', true)
        .order('fecha', { ascending: false })
        .limit(50),
      supabase.from('actividades').select('*').eq('gym_id', gymId).eq('activa', true).order('nombre'),
    ])
    setSesiones((ses as unknown as SesionPuntual[]) || [])
    setActividades((act as Actividad[]) || [])
    if (act && act.length > 0 && !form.actividad_id) {
      setForm(f => ({ ...f, actividad_id: (act[0] as Actividad).id }))
    }
    setLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gymId])

  useEffect(() => { cargar() }, [cargar])

  const crear = async () => {
    if (!form.fecha) { setMsg('❌ La fecha es obligatoria'); return }
    if (!form.actividad_id && !form.nombre_libre.trim()) { setMsg('❌ Selecciona actividad o escribe un nombre'); return }
    setGuardando(true); setMsg('')
    const { error } = await supabase.from('sesiones').insert({
      actividad_id: form.actividad_id || null,
      fecha: form.fecha,
      hora_inicio: form.hora_inicio || null,
      duracion_min: form.duracion_min || null,
      aforo_max: form.aforo_max || null,
      profesor: form.profesor.trim() || null,
      notas: form.notas.trim() || null,
      es_puntual: true,
      cancelada: false,
    })
    if (error) { setMsg('❌ Error: ' + error.message) }
    else {
      setMsg('✅ Clase puntual creada')
      setForm(f => ({ ...f, nombre_libre: '', notas: '', profesor: '' }))
      await cargar()
    }
    setGuardando(false)
  }

  const toggleCancelada = async (s: SesionPuntual) => {
    // Cancelar no borra reservas existentes
    const { error } = await supabase
      .from('sesiones').update({ cancelada: !s.cancelada }).eq('id', s.id)
    if (error) { console.error('[ClasesPuntualesTab] toggle:', error.message); return }
    await cargar()
  }

  if (loading) return <p style={{ color: '#888', textAlign: 'center', padding: '40px 0', fontSize: '13px' }}>Cargando...</p>

  return (
    <div>
      {/* Formulario nueva clase puntual */}
      <div style={{ background: '#1a1a1a', border: '1px solid rgba(200,245,66,0.15)', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
        <div style={{ fontSize: '13px', fontWeight: '700', color: '#c8f542', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>Nueva clase puntual</div>

        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', color: '#888', fontSize: '12px', marginBottom: '6px', fontWeight: '500' }}>ACTIVIDAD (O DEJA EN BLANCO PARA USAR NOMBRE LIBRE)</label>
          <select style={inputStyle} value={form.actividad_id} onChange={e => setForm({ ...form, actividad_id: e.target.value })}>
            <option value="">— Sin actividad / nombre libre —</option>
            {actividades.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </select>
        </div>
        {!form.actividad_id && (
          <div style={{ marginBottom: '10px' }}>
            <input style={inputStyle} placeholder="Nombre de la clase" value={form.nombre_libre}
              onChange={e => setForm({ ...form, nombre_libre: e.target.value })} />
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
          <div>
            <label style={{ display: 'block', color: '#888', fontSize: '12px', marginBottom: '6px', fontWeight: '500' }}>FECHA</label>
            <input type="date" style={inputStyle} value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} />
          </div>
          <div>
            <label style={{ display: 'block', color: '#888', fontSize: '12px', marginBottom: '6px', fontWeight: '500' }}>HORA</label>
            <input type="time" style={inputStyle} value={form.hora_inicio} onChange={e => setForm({ ...form, hora_inicio: e.target.value })} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
          <div>
            <label style={{ display: 'block', color: '#888', fontSize: '12px', marginBottom: '6px', fontWeight: '500' }}>DURACIÓN (MIN)</label>
            <input type="number" style={inputStyle} value={form.duracion_min} onChange={e => setForm({ ...form, duracion_min: parseInt(e.target.value) || 60 })} />
          </div>
          <div>
            <label style={{ display: 'block', color: '#888', fontSize: '12px', marginBottom: '6px', fontWeight: '500' }}>AFORO</label>
            <input type="number" style={inputStyle} value={form.aforo_max} onChange={e => setForm({ ...form, aforo_max: parseInt(e.target.value) || 1 })} />
          </div>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <input style={inputStyle} placeholder="Profesor (opcional)" value={form.profesor} onChange={e => setForm({ ...form, profesor: e.target.value })} />
        </div>
        <div style={{ marginBottom: '14px' }}>
          <input style={inputStyle} placeholder="Notas internas (opcional)" value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} />
        </div>
        {msg && (
          <div style={{ marginBottom: '10px', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', background: msg.includes('✅') ? 'rgba(200,245,66,0.1)' : 'rgba(255,92,92,0.1)', color: msg.includes('✅') ? '#c8f542' : '#ff5c5c' }}>
            {msg}
          </div>
        )}
        <button onClick={crear} disabled={guardando}
          style={{ background: '#c8f542', color: '#0f0f0f', border: 'none', borderRadius: '10px', padding: '11px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', width: '100%', fontFamily: 'system-ui', opacity: guardando ? 0.6 : 1 }}>
          {guardando ? 'Guardando...' : '+ Crear clase puntual'}
        </button>
      </div>

      {/* Lista de clases puntuales */}
      {sesiones.length === 0 ? (
        <p style={{ color: '#888', textAlign: 'center', padding: '20px 0', fontSize: '13px' }}>Sin clases puntuales.</p>
      ) : sesiones.map(s => (
        <div key={s.id} style={{ ...cardStyle, opacity: s.cancelada ? 0.4 : 1, borderLeft: `3px solid ${s.actividad?.color || '#5ca8ff'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '700' }}>{s.actividad?.nombre || '—'}</div>
              <div style={{ fontSize: '12px', color: '#888', marginTop: '3px' }}>
                {s.fecha} · {s.hora_inicio ? String(s.hora_inicio).slice(0, 5) : '—'} · {s.duracion_min ?? '—'} min · Aforo: {s.aforo_max ?? '—'}
              </div>
              {s.profesor && <div style={{ fontSize: '12px', color: '#5ca8ff', marginTop: '2px' }}>👤 {s.profesor}</div>}
              {s.notas && <div style={{ fontSize: '11px', color: '#888', fontStyle: 'italic', marginTop: '2px' }}>{s.notas}</div>}
              {s.cancelada && <div style={{ fontSize: '11px', color: '#ff5c5c', marginTop: '4px' }}>❌ Cancelada</div>}
            </div>
            <button onClick={() => toggleCancelada(s)}
              style={{ background: s.cancelada ? 'rgba(200,245,66,0.1)' : 'rgba(255,92,92,0.1)', border: `1px solid ${s.cancelada ? 'rgba(200,245,66,0.2)' : 'rgba(255,92,92,0.2)'}`, borderRadius: '8px', padding: '5px 10px', fontSize: '12px', cursor: 'pointer', color: s.cancelada ? '#c8f542' : '#ff5c5c', fontFamily: 'system-ui', flexShrink: 0 }}>
              {s.cancelada ? 'Reactivar' : 'Cancelar'}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
