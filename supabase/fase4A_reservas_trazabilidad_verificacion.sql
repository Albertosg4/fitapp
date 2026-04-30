-- Verificación Fase 4A: columnas, índices y conteos en public.reservas.

SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'reservas'
  AND column_name IN (
    'created_at',
    'created_by',
    'created_source',
    'updated_at',
    'cancelled_at',
    'cancelled_by',
    'cancelled_source',
    'cancellation_reason'
  )
ORDER BY column_name;

SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'reservas'
  AND indexname IN (
    'idx_reservas_created_at',
    'idx_reservas_cancelled_at',
    'idx_reservas_created_by',
    'idx_reservas_cancelled_by'
  )
ORDER BY indexname;

SELECT
  COUNT(*) AS total_reservas,
  COUNT(*) FILTER (WHERE estado = 'cancelada') AS reservas_canceladas,
  COUNT(*) FILTER (WHERE created_at IS NOT NULL) AS reservas_con_created_at,
  COUNT(*) FILTER (WHERE cancelled_at IS NOT NULL) AS reservas_con_cancelled_at
FROM public.reservas;
