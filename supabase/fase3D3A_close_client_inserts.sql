-- Fase 3D-3A: cerrar INSERT directo desde cliente/authenticated en sesiones y asistencia.
BEGIN;
DROP POLICY IF EXISTS "sesiones_insert" ON public.sesiones;
DROP POLICY IF EXISTS "asistencia_insert" ON public.asistencia;
COMMIT;
