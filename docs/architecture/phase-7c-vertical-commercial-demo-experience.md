# Fase 7C · Vertical commercial demo experience

## Objetivo
Añadir una experiencia comercial visible por vertical en modo demo para que FITAPP pueda presentarse mejor por sector sin tocar lógica real ni backend.

## Alcance de esta fase
- Experiencia comercial por vertical en UI del panel admin y socio.
- Hero comercial con headline, subtitle, caso de uso y value props.
- Cards de capacidades por vertical con estado ON/OFF en preview visual.
- Mejora del selector demo vertical con copy explícito local.

## Restricciones explícitas
- Esto es **UI/demo client-side**.
- No hay persistencia tenant/location.
- No hay Supabase, SQL, RLS, Auth, Stripe, APIs nuevas ni cambios de rutas.
- No se cambian permisos, payloads, reservas, pagos ni check-in reales.

## Qué cambia por vertical
- Headline y subtitle comercial.
- Resumen admin y member summary.
- Value props y notas de demo.
- Feature cards (reservas/citas/inscripciones, pagos, QR/check-in, asistencia/visitas, capacidad/aforo, horarios recurrentes).
- Copy ligero en socio.

## Qué no cambia
- Lógica real de negocio.
- Flujo real de reservas, pagos o check-in.
- Aislamiento de datos.

## Checklist manual
- Cambiar vertical en admin y validar hero/capability cards.
- Confirmar mensaje de "Modo demo vertical" y aviso de demo local.
- Validar en socio el member summary contextual.
- Verificar que gym sigue como default y reset funciona.
