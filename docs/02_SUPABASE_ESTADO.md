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
- Estado: aplicado y validado
- Resultado:
  - RPC toggle_reserva rellena trazabilidad runtime
  - fallback JS rellena trazabilidad runtime
  - created_by / created_source / cancelled_at / cancelled_by / cancelled_source / updated_at disponibles en flujo real
- Nota:
  - El bug de FOUND detectado posteriormente queda resuelto por Fase 4E.

## Fase 4D - Reset demo calendario/reservas

- Fecha:
- Precheck: `supabase/fase4D_demo_schedule_reset_precheck.sql`
- SQL principal: `supabase/fase4D_demo_schedule_reset_seed.sql`
- Verificación: `supabase/fase4D_demo_schedule_reset_verificacion.sql`
- Rollback: `supabase/fase4D_demo_schedule_reset_rollback.sql`
- Estado: aplicado y validado
- Precheck:
  - actividades_gym = 5
  - horarios_clase_gym = 6
  - clases_legacy_gym = 0
  - sesiones_relacionadas_gym = 14
  - reservas_relacionadas_sesiones_gym = 5
  - asistencia_relacionada_reservas_o_socios_gym = 2
- Backup manual:
  - backup_fase4d_actividades = 5
  - backup_fase4d_horarios_clase = 6
  - backup_fase4d_clases = 0
  - backup_fase4d_sesiones = 14
  - backup_fase4d_reservas = 5
  - backup_fase4d_asistencia = 2
- Post reset:
  - actividades_gym = 5
  - horarios_clase_gym = 6
  - sesiones_relacionadas_gym = 0
  - reservas_relacionadas_sesiones_gym = 0
  - asistencia_relacionada_reservas_o_socios_gym = 0
  - clases_legacy_gym = 0
- Validación funcional:
  - Panel admin: OK
  - 5 actividades visibles: OK
  - 6 horarios visibles: OK
  - Panel socio: OK
  - Calendario limpio con clases nuevas: OK
- Nota:
  - El script versionado se actualiza para usar la variante simple sin tabla temporal, porque fue la que funcionó en Supabase SQL Editor.

## Fase 4E - Fix RPC toggle_reserva FOUND

- Fecha:
- SQL principal: supabase/fase4E_fix_toggle_reserva_found.sql
- Rollback: supabase/fase4E_fix_toggle_reserva_found_rollback.sql
- Verificación: supabase/fase4E_fix_toggle_reserva_found_verificacion.sql
- Estado: aplicado y validado
- Problema corregido:
  - FOUND se sobrescribía después de SELECT COUNT(*) y podía provocar ok=true sin INSERT real.
- Resultado:
  - reservar crea fila real en public.reservas.
  - cancelar rellena cancelled_at, cancelled_by, cancelled_source y updated_at.
  - reactivar limpia campos de cancelación y mantiene created_by/created_source.
- Validación:
  - reservar: OK
  - cancelar: OK
  - reactivar: OK
  - panel socio: OK
  - panel admin: OK

## Fase 5A - Sesiones y asistencia con gym_id directo

- Fecha: 2026-05-01
- SQL principal modelo: supabase/fase5A_sesiones_asistencia_gym_linking.sql
- Rollback modelo: supabase/fase5A_sesiones_asistencia_gym_linking_rollback.sql
- Verificación modelo: supabase/fase5A_sesiones_asistencia_gym_linking_verificacion.sql
- SQL RPC: supabase/fase5A_toggle_reserva_set_sesion_gym_id.sql
- Rollback RPC: supabase/fase5A_toggle_reserva_set_sesion_gym_id_rollback.sql
- Verificación RPC: supabase/fase5A_toggle_reserva_set_sesion_gym_id_verificacion.sql
- Estado: aplicado y validado
- Resumen de aplicación:
  - SQL modelo aplicado: OK
  - SQL RPC aplicado: OK
- Resultados verificados:
  - sesiones.gym_id: columna presente
  - asistencia.gym_id: columna presente
  - asistencia.sesion_id: columna presente
  - idx_sesiones_gym_fecha: presente
  - idx_asistencia_gym_fecha: presente
  - idx_asistencia_sesion: presente
  - total_sesiones = 2
  - sesiones_con_gym_id = 2
  - sesiones_sin_gym_id = 0
  - total_asistencia inicial post-modelo = 0
- Validación funcional:
  - check-in libre: OK
    - reserva_id = null
    - sesion_id = null
    - gym_id = b94be501-cdb4-4e48-a525-e0a669ad0967
  - check-in con reserva: OK
    - reserva_id = cd248e5e-6545-4bc0-90ad-1b05aec87e39
    - sesion_id = d1ae4edc-61b2-4400-a841-84132f8f60ec
    - gym_id = b94be501-cdb4-4e48-a525-e0a669ad0967
  - join asistencia/sesión/actividad: OK
    - asistencia_gym_id = sesion_gym_id
    - actividad = Open Mat
    - fecha = 2026-05-01
    - hora_inicio = 18:00:00
- Nota:
  - No se ha aplicado NOT NULL todavía. Queda pendiente endurecer en una fase posterior tras más validación.
  - RLS no se modificó en Fase 5A; el siguiente paso recomendado es Fase 5B para endurecer policies aprovechando gym_id directo.

## Fase 5B - RLS gym-scoped en sesiones/asistencia

- Fecha: 2026-05-01
- Precheck: supabase/fase5B_rls_gym_scoped_precheck.sql
- SQL principal: supabase/fase5B_rls_gym_scoped_sesiones_asistencia.sql
- Rollback: supabase/fase5B_rls_gym_scoped_sesiones_asistencia_rollback.sql
- Verificación: supabase/fase5B_rls_gym_scoped_sesiones_asistencia_verificacion.sql
- Estado: aplicado y validado
- Requisito previo:
  - Fase 5A aplicada y validada.
  - sesiones.gym_id y asistencia.gym_id presentes.
- Resumen de ejecución:
  - Precheck ejecutado: OK.
  - SQL principal aplicado: OK.
  - Verificación ejecutada: OK.
  - Rollback: no ejecutado.
- Drift corregido en Supabase live:
  - Error inicial: `function auth_gym_id() does not exist`.
  - Acción: creada manualmente `public.auth_gym_id()`.
  - Verificación: `routine_name = auth_gym_id`, `security_type = DEFINER`.
  - Nota: función esperada por el diseño histórico; drift corregido en producción.
- Results:
  - total_sesiones = 3
  - sesiones_con_gym_id = 3
  - sesiones_sin_gym_id = 0
  - total_asistencia = 1
  - asistencia_con_gym_id = 1
  - asistencia_sin_gym_id = 0
  - asistencia_con_reserva_y_sesion = 1
  - asistencia_con_reserva_sin_sesion = 0
- Policies finales:
  - sesiones_select_gym_scoped
  - sesiones_update_admin_gym_scoped
  - admin_ver_asistencia_gym_scoped
  - socio_ver_propia_asistencia
- Validación funcional:
  - Panel socio: OK.
  - Calendario/clases socio: OK.
  - Panel admin: OK.
  - Check-in QR: OK.
  - Mensaje QR: “Acceso permitido / clase registrada ya hoy”.
- Fuera de alcance / pendiente:
  - reservas.
  - pagos.
  - perfiles_update_propio.
  - NOT NULL.
  - prueba multi-gym real.

## Fase 5C - Auditoría RLS reservas/pagos/perfiles

- Estado: **Fase 5C-A reservas aplicada y validada** en Supabase live.
- Precheck: ejecutado.
- SQL reservas aplicado: `supabase/fase5C_A_rls_reservas_gym_scoped.sql`.
- Verificación reservas: ejecutada.
- Rollback: no ejecutado.

### Resultados verificados

- total_reservas = 4
- reservas_confirmadas = 1
- reservas_canceladas = 3
- reservas_con_sesion_gym_id = 4
- reservas_sin_sesion_gym_id = 0
- total_pagos = 10
- pagos_con_gym_id = 10
- pagos_sin_gym_id = 0
- perfiles admin = 1 con gym_id
- perfiles socio = 3 con gym_id
- clases_legacy = 0

### Policies finales de reservas (post 5C-A)

- `reservas_insert_gym_scoped`
- `reservas_select_gym_scoped`
- `reservas_update_gym_scoped`

### Validación funcional post-aplicación

- Panel socio: OK
- Mis reservas visibles: OK
- Reservar clase futura: OK
- Cancelar reserva: OK
- Reactivar reserva: OK
- Panel admin: OK
- Reservas/sesiones visibles: OK
- Check-in QR: OK

### Pendientes de Fase 5C

- Fase 5C-B: pagos.
- Fase 5C-C: perfiles_update_propio.
- Fase 5C-D: clases legacy.
- Fase 5C-E: prueba multi-gym real.
- Evaluar NOT NULL más adelante.
