# Auditoría flujo de pagos Stripe — App real gimnasio

## Fase 9A — Hardening ciclo de vida pagos/membresía

- El webhook delega ahora el registro de pago + actualización de membresía en la RPC transaccional `public.registrar_pago_stripe_membresia`.
- Ya no debe existir el patrón inseguro de `update perfiles` y `insert pagos` por separado en webhook.
- La RPC usa `gym_id` real de `perfiles` y aplica idempotencia por `stripe_payment_id`, `stripe_session_id` y `stripe_event_id`.

## Estado SQL

SQL is prepared but not executed.

**IMPORTANTE:** el SQL debe ejecutarse y verificarse antes de desplegar/usar el webhook nuevo que depende de `registrar_pago_stripe_membresia`.

Orden:
1. `docs/sql/fase-9a-stripe-membership-lifecycle/00_precheck.sql`
2. revisar resultado
3. `docs/sql/fase-9a-stripe-membership-lifecycle/01_main.sql` (solo tras aprobación)
4. `docs/sql/fase-9a-stripe-membership-lifecycle/02_verify.sql`
5. `docs/sql/fase-9a-stripe-membership-lifecycle/99_rollback.sql` (solo con fallo confirmado)

## Riesgos

### Riesgo cerrado
- Actualización de membresía e inserción de pago separadas (sin atomicidad) en webhook.

### Riesgo pendiente
- Ejecutar SQL manual y validar ciclo completo en Stripe test mode (checkout/cancel/ok/webhook/idempotencia).
