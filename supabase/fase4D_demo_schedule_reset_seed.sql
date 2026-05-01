-- DESTRUCTIVO
-- Ejecutar solo si se confirma que los datos actuales son demo/test.
-- No toca perfiles, pagos, gimnasios ni auth.users.
-- Recomendado hacer backup/snapshot Supabase antes.

BEGIN;

CREATE TEMP TABLE _fase4d_target_gym AS
SELECT 'b94be501-cdb4-4e48-a525-e0a669ad0967'::uuid AS gym_id;

-- A) Borrar asistencia relacionada con reservas de sesiones del gym y/o socios del gym
DELETE FROM asistencia ast
WHERE ast.reserva_id IN (
  SELECT r.id
  FROM reservas r
  JOIN sesiones s ON s.id = r.sesion_id
  LEFT JOIN horarios_clase h ON h.id = s.horario_id
  LEFT JOIN actividades a ON a.id = s.actividad_id
  LEFT JOIN clases c ON c.id = s.clase_id
  JOIN _fase4d_target_gym tg ON true
  WHERE h.gym_id = tg.gym_id
     OR a.gym_id = tg.gym_id
     OR c.gym_id = tg.gym_id
)
OR ast.user_id IN (
  SELECT p.id
  FROM perfiles p
  JOIN _fase4d_target_gym tg ON true
  WHERE p.gym_id = tg.gym_id
);

-- B) Borrar reservas relacionadas con sesiones del gym
DELETE FROM reservas r
WHERE r.sesion_id IN (
  SELECT s.id
  FROM sesiones s
  LEFT JOIN horarios_clase h ON h.id = s.horario_id
  LEFT JOIN actividades a ON a.id = s.actividad_id
  LEFT JOIN clases c ON c.id = s.clase_id
  JOIN _fase4d_target_gym tg ON true
  WHERE h.gym_id = tg.gym_id
     OR a.gym_id = tg.gym_id
     OR c.gym_id = tg.gym_id
);

-- C) Borrar sesiones relacionadas con horarios/actividades/clases del gym
DELETE FROM sesiones s
WHERE s.id IN (
  SELECT s2.id
  FROM sesiones s2
  LEFT JOIN horarios_clase h ON h.id = s2.horario_id
  LEFT JOIN actividades a ON a.id = s2.actividad_id
  LEFT JOIN clases c ON c.id = s2.clase_id
  JOIN _fase4d_target_gym tg ON true
  WHERE h.gym_id = tg.gym_id
     OR a.gym_id = tg.gym_id
     OR c.gym_id = tg.gym_id
);

-- D) Borrar horarios_clase del gym
DELETE FROM horarios_clase h
USING _fase4d_target_gym tg
WHERE h.gym_id = tg.gym_id;

-- E) Borrar actividades del gym
DELETE FROM actividades a
USING _fase4d_target_gym tg
WHERE a.gym_id = tg.gym_id;

-- F) Borrar clases legacy del gym
DELETE FROM clases c
USING _fase4d_target_gym tg
WHERE c.gym_id = tg.gym_id;

-- Sembrar actividades limpias (demo)
INSERT INTO actividades (gym_id, nombre, descripcion, color, activa)
SELECT tg.gym_id, x.nombre, x.descripcion, x.color, true
FROM _fase4d_target_gym tg
JOIN (
  VALUES
    ('Boxeo', 'Clase técnica y acondicionamiento de boxeo.', '#ef4444'),
    ('MMA', 'Entrenamiento mixto de striking y grappling.', '#3b82f6'),
    ('Brazilian Jiu-Jitsu', 'Trabajo de técnica y sparring de BJJ.', '#22c55e'),
    ('Muay Thai', 'Clase de golpeo y combinaciones de Muay Thai.', '#f97316'),
    ('Open Mat', 'Sesión libre de práctica supervisada.', '#a855f7')
) AS x(nombre, descripcion, color) ON true;

-- Sembrar horarios limpios (sin crear sesiones/reservas/asistencia)
-- dia_semana: 0=lunes, 1=martes, 2=miércoles, 3=jueves, 4=viernes, 5=sábado, 6=domingo
INSERT INTO horarios_clase (
  gym_id,
  actividad_id,
  dia_semana,
  hora_inicio,
  duracion_min,
  aforo_max,
  profesor,
  fecha_inicio,
  fecha_fin,
  activo
)
SELECT
  tg.gym_id,
  a.id,
  h.dia_semana,
  h.hora_inicio,
  h.duracion_min,
  h.aforo_max,
  h.profesor,
  CURRENT_DATE,
  NULL,
  true
FROM _fase4d_target_gym tg
JOIN (
  VALUES
    ('Boxeo', 0, '18:00'::time, 60::smallint, 12::smallint, 'JGS'),
    ('MMA', 0, '19:15'::time, 75::smallint, 12::smallint, 'JGS'),
    ('Brazilian Jiu-Jitsu', 1, '18:00'::time, 75::smallint, 14::smallint, 'JGS'),
    ('Muay Thai', 2, '18:00'::time, 60::smallint, 12::smallint, 'JGS'),
    ('Brazilian Jiu-Jitsu', 3, '18:00'::time, 75::smallint, 14::smallint, 'JGS'),
    ('Open Mat', 4, '18:00'::time, 90::smallint, 20::smallint, 'JGS')
) AS h(actividad_nombre, dia_semana, hora_inicio, duracion_min, aforo_max, profesor)
  ON true
JOIN actividades a
  ON a.gym_id = tg.gym_id
 AND a.nombre = h.actividad_nombre;

-- Resúmenes finales
SELECT id, nombre, descripcion, color, activa
FROM actividades a
JOIN _fase4d_target_gym tg ON a.gym_id = tg.gym_id
ORDER BY nombre;

SELECT h.id, a.nombre AS actividad, h.dia_semana, h.hora_inicio, h.duracion_min, h.aforo_max, h.profesor, h.activo
FROM horarios_clase h
JOIN actividades a ON a.id = h.actividad_id
JOIN _fase4d_target_gym tg ON h.gym_id = tg.gym_id
ORDER BY h.dia_semana, h.hora_inicio;

SELECT COUNT(*) AS sesiones_restantes_relacionadas
FROM sesiones s
LEFT JOIN horarios_clase h ON h.id = s.horario_id
LEFT JOIN actividades a ON a.id = s.actividad_id
LEFT JOIN clases c ON c.id = s.clase_id
JOIN _fase4d_target_gym tg ON true
WHERE h.gym_id = tg.gym_id
   OR a.gym_id = tg.gym_id
   OR c.gym_id = tg.gym_id;

SELECT COUNT(*) AS reservas_restantes_relacionadas
FROM reservas r
JOIN sesiones s ON s.id = r.sesion_id
LEFT JOIN horarios_clase h ON h.id = s.horario_id
LEFT JOIN actividades a ON a.id = s.actividad_id
LEFT JOIN clases c ON c.id = s.clase_id
JOIN _fase4d_target_gym tg ON true
WHERE h.gym_id = tg.gym_id
   OR a.gym_id = tg.gym_id
   OR c.gym_id = tg.gym_id;

SELECT COUNT(*) AS asistencia_restante_relacionada
FROM asistencia ast
JOIN _fase4d_target_gym tg ON true
WHERE ast.reserva_id IN (
  SELECT r.id
  FROM reservas r
  JOIN sesiones s ON s.id = r.sesion_id
  LEFT JOIN horarios_clase h ON h.id = s.horario_id
  LEFT JOIN actividades a ON a.id = s.actividad_id
  LEFT JOIN clases c ON c.id = s.clase_id
  WHERE h.gym_id = tg.gym_id
     OR a.gym_id = tg.gym_id
     OR c.gym_id = tg.gym_id
)
OR ast.user_id IN (
  SELECT p.id
  FROM perfiles p
  WHERE p.gym_id = tg.gym_id
);

COMMIT;
