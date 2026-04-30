-- A) Confirmar que la policy pública ya no existe
SELECT
  tablename,
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'gimnasios'
  AND policyname = 'leer gimnasios'
ORDER BY policyname;

-- Resultado esperado tras aplicar el SQL principal: 0 rows.

-- B) Confirmar que sigue existiendo la policy de lectura autenticada
SELECT
  tablename,
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'gimnasios'
ORDER BY policyname;

-- Resultado esperado:
-- - debe seguir existiendo "gimnasios_auth"
-- - no debe aparecer "leer gimnasios"

-- C) Confirmar que RLS sigue activo en gimnasios
SELECT
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'gimnasios';

-- Resultado esperado:
-- - rowsecurity = true
