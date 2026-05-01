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
- ✅ `sesiones_insert` eliminada: cierre 3D-3A aplicado y validado.
- ✅ `asistencia_insert` eliminada: cierre 3D-3A aplicado y validado.
- ⚠️ `perfiles_update_propio` permite update directo del propio perfil (revisión pendiente).
- ✅ `gimnasios` sin lectura pública abierta: cierre 3D-3B aplicado y validado (permanece policy `gimnasios_auth`).
- ⚠️ Existen policies con rol `public` condicionadas internamente que requieren auditoría fina antes de cambiar.
- ⚠️ Rate limit de check-in en memoria: protección **best-effort** (no distribuida).
- ⚠️ Stripe webhook no es transaccional entre update de perfil + insert de pago: los errores ya no son silenciosos, pero persiste riesgo residual sin RPC/transacción DB.
- ⚠️ Fallback JS de reservas sigue como deuda técnica controlada (no bug crítico).

- Auditoría de escrituras cliente/API para preparar RLS: docs/security/rls-client-write-audit.md

- Cierre RLS de INSERT cliente en sesiones/asistencia aplicado y validado: se eliminaron las policies `sesiones_insert` y `asistencia_insert`; validación funcional OK en sesión puntual admin, reserva/cancelación socio y check-in QR con/sin reserva.
- Cierre RLS de SELECT público en gimnasios aplicado y validado: se eliminó la policy `leer gimnasios`; permanece `gimnasios_auth`; validación funcional OK en pantalla pública, login admin/socio y paneles admin/socio.

- Fase 4A de trazabilidad base de reservas aplicada y verificada: columnas e índices presentes; total_reservas = 5; reservas_con_created_at = 5; reservas_con_cancelled_at = 0. Drift detectado en `created_at`, cubierto por Fase 4B.
- Fase 4B preparada para normalizar `reservas.created_at` a `timestamptz NOT NULL DEFAULT now()` e interpretar valores legacy como UTC. Pendiente de aplicar manualmente.

- Fase 4B aplicada y validada: reservas.created_at normalizado a timestamptz NOT NULL DEFAULT now().
- Preparada Fase 4C para rellenar trazabilidad runtime en reservas mediante RPC toggle_reserva y fallback JS.
