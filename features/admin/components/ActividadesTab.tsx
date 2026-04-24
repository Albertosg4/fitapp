'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Actividad } from '@/types/domain'

const cardStyle = { background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '14px', marginBottom: '10px' }
const inputStyle = { width: '100%', background: '#181818', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '10px 14px', color: '#f0f0f0', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'system-ui' }

interface Props {
  gymId: string
}

export default function ActividadesTab({ gymId }: Props) {
  const [actividades, setActividades] = useState<Actividad[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ nombre: '', descripcion: '', color: '#c8f542' })
  const [guardando, setGuardando] = useState(false)
  const [msg, setMsg] = useState('')
  const [expandida, setExpandida] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    const { data } = await supabase
      .from('actividades').select('*')
      .eq('gym_id', gymId).order('nombre')
    setActividades((data as Actividad[]) || [])
    setLoading(false)
  }, [gymId])

  useEffect(() => { cargar() }, [cargar])

  const crear = async () => {
    if (!form.nombre.trim()) { setMsg('❌ El nombre es obligatorio'); return }
    setGuardando(true); setMsg('')
    const { error } = await supabase.from('actividades').insert({
      gym_id: gymId,
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim() || null,
      color: form.color,
    })
    if (error) { setMsg('❌ Error: ' + error.message) }
    else {
      setMsg('✅ Actividad creada')
      setForm({ nombre: '', descripcion: '', color: '#c8f542' })
      await cargar()
    }
    setGuardando(false)
  }

  const toggleActiva = async (actividad: Actividad) => {
    const { error } = await supabase
      .from('actividades').update({ activa: !actividad.activa }).eq('id', actividad.id)
    if (error) { console.error('[ActividadesTab] toggleActiva:', error.message); return }
    await cargar()
  }

  if (loading) return <p style={{ color: '#888', textAlign: 'center', padding: '40px 0', fontSize: '13px' }}>Cargando...</p>

  return (
    <div>
      {/* Formulario nueva actividad */}
      <div style={{ background: '#1a1a1a', border: '1px solid rgba(200,245,66,0.15)', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
        <div style={{ fontSize: '13px', fontWeight: '700', color: '#c8f542', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>Nueva actividad</div>
        <div style={{ marginBottom: '10px' }}>
          <input style={inputStyle} placeholder="Nombre (ej: Boxeo, CrossFit, Yoga...)" value={form.nombre}
            onChange={e => setForm({ ...form, nombre: e.target.value })} />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <input style={inputStyle} placeholder="Descripción (opcional)" value={form.descripcion}
            onChange={e => setForm({ ...form, descripcion: e.target.value })} />
        </div>
        <div style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ fontSize: '12px', color: '#888' }}>Color:</label>
          <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })}
            style={{ width: '40px', height: '32px', border: 'none', borderRadius: '6px', cursor: 'pointer', background: 'transparent' }} />
          <span style={{ fontSize: '12px', color: '#888', fontFamily: 'monospace' }}>{form.color}</span>
        </div>
        {msg && (
          <div style={{ marginBottom: '10px', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', background: msg.includes('✅') ? 'rgba(200,245,66,0.1)' : 'rgba(255,92,92,0.1)', color: msg.includes('✅') ? '#c8f542' : '#ff5c5c' }}>
            {msg}
          </div>
        )}
        <button onClick={crear} disabled={guardando}
          style={{ background: '#c8f542', color: '#0f0f0f', border: 'none', borderRadius: '10px', padding: '11px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', width: '100%', fontFamily: 'system-ui', opacity: guardando ? 0.6 : 1 }}>
          {guardando ? 'Guardando...' : '+ Añadir actividad'}
        </button>
      </div>

      {/* Lista de actividades */}
      {actividades.length === 0 ? (
        <p style={{ color: '#888', textAlign: 'center', padding: '20px 0', fontSize: '13px' }}>Sin actividades. Crea la primera.</p>
      ) : actividades.map(a => (
        <div key={a.id} style={{ ...cardStyle, opacity: a.activa ? 1 : 0.5, borderLeft: `3px solid ${a.color || '#c8f542'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ cursor: 'pointer' }} onClick={() => setExpandida(expandida === a.id ? null : a.id)}>
              <div style={{ fontSize: '15px', fontWeight: '700' }}>{a.nombre}</div>
              {a.descripcion && <div style={{ fontSize: '12px', color: '#888', marginTop: '3px' }}>{a.descripcion}</div>}
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '20px', background: a.activa ? 'rgba(200,245,66,0.12)' : 'rgba(255,255,255,0.06)', color: a.activa ? '#c8f542' : '#555' }}>
                {a.activa ? 'Activa' : 'Inactiva'}
              </span>
              <button onClick={() => toggleActiva(a)}
                style={{ background: a.activa ? 'rgba(255,92,92,0.1)' : 'rgba(200,245,66,0.1)', border: `1px solid ${a.activa ? 'rgba(255,92,92,0.2)' : 'rgba(200,245,66,0.2)'}`, borderRadius: '8px', padding: '5px 10px', fontSize: '12px', cursor: 'pointer', color: a.activa ? '#ff5c5c' : '#c8f542', fontFamily: 'system-ui' }}>
                {a.activa ? 'Desactivar' : 'Activar'}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
