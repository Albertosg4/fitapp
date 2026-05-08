# Auditoría flujo de pagos Stripe — App real gimnasio

## Fase 9A — Hardening ciclo de vida pagos/membresía

After auditing the Stripe payment flow, this PR hardens the real gym membership payment lifecycle end-to-end.

### Auditoría inicial (código)
- Checkout: valida sesión bearer y tipo de membresía en servidor; calcula importe desde dominio; crea sesión Stripe con metadata.  
- Webhook: usa firma Stripe con raw body y procesa `checkout.session.completed`; actualiza `perfiles` e inserta `pagos`.  
- Tabla de pagos: `public.pagos` (fuente para socio/admin).  
- Relación pago/socio/gym: `pagos.user_id` y `pagos.gym_id`; webhook toma `gym_id` desde perfil/metadata.  
- Idempotencia: existía por `stripe_payment_id`; se endurece con `stripe_session_id` + `stripe_event_id` (SQL manual preparado).  
- Admin y socio: ambos leen de `pagos`.
- Errores seguros: mejorados para no exponer detalles técnicos.
- No confirmado desde código. Requiere validación manual/Supabase: constraints actuales en `pagos` y estado real de índices productivos.

### Cambios hechos
- Checkout endurecido con respuestas seguras y metadata mínima (`source=fitapp`, `gym_id`, `tipo_membresia`, `supabase_user_id`).
- Webhook endurecido con validación de firma/evento/metadata e idempotencia extendida.
- UI socio/admin/historial con mensajes más claros para cancelación/error/redirección.
- Script de readiness no destructivo añadido.

### SQL preparado
SQL is prepared but not executed.
Orden exacto:
1. `docs/sql/fase-9a-stripe-membership-lifecycle/00_precheck.sql`
2. `docs/sql/fase-9a-stripe-membership-lifecycle/01_main.sql`
3. `docs/sql/fase-9a-stripe-membership-lifecycle/02_verify.sql`
4. `docs/sql/fase-9a-stripe-membership-lifecycle/99_rollback.sql` (solo si falla y se confirma)

### Riesgos cerrados
- Errores técnicos expuestos al cliente en checkout.
- Metadata incompleta para trazabilidad webhook.
- Duplicados por reintentos sin session/event id.

### Riesgos pendientes
- Verificación manual en Stripe test mode de punta a punta.
- Confirmar en Supabase live índices/columnas tras aplicar SQL manual.

### Qué NO se ha hecho
- No SQL ejecutado.
- No cambios en datos Supabase.
- No live mode Stripe.
- No pagos reales.
