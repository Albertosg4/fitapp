SELECT
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    (table_name = 'sesiones' AND column_name = 'gym_id')
    OR (table_name = 'asistencia' AND column_name IN ('gym_id', 'sesion_id'))
  )
ORDER BY table_name, column_name;

SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN (
    'idx_sesiones_gym_fecha',
    'idx_asistencia_gym_fecha',
    'idx_asistencia_sesion'
  )
ORDER BY tablename, indexname;

SELECT
  COUNT(*) AS total_sesiones,
  COUNT(*) FILTER (WHERE gym_id IS NOT NULL) AS sesiones_con_gym_id,
  COUNT(*) FILTER (WHERE gym_id IS NULL) AS sesiones_sin_gym_id
FROM public.sesiones;

SELECT
  COUNT(*) AS total_asistencia,
  COUNT(*) FILTER (WHERE gym_id IS NOT NULL) AS asistencia_con_gym_id,
  COUNT(*) FILTER (WHERE gym_id IS NULL) AS asistencia_sin_gym_id,
  COUNT(*) FILTER (WHERE reserva_id IS NOT NULL AND sesion_id IS NOT NULL) AS asistencia_con_reserva_y_sesion,
  COUNT(*) FILTER (WHERE reserva_id IS NOT NULL AND sesion_id IS NULL) AS asistencia_con_reserva_sin_sesion
FROM public.asistencia;

SELECT
  id,
  gym_id,
  horario_id,
  actividad_id,
  fecha,
  hora_inicio,
  cancelada,
  es_puntual
FROM public.sesiones
ORDER BY fecha DESC, hora_inicio DESC
LIMIT 20;

SELECT
  id,
  user_id,
  reserva_id,
  sesion_id,
  gym_id,
  metodo,
  check_in_at
FROM public.asistencia
ORDER BY check_in_at DESC
LIMIT 20;
