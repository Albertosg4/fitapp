-- Rollback Fase 4B: revierte created_at a timestamp without time zone y nullable.
-- Nota: se usa UTC para preservar el instante real almacenado por Supabase/Postgres.
-- La presentación en Europe/Madrid debe resolverse en app/UI, no reinterpretando datos
-- en el cambio de tipo.
BEGIN;

ALTER TABLE public.reservas
  ALTER COLUMN created_at DROP NOT NULL;

ALTER TABLE public.reservas
  ALTER COLUMN created_at TYPE timestamp without time zone
  USING created_at AT TIME ZONE 'UTC';

ALTER TABLE public.reservas
  ALTER COLUMN created_at SET DEFAULT now();

COMMIT;
