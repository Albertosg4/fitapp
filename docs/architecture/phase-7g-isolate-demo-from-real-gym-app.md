# Fase 7G - Aislar demo multi-sector de la app real de gimnasio

## Decision

La Fase 7G aisla la demo multi-sector de la app real de gimnasio. FITAPP mantiene dos superficies separadas:

- `/admin` y `/socio` vuelven a ser experiencia operativa real de gimnasio.
- `/demo` y `/demo/*` conservan la experiencia comercial multi-sector.

La multi-verticalidad sigue siendo comercial/demo. No convierte FITAPP en una plataforma multi-tenant ni multi-sector en runtime.

## Alcance

La app real de gimnasio queda protegida de la preview vertical:

- `/admin` no usa selector de vertical, hero comercial ni cards multi-sector.
- `/admin` muestra siempre modulos reales de gimnasio: actividades, horarios, puntuales, socios, pagos y nuevo socio.
- `/socio` muestra siempre clases, historial, pagos, Mi QR y perfil.
- `/socio` mantiene ocupacion/capacidad de gimnasio en reservas.
- Los componentes reales usados por admin/socio usan textos estables de gimnasio.

La demo comercial permanece bajo `/demo`:

- Puede usar `VerticalSettingsProvider`.
- Puede usar `VerticalPreviewSwitcher`.
- Puede usar `VerticalDemoHero`.
- Puede usar `VerticalCapabilityCards`.
- Puede usar paginas interactivas y copy por vertical.

## Seguridad y fuera de alcance

Esta fase no toca backend ni datos reales:

- No se toca Supabase.
- No se toca Auth.
- No se toca SQL.
- No se toca RLS.
- No se toca Stripe.
- No se toca backend.
- No se cambian datos reales.
- No se crean usuarios demo.
- No se crean credenciales.
- No se cambian nombres de tablas.
- No se cambia `gym_id`.
- No se cambia `public.gimnasios`.
- No se cambia logica real de reservas, pagos ni check-in.

## Implicacion de producto

La demo multi-sector sirve para venta y validacion comercial online. La app real sigue siendo la app operativa de gimnasio/JGS Fight Team.

El futuro multi-tenant o multi-sector real debe hacerse en fases separadas, con diseno de datos, permisos, migraciones, Auth, RLS, pagos y operaciones revisados de forma explicita.
