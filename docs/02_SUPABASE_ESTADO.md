# 02 · Supabase — Estado conocido

> Documento de estado operativo. No implica que RLS esté completamente saneado.

## Estado actual

- Producción operativa.
- Las escrituras admin principales ya migraron a API protegida (server-side).
- Limpieza RLS crítica **3D-2B aplicada y validada** en Supabase live (project ref `bfhifmvndqyxhseqrivu`).
- RLS **no está completamente saneado**: quedan riesgos secundarios y auditoría fina pendiente.

## Sobre RLS y policies (importante)

- ❗ **No afirmar que RLS está perfecto**: el estado actual requiere revisión formal.
- 3D-2B cerró aperturas críticas, pero siguen policies legacy/mixtas por revisar.
- Hay que validar compatibilidad real con escenarios multi-gimnasio.

## Hitos previos ya aplicados

- **Fase 3A**: índices, constraints y RPC `toggle_reserva`.
- **Fase 3A1**: corrección de `toggle_reserva` usando `v_reserva_existe`.
- **Fase 3D-1**: auditoría live de RLS/policies (solo lectura) en Supabase project ref `bfhifmvndqyxhseqrivu`.
- **Fase 3D-2A**: scripts SQL preparados (limpieza crítica, rollback y verificación).
- **Fase 3D-2B**: limpieza RLS crítica aplicada manualmente en Supabase live y validada.

## Resultado aplicado en 3D-2B (live)

Se aplicó en SQL Editor de Supabase live:

- Eliminación de policies críticas/legacy:
  - `DROP POLICY IF EXISTS "leer perfiles" ON public.perfiles;`
  - `DROP POLICY IF EXISTS "usuarios pueden leer su perfil" ON public.perfiles;`
  - `DROP POLICY IF EXISTS "admin puede gestionar clases" ON public.clases;`
  - `DROP POLICY IF EXISTS "socios pueden leer clases" ON public.clases;`
- Ajuste de permisos EXECUTE en funciones sensibles:
  - `get_user_rol()`: revocado para `PUBLIC`/`anon`; grant para `authenticated` y `service_role`.
  - `toggle_reserva(uuid, date)`: revocado para `PUBLIC`/`anon`; grant para `authenticated` y `service_role`.

## Verificaciones post-aplicación 3D-2B

- Consulta de policies críticas: **0 filas**.
- `anon_can_execute`:
  - `get_user_rol()`: **false**
  - `toggle_reserva(uuid, date)`: **false**
- `authenticated_can_execute`:
  - `get_user_rol()`: **true**
  - `toggle_reserva(uuid, date)`: **true**
- `service_role_can_execute`:
  - `get_user_rol()`: **true**
  - `toggle_reserva(uuid, date)`: **true**

## No ejecutar cambios RLS fuera de fase específica

Cualquier cambio adicional de RLS/policies debe hacerse en fase dedicada, con:

1. Inventario de policies actuales.
2. Plan de rollback listo.
3. Pruebas funcionales y de aislamiento multi-gimnasio.
4. Aplicación controlada por lotes.

## Escrituras admin ya protegidas antes de RLS fina

Antes de completar la fase de RLS secundaria, ya se movieron a APIs protegidas las escrituras admin principales de:

- `actividades`
- `horarios_clase`
- `sesiones` puntuales
- toggles de socios/membresía

## Pendientes explícitos

- Limpieza RLS secundaria (policies no críticas / legacy restantes).
- Pruebas con datos multi-gimnasio reales.
- Revisión de `sesiones_insert`.
- Revisión de `asistencia_insert`.
- Revisión de `perfiles_update_propio`.
- Revisión de `gimnasios` con `SELECT` público.
- Índices duplicados (limpieza opcional a futuro).

## Precheck live Supabase

- Fecha:
- Ejecutado por:
- Archivo usado: supabase/precheck/00_estado_actual.sql
- Resultado: pendiente de pegar tras ejecución manual en Supabase SQL Editor
- Observaciones:

## Fase 3D-3A - Cierre INSERT cliente sesiones/asistencia

- Fecha: pendiente
- SQL principal: supabase/fase3D3A_close_client_inserts.sql
- Rollback: supabase/fase3D3A_close_client_inserts_rollback.sql
- Verificación: supabase/fase3D3A_close_client_inserts_verificacion.sql
- Estado: aplicado
- Resultado: aplicado correctamente
- Validación funcional:
  - crear sesión puntual desde admin: OK
  - reservar clase como socio: OK
  - cancelar reserva como socio: OK
  - check-in QR con reserva: OK
  - check-in QR libre: OK

## Fase 3D-3B - Cierre SELECT público gimnasios

- Fecha:
- SQL principal: supabase/fase3D3B_close_public_gimnasios.sql
- Rollback: supabase/fase3D3B_close_public_gimnasios_rollback.sql
- Verificación: supabase/fase3D3B_close_public_gimnasios_verificacion.sql
- Estado: aplicado
- Resultado: aplicado correctamente.
- Validación funcional:
  - cargar pantalla pública inicial: OK
  - login admin: OK
  - login socio: OK
  - entrar a panel admin: OK
  - entrar a panel socio: OK


## Fase 4A - Trazabilidad base en reservas

- Fecha:
- SQL principal: supabase/fase4A_reservas_trazabilidad.sql
- Rollback: supabase/fase4A_reservas_trazabilidad_rollback.sql
- Verificación: supabase/fase4A_reservas_trazabilidad_verificacion.sql
- Estado: aplicado
- Resultado: aplicado correctamente con observación de drift detectado en `created_at`.
- Verificación:
  - 8 columnas presentes: OK
  - 4 índices presentes: OK
  - total_reservas = 5
  - reservas_con_created_at = 5
  - reservas_con_cancelled_at = 0
  - drift detectado: `created_at` está como `timestamp without time zone` nullable

## Fase 4B - Normalización created_at en reservas

- Fecha:
- SQL principal: supabase/fase4B_fix_reservas_created_at.sql
- Rollback: supabase/fase4B_fix_reservas_created_at_rollback.sql
- Verificación: supabase/fase4B_fix_reservas_created_at_verificacion.sql
- Estado: aplicado
- Resultado: aplicado y validado
- Verificación:
  - created_at = timestamp with time zone
  - is_nullable = NO
  - default = now()
  - total_reservas = 5
  - reservas_sin_created_at = 0
  - idx_reservas_created_at presente

## Fase 4C - Trazabilidad runtime en reservas

- Fecha:
- SQL principal: supabase/fase4C_reservas_traceability_runtime.sql
- Rollback: supabase/fase4C_reservas_traceability_runtime_rollback.sql
- Verificación: supabase/fase4C_reservas_traceability_runtime_verificacion.sql
- Estado: pendiente de aplicar manualmente
- Cambios de aplicación:
  - app/api/reservas/toggle/route.ts rellena trazabilidad en fallback JS
  - types/domain.ts incluye campos opcionales de trazabilidad
- Resultado esperado:
  - nuevas reservas guardan created_by y created_source
  - cancelaciones guardan cancelled_at, cancelled_by, cancelled_source y updated_at
  - reactivaciones limpian campos de cancelación y actualizan updated_at
- Validación funcional pendiente:
  - reservar clase como socio
  - comprobar created_by y created_source
  - cancelar reserva como socio
  - comprobar cancelled_at, cancelled_by, cancelled_source y updated_at
  - reactivar reserva si el flujo lo permite
  - comprobar que no hay errores en panel socio ni panel admin
