-- ============================================================
-- Fase 4E verificación
-- ============================================================

-- A) Definición vigente de la función
SELECT pg_get_functiondef('public.toggle_reserva(uuid,date)'::regprocedure) AS function_definition;

-- B) Reservas recientes
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
  cancelled_source
FROM public.reservas
ORDER BY created_at DESC
LIMIT 10;

-- C) Conteo agregado de trazabilidad
SELECT
  COUNT(*) AS total_reservas,
  COUNT(*) FILTER (WHERE estado = 'confirmada') AS confirmadas,
  COUNT(*) FILTER (WHERE created_by IS NOT NULL) AS con_created_by,
  COUNT(*) FILTER (WHERE created_source = 'socio') AS con_created_source_socio
FROM public.reservas;

-- D) Validación manual esperada
-- - Con reservas vacías, reservar clase desde socio debe crear 1 fila en reservas.
-- - La fila debe tener estado='confirmada'.
-- - created_by debe ser igual a user_id.
-- - created_source debe ser 'socio'.
-- - Cancelar desde socio debe cambiar estado='cancelada' y rellenar cancelled_at/by/source.
