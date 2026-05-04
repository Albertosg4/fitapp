'use client'
import HistorialActividadSocio from '@/components/HistorialActividadSocio'

interface Props {
  userId: string
}

export default function SocioHistorialTab({ userId }: Props) {
  return <HistorialActividadSocio userId={userId} />
}
