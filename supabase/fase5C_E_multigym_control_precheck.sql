-- Fase 5C-E (preparación) - Precheck multi-gym controlado
-- Objetivo: inspeccionar estado actual antes de crear un segundo gym demo.
-- Este script es SOLO lectura.

-- 1) Gimnasios existentes
SELECT id, nombre, created_at
FROM public.gimnasios
ORDER BY created_at NULLS LAST, nombre;

-- 2) Perfiles por gym y rol
SELECT p.gym_id, g.nombre AS gym_nombre, p.rol, COUNT(*) AS total
FROM public.perfiles p
LEFT JOIN public.gimnasios g ON g.id = p.gym_id
GROUP BY p.gym_id, g.nombre, p.rol
ORDER BY g.nombre NULLS LAST, p.rol;

-- 3) Pagos por gym y estado
SELECT pg.gym_id, g.nombre AS gym_nombre, pg.estado, COUNT(*) AS total
FROM public.pagos pg
LEFT JOIN public.gimnasios g ON g.id = pg.gym_id
GROUP BY pg.gym_id, g.nombre, pg.estado
ORDER BY g.nombre NULLS LAST, pg.estado;

-- 4) Sesiones por gym
SELECT s.gym_id, g.nombre AS gym_nombre, COUNT(*) AS total_sesiones
FROM public.sesiones s
LEFT JOIN public.gimnasios g ON g.id = s.gym_id
GROUP BY s.gym_id, g.nombre
ORDER BY g.nombre NULLS LAST;

-- 5) Reservas por gym (deducido por sesión)
SELECT s.gym_id, g.nombre AS gym_nombre, r.estado, COUNT(*) AS total_reservas
FROM public.reservas r
JOIN public.sesiones s ON s.id = r.sesion_id
LEFT JOIN public.gimnasios g ON g.id = s.gym_id
GROUP BY s.gym_id, g.nombre, r.estado
ORDER BY g.nombre NULLS LAST, r.estado;

-- 6) Filas sin gym_id en tablas relevantes
SELECT 'perfiles' AS tabla, COUNT(*) AS filas_sin_gym_id
FROM public.perfiles
WHERE gym_id IS NULL
UNION ALL
SELECT 'pagos' AS tabla, COUNT(*) AS filas_sin_gym_id
FROM public.pagos
WHERE gym_id IS NULL
UNION ALL
SELECT 'sesiones' AS tabla, COUNT(*) AS filas_sin_gym_id
FROM public.sesiones
WHERE gym_id IS NULL;

-- 7) Mismatches pagos vs perfil (cross-gym)
SELECT COUNT(*) AS pagos_user_gym_mismatch
FROM public.pagos pg
JOIN public.perfiles p ON p.id = pg.user_id
WHERE pg.gym_id IS DISTINCT FROM p.gym_id;

-- 8) Mismatches reservas vs perfil/sesión (cross-gym)
SELECT COUNT(*) AS reservas_user_session_gym_mismatch
FROM public.reservas r
JOIN public.perfiles p ON p.id = r.user_id
JOIN public.sesiones s ON s.id = r.sesion_id
WHERE p.gym_id IS DISTINCT FROM s.gym_id;

-- 9) Mismatches reservas vs sesión sin gym_id (inconsistencia de referencia)
SELECT COUNT(*) AS reservas_sin_sesion_gym_id
FROM public.reservas r
JOIN public.sesiones s ON s.id = r.sesion_id
WHERE s.gym_id IS NULL;

-- 10) Columnas relevantes para confirmar compatibilidad
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('gimnasios', 'perfiles', 'pagos', 'sesiones', 'reservas')
ORDER BY table_name, ordinal_position;
