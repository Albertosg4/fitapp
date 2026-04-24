'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Actividad, HorarioClase } from '@/types/domain'

const cardStyle = { background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '14px', marginBottom: '10px' }
const inputStyle = { width: '100%', background: '#181818', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '10px 14px', color: '#f0f0f0', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'system-ui' }

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

interface Props {
  gymId: string
}

interface HorarioConActividad extends HorarioClase {
  actividad?: { nombre: string; color: string | null }
}

export default function HorariosTab({ gymId }: Props) {
  const [horarios, setHorarios] = useState<HorarioConActividad[]>([])
  const [actividades, setActividades] = useState<Actividad[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    actividad_id: '',
    dia_semana: 0,
    hora_inicio: '07:00',
    duracion_min: 60,
    aforo_max: 15,
    profesor: '',
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_fin: '',
  })
  const [guardando, setGuardando] = useState(false)
  const [msg, setMsg] = useState('')

  const cargar = useCallback(async () => {
    const [{ data: hor }, { data: act }] = await Promise.all([
      supabase.from('horarios_clase')
        .select('*, actividad:actividades(nombre, color)')
        .eq('gym_id', gymId).order('dia_semana').order('hora_inicio'),
      supabase.from('actividades').select('*').eq('gym_id', gymId).eq('activa', true).order('nombre'),
    ])
    setHorarios((hor as unknown as HorarioConActividad[]) || [])
    setActividades((act as Actividad[]) || [])
    if (act && act.length > 0 && !form.actividad_id) {
      setForm(f => ({ ...f, actividad_id: (act[0] as Actividad).id }))
    }
    setLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gymId])

  useEffect(() => { cargar() }, [cargar])

  const crear = async () => {
    if (!form.actividad_id) { setMsg('❌ Selecciona una actividad'); return }
    setGuardando(true); setMsg('')
    const { error } = await supabase.from('horarios_clase').insert({
      gym_id: gymId,
      actividad_id: form.actividad_id,
      dia_semana: form.dia_semana,
      hora_inicio: form.hora_inicio,
      duracion_min: form.duracion_min,
      aforo_max: form.aforo_max,
      profesor: form.profesor.trim() || null,
      fecha_inicio: form.fecha_inicio,
      fecha_fin: form.fecha_fin || null,
    })
    if (error) { setMsg('❌ Error: ' + error.message) }
    else {
      setMsg('✅ Horario creado')
      setForm(f => ({ ...f, profesor: '', fecha_fin: '' }))
      await cargar()
    }
    setGuardando(false)
  }

  const toggleActivo = async (h: HorarioConActividad) => {
    // Desactivar no borra reservas existentes
    const { error } = await supabase
      .from('horarios_clase').update({ activo: !h.activo }).eq('id', h.id)
    if (error) { console.error('[HorariosTab] toggleActivo:', error.message); return }
    await cargar()
  }

  if (loading) return <p style={{ color: '#888', textAlign: 'center', padding: '40px 0', fontSize: '13px' }}>Cargando...</p>

  return (
    <div>
      {/* Formulario nuevo horario */}
      <div style={{ background: '#1a1a1a', border: '1px solid rgba(200,245,66,0.15)', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
        <div style={{ fontSize: '13px', fontWeight: '700', color: '#c8f542', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>Nuevo horario recurrente</div>

        {actividades.length === 0 ? (
          <p style={{ color: '#ffb84d', fontSize: '13px', marginBottom: '12px' }}>⚠️ Primero crea una actividad en la pestaña Actividades.</p>
        ) : (
          <>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', color: '#888', fontSize: '12px', marginBottom: '6px', fontWeight: '500' }}>ACTIVIDAD</label>
              <select style={inputStyle} value={form.actividad_id} onChange={e => setForm({ ...form, actividad_id: e.target.value })}>
                {actividades.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              <div>
                <label style={{ display: 'block', color: '#888', fontSize: '12px', marginBottom: '6px', fontWeight: '500' }}>DÍA</label>
                <select style={inputStyle} value={form.dia_semana} onChange={e => setForm({ ...form, dia_semana: parseInt(e.target.value) })}>
                  {DIAS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
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
              <label style={{ display: 'block', color: '#888', fontSize: '12px', marginBottom: '6px', fontWeight: '500' }}>PROFESOR (OPCIONAL)</label>
              <input style={inputStyle} placeholder="Nombre del profesor" value={form.profesor} onChange={e => setForm({ ...form, profesor: e.target.value })} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', color: '#888', fontSize: '12px', marginBottom: '6px', fontWeight: '500' }}>DESDE</label>
                <input type="date" style={inputStyle} value={form.fecha_inicio} onChange={e => setForm({ ...form, fecha_inicio: e.target.value })} />
              </div>
              <div>
                <label style={{ display: 'block', color: '#888', fontSize: '12px', marginBottom: '6px', fontWeight: '500' }}>HASTA (OPCIONAL)</label>
                <input type="date" style={inputStyle} value={form.fecha_fin} onChange={e => setForm({ ...form, fecha_fin: e.target.value })} />
              </div>
            </div>
            {msg && (
              <div style={{ marginBottom: '10px', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', background: msg.includes('✅') ? 'rgba(200,245,66,0.1)' : 'rgba(255,92,92,0.1)', color: msg.includes('✅') ? '#c8f542' : '#ff5c5c' }}>
                {msg}
              </div>
            )}
            <button onClick={crear} disabled={guardando}
              style={{ background: '#c8f542', color: '#0f0f0f', border: 'none', borderRadius: '10px', padding: '11px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', width: '100%', fontFamily: 'system-ui', opacity: guardando ? 0.6 : 1 }}>
              {guardando ? 'Guardando...' : '+ Añadir horario'}
            </button>
          </>
        )}
      </div>

      {/* Lista de horarios */}
      {horarios.length === 0 ? (
        <p style={{ color: '#888', textAlign: 'center', padding: '20px 0', fontSize: '13px' }}>Sin horarios recurrentes.</p>
      ) : horarios.map(h => (
        <div key={h.id} style={{ ...cardStyle, opacity: h.activo ? 1 : 0.5, borderLeft: `3px solid ${h.actividad?.color || '#c8f542'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '700' }}>{h.actividad?.nombre || '—'}</div>
              <div style={{ fontSize: '12px', color: '#888', marginTop: '3px' }}>
                {DIAS[h.dia_semana]} · {String(h.hora_inicio).slice(0, 5)} · {h.duracion_min} min · Aforo: {h.aforo_max}
              </div>
              {h.profesor && <div style={{ fontSize: '12px', color: '#5ca8ff', marginTop: '2px' }}>👤 {h.profesor}</div>}
              {h.fecha_fin && <div style={{ fontSize: '11px', color: '#ffb84d', marginTop: '2px' }}>Hasta {h.fecha_fin}</div>}
            </div>
            <button onClick={() => toggleActivo(h)}
              style={{ background: h.activo ? 'rgba(255,92,92,0.1)' : 'rgba(200,245,66,0.1)', border: `1px solid ${h.activo ? 'rgba(255,92,92,0.2)' : 'rgba(200,245,66,0.2)'}`, borderRadius: '8px', padding: '5px 10px', fontSize: '12px', cursor: 'pointer', color: h.activo ? '#ff5c5c' : '#c8f542', fontFamily: 'system-ui', flexShrink: 0 }}>
              {h.activo ? 'Desactivar' : 'Activar'}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
