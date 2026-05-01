-- A) Comprobar que las policies antiguas ya no están
SELECT tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('sesiones', 'asistencia')
  AND policyname IN (
    'sesiones_select',
    'sesiones_update_admin',
    'admin_ver_toda_asistencia'
  )
ORDER BY tablename, policyname;

-- Esperado: 0 rows.

-- B) Comprobar nuevas policies
SELECT tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('sesiones', 'asistencia')
ORDER BY tablename, policyname;

-- Debe verse:
-- - sesiones_select_gym_scoped
-- - sesiones_update_admin_gym_scoped
-- - admin_ver_asistencia_gym_scoped
-- - socio_ver_propia_asistencia

-- C) RLS activo
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('sesiones', 'asistencia')
ORDER BY tablename;

-- D) Conteos post-hardening
SELECT
  COUNT(*) AS total_sesiones,
  COUNT(*) FILTER (WHERE gym_id IS NOT NULL) AS sesiones_con_gym_id,
  COUNT(*) FILTER (WHERE gym_id IS NULL) AS sesiones_sin_gym_id
FROM public.sesiones;

SELECT
  COUNT(*) AS total_asistencia,
  COUNT(*) FILTER (WHERE gym_id IS NOT NULL) AS asistencia_con_gym_id,
  COUNT(*) FILTER (WHERE gym_id IS NULL) AS asistencia_sin_gym_id
FROM public.asistencia;

-- E) Comentario de validación manual
-- Validación funcional esperada:
-- - Panel socio carga calendario: OK
-- - Panel socio ve clases del gym: OK
-- - Panel admin carga sesiones/asistencia: OK
-- - Check-in QR sigue funcionando: OK
-- - Admin no debe poder leer asistencia/sesiones de otro gym cuando exista fixture multi-gym.
