-- Fase 5C-D (preparación) — Rollback de policies legacy en public.clases
-- SOLO ejecutar si falla 5C-D y se necesita restaurar comportamiento legacy.
-- No borra datos. No toca Auth/Stripe.

BEGIN;

-- Limpiar estado previo (idempotente)
DROP POLICY IF EXISTS "clases_select" ON public.clases;
DROP POLICY IF EXISTS "clases_insert" ON public.clases;
DROP POLICY IF EXISTS "clases_update" ON public.clases;
DROP POLICY IF EXISTS "clases_delete" ON public.clases;
DROP POLICY IF EXISTS "admin puede gestionar clases" ON public.clases;
DROP POLICY IF EXISTS "socios pueden leer clases" ON public.clases;

-- Restaurar set legacy documentado en auditorías 5C
CREATE POLICY "clases_select"
  ON public.clases
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "clases_insert"
  ON public.clases
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "clases_update"
  ON public.clases
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "clases_delete"
  ON public.clases
  FOR DELETE
  TO public
  USING (true);

COMMENT ON TABLE public.clases IS
'Tabla legacy (rollback 5C-D): policies legacy restauradas temporalmente. Modelo recomendado: actividades + horarios_clase + sesiones.';

COMMIT;
