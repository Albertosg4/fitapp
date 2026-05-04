-- Fase 5C-D (preparación) — Verificación post-hardening de public.clases
-- SOLO LECTURA.

-- 1) Confirmar RLS activo
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

-- 2) Confirmar policies activas restantes
SELECT
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'clases'
ORDER BY cmd, policyname;

-- 3) Confirmar total de filas (sin cambios de datos)
SELECT COUNT(*) AS total_clases_legacy
FROM public.clases;

-- 4) Warning explícito si hay filas
SELECT
  CASE
    WHEN COUNT(*) > 0 THEN 'WARNING: public.clases contiene filas; validar deprecación antes de bloquear accesos cliente.'
    ELSE 'OK: public.clases sin filas.'
  END AS estado_clases_legacy
FROM public.clases;
