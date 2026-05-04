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
- Fase 4B aplicada y validada: reservas.created_at normalizado a timestamptz NOT NULL DEFAULT now().
- Fase 4C aplicada y validada; trazabilidad runtime operativa.

- Fase 4D aplicada y validada; reset demo calendario/reservas ejecutado con backup manual previo.

- Fase 4E aplicada y validada; bug FOUND corregido.


- Deuda menor: las tablas backup_fase4d_* quedan como backup manual temporal. Decidir más adelante si conservarlas, exportarlas o eliminarlas cuando el entorno esté estable.

- Fase 5A aplicada y validada: sesiones.gym_id, asistencia.gym_id y asistencia.sesion_id operativos; check-in libre y check-in con reserva validados.

- Fase 5B aplicada y validada: RLS de sesiones/asistencia endurecida usando gym_id directo y auth_gym_id().
- Pendiente futuro: valorar NOT NULL en sesiones.gym_id y asistencia.gym_id cuando haya más histórico validado.

- Drift corregido: `public.auth_gym_id()` no existía en Supabase live y se creó manualmente como SECURITY DEFINER.
- Pendiente siguiente: revisar RLS de reservas/pagos/perfiles y ejecutar prueba multi-gym real.
- Pendiente futuro: valorar NOT NULL en sesiones.gym_id y asistencia.gym_id.

- Preparada Fase 5C para auditar RLS de reservas/pagos/perfiles/legacy y preparar hardening de reservas. Pendiente de ejecutar precheck y decidir aplicación manual.

- Fase 5C-A aplicada y validada: reservas quedan gym-scoped vía `sesiones.gym_id` + `auth_gym_id()`; admin ya no depende de `get_user_rol()` global en reservas.
- Pendientes 5C:
  - perfiles_update_propio sigue demasiado amplio.
  - clases legacy no tiene filas, pero conserva policies antiguas.
  - falta prueba multi-gym real.

- Fase 5C-B pagos aplicada y validada en Supabase live.
  - Riesgo reducido: exposición admin global/duplicada en pagos mitigada al consolidar policies gym-scoped.
  - Policies finales: `admin_ver_pagos_gym_scoped` y `socio_ver_propios_pagos_gym_scoped`.
  - Conteos de verificación: total_pagos = 10, pagos_con_gym_id = 10, pagos_sin_gym_id = 0.
  - Rollback de 5C-B: no ejecutado.
- Stripe/checkout/webhooks siguen fuera de alcance en 5C-B y no se tocaron.
- `perfiles_update_propio` y `clases` legacy continúan como pendientes para fases posteriores.
- Pendiente futuro: valorar NOT NULL en `pagos.gym_id` si procede tras más histórico validado.
