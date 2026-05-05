# Auditoría de escrituras Supabase cliente/API

## Objetivo

Esta auditoría identifica dependencias actuales de escrituras directas a Supabase para preparar el cierre de policies RLS abiertas **sin romper la app**. El alcance es solo de lectura/análisis del código, sin cambios funcionales ni cambios en Supabase.

## Resumen ejecutivo

| tabla | operación | origen | archivo | riesgo | recomendación |
|---|---|---|---|---|---|
| reservas | rpc `toggle_reserva` | API server-side con cliente autenticado de usuario | `app/api/reservas/toggle/route.ts` | Medio: depende de `auth.uid()` en DB y de policy de `authenticated`. | Mantener RPC y endurecer policy para que solo permita operar sobre `auth.uid()`. |
| reservas | insert/update | API server-side (`supabaseAdmin`) fallback | `app/api/reservas/toggle/route.ts` | Medio: usa `service_role`; el control queda en lógica API. | Mantener validaciones `requireSocio` + aislar por `gym_id`; después cerrar policies directas a cliente. |
| sesiones | insert | API admin (`supabaseAdmin`) | `app/api/admin/sesiones/route.ts` | Bajo-Medio: no depende de `sesiones_insert` cliente si toda alta pasa por API. | Cerrar `sesiones_insert` para cliente authenticated cuando se confirme que no hay escrituras browser. |
| sesiones | update | API admin (`supabaseAdmin`) | `app/api/admin/sesiones/route.ts` | Bajo-Medio: update actual no filtra `gym_id` en la sentencia final, aunque valida antes. | Añadir defensa en profundidad en próximo PR (sin urgencia para este audit-only). |
| asistencia | insert | API checkin (`supabaseAdmin`) | `app/api/checkin/route.ts` | Bajo-Medio: app no usa insert cliente directo. | Cerrar `asistencia_insert` para cliente authenticated y mantener vía API. |
| perfiles | update | APIs admin/stripe/pagos (`supabaseAdmin`) | `app/api/pagos/manual/route.ts`, `app/api/stripe/*`, `app/api/admin/socios/toggle/route.ts` | Medio: hay updates amplios por service role; `perfiles_update_propio` abierta puede ser riesgosa por columnas. | Restringir `perfiles_update_propio` por columnas permitidas tras validar que UI no hace update directo. |
| pagos | insert/update | APIs server-side (`supabaseAdmin`) | `app/api/pagos/manual/route.ts`, `app/api/stripe/webhook/route.ts` | Bajo-Medio: operación backend controlada; riesgo principal es lectura demasiado amplia. | Cerrar/ajustar policies de lectura admin por `gym_id` y mantener escrituras vía API. |
| actividades | insert/update | API admin (`supabaseAdmin`) | `app/api/admin/actividades/route.ts` | Bajo: server-side con `requireAdmin` y `gym_id`. | Mantener en API; no habilitar escritura cliente. |
| horarios_clase | insert/update | API admin (`supabaseAdmin`) | `app/api/admin/horarios/route.ts` | Bajo: server-side con `requireAdmin` y `gym_id`. | Mantener en API; no habilitar escritura cliente. |

## Escrituras desde cliente/browser

Resultado de búsqueda de `.insert(`, `.update(`, `.upsert(`, `.delete(`, `.rpc(` fuera de `app/api`:

- **No se encontraron escrituras Supabase directas desde cliente/browser** en componentes/hooks del frontend.
- Única coincidencia de `.delete(` en frontend corresponde a `Map.delete()` (no Supabase) en `features/socio/hooks/useSocioData.ts`.

Implicación para RLS:

- Cerrar policies de **INSERT/UPDATE/DELETE directas al cliente** en tablas sensibles no debería romper flujos actuales, porque las mutaciones pasan por API server-side.

## Escrituras desde APIs server-side

### Con `requireAdmin`

- `app/api/admin/actividades/route.ts`
  - tabla `actividades`, operación `insert` (POST), usa `requireAdmin`, usa `supabaseAdmin`.
  - tabla `actividades`, operación `update` (PATCH), usa `requireAdmin`, usa `supabaseAdmin`, con validación de `gym_id`.

- `app/api/admin/horarios/route.ts`
  - tabla `horarios_clase`, operación `insert` (POST), usa `requireAdmin`, usa `supabaseAdmin`.
  - tabla `horarios_clase`, operación `update` (PATCH), usa `requireAdmin`, usa `supabaseAdmin`, con validación de `gym_id`.

- `app/api/admin/sesiones/route.ts`
  - tabla `sesiones`, operación `insert` (POST), usa `requireAdmin`, usa `supabaseAdmin`.
  - tabla `sesiones`, operación `update` (PATCH), usa `requireAdmin`, usa `supabaseAdmin`.

- `app/api/admin/socios/toggle/route.ts`
  - tabla `perfiles`, operación `update` (PATCH), usa `requireAdmin`, usa `supabaseAdmin`, filtrando `id`, `gym_id`, `rol`.

- `app/api/register-socio/route.ts`
  - tabla `perfiles`, operación `insert` (POST), usa `requireAdmin`, usa `supabaseAdmin`.

- `app/api/pagos/manual/route.ts`
  - tabla `pagos`, operación `insert` (POST), usa `requireAdmin`, usa `supabaseAdmin`.
  - tabla `pagos`, operación `update` (PATCH), usa `requireAdmin`, usa `supabaseAdmin`.
  - tabla `perfiles`, operación `update` (POST/PATCH), usa `requireAdmin`, usa `supabaseAdmin`.

### Con `requireSocio`

- `app/api/reservas/toggle/route.ts`
  - tabla `reservas`, operación `insert/update` en fallback JS, usa `requireSocio`, usa `supabaseAdmin`.
  - tabla `sesiones`, operación `insert` en fallback JS para crear sesión puntual de horario+fecha, usa `requireSocio`, usa `supabaseAdmin`.

### Sin `requireAdmin/requireSocio` (integraciones internas)

- `app/api/checkin/route.ts`
  - tabla `asistencia`, operación `insert` (acceso libre y checkin con reserva), usa `supabaseAdmin`.

- `app/api/stripe/checkout/route.ts`
  - tabla `perfiles`, operación `update` (`stripe_customer_id`), usa `supabaseAdmin`.

- `app/api/stripe/webhook/route.ts`
  - tabla `perfiles`, operación `update` (membresía), usa `supabaseAdmin`.
  - tabla `pagos`, operación `insert`, usa `supabaseAdmin`.

## RPC usadas

- `toggle_reserva`
  - archivo: `app/api/reservas/toggle/route.ts`
  - invocación: `supabaseUser.rpc('toggle_reserva', { p_horario_id, p_fecha })`
  - origen: API server-side que crea cliente Supabase con JWT del usuario (no browser directo).
  - dependencia de `auth.uid()`: **sí**, explícita en comentarios y diseño; si falla, hay fallback JS con `supabaseAdmin`.

## Lecturas que dependen de policies RLS abiertas

Hallazgos relevantes respecto al precheck:

- `gimnasios` con SELECT público: en este repo no apareció uso directo frecuente de `.from('gimnasios')`, pero una policy pública `qual true` mantiene superficie de exposición innecesaria.
- `sesiones_select` para `authenticated`: múltiples lecturas de sesiones en frontend/hooks y API dependen de que el usuario autenticado pueda leer sesiones.
- `reservas_select` y `reservas_update`: el flujo socio en reservas depende de lectura/estado de reservas; hoy parte crítica se hace vía API.
- `pagos` lectura admin (`Admin lee todos los pagos` / `admin_ver_todos_pagos`): revisar que quede acotada por `gym_id` para evitar lecturas cross-gym en panel admin.

## Policies candidatas a cerrar en siguiente PR

| policy | tabla | acción recomendada | condición para cerrarla con seguridad |
|---|---|---|---|
| `leer gimnasios` | gimnasios | Reemplazar SELECT público por acceso autenticado y/o subset mínimo. | Confirmar que no hay vistas públicas reales que requieran catálogo completo de gimnasios. |
| `sesiones_insert` | sesiones | Cerrar INSERT directo a `authenticated`. | Confirmado en esta auditoría: no hay insert cliente directo; altas pasan por API/RPC. |
| `sesiones_select` | sesiones | Restringir SELECT por `gym_id`/relación de socio-admin. | Verificar que hooks de socio/admin sigan recibiendo sesiones de su gimnasio. |
| `asistencia_insert` | asistencia | Cerrar INSERT directo a `authenticated`. | Confirmado en esta auditoría: check-in inserta por API (`supabaseAdmin`). |
| `perfiles_update_propio` | perfiles | Limitar columnas actualizables y reforzar condición de ownership. | Confirmar qué campos debe poder editar el usuario final (si alguno) y mover resto a API. |
| `Admin lee todos los pagos` | pagos | Acotar por `gym_id` explícito + rol admin. | Verificar consultas admin actuales y escenarios multi-gym. |
| `admin_ver_todos_pagos` | pagos | Igual que anterior: restringir por `gym_id`. | Confirmar que ningún reporte operativo necesita pagos cross-gym. |
| `reservas_select` | reservas | Mantener solo lectura propia/admin de gym; eliminar amplitud innecesaria. | Validar flujo de socio (`mis reservas`) y panel admin por gym. |
| `reservas_update` | reservas | Quitar update directo cliente si existe y concentrar en API/RPC controlada. | Confirmar que toggle/cancelación sigue solo por `/api/reservas/toggle`. |

## Conclusión

- **Policies que se pueden cerrar sin tocar código (alta confianza):**
  - `sesiones_insert` (cliente authenticated).
  - `asistencia_insert` (cliente authenticated).

- **Policies que requieren validación/migración previa o ajuste fino antes de cerrar totalmente:**
  - `perfiles_update_propio` (definir columnas permitidas; riesgo de sobreescritura de campos sensibles).
  - `sesiones_select` (mantener lectura necesaria por gym/rol para frontend).
  - `reservas_select` y `reservas_update` (confirmar alcance exacto de socio/admin y RPC).
  - `pagos` admin (`Admin lee todos los pagos`, `admin_ver_todos_pagos`) para garantizar aislamiento por `gym_id`.
  - `leer gimnasios` si existe algún caso de uso realmente público.

- **Pendientes de validación manual:**
  1. Inventario exacto de policies actuales en Supabase live y su SQL real (especialmente las admin sin filtro claro de `gym_id`).
  2. Prueba end-to-end multi-gym (admin y socio) tras endurecer `SELECT` en `sesiones`, `reservas`, `pagos`.
  3. Confirmar si existe consumo externo/público de datos de `gimnasios` antes de cerrar lectura pública.

## Seguimiento Fase 5B

- Fase 5B aplicada y validada.
- No se reabrieron INSERT cliente en sesiones/asistencia.
- sesiones/asistencia ahora usan gym_id directo para SELECT/UPDATE (con `auth_gym_id()` en policies gym-scoped).
- Reservas, pagos y perfiles siguen pendientes de hardening posterior.

## Seguimiento Fase 5C

- Fase 5C-A reservas aplicada y validada.
- Fase 5C-B pagos aplicada y validada.
- Fase 5C-E multi-gym controlada aplicada y validada en Supabase live.
- Fase 5C-C perfiles update aplicada y validada.
- Fase 5C-D clases legacy aplicada y validada.
- Reservas usan gym-scope por `sesiones.gym_id` y pagos por `pagos.gym_id` + `auth_gym_id()`.
- Policies de pagos finales: `admin_ver_pagos_gym_scoped` y `socio_ver_propios_pagos_gym_scoped`.
- Verificación multi-gym 5C-E: mismatches en 0 (`pagos_user_gym_mismatch`, `reservas_user_session_gym_mismatch`).
- `public.perfiles` quedó con UPDATE cliente directo cerrado en 5C-C.
- Stripe sigue fuera de alcance en 5C y no se tocó checkout/webhooks.

## Actualización Fase 5C-D (solo documentación)

- No SQL was applied by this PR.
- This PR only documents the already-applied Fase 5C-D clases legacy hardening.
- Rollback was not executed.
- No data was deleted and public.clases was not dropped.

## Nota 2026-05-04 — Fase 5C-E aplicada (solo documentación)

- Esta actualización documenta una aplicación ya ejecutada en Supabase live fuera de este PR.
- No SQL was applied by this PR.
- Rollback no ejecutado.
- Sin cambios sobre Stripe, checkout o webhooks.

## Actualización Fase 5C-C (aplicada y validada)

- Resultado de auditoría de código (repo actual): no hay escrituras de `perfiles` desde cliente/browser autenticado.
- Las actualizaciones detectadas de `public.perfiles` ocurren en APIs server-side con `supabaseAdmin` (service role):
  - `app/api/pagos/manual/route.ts`: `membresia_activa`, `membresia_vence`, `tipo_membresia`.
  - `app/api/stripe/checkout/route.ts`: `stripe_customer_id`.
  - `app/api/stripe/webhook/route.ts`: `membresia_activa`, `membresia_vence`, `tipo_membresia`.
  - `app/api/admin/socios/toggle/route.ts`: `membresia_activa`.
- Conclusión de hardening 5C-C: se aplicó el cierre de UPDATE directo cliente eliminando `perfiles_update_propio` y `admin_update_perfiles_su_gym`, manteniendo flujos vía API protegida.
- Estado: **aplicado y validado**.
- SQL aplicado (manual):
  - `supabase/fase5C_C_rls_perfiles_update_hardening.sql`
- Verificación ejecutada:
  - `supabase/fase5C_C_rls_perfiles_update_hardening_verificacion.sql`
- Rollback disponible (no ejecutado):
  - `supabase/fase5C_C_rls_perfiles_update_hardening_rollback.sql`
- Resultado: `public.perfiles` con **0 policies UPDATE** y `perfiles_select_propio` aún activa.
- No SQL was applied by this PR.
- This PR only documents the already-applied Fase 5C-C perfiles update hardening.
- Rollback was not executed.
- Alcance fuera de esta fase: Stripe/checkout/webhooks, Auth users, reservas/pagos/sesiones/asistencia, clases legacy.

## Seguimiento post-5C y preparación 5F

- Nota post-5F (2026-05-05):
  - Escrituras críticas cliente/API ya cerradas en fases previas (5C-A/B/C/D/E).
  - Auditoría final 5F ejecutada y sin bloqueantes.
  - Las siguientes fases (NOT NULL/índices/QR distribuido) quedan separadas como cambios estructurales no incluidos en 5F.


- Escrituras directas críticas desde cliente: **cerradas**.
- `perfiles_update_propio`: **cerrado** en 5C-C.
- `clases` legacy: **cerrado/deprecado** en 5C-D.
- Estado actual: auditoría final post-5C (Fase 5F) ya ejecutada y validada; siguientes fases estructurales quedan separadas.
- Este PR no introduce cambios runtime ni cambios funcionales de APIs/UI.
