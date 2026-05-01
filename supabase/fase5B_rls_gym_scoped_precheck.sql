-- Fase 5B precheck (solo lectura)

-- A) Policies actuales relevantes
SELECT tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'sesiones',
    'asistencia',
    'reservas',
    'pagos',
    'perfiles',
    'gimnasios',
    'actividades',
    'horarios_clase',
    'clases'
  )
ORDER BY tablename, policyname;

-- B) RLS activo
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'sesiones',
    'asistencia',
    'reservas',
    'pagos',
    'perfiles',
    'gimnasios',
    'actividades',
    'horarios_clase',
    'clases'
  )
ORDER BY tablename;

-- C) Conteo de datos para validar gym_id directo
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

-- D) Muestras de sesiones/asistencia
SELECT id, gym_id, horario_id, actividad_id, fecha, hora_inicio, cancelada, es_puntual
FROM public.sesiones
ORDER BY fecha DESC, hora_inicio DESC
LIMIT 20;

SELECT id, user_id, reserva_id, sesion_id, gym_id, metodo, check_in_at
FROM public.asistencia
ORDER BY check_in_at DESC
LIMIT 20;
