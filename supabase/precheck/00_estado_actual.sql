-- Precheck live de Supabase (SOLO LECTURA)
-- Este script es exclusivamente de inspección y NO debe modificar datos.
-- No incluir ALTER, UPDATE, INSERT, DELETE, DROP ni TRUNCATE.
-- Ejecutar manualmente en Supabase SQL Editor.
-- Copiar los resultados en la documentación o en la conversación de revisión.

-- A) Policies RLS activas
SELECT
  tablename,
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- B) RLS activo por tabla
SELECT
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- C) Columnas reales de tablas principales
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'perfiles',
    'gimnasios',
    'clases',
    'actividades',
    'horarios_clase',
    'sesiones',
    'reservas',
    'asistencia',
    'pagos'
  )
ORDER BY table_name, ordinal_position;

-- D) Funciones/RPC públicas
SELECT
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- E) Índices
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- F) Conteos clave
SELECT 'clases' AS tabla, COUNT(*) AS total FROM public.clases
UNION ALL SELECT 'actividades', COUNT(*) FROM public.actividades
UNION ALL SELECT 'horarios_clase', COUNT(*) FROM public.horarios_clase
UNION ALL SELECT 'sesiones', COUNT(*) FROM public.sesiones
UNION ALL SELECT 'reservas', COUNT(*) FROM public.reservas
UNION ALL SELECT 'reservas_canceladas', COUNT(*) FROM public.reservas WHERE estado = 'cancelada'
UNION ALL SELECT 'asistencia', COUNT(*) FROM public.asistencia
UNION ALL SELECT 'asistencia_sin_reserva', COUNT(*) FROM public.asistencia WHERE reserva_id IS NULL
UNION ALL SELECT 'pagos', COUNT(*) FROM public.pagos
UNION ALL SELECT 'perfiles_socios', COUNT(*) FROM public.perfiles WHERE rol = 'socio'
UNION ALL SELECT 'perfiles_admins', COUNT(*) FROM public.perfiles WHERE rol = 'admin';

-- G) Sesiones que podrían quedarse sin gym_id al hacer backfill futuro
SELECT
  s.id,
  s.fecha,
  s.horario_id,
  s.actividad_id,
  s.clase_id,
  h.gym_id AS gym_id_desde_horario,
  a.gym_id AS gym_id_desde_actividad,
  c.gym_id AS gym_id_desde_clase
FROM public.sesiones s
LEFT JOIN public.horarios_clase h ON h.id = s.horario_id
LEFT JOIN public.actividades a ON a.id = s.actividad_id
LEFT JOIN public.clases c ON c.id = s.clase_id
WHERE COALESCE(h.gym_id, a.gym_id, c.gym_id) IS NULL
ORDER BY s.fecha DESC;

-- H) Asistencias sin reserva
SELECT
  id,
  user_id,
  reserva_id,
  metodo,
  check_in_at
FROM public.asistencia
WHERE reserva_id IS NULL
ORDER BY check_in_at DESC
LIMIT 100;

-- I) Reservas canceladas sin trazabilidad actual
SELECT
  id,
  user_id,
  sesion_id,
  estado
FROM public.reservas
WHERE estado = 'cancelada'
ORDER BY id DESC
LIMIT 100;
