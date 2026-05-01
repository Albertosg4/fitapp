-- Verificación Fase 4B: tipo, nullability, default, nulos e índice de created_at

-- A) Tipo, nullability y default
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'reservas'
  AND column_name = 'created_at';

-- Resultado esperado:
-- data_type = timestamp with time zone
-- is_nullable = NO
-- column_default = now() o equivalente

-- B) Confirmar que no hay NULLs
SELECT
  COUNT(*) AS total_reservas,
  COUNT(*) FILTER (WHERE created_at IS NULL) AS reservas_sin_created_at
FROM public.reservas;

-- Resultado esperado:
-- reservas_sin_created_at = 0

-- C) Confirmar que el índice existe
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'reservas'
  AND indexname = 'idx_reservas_created_at';
