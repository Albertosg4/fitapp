-- Fase 4D · Precheck reset demo calendario/reservas
-- SOLO SELECT (sin cambios de datos)
-- Revisar gym_id antes de ejecutar.

WITH target_gym AS (
  SELECT 'b94be501-cdb4-4e48-a525-e0a669ad0967'::uuid AS gym_id
),
gym_sesiones AS (
  SELECT DISTINCT s.id
  FROM sesiones s
  LEFT JOIN horarios_clase h ON h.id = s.horario_id
  LEFT JOIN actividades a ON a.id = s.actividad_id
  LEFT JOIN clases c ON c.id = s.clase_id
  CROSS JOIN target_gym tg
  WHERE h.gym_id = tg.gym_id
     OR a.gym_id = tg.gym_id
     OR c.gym_id = tg.gym_id
),
gym_reservas AS (
  SELECT r.id, r.user_id
  FROM reservas r
  JOIN gym_sesiones gs ON gs.id = r.sesion_id
),
gym_users AS (
  SELECT p.id AS user_id
  FROM perfiles p
  CROSS JOIN target_gym tg
  WHERE p.gym_id = tg.gym_id
)
SELECT 'gym_objetivo' AS metrica, tg.gym_id::text AS valor
FROM target_gym tg
UNION ALL
SELECT 'actividades_gym', COUNT(*)::text
FROM actividades a
CROSS JOIN target_gym tg
WHERE a.gym_id = tg.gym_id
UNION ALL
SELECT 'horarios_clase_gym', COUNT(*)::text
FROM horarios_clase h
CROSS JOIN target_gym tg
WHERE h.gym_id = tg.gym_id
UNION ALL
SELECT 'clases_legacy_gym', COUNT(*)::text
FROM clases c
CROSS JOIN target_gym tg
WHERE c.gym_id = tg.gym_id
UNION ALL
SELECT 'sesiones_relacionadas_gym', COUNT(*)::text
FROM gym_sesiones
UNION ALL
SELECT 'reservas_relacionadas_sesiones_gym', COUNT(*)::text
FROM gym_reservas
UNION ALL
SELECT 'asistencia_relacionada_reservas_o_socios_gym', COUNT(*)::text
FROM asistencia ast
LEFT JOIN gym_reservas gr ON gr.id = ast.reserva_id
LEFT JOIN gym_users gu ON gu.user_id = ast.user_id
WHERE gr.id IS NOT NULL OR gu.user_id IS NOT NULL
;

-- Listado resumido de actividades actuales del gym objetivo
WITH target_gym AS (
  SELECT 'b94be501-cdb4-4e48-a525-e0a669ad0967'::uuid AS gym_id
)
SELECT a.id, a.nombre, a.descripcion, a.color, a.activa, a.created_at
FROM actividades a
CROSS JOIN target_gym tg
WHERE a.gym_id = tg.gym_id
ORDER BY a.nombre;

-- Listado resumido de horarios actuales del gym objetivo
WITH target_gym AS (
  SELECT 'b94be501-cdb4-4e48-a525-e0a669ad0967'::uuid AS gym_id
)
SELECT h.id, h.actividad_id, a.nombre AS actividad_nombre, h.dia_semana, h.hora_inicio, h.duracion_min, h.aforo_max, h.profesor, h.fecha_inicio, h.fecha_fin, h.activo
FROM horarios_clase h
JOIN actividades a ON a.id = h.actividad_id
CROSS JOIN target_gym tg
WHERE h.gym_id = tg.gym_id
ORDER BY h.dia_semana, h.hora_inicio;

-- Listado resumido de sesiones actuales relacionadas con el gym objetivo
WITH target_gym AS (
  SELECT 'b94be501-cdb4-4e48-a525-e0a669ad0967'::uuid AS gym_id
)
SELECT s.id, s.fecha, s.hora_inicio, s.duracion_min, s.aforo_max, s.profesor, s.cancelada, s.horario_id, s.actividad_id, s.clase_id
FROM sesiones s
LEFT JOIN horarios_clase h ON h.id = s.horario_id
LEFT JOIN actividades a ON a.id = s.actividad_id
LEFT JOIN clases c ON c.id = s.clase_id
CROSS JOIN target_gym tg
WHERE h.gym_id = tg.gym_id
   OR a.gym_id = tg.gym_id
   OR c.gym_id = tg.gym_id
ORDER BY s.fecha DESC, s.hora_inicio DESC NULLS LAST
LIMIT 200;

-- Listado resumido de reservas actuales relacionadas con sesiones del gym objetivo
WITH target_gym AS (
  SELECT 'b94be501-cdb4-4e48-a525-e0a669ad0967'::uuid AS gym_id
)
SELECT r.id, r.sesion_id, r.user_id, r.estado, r.created_at, r.cancelled_at, r.cancelled_by, r.cancelled_source
FROM reservas r
JOIN sesiones s ON s.id = r.sesion_id
LEFT JOIN horarios_clase h ON h.id = s.horario_id
LEFT JOIN actividades a ON a.id = s.actividad_id
LEFT JOIN clases c ON c.id = s.clase_id
CROSS JOIN target_gym tg
WHERE h.gym_id = tg.gym_id
   OR a.gym_id = tg.gym_id
   OR c.gym_id = tg.gym_id
ORDER BY r.created_at DESC NULLS LAST
LIMIT 200;
