'use client'

import { useState } from 'react'
import HistorialPagos from '@/components/HistorialPagos'
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'
import { IMPORTES, TIPOS_MEMBRESIA, getDiasRestantes, getEstadoMembresia, type TipoMembresia } from '@/lib/domain/membresias'
import type { Socio } from '@/types/domain'

interface Props {
  userId: string
  perfil: Socio | null
  pagando: boolean
  onPagar: (tipoMembresia: string) => void
}

type RenewalStep = 'closed' | 'select_plan' | 'confirm_plan'

const membershipLabelMap = TIPOS_MEMBRESIA.reduce<Record<string, string>>((acc, tipo) => {
  acc[tipo.value] = tipo.label
  return acc
}, {})

export default function SocioPagosTab({ userId, perfil, pagando, onPagar }: Props) {
  const [renewalStep, setRenewalStep] = useState<RenewalStep>('closed')
  const [selectedPlan, setSelectedPlan] = useState<TipoMembresia | null>(null)

  const estadoMembresia = perfil ? getEstadoMembresia(perfil) : 'inactiva'
  const diasRestantes = perfil?.membresia_vence ? getDiasRestantes(perfil.membresia_vence) : null

  const estadoConfig = {
    activa: { label: 'Activa', variant: 'success' as const },
    por_vencer: { label: 'Próxima a vencer', variant: 'warning' as const },
    caducada: { label: 'Caducada', variant: 'danger' as const },
    inactiva: { label: 'Sin membresía activa', variant: 'neutral' as const },
  }[estadoMembresia]

  const tipoLabel = perfil?.tipo_membresia ? (membershipLabelMap[perfil.tipo_membresia] ?? perfil.tipo_membresia) : 'Sin plan activo'

  return (
    <div className="space-y-4 p-4 sm:p-5">
      <Card className="!border-lime-300/20 !bg-[#181818] !text-zinc-100 shadow-[0_12px_24px_rgba(0,0,0,0.3)]">
        <CardHeader className="space-y-3">
          <CardTitle className="text-xl font-extrabold text-zinc-100">Estado de membresía</CardTitle>
          <Badge variant={estadoConfig.variant} className="w-fit">{estadoConfig.label}</Badge>
        </CardHeader>
        <CardContent className="space-y-2 pt-0 text-sm text-zinc-200">
          <p><span className="text-zinc-400">Tipo:</span> {tipoLabel}</p>
          <p><span className="text-zinc-400">Caduca:</span> {perfil?.membresia_vence ? new Date(perfil.membresia_vence).toLocaleDateString('es-ES') : 'Sin fecha de caducidad'}</p>
          {perfil?.membresia_vence ? (
            <p>
              <span className="text-zinc-400">Estado temporal:</span>{' '}
              {diasRestantes !== null && diasRestantes >= 0
                ? `Quedan ${diasRestantes} día${diasRestantes === 1 ? '' : 's'}`
                : `Caducó hace ${Math.abs(diasRestantes ?? 0)} día${Math.abs(diasRestantes ?? 0) === 1 ? '' : 's'}`}
            </p>
          ) : (
            <p className="text-zinc-400">Aún no tienes una membresía activa registrada.</p>
          )}
        </CardContent>
      </Card>

      <Card className="!border-lime-300/20 !bg-[#181818] !text-zinc-100 shadow-[0_12px_24px_rgba(0,0,0,0.3)]">
        <CardHeader className="space-y-2">
          <CardTitle className="text-xl font-extrabold text-zinc-100">Historial de pagos</CardTitle>
          <CardDescription className="!text-zinc-300">Consulta tus pagos realizados.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <HistorialPagos userId={userId} />
        </CardContent>
      </Card>

      <Card className="!border-lime-300/20 !bg-[#181818] !text-zinc-100">
        <CardHeader>
          <CardTitle className="text-base font-bold uppercase tracking-wide text-zinc-200">Renovar membresía</CardTitle>
          <CardDescription className="!text-zinc-400">Elige un plan y después confirma para ir al pago seguro con Stripe.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-1">
          {renewalStep === 'closed' && (
            <Button onClick={() => setRenewalStep('select_plan')} disabled={pagando} className="w-full !bg-lime-300 !text-black hover:!bg-lime-200">
              Renovar membresía
            </Button>
          )}

          {renewalStep === 'select_plan' && (
            <div className="space-y-2">
              {TIPOS_MEMBRESIA.map((t) => (
                <Button
                  key={t.value}
                  onClick={() => {
                    setSelectedPlan(t.value)
                    setRenewalStep('confirm_plan')
                  }}
                  disabled={pagando}
                  variant="ghost"
                  className="h-auto w-full justify-between rounded-xl !border !border-lime-300/20 !bg-[#1e1e1e] px-4 py-3 text-left !text-lime-300 hover:!bg-zinc-800/80 hover:!text-lime-200"
                >
                  <span className="text-sm font-semibold">{t.label}</span>
                  <span className="text-xs text-zinc-300">{IMPORTES[t.value].toFixed(2)}€</span>
                </Button>
              ))}
              <Button onClick={() => setRenewalStep('closed')} variant="ghost" className="w-full !text-zinc-300">Cancelar</Button>
            </div>
          )}

          {renewalStep === 'confirm_plan' && selectedPlan && (
            <div className="space-y-3 rounded-xl border border-lime-300/20 bg-[#1e1e1e] p-4">
              <p className="text-sm text-zinc-200">Plan seleccionado: <strong>{membershipLabelMap[selectedPlan]}</strong></p>
              <p className="text-sm text-zinc-200">Importe: <strong>{IMPORTES[selectedPlan].toFixed(2)}€</strong></p>
              <p className="text-xs text-zinc-400">Serás enviado al pago seguro con Stripe para completar la renovación.</p>
              <div className="flex gap-2">
                <Button onClick={() => setRenewalStep('select_plan')} variant="ghost" className="flex-1 !text-zinc-300">Cambiar plan</Button>
                <Button onClick={() => onPagar(selectedPlan)} loading={pagando} className="flex-1 !bg-lime-300 !text-black hover:!bg-lime-200">Continuar al pago</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
