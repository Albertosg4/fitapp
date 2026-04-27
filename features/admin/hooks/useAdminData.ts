'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Socio } from '@/types/domain'

export interface AdminStats {
  actividadesActivas: number
  horariosActivos: number
  puntualesProximas: number
  sociosActivos: number
}

export function useAdminData() {
  const [socios, setSocios] = useState<Socio[]>([])
  const [gymId, setGymId] = useState('')
  const [stats, setStats] = useState<AdminStats>({ actividadesActivas: 0, horariosActivos: 0, puntualesProximas: 0, sociosActivos: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const loadSocios = useCallback(async (gid?: string) => {
    const gymIdToUse = gid || gymId
    if (!gymIdToUse) {
      console.error('[useAdminData] loadSocios: gym_id no disponible')
      return
    }
    const { data, error: err } = await supabase
      .from('perfiles')
      .select('*')
      .eq('rol', 'socio')
      .eq('gym_id', gymIdToUse)
      .order('nombre')
    if (err) console.error('[useAdminData] loadSocios:', err.message)
    if (mountedRef.current) setSocios((data as Socio[]) || [])
  }, [gymId])

  const loadStats = useCallback(async (gid: string) => {
    const hoy = new Date().toISOString().split('T')[0]
    const { data: actividadesData, error: actividadesError } = await supabase
      .from('actividades')
      .select('id')
      .eq('gym_id', gid)
    if (actividadesError) {
      console.error('[useAdminData] loadStats actividades:', actividadesError.message)
    }

    const actividadIds = (actividadesData || []).map(a => String(a.id))
    const puntualesProximasPromise = actividadIds.length > 0
      ? supabase
        .from('sesiones')
        .select('id', { count: 'exact', head: true })
        .eq('es_puntual', true)
        .eq('cancelada', false)
        .gte('fecha', hoy)
        .in('actividad_id', actividadIds)
      // Límite conocido: sesiones puntuales sin actividad_id no pueden aislarse por gym de forma segura
      // mientras sesiones no tenga gym_id directo.
      : Promise.resolve({ count: 0, error: null } as { count: number | null; error: null })

    const [{ count: actAct, error: actErr }, { count: horAct, error: horErr }, { count: puntProx, error: puntErr }, { count: socAct, error: socErr }] = await Promise.all([
      supabase.from('actividades').select('id', { count: 'exact', head: true }).eq('gym_id', gid).eq('activa', true),
      supabase.from('horarios_clase').select('id', { count: 'exact', head: true }).eq('gym_id', gid).eq('activo', true),
      puntualesProximasPromise,
      supabase.from('perfiles').select('id', { count: 'exact', head: true }).eq('rol', 'socio').eq('gym_id', gid).eq('membresia_activa', true),
    ])
    if (actErr) console.error('[useAdminData] loadStats actividadesActivas:', actErr.message)
    if (horErr) console.error('[useAdminData] loadStats horariosActivos:', horErr.message)
    if (puntErr) console.error('[useAdminData] loadStats puntualesProximas:', puntErr.message)
    if (socErr) console.error('[useAdminData] loadStats sociosActivos:', socErr.message)
    if (mountedRef.current) setStats({
      actividadesActivas: actAct || 0,
      horariosActivos: horAct || 0,
      puntualesProximas: puntProx || 0,
      sociosActivos: socAct || 0,
    })
  }, [])

  const init = useCallback(async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError) throw new Error('No se pudo validar la sesión')
      if (!user) { router.push('/'); return }

      const { data: perfil, error: perfilError } = await supabase
        .from('perfiles')
        .select('id, rol, gym_id')
        .eq('id', user.id)
        .maybeSingle()

      if (perfilError) throw new Error('No se pudo cargar el perfil del admin')
      if (!perfil) throw new Error('Perfil de admin no encontrado')
      if (perfil.rol !== 'admin') throw new Error('Acceso denegado: usuario sin rol admin')
      if (!perfil.gym_id) throw new Error('El perfil admin no tiene gym_id asignado')

      if (mountedRef.current) setGymId(perfil.gym_id)
      await Promise.all([loadSocios(perfil.gym_id), loadStats(perfil.gym_id)])
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

  const logout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return {
    socios, gymId, stats, loading, error,
    loadSocios, loadStats,
    logout,
  }
}
