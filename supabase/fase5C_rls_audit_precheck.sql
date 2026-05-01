-- Fase 5C - Precheck de auditoría RLS (solo lectura)

-- A) Inventario completo de policies relevantes
SELECT tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'reservas',
    'pagos',
    'perfiles',
    'clases',
    'gimnasios',
    'sesiones',
    'asistencia',
    'actividades',
    'horarios_clase'
  )
ORDER BY tablename, policyname;

-- B) RLS activo
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'reservas',
    'pagos',
    'perfiles',
    'clases',
    'gimnasios',
    'sesiones',
    'asistencia',
    'actividades',
    'horarios_clase'
  )
ORDER BY tablename;

-- C) Funciones helper de auth
SELECT
  routine_schema,
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('auth_gym_id', 'get_user_rol', 'toggle_reserva')
ORDER BY routine_name;

-- D) Conteos de reservas por estado y trazabilidad
SELECT
  COUNT(*) AS total_reservas,
  COUNT(*) FILTER (WHERE estado = 'confirmada') AS reservas_confirmadas,
  COUNT(*) FILTER (WHERE estado = 'cancelada') AS reservas_canceladas,
  COUNT(*) FILTER (WHERE created_by IS NOT NULL) AS reservas_con_created_by,
  COUNT(*) FILTER (WHERE created_source IS NOT NULL) AS reservas_con_created_source,
  COUNT(*) FILTER (WHERE cancelled_at IS NOT NULL) AS reservas_con_cancelled_at,
  COUNT(*) FILTER (WHERE cancelled_by IS NOT NULL) AS reservas_con_cancelled_by
FROM public.reservas;

-- E) Reservas con gym deducible por sesión
SELECT
  COUNT(*) AS total_reservas,
  COUNT(*) FILTER (WHERE s.gym_id IS NOT NULL) AS reservas_con_sesion_gym_id,
  COUNT(*) FILTER (WHERE s.gym_id IS NULL) AS reservas_sin_sesion_gym_id
FROM public.reservas r
LEFT JOIN public.sesiones s ON s.id = r.sesion_id;

-- F) Pagos por gym/estado
SELECT
  COUNT(*) AS total_pagos,
  COUNT(*) FILTER (WHERE gym_id IS NOT NULL) AS pagos_con_gym_id,
  COUNT(*) FILTER (WHERE gym_id IS NULL) AS pagos_sin_gym_id,
  COUNT(*) FILTER (WHERE estado = 'pagado') AS pagos_pagados,
  COUNT(*) FILTER (WHERE estado <> 'pagado') AS pagos_no_pagados
FROM public.pagos;

-- G) Perfiles por rol/gym
SELECT
  rol,
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE gym_id IS NOT NULL) AS con_gym_id,
  COUNT(*) FILTER (WHERE gym_id IS NULL) AS sin_gym_id
FROM public.perfiles
GROUP BY rol
ORDER BY rol;

-- H) Clases legacy
SELECT
  COUNT(*) AS total_clases_legacy,
  COUNT(*) FILTER (WHERE gym_id IS NOT NULL) AS clases_con_gym_id,
  COUNT(*) FILTER (WHERE gym_id IS NULL) AS clases_sin_gym_id
FROM public.clases;

-- I) Muestras
SELECT id, user_id, sesion_id, estado, created_at, created_by, created_source, cancelled_at, cancelled_by, cancelled_source
FROM public.reservas
ORDER BY created_at DESC
LIMIT 20;

SELECT id, user_id, gym_id, importe, tipo_membresia, metodo, estado, fecha_pago, stripe_payment_id
FROM public.pagos
ORDER BY fecha_pago DESC NULLS LAST, created_at DESC NULLS LAST
LIMIT 20;

SELECT id, gym_id, nombre, rol, membresia_activa, membresia_vence
FROM public.perfiles
ORDER BY rol, nombre
LIMIT 50;
