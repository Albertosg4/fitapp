-- Fase 4C - Verificación de trazabilidad runtime en reservas

-- A) Ver definición de la función
SELECT
  pg_get_functiondef('public.toggle_reserva(uuid,date)'::regprocedure) AS function_definition;

-- B) Ver últimas reservas con trazabilidad
SELECT
  id,
  user_id,
  sesion_id,
  estado,
  created_at,
  created_by,
  created_source,
  updated_at,
  cancelled_at,
  cancelled_by,
  cancelled_source,
  cancellation_reason
FROM public.reservas
ORDER BY created_at DESC
LIMIT 20;

-- C) Conteo agregado
SELECT
  COUNT(*) AS total_reservas,
  COUNT(*) FILTER (WHERE created_by IS NOT NULL) AS reservas_con_created_by,
  COUNT(*) FILTER (WHERE created_source IS NOT NULL) AS reservas_con_created_source,
  COUNT(*) FILTER (WHERE estado = 'cancelada') AS reservas_canceladas,
  COUNT(*) FILTER (WHERE estado = 'cancelada' AND cancelled_at IS NOT NULL) AS canceladas_con_cancelled_at,
  COUNT(*) FILTER (WHERE estado = 'cancelada' AND cancelled_by IS NOT NULL) AS canceladas_con_cancelled_by,
  COUNT(*) FILTER (WHERE estado = 'cancelada' AND cancelled_source IS NOT NULL) AS canceladas_con_cancelled_source
FROM public.reservas;

-- D) Validación manual esperada
-- - tras reservar una clase nueva, la reserva debe tener created_by y created_source = 'socio'
-- - tras cancelar, debe tener cancelled_at, cancelled_by, cancelled_source = 'socio' y updated_at
-- - tras reactivar, debe limpiar cancelled_at/by/source/reason y actualizar updated_at
