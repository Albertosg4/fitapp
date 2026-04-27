# 06 · Decisiones Técnicas

## DT-01 · Modelo de entrega por fases

- **Una fase = una rama = una PR**.
- Objetivo: trazabilidad, rollback simple y revisión acotada.

## DT-02 · Separación de alcance

- **No mezclar RLS con cambios de UI/API** en una misma fase.
- RLS se trata en fase específica por su riesgo operativo.

## DT-03 · Escrituras sensibles admin

- Las escrituras sensibles de admin deben pasar por API protegida con `requireAdmin`.
- Evitar escrituras directas desde browser para operaciones críticas.

## DT-04 · Seguridad multi-gimnasio

- `gym_id` **nunca** se acepta del cliente en escrituras.
- Se resuelve server-side desde el contexto autenticado (`requireAdmin`/`requireSocio`).

## DT-05 · Sesiones puntuales sin `actividad_id`

- Crear sesiones puntuales sin `actividad_id` queda bloqueado.
- Se mantiene bloqueo hasta resolver modelo (p.ej. añadir `gym_id` directo en `sesiones` o alternativa validada).

## DT-06 · Fuente única de membresías

- Cálculo de vencimientos por meses reales con `calcularNuevaFechaVencimiento()`.
- Lógica centralizada en `lib/domain/membresias.ts`.

## DT-07 · Reactivación de socio

- Reactivar socio **no renueva** membresía automáticamente.
- Solo cambia estado de activación (`membresia_activa`).

## DT-08 · Pago pendiente

- Pago pendiente **no renueva** hasta confirmación explícita.
- La renovación se ejecuta al confirmar pago.

## DT-09 · Alcance Stripe

- Stripe queda fuera de fase 3C.
- Tendrá fase propia para revisión completa (checkout + webhook + coherencia de membresías).
