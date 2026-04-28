-- ============================================================
-- JGS Fight Team — Fase 3D-2A: rollback de limpieza RLS crítica
-- Archivo: supabase/fase3D2A_rls_critical_cleanup_rollback.sql
--
-- ADVERTENCIA:
-- - Este rollback es SOLO de contingencia.
-- - Reintroduce riesgos de exposición/amplitud detectados en 3D-1.
-- - Solo debe usarse si el cleanup rompe operación.
-- - No es el estado final recomendado.
-- ============================================================

-- ------------------------------------------------------------
-- A) Re-crear policies legacy de public.perfiles
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "leer perfiles" ON public.perfiles;
CREATE POLICY "leer perfiles"
  ON public.perfiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy legacy duplicada de "perfiles_select_propio"
DROP POLICY IF EXISTS "usuarios pueden leer su perfil" ON public.perfiles;
CREATE POLICY "usuarios pueden leer su perfil"
  ON public.perfiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- ------------------------------------------------------------
-- B) Re-crear policies legacy de public.clases
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "admin puede gestionar clases" ON public.clases;
CREATE POLICY "admin puede gestionar clases"
  ON public.clases
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "socios pueden leer clases" ON public.clases;
CREATE POLICY "socios pueden leer clases"
  ON public.clases
  FOR SELECT
  TO authenticated
  USING (true);

-- ------------------------------------------------------------
-- C) Re-otorgar EXECUTE de contingencia en funciones sensibles
-- Este bloque:
-- - reotorga EXECUTE a anon (contingencia),
-- - reasegura authenticated y service_role,
-- - no representa el estado final recomendado de seguridad.
-- ------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.get_user_rol() TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_rol() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_rol() TO service_role;

-- Firma confirmada en repo: toggle_reserva(uuid, date)
GRANT EXECUTE ON FUNCTION public.toggle_reserva(uuid, date) TO anon;
GRANT EXECUTE ON FUNCTION public.toggle_reserva(uuid, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_reserva(uuid, date) TO service_role;
