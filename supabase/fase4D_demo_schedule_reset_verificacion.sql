-- Fase 4D · Verificación post reset/seed
-- SOLO SELECT (sin cambios de datos)

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
  SELECT r.id
  FROM reservas r
  JOIN gym_sesiones gs ON gs.id = r.sesion_id
),
gym_users AS (
  SELECT p.id AS user_id
  FROM perfiles p
  CROSS JOIN target_gym tg
  WHERE p.gym_id = tg.gym_id
)
SELECT 'actividades_gym (esperado=5)' AS check_name, COUNT(*)::text AS valor
FROM actividades a
CROSS JOIN target_gym tg
WHERE a.gym_id = tg.gym_id
UNION ALL
SELECT 'horarios_clase_gym (esperado=6)', COUNT(*)::text
FROM horarios_clase h
CROSS JOIN target_gym tg
WHERE h.gym_id = tg.gym_id
UNION ALL
SELECT 'sesiones_relacionadas_gym (esperado=0)', COUNT(*)::text
FROM gym_sesiones
UNION ALL
SELECT 'reservas_relacionadas_sesiones_gym (esperado=0)', COUNT(*)::text
FROM gym_reservas
UNION ALL
SELECT 'asistencia_relacionada_reservas_o_socios_gym (esperado=0 o residual no relacionado)', COUNT(*)::text
FROM asistencia ast
LEFT JOIN gym_reservas gr ON gr.id = ast.reserva_id
LEFT JOIN gym_users gu ON gu.user_id = ast.user_id
WHERE gr.id IS NOT NULL OR gu.user_id IS NOT NULL
UNION ALL
SELECT 'clases_legacy_gym (esperado=0)', COUNT(*)::text
FROM clases c
CROSS JOIN target_gym tg
WHERE c.gym_id = tg.gym_id;

-- Revisión visual: actividades del gym
WITH target_gym AS (
  SELECT 'b94be501-cdb4-4e48-a525-e0a669ad0967'::uuid AS gym_id
)
SELECT id, nombre, descripcion, color, activa
FROM actividades a
CROSS JOIN target_gym tg
WHERE a.gym_id = tg.gym_id
ORDER BY nombre;

-- Revisión visual: horarios del gym
WITH target_gym AS (
  SELECT 'b94be501-cdb4-4e48-a525-e0a669ad0967'::uuid AS gym_id
)
SELECT h.id, a.nombre AS actividad, h.dia_semana, h.hora_inicio, h.duracion_min, h.aforo_max, h.profesor, h.fecha_inicio, h.fecha_fin, h.activo
FROM horarios_clase h
JOIN actividades a ON a.id = h.actividad_id
CROSS JOIN target_gym tg
WHERE h.gym_id = tg.gym_id
ORDER BY h.dia_semana, h.hora_inicio;
