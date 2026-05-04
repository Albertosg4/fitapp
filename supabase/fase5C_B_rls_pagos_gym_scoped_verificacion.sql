-- Verificación Fase 5C-B (pagos gym-scoped)
-- Salida pensada para pegar en ChatGPT.

-- 1) RLS activo en public.pagos
SELECT
  'rls_estado' AS check_name,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'pagos';

-- 2) Policies activas de public.pagos
SELECT
  'policies_activas' AS check_name,
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'pagos'
ORDER BY policyname;

-- 3) Conteos principales de datos
SELECT
  'conteos_pagos' AS check_name,
  COUNT(*) AS total_pagos,
  COUNT(*) FILTER (WHERE gym_id IS NOT NULL) AS pagos_con_gym_id,
  COUNT(*) FILTER (WHERE gym_id IS NULL) AS pagos_sin_gym_id
FROM public.pagos;

-- 4) Policies legacy/globales esperadas como ausentes
SELECT
  'legacy_policy_presence' AS check_name,
  policyname,
  CASE WHEN COUNT(*) = 0 THEN 'AUSENTE_OK' ELSE 'PRESENTE_REVISAR' END AS status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'pagos'
  AND policyname IN ('Admin lee todos los pagos', 'admin_ver_todos_pagos', 'socio_ver_propios_pagos')
GROUP BY policyname
UNION ALL
SELECT
  'legacy_policy_presence' AS check_name,
  x.policyname,
  'AUSENTE_OK' AS status
FROM (VALUES ('Admin lee todos los pagos'), ('admin_ver_todos_pagos'), ('socio_ver_propios_pagos')) AS x(policyname)
WHERE NOT EXISTS (
  SELECT 1
  FROM pg_policies p
  WHERE p.schemaname = 'public'
    AND p.tablename = 'pagos'
    AND p.policyname = x.policyname
)
ORDER BY policyname;

-- 5) Policies nuevas esperadas como presentes
SELECT
  'new_policy_presence' AS check_name,
  policyname,
  CASE WHEN COUNT(*) = 1 THEN 'PRESENTE_OK' ELSE 'FALTA_O_DUPLICADA_REVISAR' END AS status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'pagos'
  AND policyname IN ('admin_ver_pagos_gym_scoped', 'socio_ver_propios_pagos_gym_scoped')
GROUP BY policyname
UNION ALL
SELECT
  'new_policy_presence' AS check_name,
  x.policyname,
  'FALTA_O_DUPLICADA_REVISAR' AS status
FROM (VALUES ('admin_ver_pagos_gym_scoped'), ('socio_ver_propios_pagos_gym_scoped')) AS x(policyname)
WHERE NOT EXISTS (
  SELECT 1
  FROM pg_policies p
  WHERE p.schemaname = 'public'
    AND p.tablename = 'pagos'
    AND p.policyname = x.policyname
)
ORDER BY policyname;

-- 6) Validación de helper auth_gym_id()
SELECT
  'auth_gym_id_function' AS check_name,
  routine_schema,
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'auth_gym_id';

-- 7) Warnings de compatibilidad de datos
SELECT
  'warning_pagos_sin_gym_id' AS warning_name,
  COUNT(*) AS cantidad,
  CASE
    WHEN COUNT(*) = 0 THEN 'OK'
    ELSE 'WARNING: existen pagos sin gym_id; revisar backfill antes de endurecer más operaciones.'
  END AS warning
FROM public.pagos
WHERE gym_id IS NULL;

SELECT
  'warning_pagos_user_gym_mismatch' AS warning_name,
  COUNT(*) AS cantidad,
  CASE
    WHEN COUNT(*) = 0 THEN 'OK'
    ELSE 'WARNING: hay pagos con gym_id distinto al gym_id del perfil del usuario.'
  END AS warning
FROM public.pagos pa
JOIN public.perfiles pe ON pe.id = pa.user_id
WHERE pa.gym_id IS NOT NULL
  AND pe.gym_id IS NOT NULL
  AND pa.gym_id <> pe.gym_id;
