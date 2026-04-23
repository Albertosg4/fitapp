import { NextRequest, NextResponse } from 'next/server'

// Protección de rutas via proxy (Next.js 16)
// La verificación de sesión y rol se hace en cada página via supabase.auth.getUser()
// porque la sesión se almacena en localStorage (no en cookies).
// Este proxy solo deja pasar todas las peticiones sin modificar.

export async function proxy(_req: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/socio/:path*'],
}
