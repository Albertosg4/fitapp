'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@/components/ui'

type EstadoCheckin = 'loading' | 'ok' | 'error'

function getTokenFromLocation(): string {
  try {
    const raw = new URL(window.location.href).searchParams.get('token')
    return raw?.trim() ?? ''
  } catch {
    return ''
  }
}

function CheckinInner() {
  const params = useSearchParams()
  const token = params.get('token')
  const [estado, setEstado] = useState<EstadoCheckin>('loading')
  const [nombre, setNombre] = useState('')
  const [msg, setMsg] = useState('')

  const procesarCheckin = useCallback(async (qrToken: string) => {
    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: qrToken }),
      })
      const data = await res.json()
      if (!res.ok) {
        setNombre(data.nombre || '')
        setEstado('error')
        setMsg(data.error || 'Error al procesar el check-in')
        return
      }
      setNombre(data.nombre || '')
      setEstado('ok')
      setMsg(data.msg || 'Check-in registrado ✅')
    } catch {
      setEstado('error')
      setMsg('Error de conexión')
    }
  }, [])

  const procesarTokenInvalido = useCallback(() => {
    setEstado('error')
    setMsg('Token inválido')
  }, [])

  useEffect(() => {
    const tokenFromQuery = token?.trim() ?? ''
    const tokenFromLocation = tokenFromQuery || getTokenFromLocation()
    if (tokenFromLocation) {
      procesarCheckin(tokenFromLocation)
      return
    }
    procesarTokenInvalido()
  }, [token, procesarCheckin, procesarTokenInvalido])

  const statusConfig = {
    loading: {
      badgeLabel: 'Procesando',
      badgeVariant: 'info' as const,
      icon: '⏳',
      title: 'Validando check-in',
      description: 'Estamos verificando tu acceso. Esto tarda unos segundos.',
    },
    ok: {
      badgeLabel: 'Completado',
      badgeVariant: 'success' as const,
      icon: '✅',
      title: 'Check-in confirmado',
      description: 'Tu entrada ha sido registrada correctamente.',
    },
    error: {
      badgeLabel: 'No completado',
      badgeVariant: 'danger' as const,
      icon: '❌',
      title: 'No se pudo completar',
      description: 'Revisa el estado del token o inténtalo de nuevo más tarde.',
    },
  }[estado]

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md items-center justify-center">
        <Card className="w-full !border-slate-800 !bg-slate-900/90 shadow-2xl shadow-slate-950/60 backdrop-blur">
          <CardHeader>
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-3xl" aria-hidden="true">{statusConfig.icon}</span>
              <Badge variant={statusConfig.badgeVariant}>{statusConfig.badgeLabel}</Badge>
            </div>
            <CardTitle className="text-xl text-white">{statusConfig.title}</CardTitle>
            <CardDescription className="text-slate-300">{statusConfig.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {estado === 'loading' ? (
              <div className="space-y-3">
                <Skeleton className="h-5 w-3/4 bg-slate-700" rounded="md" />
                <Skeleton className="h-16 w-full bg-slate-700" rounded="lg" />
              </div>
            ) : (
              <>
                {nombre ? (
                  <div className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Socio</p>
                    <p className="mt-1 text-lg font-semibold text-white">{nombre}</p>
                  </div>
                ) : null}
                <div className="rounded-xl border border-slate-700 bg-slate-800/70 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Resultado</p>
                  <p className="mt-1 text-sm font-medium text-slate-100">{msg}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

export default function CheckinPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6">
          <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md items-center justify-center">
            <Card className="w-full !border-slate-800 !bg-slate-900/90">
              <CardHeader>
                <Skeleton className="mb-3 h-6 w-24 bg-slate-700" rounded="full" />
                <Skeleton className="h-7 w-2/3 bg-slate-700" rounded="md" />
                <Skeleton className="mt-2 h-4 w-full bg-slate-700" rounded="md" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-5 w-1/2 bg-slate-700" rounded="md" />
                <Skeleton className="h-16 w-full bg-slate-700" rounded="lg" />
              </CardContent>
            </Card>
          </div>
        </main>
      }
    >
      <CheckinInner />
    </Suspense>
  )
}
