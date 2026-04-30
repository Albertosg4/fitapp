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

- Fecha:
- SQL principal: supabase/fase3D3A_close_client_inserts.sql
- Rollback: supabase/fase3D3A_close_client_inserts_rollback.sql
- Verificación: supabase/fase3D3A_close_client_inserts_verificacion.sql
- Estado: pendiente de aplicar manualmente
- Resultado esperado: las policies sesiones_insert y asistencia_insert desaparecen de pg_policies
- Validación funcional pendiente:
  - crear sesión puntual desde admin
  - reservar clase como socio
  - cancelar reserva como socio
  - hacer check-in QR con reserva
  - hacer check-in QR libre si aplica
