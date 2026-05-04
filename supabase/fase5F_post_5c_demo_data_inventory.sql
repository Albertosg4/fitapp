-- Fase 5F — Inventario de datos demo multi-gym (SOLO LECTURA)
-- No borrar ni modificar datos en esta fase.
-- Nota: NO tocar auth.users aquí.
-- Si se decide limpieza futura, los usuarios Auth demo se eliminan manualmente desde Supabase Dashboard/Auth.

-- Referencias demo 5C-E:
-- Gym demo: FITAPP Demo Gym 2
-- gym_id: b89abc75-8eb2-4dbf-8b32-f4586c75cccf
-- Admin demo auth user id: 28070f8a-b271-49e6-8343-649b2c1d0bfb (admin.demo.gym2@fitapp.test)
-- Socio demo auth user id: b87084ff-124c-4b90-a96b-6bf0f52c16bc (socio.demo.gym2@fitapp.test)
-- Tag demo: F5CE_DEMO_GYM2_2026_05

WITH constants AS (
  SELECT
    'b89abc75-8eb2-4dbf-8b32-f4586c75cccf'::uuid AS demo_gym_id,
    '28070f8a-b271-49e6-8343-649b2c1d0bfb'::uuid AS demo_admin_id,
    'b87084ff-124c-4b90-a96b-6bf0f52c16bc'::uuid AS demo_socio_id,
    'F5CE_DEMO_GYM2_2026_05'::text AS demo_tag
)
SELECT
  'gym_demo_exists' AS check_name,
  COUNT(*)::bigint AS total,
  CASE WHEN COUNT(*) > 0 THEN 'FOUND' ELSE 'NOT_FOUND' END AS status,
  'Existencia del gym demo por id.' AS details
FROM public.gimnasios g
CROSS JOIN constants c
WHERE g.id = c.demo_gym_id

UNION ALL

SELECT
  'perfiles_demo_found' AS check_name,
  COUNT(*)::bigint AS total,
  CASE WHEN COUNT(*) > 0 THEN 'FOUND' ELSE 'NOT_FOUND' END AS status,
  'Perfiles demo (admin/socio) en public.perfiles.' AS details
FROM public.perfiles p
CROSS JOIN constants c
WHERE p.id IN (c.demo_admin_id, c.demo_socio_id)

UNION ALL

SELECT
  'pagos_demo_found' AS check_name,
  COUNT(*)::bigint AS total,
  CASE WHEN COUNT(*) > 0 THEN 'FOUND' ELSE 'NOT_FOUND' END AS status,
  'Pagos asociados al gym demo o usuarios demo.' AS details
FROM public.pagos pa
CROSS JOIN constants c
WHERE pa.gym_id = c.demo_gym_id
   OR pa.user_id IN (c.demo_admin_id, c.demo_socio_id)

UNION ALL

SELECT
  'sesiones_demo_found' AS check_name,
  COUNT(*)::bigint AS total,
  CASE WHEN COUNT(*) > 0 THEN 'FOUND' ELSE 'NOT_FOUND' END AS status,
  'Sesiones asociadas al gym demo.' AS details
FROM public.sesiones s
CROSS JOIN constants c
WHERE s.gym_id = c.demo_gym_id

UNION ALL

SELECT
  'reservas_demo_found' AS check_name,
  COUNT(*)::bigint AS total,
  CASE WHEN COUNT(*) > 0 THEN 'FOUND' ELSE 'NOT_FOUND' END AS status,
  'Reservas de usuarios demo o sobre sesiones del gym demo.' AS details
FROM public.reservas r
JOIN public.sesiones s ON s.id = r.sesion_id
CROSS JOIN constants c
WHERE r.user_id IN (c.demo_admin_id, c.demo_socio_id)
   OR s.gym_id = c.demo_gym_id

UNION ALL

SELECT
  'possible_non_demo_data_inside_demo_gym' AS check_name,
  COUNT(*)::bigint AS total,
  CASE WHEN COUNT(*) = 0 THEN 'NONE' ELSE 'REVIEW' END AS status,
  'Perfiles en gym demo distintos de admin/socio demo (revisar si son esperados).' AS details
FROM public.perfiles p
CROSS JOIN constants c
WHERE p.gym_id = c.demo_gym_id
  AND p.id NOT IN (c.demo_admin_id, c.demo_socio_id)

UNION ALL

SELECT
  'recommendation' AS check_name,
  1::bigint AS total,
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM public.perfiles p
      CROSS JOIN constants c
      WHERE p.gym_id = c.demo_gym_id
        AND p.id NOT IN (c.demo_admin_id, c.demo_socio_id)
    )
    THEN 'CLEANUP_CANDIDATE'
    ELSE 'KEEP_DEMO_DATA'
  END AS status,
  'KEEP_DEMO_DATA si se conserva escenario multi-gym; CLEANUP_CANDIDATE si se decide fase posterior de limpieza.' AS details;
