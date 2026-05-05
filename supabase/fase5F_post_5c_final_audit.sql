-- Fase 5F — Auditoría final post-5C (SOLO LECTURA)
-- Objetivo: consolidar estado RLS + consistencia de gym_id + helpers/RPC + semáforos finales.
-- Importante:
--   * No aplicar DDL/DML en esta fase.
--   * No tocar Stripe/checkout/webhooks/Auth.
--   * No borrar datos.

-- =========================================================
-- A) Estado RLS/policies principales
-- =========================================================
SELECT
  n.nspname AS schema,
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS rls_forced,
  COUNT(p.polname) AS total_policies
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_policy p ON p.polrelid = c.oid
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relname IN (
    'perfiles', 'pagos', 'reservas', 'sesiones', 'asistencia',
    'gimnasios', 'clases', 'actividades', 'horarios_clase'
  )
GROUP BY n.nspname, c.relname, c.relrowsecurity, c.relforcerowsecurity
ORDER BY c.relname;

SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'perfiles', 'pagos', 'reservas', 'sesiones', 'asistencia',
    'gimnasios', 'clases', 'actividades', 'horarios_clase'
  )
ORDER BY tablename, policyname;

-- =========================================================
-- B) Conteos básicos por tabla
-- =========================================================
SELECT 'perfiles_total' AS metric, COUNT(*)::bigint AS total FROM public.perfiles
UNION ALL SELECT 'pagos_total', COUNT(*)::bigint FROM public.pagos
UNION ALL SELECT 'reservas_total', COUNT(*)::bigint FROM public.reservas
UNION ALL SELECT 'sesiones_total', COUNT(*)::bigint FROM public.sesiones
UNION ALL SELECT 'asistencia_total', COUNT(*)::bigint FROM public.asistencia
UNION ALL SELECT 'gimnasios_total', COUNT(*)::bigint FROM public.gimnasios
UNION ALL SELECT 'clases_total', COUNT(*)::bigint FROM public.clases
UNION ALL SELECT 'actividades_total', COUNT(*)::bigint FROM public.actividades
UNION ALL SELECT 'horarios_clase_total', COUNT(*)::bigint FROM public.horarios_clase
ORDER BY metric;

-- =========================================================
-- C) Conteos gym_id por tabla (solo donde existe gym_id)
-- =========================================================
SELECT 'perfiles' AS table_name,
       COUNT(*)::bigint AS total,
       COUNT(*) FILTER (WHERE gym_id IS NOT NULL)::bigint AS con_gym_id,
       COUNT(*) FILTER (WHERE gym_id IS NULL)::bigint AS sin_gym_id
FROM public.perfiles
UNION ALL
SELECT 'pagos', COUNT(*)::bigint,
       COUNT(*) FILTER (WHERE gym_id IS NOT NULL)::bigint,
       COUNT(*) FILTER (WHERE gym_id IS NULL)::bigint
FROM public.pagos
UNION ALL
SELECT 'sesiones', COUNT(*)::bigint,
       COUNT(*) FILTER (WHERE gym_id IS NOT NULL)::bigint,
       COUNT(*) FILTER (WHERE gym_id IS NULL)::bigint
FROM public.sesiones
UNION ALL
SELECT 'asistencia', COUNT(*)::bigint,
       COUNT(*) FILTER (WHERE gym_id IS NOT NULL)::bigint,
       COUNT(*) FILTER (WHERE gym_id IS NULL)::bigint
FROM public.asistencia
UNION ALL
SELECT 'clases', COUNT(*)::bigint,
       COUNT(*) FILTER (WHERE gym_id IS NOT NULL)::bigint,
       COUNT(*) FILTER (WHERE gym_id IS NULL)::bigint
FROM public.clases
UNION ALL
SELECT 'actividades', COUNT(*)::bigint,
       COUNT(*) FILTER (WHERE gym_id IS NOT NULL)::bigint,
       COUNT(*) FILTER (WHERE gym_id IS NULL)::bigint
FROM public.actividades
UNION ALL
SELECT 'horarios_clase', COUNT(*)::bigint,
       COUNT(*) FILTER (WHERE gym_id IS NOT NULL)::bigint,
       COUNT(*) FILTER (WHERE gym_id IS NULL)::bigint
FROM public.horarios_clase
ORDER BY table_name;

-- =========================================================
-- D) Mismatches de consistencia
-- =========================================================
WITH checks AS (
  SELECT
    'pagos_user_id_vs_perfiles_gym_id' AS check_name,
    COUNT(*)::bigint AS total
  FROM public.pagos pa
  JOIN public.perfiles pe ON pe.id = pa.user_id
  WHERE pa.gym_id IS DISTINCT FROM pe.gym_id

  UNION ALL

  SELECT
    'reservas_user_id_vs_sesiones_gym_id_vs_perfiles_gym_id' AS check_name,
    COUNT(*)::bigint AS total
  FROM public.reservas r
  JOIN public.sesiones s ON s.id = r.sesion_id
  JOIN public.perfiles pe ON pe.id = r.user_id
  WHERE s.gym_id IS DISTINCT FROM pe.gym_id

  UNION ALL

  SELECT
    'asistencia_user_id_vs_asistencia_gym_id_vs_perfiles_gym_id' AS check_name,
    COUNT(*)::bigint AS total
  FROM public.asistencia a
  JOIN public.perfiles pe ON pe.id = a.user_id
  WHERE a.gym_id IS DISTINCT FROM pe.gym_id

  UNION ALL

  SELECT
    'sesiones_sin_gym_id' AS check_name,
    COUNT(*)::bigint AS total
  FROM public.sesiones s
  WHERE s.gym_id IS NULL

  UNION ALL

  SELECT
    'reservas_asociadas_a_sesiones_sin_gym_id' AS check_name,
    COUNT(*)::bigint AS total
  FROM public.reservas r
  JOIN public.sesiones s ON s.id = r.sesion_id
  WHERE s.gym_id IS NULL

  UNION ALL

  SELECT
    'horarios_clase_gym_id_vs_actividades_gym_id' AS check_name,
    COUNT(*)::bigint AS total
  FROM public.horarios_clase h
  JOIN public.actividades a ON a.id = h.actividad_id
  WHERE h.gym_id IS DISTINCT FROM a.gym_id

  UNION ALL

  SELECT
    'sesiones_gym_id_vs_horarios_clase_gym_id' AS check_name,
    COUNT(*)::bigint AS total
  FROM public.sesiones s
  JOIN public.horarios_clase h ON h.id = s.horario_id
  WHERE s.horario_id IS NOT NULL
    AND s.gym_id IS DISTINCT FROM h.gym_id

  UNION ALL

  SELECT
    'sesiones_gym_id_vs_actividades_gym_id' AS check_name,
    COUNT(*)::bigint AS total
  FROM public.sesiones s
  JOIN public.actividades a ON a.id = s.actividad_id
  WHERE s.actividad_id IS NOT NULL
    AND s.gym_id IS DISTINCT FROM a.gym_id
)
SELECT
  check_name,
  total,
  CASE WHEN total = 0 THEN 'OK' ELSE 'WARNING' END AS status
FROM checks
ORDER BY check_name;

-- =========================================================
-- E) Estado de funciones helper/RPC + permisos EXECUTE
-- =========================================================
SELECT
  n.nspname AS schema,
  p.proname AS function_name,
  pg_catalog.pg_get_function_identity_arguments(p.oid) AS args,
  pg_catalog.pg_get_function_result(p.oid) AS returns,
  p.prosecdef AS security_definer,
  has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_can_execute,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_can_execute,
  has_function_privilege('service_role', p.oid, 'EXECUTE') AS service_role_can_execute
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND (
    (p.proname = 'auth_gym_id' AND pg_get_function_identity_arguments(p.oid) = '') OR
    (p.proname = 'get_user_rol' AND pg_get_function_identity_arguments(p.oid) = '') OR
    (
      p.proname = 'toggle_reserva'
      AND p.pronargs = 2
      AND p.proargtypes[0] = 'uuid'::regtype
      AND p.proargtypes[1] = 'date'::regtype
    )
  )
ORDER BY function_name;

-- =========================================================
-- F) Estado final esperado de 5C
-- =========================================================
WITH checks AS (
  SELECT
    'reservas_gym_scoped_ready' AS check_name,
    CASE
      WHEN (
        SELECT COUNT(DISTINCT policyname)
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'reservas'
          AND policyname IN (
            'reservas_insert_gym_scoped',
            'reservas_select_gym_scoped',
            'reservas_update_gym_scoped'
          )
      ) = 3
      THEN 'OK'
      ELSE 'WARNING'
    END AS status,
    'Set completo de 3 policies gym-scoped de reservas validado.' AS details

  UNION ALL

  SELECT
    'pagos_gym_scoped_ready',
    CASE
      WHEN EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'pagos'
          AND policyname = 'admin_ver_pagos_gym_scoped'
      )
      AND EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'pagos'
          AND policyname = 'socio_ver_propios_pagos_gym_scoped'
      )
      THEN 'OK' ELSE 'WARNING'
    END,
    'Policies gym-scoped de pagos presentes.'

  UNION ALL

  SELECT
    'perfiles_update_closed',
    CASE
      WHEN NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'perfiles' AND cmd = 'UPDATE'
      )
      THEN 'OK' ELSE 'WARNING'
    END,
    'public.perfiles sin policies UPDATE directas de cliente.'

  UNION ALL

  SELECT
    'clases_legacy_closed',
    CASE
      WHEN (
        SELECT COUNT(*) FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'clases'
      ) = 0
      THEN 'OK' ELSE 'WARNING'
    END,
    'Tabla legacy clases con 0 policies activas.'

  UNION ALL

  SELECT
    'multi_gym_demo_present',
    CASE
      WHEN EXISTS (
        SELECT 1 FROM public.gimnasios g
        WHERE g.id = 'b89abc75-8eb2-4dbf-8b32-f4586c75cccf'::uuid
      )
      THEN 'OK' ELSE 'WARNING'
    END,
    'Escenario demo multi-gym detectado (fase 5C-E).'

  UNION ALL

  SELECT
    'rls_base_closed',
    CASE
      WHEN NOT EXISTS (
        SELECT 1
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename IN ('perfiles','pagos','reservas','sesiones','asistencia','clases')
          AND policyname IN (
            'leer perfiles',
            'usuarios pueden leer su perfil',
            'admin_update_perfiles_su_gym',
            'perfiles_update_propio',
            'admin puede gestionar clases',
            'socios pueden leer clases',
            'clases_select',
            'clases_insert',
            'clases_update',
            'clases_delete',
            'sesiones_insert',
            'asistencia_insert',
            'admin_ver_todos_pagos',
            'Admin lee todos los pagos'
          )
      )
      THEN 'OK' ELSE 'WARNING'
    END,
    'Policies legacy críticas de 3D/5C ausentes.'
)
SELECT check_name, status, details
FROM checks
ORDER BY check_name;

-- =========================================================
-- G) Advertencias finales
-- =========================================================
WITH mismatch_total AS (
  SELECT COUNT(*)::bigint AS total
  FROM public.sesiones s
  WHERE s.gym_id IS NULL
), not_null_counts AS (
  SELECT 'perfiles' AS table_name, COUNT(*) FILTER (WHERE gym_id IS NULL)::bigint AS null_rows FROM public.perfiles
  UNION ALL
  SELECT 'pagos', COUNT(*) FILTER (WHERE gym_id IS NULL)::bigint FROM public.pagos
  UNION ALL
  SELECT 'sesiones', COUNT(*) FILTER (WHERE gym_id IS NULL)::bigint FROM public.sesiones
  UNION ALL
  SELECT 'asistencia', COUNT(*) FILTER (WHERE gym_id IS NULL)::bigint FROM public.asistencia
  UNION ALL
  SELECT 'actividades', COUNT(*) FILTER (WHERE gym_id IS NULL)::bigint FROM public.actividades
  UNION ALL
  SELECT 'horarios_clase', COUNT(*) FILTER (WHERE gym_id IS NULL)::bigint FROM public.horarios_clase
  UNION ALL
  SELECT 'clases', COUNT(*) FILTER (WHERE gym_id IS NULL)::bigint FROM public.clases
), not_null_pending AS (
  SELECT COALESCE(SUM(null_rows), 0)::bigint AS nulls_total
  FROM not_null_counts
)
SELECT
  'demo_data_present' AS warning_name,
  'INFO' AS severity,
  CASE
    WHEN EXISTS (SELECT 1 FROM public.gimnasios WHERE id = 'b89abc75-8eb2-4dbf-8b32-f4586c75cccf'::uuid)
    THEN 'PRESENT'
    ELSE 'ABSENT'
  END AS status,
  'Datos demo multi-gym detectados/no detectados. No limpiar en 5F.' AS details
UNION ALL
SELECT
  'qr_rate_limit_memory_only',
  'WARNING',
  'PENDING',
  'Rate limit QR en memoria (best-effort). Evaluar diseño distribuido en fase posterior.'
UNION ALL
SELECT
  'possible_not_null_candidates_pending_review',
  'INFO',
  CASE WHEN (SELECT nulls_total FROM not_null_pending) = 0 THEN 'READY_REVIEW' ELSE 'HAS_NULLS' END,
  'Revisar salida de fase5F_post_5c_not_null_candidates.sql antes de cualquier constraint.'
UNION ALL
SELECT
  'duplicate_indexes_pending_review',
  'INFO',
  'PENDING',
  'Inventario preparado en fase5F_post_5c_indexes_inventory.sql; requiere revisión manual.'
UNION ALL
SELECT
  'sesiones_without_gym_id',
  CASE WHEN (SELECT total FROM mismatch_total) = 0 THEN 'INFO' ELSE 'BLOCKER' END,
  CASE WHEN (SELECT total FROM mismatch_total) = 0 THEN 'OK' ELSE 'HAS_ROWS' END,
  'Si hay sesiones sin gym_id, bloquear endurecimientos NOT NULL hasta saneo controlado.'
ORDER BY warning_name;
