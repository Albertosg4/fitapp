# 04 · Plan de Fases

## Estado actualizado

### Completadas

- ✅ 3B-1 — Reservas socio
- ✅ 3B-2 — Lecturas admin por `gym_id`
- ✅ 3C-1 — Actividades admin vía API protegida
- ✅ 3C-2 — Horarios admin vía API protegida
- ✅ 3C-3 — Clases puntuales admin vía API protegida
- ✅ 3C-4 — Socios/membresías vía API protegida + vencimientos unificados
- ✅ 3C-5 — Auditoría de escrituras directas restantes (sin cambios)
- ✅ 3C-6A — Hardening mínimo de check-in QR
- ✅ 3C-6B — Auditoría de `/api/reservas/toggle` (sin cambios)
- ✅ Stripe-1 — Auditoría Stripe actual (sin cambios)
- ✅ Stripe-2 — Unificación Stripe con dominio de membresías

## Siguiente bloque recomendado

- 3D — Auditoría RLS/policies global
- 3E — Pruebas multi-gimnasio
- 3F — Limpieza legacy
- QA final

## Notas de alcance para siguientes fases

- No se recomienda tocar el fallback de reservas en esta etapa salvo fase específica futura.
- Stripe queda parcialmente cerrado en checkout/webhook; pendiente solo de pruebas end-to-end reales si aplica.
