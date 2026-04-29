'use client'

import HistorialPagos from '@/components/HistorialPagos'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'
import { TIPOS_MEMBRESIA } from '@/lib/domain/membresias'

interface Props {
  userId: string
  pagando: boolean
  onPagar: (tipoMembresia: string) => void
}

export default function SocioPagosTab({ userId, pagando, onPagar }: Props) {
  return (
    <div className="space-y-4 p-4 sm:p-5">
      <Card className="!border-lime-300/20 !bg-[#181818] !text-zinc-100 shadow-[0_12px_24px_rgba(0,0,0,0.3)]">
        <CardHeader className="space-y-2">
          <CardTitle className="text-xl font-extrabold text-zinc-100">Mis pagos</CardTitle>
          <CardDescription className="!text-zinc-300">
            Revisa tu historial de pagos y renueva tu membresía cuando lo necesites.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <HistorialPagos userId={userId} compact={false} />
        </CardContent>
      </Card>

      <Card className="!border-lime-300/20 !bg-[#181818] !text-zinc-100">
        <CardHeader>
          <CardTitle className="text-base font-bold uppercase tracking-wide text-zinc-200">Renovar membresía</CardTitle>
          <CardDescription className="!text-zinc-400">Selecciona el plan para continuar con el mismo flujo de pago.</CardDescription>
        </CardHeader>
        <CardContent className="pt-1">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {TIPOS_MEMBRESIA.map((t) => (
              <Button
                key={t.value}
                onClick={() => onPagar(t.value)}
                disabled={pagando}
                variant="ghost"
                className="h-auto justify-start rounded-xl !border !border-lime-300/20 !bg-[#1e1e1e] px-4 py-3 text-left !text-lime-300 hover:!bg-zinc-800/80 hover:!text-lime-200"
              >
                <span className="text-sm font-semibold">{t.label}</span>
              </Button>
            ))}
          </div>
          {pagando ? <p className="mt-3 text-center text-xs text-zinc-400">Redirigiendo a pago...</p> : null}
        </CardContent>
      </Card>
    </div>
  )
}
