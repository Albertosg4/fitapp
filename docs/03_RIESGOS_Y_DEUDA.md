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
- ✅ Prueba multi-gym real controlada validada en 5C-E (aislamiento OK con mismatch=0).
- ✅ Fase 5C-D clases legacy aplicada y validada: `public.clases` queda deprecada y cerrada a acceso directo (RLS activo, 0 policies activas, 0 filas).
- ⏳ QR sin rotación periódica pendiente.
- ✅ `sesiones_insert` eliminada: cierre 3D-3A aplicado y validado.
- ✅ `asistencia_insert` eliminada: cierre 3D-3A aplicado y validado.
- ✅ `perfiles_update_propio` cerrado en 5C-C: UPDATE directo de cliente en `public.perfiles` eliminado y validado.
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
- Pendiente siguiente: revisar y endurecer RLS de perfiles y legacy (multi-gym real ya validada en 5C-E).
- Pendiente futuro: valorar NOT NULL en sesiones.gym_id y asistencia.gym_id.

- Preparada Fase 5C para auditar RLS de reservas/pagos/perfiles/legacy y preparar hardening de reservas. Pendiente de ejecutar precheck y decidir aplicación manual.

- Fase 5C-A aplicada y validada: reservas quedan gym-scoped vía `sesiones.gym_id` + `auth_gym_id()`; admin ya no depende de `get_user_rol()` global en reservas.
- Pendientes 5C:
  - perfiles_update_propio sigue demasiado amplio.
  - clases legacy no tiene filas, pero conserva policies antiguas.
  - multi-gym real 5C-E ya validada.

- Fase 5C-B pagos aplicada y validada en Supabase live.
  - Riesgo reducido: exposición admin global/duplicada en pagos mitigada al consolidar policies gym-scoped.
  - Policies finales: `admin_ver_pagos_gym_scoped` y `socio_ver_propios_pagos_gym_scoped`.
  - Conteos de verificación: total_pagos = 10, pagos_con_gym_id = 10, pagos_sin_gym_id = 0.
  - Rollback de 5C-B: no ejecutado.
- Stripe/checkout/webhooks siguen fuera de alcance en 5C-B y no se tocaron.
- `perfiles_update_propio` quedó cerrado en 5C-C; `clases` legacy quedó deprecada/cerrada en 5C-D.
- Pendiente futuro: valorar NOT NULL en `pagos.gym_id` si procede tras más histórico validado.

## Actualización 2026-05-04 (Fase 5C-E aplicada y validada)

- Fase 5C-E (multi-gym controlado) fue **aplicada y validada** en Supabase live con gimnasio demo y usuarios demo controlados.
- Resultado clave: aislamiento multi-gym validado en SQL y en app (`pagos_user_gym_mismatch = 0`, `reservas_user_session_gym_mismatch = 0`).
- Riesgo residual de aislamiento multi-gym reducido de forma significativa.
- Stripe/checkout/webhooks se mantienen fuera de alcance y no se tocaron.
- Rollback de 5C-E: no ejecutado.
- Pendiente futuro: valorar `NOT NULL` en `gym_id` donde proceda cuando el histórico validado lo permita.

## Actualización 2026-05-04 (Fase 5C-C aplicada y validada)

- Hardening de `perfiles_update_propio` aplicado manualmente y validado en Supabase live.
- UPDATE directo de cliente sobre `public.perfiles` queda cerrado (0 policies UPDATE).
- `perfiles_select_propio` se mantiene activa para lecturas propias autenticadas.
- SQL aplicado: `supabase/fase5C_C_rls_perfiles_update_hardening.sql`.
- Verificación ejecutada: `supabase/fase5C_C_rls_perfiles_update_hardening_verificacion.sql`.
- Rollback disponible: `supabase/fase5C_C_rls_perfiles_update_hardening_rollback.sql` (no ejecutado).
- Pendientes se mantienen: posible `NOT NULL` futuro en `gym_id` donde proceda y limpieza posterior de datos demo multi-gym si se decide.
- Fuera de alcance (sin cambios): Stripe/checkout/webhooks, Auth users, reservas/pagos/sesiones/asistencia.

## Actualización 2026-05-04 — Fase 5C-D aplicada y validada

- Hardening manual aplicado en Supabase live sobre `public.clases` (tabla legacy).
- SQL aplicado: `supabase/fase5C_D_rls_clases_legacy_hardening.sql`.
- Verificación ejecutada: `supabase/fase5C_D_rls_clases_legacy_verificacion.sql`.
- Rollback disponible: `supabase/fase5C_D_rls_clases_legacy_rollback.sql` (**no ejecutado**).
- Resultado técnico:
  - RLS activo en `public.clases`.
  - 0 policies activas en `public.clases`.
  - 0 filas en `public.clases`.
  - Sin borrado de datos y sin drop de tabla.
- `public.clases` queda deprecada/cerrada a acceso directo.
- Pendientes posteriores se mantienen:
  - posibles `NOT NULL` futuros en columnas `gym_id` donde aplique.
  - limpieza opcional de datos demo multi-gym.
  - hardening QR (rotación/rate-limit distribuido) en fase posterior.
  - limpieza de índices duplicados si sigue pendiente.
- Fuera de alcance (sin cambios): Stripe/checkout/webhooks/Auth.

## Actualización 2026-05-04 — Preparación Fase 5F (solo auditoría)

- RLS base 5C: **cerrada** (5C-A/B/C/D/E aplicadas y validadas).
- 5F prepara decisiones, **no aplica cambios** en Supabase.
- Deuda/riesgo que se mantiene para fases posteriores:
  - Posibles `NOT NULL` futuros en columnas `gym_id` (fase 5G, PR separado).
  - Datos demo multi-gym pendientes de decisión de conservación vs limpieza.
  - QR/rate-limit distribuido pendiente (actual en memoria best-effort).
  - Revisión de índices potencialmente duplicados.
  - `tenant_settings`/multi-sector diferido intencionalmente.


## Actualización 2026-05-05 — Fase 5F ejecutada y validada

- La auditoría final post-5C ya fue ejecutada manualmente en Supabase live con resultado global **OK** sin bloqueantes.
- Siguiente candidato fuerte recomendado: **Fase 5G** para `NOT NULL` en `gym_id`, en PR/fase separada, con ventana controlada y rollback explícito.
- Limpieza de índices duplicados: mantener diferida a fase separada posterior (sin drops en 5F).
- QR/rate-limit distribuido: sigue pendiente (estado actual en memoria best-effort).
- `auth_gym_id()` mantiene `EXECUTE` para `anon`; revisar si se endurece en una fase separada para no romper onboarding/flows dependientes.
- Datos demo multi-gym: conservar por ahora como entorno útil de pruebas (`KEEP_DEMO_DATA`).

## Actualización 2026-05-05 — Post-5F / Fase 6A (dirección multi-negocio)

- Riesgo estratégico activo: acoplamiento del producto al vertical gimnasio en lenguaje, UX y decisiones de alcance.
- Riesgo técnico activo: endurecer `gym_id` (por ejemplo, vía `NOT NULL`) antes de cerrar el diseño tenant/location/vertical puede generar deuda de migración.
- Decisión de fase: **Fase 5G (`NOT NULL`) queda pausada** hasta cerrar dirección de arquitectura multi-negocio.
- Prioridad estratégica actual: definir arquitectura de producto tenant/location/vertical antes de nuevos cambios estructurales en schema.
- Pendientes operativos que siguen vigentes (índices duplicados, QR/rate-limit distribuido) se mantienen, pero por detrás de la decisión de arquitectura de producto.

## Actualización 2026-05-05 — Riesgos de arquitectura previos a ejecución (Fase 6B)

- Riesgo alto si se añade `tenant_id` sin inventario previo de impacto en schema, app, API y RLS.
- Riesgo alto si se renombra `gym_id` de forma prematura sin estrategia de transición y rollback por fases.
- Riesgo estratégico si se intenta resolver el multi-sector solo con textos de UI sin un modelo tenant/location/vertical detrás.
- Mitigación recomendada: **6B diseño técnico documental**, **6C inventario de impacto**, **6D decisión de migración** antes de tocar schema.


## Actualización 2026-05-06 — Riesgos de ejecución (Fase 6C ampliada)

- Riesgo: avanzar demasiado lento y no consolidar producto.
  - Mitigación: ejecutar bloques más grandes pero de baja superficie de riesgo (documentales o de abstracción semántica).
- Riesgo: avanzar demasiado rápido en schema/RLS y romper compatibilidad.
  - Mitigación: no tocar Supabase hasta tener SQL, rollback y verificación separados y aprobados.
- Riesgo: cambiar UI antes de tener capa de labels y mezclar semántica con estructura.
  - Mitigación: siguiente cambio seguro recomendado = foundation de vertical labels.
