-- Fase 4B: corrige drift de esquema en public.reservas.created_at
-- Objetivo: normalizar a timestamptz NOT NULL DEFAULT now()
BEGIN;

UPDATE public.reservas
SET created_at = now()
WHERE created_at IS NULL;

ALTER TABLE public.reservas
  ALTER COLUMN created_at TYPE timestamptz
  USING created_at AT TIME ZONE 'Europe/Madrid';

ALTER TABLE public.reservas
  ALTER COLUMN created_at SET DEFAULT now();

ALTER TABLE public.reservas
  ALTER COLUMN created_at SET NOT NULL;

COMMIT;
