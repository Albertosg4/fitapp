-- Fase 5C-D (preparación) — Precheck de public.clases legacy
-- SOLO LECTURA. No aplica cambios.

-- 1) Estado RLS en public.clases
SELECT
  n.nspname AS schema_name,
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname = 'clases'
  AND c.relkind = 'r';

-- 2) Policies activas en public.clases
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'clases'
ORDER BY cmd, policyname;

-- 3) Conteo total de filas
SELECT COUNT(*) AS total_clases_legacy
FROM public.clases;

-- 4) Conteo por gym_id
SELECT
  gym_id,
  COUNT(*) AS total
FROM public.clases
GROUP BY gym_id
ORDER BY total DESC;

-- 5) Filas sin gym_id
SELECT
  COUNT(*) AS clases_sin_gym_id
FROM public.clases
WHERE gym_id IS NULL;

-- 6) Columnas de public.clases
SELECT
  ordinal_position,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'clases'
ORDER BY ordinal_position;

-- Nota:
-- Dependencias de runtime/código no se pueden verificar desde SQL.
-- Esa auditoría se realiza en el repositorio (búsqueda de usos .from('clases') y referencias legacy).
