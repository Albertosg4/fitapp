'use client'

import { Badge, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, EmptyState } from '@/components/ui'
import type { Socio } from '@/types/domain'
import { getActiveVerticalLabels } from '@/lib/domain/verticals'

interface Props {
  perfil: Socio | null
  qrUrl: string
}

export default function SocioQRTab({ perfil, qrUrl }: Props) {
  const memberCode = `FIT-${perfil?.qr_token?.slice(0, 4).toUpperCase() || '0000'}`
  const labels = getActiveVerticalLabels()

  return (
    <section className="px-4 pb-6 pt-4 sm:px-6">
      <Card className="mx-auto w-full max-w-md border-lime-400/30 bg-zinc-900 text-zinc-100 shadow-[0_18px_40px_-24px_rgba(178,255,70,0.55)]">
        <CardHeader className="space-y-3 border-b border-zinc-800 pb-5">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-xl font-extrabold text-zinc-50">Tu QR de acceso</CardTitle>
            {perfil?.membresia_activa ? (
              <Badge variant="success" className="bg-lime-400/20 text-lime-300">
                Membresía activa
              </Badge>
            ) : (
              <Badge variant="warning">Sin membresía</Badge>
            )}
          </div>
          <CardDescription className="text-zinc-400">
            Enséñalo en recepción para registrar tu entrada
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col items-center gap-5 pt-6">
          {qrUrl ? (
            <div className="rounded-2xl border border-zinc-200/70 bg-white p-4 shadow-lg shadow-black/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrUrl} alt="QR de acceso" className="block h-[220px] w-[220px] max-w-full" />
            </div>
          ) : (
            <EmptyState
              title="QR no disponible"
              description="Estamos generando tu QR. Inténtalo de nuevo en unos segundos."
              className="w-full border-zinc-700 bg-zinc-800 text-zinc-200"
            />
          )}

          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Tu identificador</p>
            <p className="mt-2 font-mono text-2xl font-extrabold tracking-[0.25em] text-lime-300">{memberCode}</p>
          </div>
        </CardContent>

        <CardFooter className="pt-0 text-center text-sm text-zinc-400">
          {`Muestra este QR al entrar al ${labels.locationLabel.toLowerCase()} o al hacer check-in en una ${labels.serviceLabel.toLowerCase()}.`}
        </CardFooter>
      </Card>
    </section>
  )
}
