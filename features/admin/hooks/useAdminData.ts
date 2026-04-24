'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Socio } from '@/types/domain'

export interface AdminStats {
  actividadesActivas: number
  horariosActivos: number
  puntualasProximas: number
  sociosActivos: number
}

export function useAdminData() {
  const [socios, setSocios] = useState<Socio[]>([])
  const [gymId, setGymId] = useState('')
  const [stats, setStats] = useState<AdminStats>({ actividadesActivas: 0, horariosActivos: 0, puntualasProximas: 0, sociosActivos: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const loadSocios = useCallback(async () => {
    const { data, error: err } = await supabase
      .from('perfiles').select('*').eq('rol', 'socio').order('nombre')
    if (err) console.error('[useAdminData] loadSocios:', err.message)
    if (mountedRef.current) setSocios((data as Socio[]) || [])
  }, [])

  const loadStats = useCallback(async (gid: string) => {
    const hoy = new Date().toISOString().split('T')[0]
    const [{ count: actAct }, { count: horAct }, { count: puntProx }, { count: socAct }] = await Promise.all([
      supabase.from('actividades').select('id', { count: 'exact', head: true }).eq('gym_id', gid).eq('activa', true),
      supabase.from('horarios_clase').select('id', { count: 'exact', head: true }).eq('gym_id', gid).eq('activo', true),
      supabase.from('sesiones').select('id', { count: 'exact', head: true }).eq('es_puntual', true).eq('cancelada', false).gte('fecha', hoy),
      supabase.from('perfiles').select('id', { count: 'exact', head: true }).eq('rol', 'socio').eq('membresia_activa', true),
    ])
    if (mountedRef.current) setStats({
      actividadesActivas: actAct || 0,
      horariosActivos: horAct || 0,
      puntualasProximas: puntProx || 0,
      sociosActivos: socAct || 0,
    })
  }, [])

  const init = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      const { data: gym, error: gymError } = await supabase.from('gimnasios').select('id').single()
      if (gymError) throw new Error('No se pudo cargar el gimnasio')
      if (!gym) throw new Error('Gimnasio no encontrado')
      if (mountedRef.current) setGymId(gym.id)
      await Promise.all([loadSocios(), loadStats(gym.id)])
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al inicializar'
      console.error('[useAdminData] init error:', msg)
      if (mountedRef.current) setError(msg)
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [router, loadSocios, loadStats])

  useEffect(() => {
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
    socios, gymId, stats, loading, error,
    loadSocios, loadStats,
    toggleActivarSocio,
    logout,
  }
}
