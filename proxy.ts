import { NextResponse } from 'next/server'

// Protección de rutas server-side pendiente de migrar a cookies (Supabase SSR).
// La sesión actual usa localStorage, por lo que la verificación de rol
// se realiza client-side en cada página.
export function proxy() {
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/socio/:path*'],
}
