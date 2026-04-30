-- Fase 4A: añade columnas base de trazabilidad en public.reservas sin cambiar lógica de aplicación.
BEGIN;

ALTER TABLE public.reservas
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_source text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cancelled_source text,
  ADD COLUMN IF NOT EXISTS cancellation_reason text;

CREATE INDEX IF NOT EXISTS idx_reservas_created_at
  ON public.reservas (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reservas_cancelled_at
  ON public.reservas (cancelled_at DESC)
  WHERE cancelled_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reservas_created_by
  ON public.reservas (created_by)
  WHERE created_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reservas_cancelled_by
  ON public.reservas (cancelled_by)
  WHERE cancelled_by IS NOT NULL;

COMMIT;
