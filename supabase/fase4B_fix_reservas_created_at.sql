-- Fase 4B: corrige drift de esquema en public.reservas.created_at
-- Objetivo: normalizar a timestamptz NOT NULL DEFAULT now()
-- Nota: se interpreta created_at legacy como UTC para preservar el instante real
-- almacenado por Supabase/Postgres. La presentación en Europe/Madrid debe hacerse
-- en app/UI, no reinterpretarse en esta migración.
BEGIN;

UPDATE public.reservas
SET created_at = now()
WHERE created_at IS NULL;

ALTER TABLE public.reservas
  ALTER COLUMN created_at TYPE timestamptz
  USING created_at AT TIME ZONE 'UTC';

ALTER TABLE public.reservas
  ALTER COLUMN created_at SET DEFAULT now();

ALTER TABLE public.reservas
  ALTER COLUMN created_at SET NOT NULL;

COMMIT;
