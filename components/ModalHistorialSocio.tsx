'use client'

import { useState } from 'react'
import HistorialAsistencia from '@/components/HistorialAsistencia'

interface Socio {
  id: string
  nombre: string
  tipo_membresia: string
  membresia_activa: boolean
}

interface Props {
  socio: Socio
  onClose: () => void
}

export default function ModalHistorialSocio({ socio, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900">{socio.nombre}</h2>
            <p className="text-xs text-gray-400 capitalize">
              {socio.tipo_membresia} ·{' '}
              <span className={socio.membresia_activa ? 'text-green-500' : 'text-red-500'}>
                {socio.membresia_activa ? 'Activa' : 'Inactiva'}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Contenido scrollable */}
        <div className="overflow-y-auto flex-1 px-5 py-4">
          <HistorialAsistencia userId={socio.id} limit={100} compact={true} />
        </div>
      </div>
    </div>
  )
}