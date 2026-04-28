# 03 · Riesgos y Deuda Técnica

## Resumen

Este documento reclasifica riesgos tras completar 3B, 3C, check-in hardening y Stripe-2.

## Riesgos mitigados / completados

- ✅ **R-01** — Escrituras admin directas en actividades/horarios/clases puntuales: **mitigado/completado** en fases 3C-1/2/3.
- ✅ **R-02** — Auditoría de escrituras directas cliente restantes: **completada** en 3C-5 (sin cambios funcionales).
- ✅ **R-03** — Endurecimiento mínimo de check-in QR: **mitigado parcialmente/completado** en 3C-6A.
- ✅ **R-04** — `/api/reservas/toggle` auditado: **completado** en 3C-6B (sin cambios).
- ✅ **R-05** — Bug de reservas por doble clic: **completado** (3B-1).
- ✅ **R-06** — `loadSocios` sin filtro `gym_id`: **completado** (3B-2).
- ✅ **R-07** — `loadStats` sin filtro `gym_id`: **completado** (3B-2).
- ✅ **R-08** — Stripe webhook con lógica antigua de membresías: **mitigado** en Stripe-2 mediante alineación con dominio de membresías.

## Riesgos residuales (se mantienen)

- ⏳ Auditoría RLS/policies global pendiente.
- ⏳ Pruebas multi-gimnasio pendientes.
- ⏳ Limpieza legacy pendiente.
- ⏳ QR sin rotación periódica pendiente.
- ⚠️ Rate limit de check-in en memoria: protección **best-effort** (no distribuida).
- ⚠️ Stripe webhook no es transaccional entre update de perfil + insert de pago: los errores ya no son silenciosos, pero persiste riesgo residual sin RPC/transacción DB.
- ⚠️ Fallback JS de reservas sigue como deuda técnica controlada (no bug crítico).
