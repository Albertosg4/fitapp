# 03 · Riesgos y Deuda Técnica

## Resumen

Este documento reclasifica riesgos tras completar 3B, 3C, check-in hardening, Stripe-2 y limpieza RLS crítica 3D-2B aplicada en Supabase live.

## Riesgos mitigados / completados

- ✅ **R-01** — Escrituras admin directas en actividades/horarios/clases puntuales: **mitigado/completado** en fases 3C-1/2/3.
- ✅ **R-02** — Auditoría de escrituras directas cliente restantes: **completada** en 3C-5 (sin cambios funcionales).
- ✅ **R-03** — Endurecimiento mínimo de check-in QR: **mitigado parcialmente/completado** en 3C-6A.
- ✅ **R-04** — `/api/reservas/toggle` auditado: **completado** en 3C-6B (sin cambios).
- ✅ **R-05** — Bug de reservas por doble clic: **completado** (3B-1).
- ✅ **R-06** — `loadSocios` sin filtro `gym_id`: **completado** (3B-2).
- ✅ **R-07** — `loadStats` sin filtro `gym_id`: **completado** (3B-2).
- ✅ **R-08** — Stripe webhook con lógica antigua de membresías: **mitigado** en Stripe-2 mediante alineación con dominio de membresías.
- ✅ **R-09** — Policy abierta en `perfiles` (`"leer perfiles"`): **mitigado** en 3D-2B (eliminada en live).
- ✅ **R-10** — Policy abierta en `clases` (`"admin puede gestionar clases"`): **mitigado** en 3D-2B (eliminada en live).
- ✅ **R-11** — `EXECUTE` para `anon` en `get_user_rol()` y `toggle_reserva(...)`: **mitigado** en 3D-2B (revocado para `anon`/`PUBLIC`, mantenido para `authenticated`/`service_role`).

## Riesgos residuales (se mantienen)

- ⏳ Limpieza RLS secundaria pendiente.
- ⏳ Pruebas multi-gimnasio reales completas pendientes.
- ⏳ Limpieza legacy pendiente.
- ⏳ QR sin rotación periódica pendiente.
- ⚠️ `sesiones_insert` permite `authenticated` (revisión pendiente).
- ⚠️ `asistencia_insert` permite `authenticated` (revisión pendiente).
- ⚠️ `perfiles_update_propio` permite update directo del propio perfil (revisión pendiente).
- ⚠️ `gimnasios` mantiene lectura pública (revisión pendiente).
- ⚠️ Existen policies con rol `public` condicionadas internamente que requieren auditoría fina antes de cambiar.
- ⚠️ Rate limit de check-in en memoria: protección **best-effort** (no distribuida).
- ⚠️ Stripe webhook no es transaccional entre update de perfil + insert de pago: los errores ya no son silenciosos, pero persiste riesgo residual sin RPC/transacción DB.
- ⚠️ Fallback JS de reservas sigue como deuda técnica controlada (no bug crítico).

- Auditoría de escrituras cliente/API para preparar RLS: docs/security/rls-client-write-audit.md

- Preparado cierre RLS de INSERT cliente en sesiones/asistencia mediante supabase/fase3D3A_close_client_inserts.sql. Pendiente de aplicar manualmente en Supabase SQL Editor y validar con el runbook.
