-- ============================================================
-- JGS Fight Team — Fase 3D-2A: rollback de limpieza RLS crítica
-- Archivo: supabase/fase3D2A_rls_critical_cleanup_rollback.sql
--
-- ADVERTENCIA:
-- - Este rollback reintroduce riesgos de exposición/amplitud detectados en 3D-1.
-- - Usar SOLO para contingencia si el fix rompe operación.
-- - No es estado final recomendado.
-- ============================================================

-- ------------------------------------------------------------
-- A) Re-crear policies legacy de public.perfiles
-- ------------------------------------------------------------
CREATE POLICY "leer perfiles"
  ON public.perfiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy legacy duplicada de "perfiles_select_propio"
CREATE POLICY "usuarios pueden leer su perfil"
  ON public.perfiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- ------------------------------------------------------------
-- B) Re-crear policies legacy de public.clases
-- ------------------------------------------------------------
CREATE POLICY "admin puede gestionar clases"
  ON public.clases
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "socios pueden leer clases"
  ON public.clases
  FOR SELECT
  TO authenticated
  USING (true);

-- ------------------------------------------------------------
-- C) Re-otorgar EXECUTE a anon en funciones sensibles
-- ------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.get_user_rol() TO anon;

-- Firma confirmada en repo: toggle_reserva(uuid, date)
GRANT EXECUTE ON FUNCTION public.toggle_reserva(uuid, date) TO anon;
