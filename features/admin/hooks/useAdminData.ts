'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Clase, Socio } from '@/types/domain'

export function useAdminData() {
  const [clases, setClases] = useState<Clase[]>([])
  const [socios, setSocios] = useState<Socio[]>([])
  const [gymId, setGymId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const loadClases = useCallback(async (gid: string) => {
    const { data, error: err } = await supabase
      .from('clases').select('*')
      .eq('gym_id', gid).eq('activa', true).order('dia_semana')
    if (err) console.error('[useAdminData] loadClases:', err.message)
    if (mountedRef.current) setClases((data as Clase[]) || [])
  }, [])

  const loadSocios = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('perfiles').select('*').eq('rol', 'socio').order('nombre')
    if (err) console.error('[useAdminData] loadSocios:', err.message)
    if (mountedRef.current) setSocios((data as Socio[]) || [])
  }, [])

  const init = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      const { data: gym, error: gymError } = await supabase.from('gimnasios').select('id').single()
      if (gymError) throw new Error('No se pudo cargar el gimnasio')
      if (!gym) throw new Error('Gimnasio no encontrado')
      if (mountedRef.current) setGymId(gym.id)
      await Promise.all([loadClases(gym.id), loadSocios()])
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al inicializar'
      console.error('[useAdminData] init error:', msg)
      if (mountedRef.current) setError(msg)
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [router, loadClases, loadSocios])

  useEffect(() => {
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const crearClase = async (nueva: Omit<Clase, 'id' | 'gym_id' | 'activa'>) => {
    if (!nueva.nombre.trim()) return
    const { error: err } = await supabase.from('clases').insert({ ...nueva, gym_id: gymId })
    if (err) { console.error('[useAdminData] crearClase:', err.message); return }
    await loadClases(gymId)
  }

  const eliminarClase = async (id: string) => {
    const { error: err } = await supabase.from('clases').update({ activa: false }).eq('id', id)
    if (err) { console.error('[useAdminData] eliminarClase:', err.message); return }
    await loadClases(gymId)
  }

  const toggleActivarSocio = async (socio: Socio): Promise<Socio> => {
    const nuevoEstado = !socio.membresia_activa
    const { error: err } = await supabase
      .from('perfiles').update({ membresia_activa: nuevoEstado }).eq('id', socio.id)
    if (err) console.error('[useAdminData] toggleActivarSocio:', err.message)
    await loadSocios()
    return { ...socio, membresia_activa: nuevoEstado }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return {
    clases, socios, gymId, loading, error,
    loadClases, loadSocios,
    crearClase, eliminarClase, toggleActivarSocio,
    logout,
  }
}
