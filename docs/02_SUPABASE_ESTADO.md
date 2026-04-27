# 02 · Supabase · Estado observado desde código

> Documento inferido desde TypeScript y SQL del repo. No ejecuta cambios en BD.

## Tablas detectadas desde el código
- `perfiles`
- `gimnasios`
- `actividades`
- `horarios_clase`
- `sesiones`
- `reservas`
- `asistencia`
- `pagos`
- (legacy referencial) `clases`

## Columnas importantes inferidas
- **perfiles:** `id`, `gym_id`, `nombre`, `rol`, `tipo_membresia`, `membresia_activa`, `membresia_vence`, `qr_token`, `stripe_customer_id`.
- **gimnasios:** `id` (mínimo confirmado por lecturas).
- **actividades:** `id`, `gym_id`, `nombre`, `descripcion`, `color`, `activa`, `created_at`.
- **horarios_clase:** `id`, `gym_id`, `actividad_id`, `dia_semana`, `hora_inicio`, `duracion_min`, `aforo_max`, `profesor`, `fecha_inicio`, `fecha_fin`, `activo`.
- **sesiones:** `id`, `clase_id` (legacy), `horario_id`, `actividad_id`, `fecha`, `hora_inicio`, `duracion_min`, `aforo_max`, `profesor`, `cancelada`, `es_puntual`, `created_at`.
- **reservas:** `id`, `sesion_id`, `user_id`, `estado`.
- **asistencia:** `id`, `user_id`, `reserva_id`, `metodo`, `check_in_at`.
- **pagos:** `id`, `user_id`, `gym_id`, `importe`, `tipo_membresia`, `meses`, `metodo`, `estado`, `notas`, `fecha_pago`, `stripe_payment_id`, `created_at`.

## Accesos desde cliente (Supabase JS en frontend)
- `useSocioData` lee `perfiles`, `horarios_clase`, `sesiones`, `reservas`.
- `useAdminData` lee/actualiza `perfiles`, lee `actividades`, `horarios_clase`, `sesiones`, `gimnasios`.
- Tabs admin (`ActividadesTab`, `HorariosTab`, `ClasesPuntualesTab`) realizan lecturas y escrituras directas en cliente.
- `SociosTab` mantiene al menos una escritura directa de `perfiles` (toggle membresía).

## Accesos desde APIs server
- `register-socio`: `perfiles` + `auth.admin.createUser`.
- `pagos` / `pagos/manual`: `pagos`, `perfiles`.
- `reservas/toggle`: `horarios_clase`, `sesiones`, `reservas` (+ RPC `toggle_reserva`).
- `checkin`: `perfiles`, `sesiones`, `reservas`, `asistencia`.
- `stripe/checkout`: `perfiles`, `auth admin`.
- `stripe/webhook`: `perfiles`, `pagos`.

## RLS conocido
- Existe script completo `supabase/fase3_seguridad.sql` que:
  - activa RLS en `perfiles`, `reservas`, `horarios_clase`, `sesiones`, `actividades`, `asistencia`, `pagos`, `gimnasios`.
  - define helper `auth_gym_id()`.
  - crea policies por rol/contexto.
- Existe fase 3A (`supabase/fase3A_seguridad.sql`) explícitamente diseñada como segura sin forzar la transición completa de RLS en escrituras admin.
- Contexto operativo reportado: RLS parece activa en varias tablas con policies antiguas (requiere inventario real en entorno Supabase).

## Policies conocidas (documentadas en SQL)
- `perfiles`: `socio_lee_su_perfil`, `admin_lee_perfiles_su_gym`, `admin_update_perfiles_su_gym`.
- `reservas`: `socio_lee_sus_reservas`, `admin_lee_reservas_su_gym` (sin escritura cliente).
- `horarios_clase`: `socio_lee_horarios_su_gym`.
- `sesiones`: `socio_lee_sesiones_su_gym`.
- `actividades`: `auth_lee_actividades_su_gym`.
- `asistencia`: `socio_lee_su_asistencia`, `admin_lee_asistencia_su_gym`.
- `pagos`: `socio_lee_sus_pagos`, `admin_lee_pagos_su_gym`.
- `gimnasios`: `admin_lee_su_gimnasio`.

## RPCs conocidas
- `toggle_reserva(uuid, date)`
  - `SECURITY DEFINER`.
  - valida auth (`auth.uid()`), membresía, gym, aforo.
  - crea/cancela/reactiva reserva de forma atómica.
- `auth_gym_id()` (helper SQL estable para policies RLS).

## Índices / constraints conocidos
- Índices rendimiento:
  - `idx_reservas_sesion_estado`
  - `idx_reservas_user_estado`
  - `idx_sesiones_horario_fecha`
  - `idx_sesiones_fecha`
  - `idx_horarios_clase_gym_activo`
  - `idx_perfiles_gym_rol`
  - `idx_asistencia_user`
  - `idx_pagos_user`
  - `idx_pagos_gym`
- Constraints por índice único parcial:
  - `reservas_sesion_user_confirmada_unique`
  - `sesiones_horario_fecha_unique`

## Dudas abiertas (a resolver en auditoría real)
- Qué policies exactas están activas hoy en producción vs scripts del repo.
- Si existen policies heredadas no reflejadas en `fase3_seguridad.sql`.
- Nivel real de aislamiento multi-gym en queries cliente admin (si RLS actual lo cubre o no).
- Si todas las tablas sensibles tienen `rowscurity=true` actualmente en prod.
- Si la RPC `toggle_reserva` está desplegada idéntica a la versión del repo.

## Queries de auditoría recomendadas (solo lectura)
```sql
-- Estado RLS por tabla
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('perfiles','reservas','horarios_clase','sesiones','actividades','asistencia','pagos','gimnasios')
ORDER BY tablename;

-- Policies vigentes
SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- RPCs relevantes
SELECT routine_name, security_type
FROM information_schema.routines
WHERE routine_schema='public' AND routine_name IN ('toggle_reserva','auth_gym_id');

-- Índices clave
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname='public'
  AND indexname IN (
    'idx_reservas_sesion_estado','idx_reservas_user_estado','idx_sesiones_horario_fecha','idx_sesiones_fecha',
    'idx_horarios_clase_gym_activo','idx_perfiles_gym_rol','idx_asistencia_user','idx_pagos_user','idx_pagos_gym',
    'reservas_sesion_user_confirmada_unique','sesiones_horario_fecha_unique'
  )
ORDER BY tablename, indexname;
```
