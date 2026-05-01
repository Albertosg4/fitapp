-- DESTRUCTIVO
-- Ejecutar solo si se confirma que los datos actuales son demo/test.
-- No toca perfiles, pagos, gimnasios ni auth.users.
-- Recomendado hacer backup/snapshot Supabase antes.

BEGIN;

-- A) Borrar asistencia relacionada con reservas de sesiones del gym y/o socios del gym
DELETE FROM asistencia ast
WHERE ast.reserva_id IN (
  SELECT r.id
  FROM reservas r
  JOIN sesiones s ON s.id = r.sesion_id
  LEFT JOIN horarios_clase h ON h.id = s.horario_id
  LEFT JOIN actividades a ON a.id = s.actividad_id
  LEFT JOIN clases c ON c.id = s.clase_id
  WHERE h.gym_id = 'b94be501-cdb4-4e48-a525-e0a669ad0967'::uuid
     OR a.gym_id = 'b94be501-cdb4-4e48-a525-e0a669ad0967'::uuid
     OR c.gym_id = 'b94be501-cdb4-4e48-a525-e0a669ad0967'::uuid
)
OR ast.user_id IN (
  SELECT p.id
  FROM perfiles p
  WHERE p.gym_id = 'b94be501-cdb4-4e48-a525-e0a669ad0967'::uuid
);

-- B) Borrar reservas relacionadas con sesiones del gym
DELETE FROM reservas r
WHERE r.sesion_id IN (
  SELECT s.id
  FROM sesiones s
  LEFT JOIN horarios_clase h ON h.id = s.horario_id
  LEFT JOIN actividades a ON a.id = s.actividad_id
  LEFT JOIN clases c ON c.id = s.clase_id
  WHERE h.gym_id = 'b94be501-cdb4-4e48-a525-e0a669ad0967'::uuid
     OR a.gym_id = 'b94be501-cdb4-4e48-a525-e0a669ad0967'::uuid
     OR c.gym_id = 'b94be501-cdb4-4e48-a525-e0a669ad0967'::uuid
);

-- C) Borrar sesiones relacionadas con horarios/actividades/clases del gym
DELETE FROM sesiones s
WHERE s.id IN (
  SELECT s2.id
  FROM sesiones s2
  LEFT JOIN horarios_clase h ON h.id = s2.horario_id
  LEFT JOIN actividades a ON a.id = s2.actividad_id
  LEFT JOIN clases c ON c.id = s2.clase_id
  WHERE h.gym_id = 'b94be501-cdb4-4e48-a525-e0a669ad0967'::uuid
     OR a.gym_id = 'b94be501-cdb4-4e48-a525-e0a669ad0967'::uuid
     OR c.gym_id = 'b94be501-cdb4-4e48-a525-e0a669ad0967'::uuid
);

-- D) Borrar horarios_clase del gym
DELETE FROM horarios_clase h
WHERE h.gym_id = 'b94be501-cdb4-4e48-a525-e0a669ad0967'::uuid;

-- E) Borrar actividades del gym
DELETE FROM actividades a
WHERE a.gym_id = 'b94be501-cdb4-4e48-a525-e0a669ad0967'::uuid;

-- F) Borrar clases legacy del gym
DELETE FROM clases c
WHERE c.gym_id = 'b94be501-cdb4-4e48-a525-e0a669ad0967'::uuid;

-- Sembrar actividades limpias (demo)
INSERT INTO actividades (gym_id, nombre, descripcion, color, activa)
VALUES
  ('b94be501-cdb4-4e48-a525-e0a669ad0967'::uuid, 'Boxeo', 'Clase técnica y acondicionamiento de boxeo.', '#ef4444', true),
  ('b94be501-cdb4-4e48-a525-e0a669ad0967'::uuid, 'MMA', 'Entrenamiento mixto de striking y grappling.', '#3b82f6', true),
  ('b94be501-cdb4-4e48-a525-e0a669ad0967'::uuid, 'Brazilian Jiu-Jitsu', 'Trabajo de técnica y sparring de BJJ.', '#22c55e', true),
  ('b94be501-cdb4-4e48-a525-e0a669ad0967'::uuid, 'Muay Thai', 'Clase de golpeo y combinaciones de Muay Thai.', '#f97316', true),
  ('b94be501-cdb4-4e48-a525-e0a669ad0967'::uuid, 'Open Mat', 'Sesión libre de práctica supervisada.', '#a855f7', true);

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
  'b94be501-cdb4-4e48-a525-e0a669ad0967'::uuid,
  a.id,
  h.dia_semana,
  h.hora_inicio,
  h.duracion_min,
  h.aforo_max,
  h.profesor,
  CURRENT_DATE,
  NULL,
  true
FROM (
  VALUES
    ('Boxeo', 0, '18:00'::time, 60::smallint, 12::smallint, 'JGS'),
    ('MMA', 0, '19:15'::time, 75::smallint, 12::smallint, 'JGS'),
    ('Brazilian Jiu-Jitsu', 1, '18:00'::time, 75::smallint, 14::smallint, 'JGS'),
    ('Muay Thai', 2, '18:00'::time, 60::smallint, 12::smallint, 'JGS'),
    ('Brazilian Jiu-Jitsu', 3, '18:00'::time, 75::smallint, 14::smallint, 'JGS'),
    ('Open Mat', 4, '18:00'::time, 90::smallint, 20::smallint, 'JGS')
) AS h(actividad_nombre, dia_semana, hora_inicio, duracion_min, aforo_max, profesor)
JOIN actividades a
  ON a.gym_id = 'b94be501-cdb4-4e48-a525-e0a669ad0967'::uuid
 AND a.nombre = h.actividad_nombre;

COMMIT;
