-- A) Confirmar que las policies ya no existen
SELECT
  tablename,
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND (
    (tablename = 'sesiones' AND policyname = 'sesiones_insert')
    OR
    (tablename = 'asistencia' AND policyname = 'asistencia_insert')
  )
ORDER BY tablename, policyname;

-- Resultado esperado tras aplicar el SQL principal: 0 rows.

-- B) Confirmar que RLS sigue activo en sesiones y asistencia
SELECT
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('sesiones', 'asistencia')
ORDER BY tablename;

-- C) Listar las policies restantes de sesiones y asistencia
SELECT
  tablename,
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('sesiones', 'asistencia')
ORDER BY tablename, policyname;
