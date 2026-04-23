'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export function useAdminData() {
  const [clases, setClases] = useState<any[]>([])
  const [socios, setSocios] = useState<any[]>([])
  const [gymId, setGymId] = useState('')
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => { init() }, [])

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }
    const { data: gym } = await supabase.from('gimnasios').select('id').single()
    if (gym) {
      setGymId(gym.id)
      await loadClases(gym.id)
    }
    await loadSocios()
    setLoading(false)
  }

  const loadClases = async (gid: string) => {
    const { data } = await supabase
      .from('clases').select('*')
      .eq('gym_id', gid).eq('activa', true)
      .order('dia_semana')
    setClases(data || [])
  }

  const loadSocios = async () => {
    const { data } = await supabase
      .from('perfiles').select('*')
      .eq('rol', 'socio').order('nombre')
    setSocios(data || [])
  }

  const crearClase = async (nueva: {
    nombre: string; dia_semana: number; hora_inicio: string; duracion_min: number; aforo_max: number
  }) => {
    if (!nueva.nombre.trim()) return
    await supabase.from('clases').insert({ ...nueva, gym_id: gymId })
    await loadClases(gymId)
  }

  const eliminarClase = async (id: string) => {
    await supabase.from('clases').update({ activa: false }).eq('id', id)
    await loadClases(gymId)
  }

  const toggleActivarSocio = async (socio: any) => {
    const nuevoEstado = !socio.membresia_activa
    await supabase.from('perfiles').update({ membresia_activa: nuevoEstado }).eq('id', socio.id)
    await loadSocios()
    return { ...socio, membresia_activa: nuevoEstado }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return {
    clases, socios, gymId, loading,
    loadClases, loadSocios,
    crearClase, eliminarClase, toggleActivarSocio,
    logout,
  }
}
