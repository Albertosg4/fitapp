-- Rollback Fase 4A: elimina columnas de trazabilidad en public.reservas.
-- ADVERTENCIA: este rollback puede borrar datos de auditoría si ya se hubieran rellenado.
BEGIN;

DROP INDEX IF EXISTS public.idx_reservas_cancelled_by;
DROP INDEX IF EXISTS public.idx_reservas_created_by;
DROP INDEX IF EXISTS public.idx_reservas_cancelled_at;
DROP INDEX IF EXISTS public.idx_reservas_created_at;

ALTER TABLE public.reservas
  DROP COLUMN IF EXISTS cancellation_reason,
  DROP COLUMN IF EXISTS cancelled_source,
  DROP COLUMN IF EXISTS cancelled_by,
  DROP COLUMN IF EXISTS cancelled_at,
  DROP COLUMN IF EXISTS updated_at,
  DROP COLUMN IF EXISTS created_source,
  DROP COLUMN IF EXISTS created_by,
  DROP COLUMN IF EXISTS created_at;

COMMIT;
