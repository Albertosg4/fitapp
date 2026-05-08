# Fronteras entre app real de gimnasio y demo multi-sector

FITAPP actualmente tiene dos superficies separadas:

1. App real de gimnasio:
   - `/admin`
   - `/socio`
   - `/checkin`
   - `app/api/*`
2. Demo comercial multi-sector:
   - `/demo`
   - `/demo/gimnasio`
   - `/demo/clinica`
   - `/demo/academia`
   - `/demo/peluqueria`
   - `/demo/generico`
   - `/demo/*/probar`

## Regla principal

La app real de gimnasio no debe depender de preview vertical ni de demo multi-sector.

## Permitido en app real

- Supabase real.
- Auth real.
- Stripe real.
- Reservas reales.
- Pagos reales.
- QR real.
- `gym_id`.
- Textos de gimnasio/JGS Fight Team.

## No permitido en app real

- Selector vertical.
- `localStorage` de preview vertical.
- Textos de clínica, peluquería, academia o genérico.
- Feature flags demo para ocultar pagos, QR, historial o capacidad.
- Componentes comerciales multi-sector.
- Mock data de demo.
- Usuarios demo.
- Credenciales demo.

## Permitido en `/demo`

- `VerticalSettingsProvider`.
- `VerticalPreviewSwitcher`.
- `VerticalDemoHero`.
- `VerticalCapabilityCards`.
- `InteractiveDemoPage`.
- Datos simulados locales.
- Copy por vertical.
- Clínica, academia, peluquería y genérico.

## No es multi-tenant real

Esta separación no convierte FITAPP en una plataforma multi-tenant real ni en una app multi-sector en runtime. La app real sigue siendo la app de gimnasio/JGS Fight Team, y la demo multi-sector vive bajo `/demo`.

Un multi-tenant real requiere una fase separada de schema, RLS, Auth, pagos y operación. Esa fase debe diseñar y validar el modelo de datos, permisos, flujos de autenticación, cobros y soporte operativo antes de activar comportamiento real por tenant, sede o vertical.

## Guardarraíl de Fase 7H

La Fase 7H añade `scripts/verify-real-gym-boundaries.mjs` para evitar regresiones. El script verifica que las superficies reales de gimnasio no importen ni usen piezas de preview vertical o demo multi-sector.
