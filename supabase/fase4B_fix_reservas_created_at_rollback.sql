-- Rollback Fase 4B: revierte created_at a timestamp without time zone y nullable.
-- Atención: este rollback puede perder semántica de zona horaria en los valores almacenados.
BEGIN;

ALTER TABLE public.reservas
  ALTER COLUMN created_at DROP NOT NULL;

ALTER TABLE public.reservas
  ALTER COLUMN created_at TYPE timestamp without time zone
  USING created_at AT TIME ZONE 'Europe/Madrid';

ALTER TABLE public.reservas
  ALTER COLUMN created_at SET DEFAULT now();

COMMIT;
