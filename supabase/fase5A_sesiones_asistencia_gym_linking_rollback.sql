BEGIN;

-- El rollback elimina columnas e índices de Fase 5A y puede perder datos de trazabilidad añadidos tras aplicar la fase.
-- Usar solo ante regresión.
DROP INDEX IF EXISTS idx_asistencia_sesion;
DROP INDEX IF EXISTS idx_asistencia_gym_fecha;
DROP INDEX IF EXISTS idx_sesiones_gym_fecha;

ALTER TABLE public.asistencia
  DROP COLUMN IF EXISTS sesion_id,
  DROP COLUMN IF EXISTS gym_id;

ALTER TABLE public.sesiones
  DROP COLUMN IF EXISTS gym_id;

COMMIT;
