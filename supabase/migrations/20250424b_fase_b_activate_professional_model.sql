-- =============================================================================
-- Migración Fase B: activar modelo profesional de clases
-- Fecha: 20250424
-- Entorno: pruebas — datos mínimos confirmados (5 clases, 4 sesiones, 3 reservas)
--
-- Adapta la migración de Fase A a la BD real:
--   - sesiones tiene `cancelada boolean`, NO `estado text`
--   - Se mantiene `cancelada` y se añade `estado` derivado para el nuevo modelo
--   - Backfill de actividades y horarios_clase desde clases existentes
-- =============================================================================


-- ---------------------------------------------------------------------------
-- 1. Crear actividades (si no existe ya de Fase A)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS actividades (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id       uuid NOT NULL REFERENCES gimnasios(id) ON DELETE CASCADE,
  nombre       text NOT NULL,
  descripcion  text,
  color        text,
  activa       boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_actividades_gym_id     ON actividades(gym_id);
CREATE INDEX IF NOT EXISTS idx_actividades_gym_activa ON actividades(gym_id, activa);


-- ---------------------------------------------------------------------------
-- 2. Crear horarios_clase (si no existe ya de Fase A)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS horarios_clase (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id        uuid NOT NULL REFERENCES gimnasios(id) ON DELETE CASCADE,
  actividad_id  uuid NOT NULL REFERENCES actividades(id) ON DELETE CASCADE,
  dia_semana    smallint NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
  hora_inicio   time NOT NULL,
  duracion_min  smallint NOT NULL CHECK (duracion_min > 0),
  aforo_max     smallint NOT NULL CHECK (aforo_max > 0),
  profesor      text,
  fecha_inicio  date NOT NULL DEFAULT CURRENT_DATE,
  fecha_fin     date,
  activo        boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_horarios_fechas CHECK (fecha_fin IS NULL OR fecha_fin > fecha_inicio)
);

CREATE INDEX IF NOT EXISTS idx_horarios_gym_id    ON horarios_clase(gym_id);
CREATE INDEX IF NOT EXISTS idx_horarios_actividad ON horarios_clase(actividad_id);
CREATE INDEX IF NOT EXISTS idx_horarios_dia       ON horarios_clase(dia_semana);
CREATE INDEX IF NOT EXISTS idx_horarios_activo    ON horarios_clase(gym_id, activo);


-- ---------------------------------------------------------------------------
-- 3. Ampliar sesiones — adaptado a BD real (tiene `cancelada boolean`)
-- Se mantiene `cancelada` para compatibilidad. Se añaden columnas nuevas.
-- ---------------------------------------------------------------------------

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sesiones' AND column_name='horario_id') THEN
    ALTER TABLE sesiones ADD COLUMN horario_id uuid REFERENCES horarios_clase(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sesiones' AND column_name='actividad_id') THEN
    ALTER TABLE sesiones ADD COLUMN actividad_id uuid REFERENCES actividades(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sesiones' AND column_name='hora_inicio') THEN
    ALTER TABLE sesiones ADD COLUMN hora_inicio time;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sesiones' AND column_name='duracion_min') THEN
    ALTER TABLE sesiones ADD COLUMN duracion_min smallint;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sesiones' AND column_name='aforo_max') THEN
    ALTER TABLE sesiones ADD COLUMN aforo_max smallint;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sesiones' AND column_name='profesor') THEN
    ALTER TABLE sesiones ADD COLUMN profesor text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sesiones' AND column_name='notas') THEN
    ALTER TABLE sesiones ADD COLUMN notas text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sesiones' AND column_name='es_puntual') THEN
    ALTER TABLE sesiones ADD COLUMN es_puntual boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- Índices nuevos sesiones
CREATE INDEX IF NOT EXISTS idx_sesiones_horario_id   ON sesiones(horario_id);
CREATE INDEX IF NOT EXISTS idx_sesiones_actividad_id ON sesiones(actividad_id);
CREATE INDEX IF NOT EXISTS idx_sesiones_fecha        ON sesiones(fecha);


-- ---------------------------------------------------------------------------
-- 4. RLS — actividades
-- ---------------------------------------------------------------------------
ALTER TABLE actividades ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='actividades' AND policyname='admin_manage_actividades') THEN
    CREATE POLICY admin_manage_actividades ON actividades FOR ALL TO authenticated
      USING (gym_id IN (SELECT gym_id FROM perfiles WHERE id = auth.uid() AND rol = 'admin'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='actividades' AND policyname='socio_read_actividades') THEN
    CREATE POLICY socio_read_actividades ON actividades FOR SELECT TO authenticated
      USING (activa = true AND gym_id IN (SELECT gym_id FROM perfiles WHERE id = auth.uid()));
  END IF;
END $$;


-- ---------------------------------------------------------------------------
-- 5. RLS — horarios_clase
-- ---------------------------------------------------------------------------
ALTER TABLE horarios_clase ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='horarios_clase' AND policyname='admin_manage_horarios') THEN
    CREATE POLICY admin_manage_horarios ON horarios_clase FOR ALL TO authenticated
      USING (gym_id IN (SELECT gym_id FROM perfiles WHERE id = auth.uid() AND rol = 'admin'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='horarios_clase' AND policyname='socio_read_horarios') THEN
    CREATE POLICY socio_read_horarios ON horarios_clase FOR SELECT TO authenticated
      USING (activo = true AND gym_id IN (SELECT gym_id FROM perfiles WHERE id = auth.uid()));
  END IF;
END $$;


-- ---------------------------------------------------------------------------
-- 6. Backfill: crear actividades desde clases existentes
-- Una actividad por clase. gym_id tomado de la propia clase.
-- Usamos ON CONFLICT para que sea idempotente.
-- ---------------------------------------------------------------------------

-- Tabla temporal de mapeo clase → actividad
CREATE TEMP TABLE IF NOT EXISTS _clase_actividad_map (
  clase_id     uuid,
  actividad_id uuid
);

-- Insertar actividades para cada clase activa que no tenga actividad aún
INSERT INTO actividades (gym_id, nombre, activa)
SELECT DISTINCT c.gym_id, c.nombre, c.activa
FROM clases c
WHERE NOT EXISTS (
  SELECT 1 FROM actividades a WHERE a.nombre = c.nombre AND a.gym_id = c.gym_id
);

-- Poblar mapa clase→actividad (por nombre, que es único en este gym pequeño)
INSERT INTO _clase_actividad_map (clase_id, actividad_id)
SELECT c.id, a.id
FROM clases c
JOIN actividades a ON a.nombre = c.nombre AND a.gym_id = c.gym_id;


-- ---------------------------------------------------------------------------
-- 7. Backfill: crear horarios_clase desde clases existentes
-- ---------------------------------------------------------------------------
INSERT INTO horarios_clase (gym_id, actividad_id, dia_semana, hora_inicio, duracion_min, aforo_max, activo)
SELECT
  c.gym_id,
  m.actividad_id,
  c.dia_semana,
  c.hora_inicio::time,
  c.duracion_min,
  c.aforo_max,
  c.activa
FROM clases c
JOIN _clase_actividad_map m ON m.clase_id = c.id
WHERE NOT EXISTS (
  SELECT 1 FROM horarios_clase h
  WHERE h.actividad_id = m.actividad_id
    AND h.dia_semana = c.dia_semana
    AND h.hora_inicio = c.hora_inicio::time
);


-- ---------------------------------------------------------------------------
-- 8. Backfill: vincular sesiones existentes a horario_id y actividad_id
-- Nota: se vincula por clase_id directamente (no por dia_semana de la fecha)
-- porque en datos de prueba las fechas pueden no coincidir con el dia_semana
-- de la clase. En producción real esto sería equivalente.
-- ---------------------------------------------------------------------------
UPDATE sesiones s
SET
  actividad_id = sub.actividad_id,
  horario_id   = sub.horario_id
FROM (
  SELECT
    s2.id AS sesion_id,
    a.id  AS actividad_id,
    h.id  AS horario_id
  FROM sesiones s2
  JOIN clases c ON c.id = s2.clase_id
  JOIN actividades a ON a.nombre = c.nombre AND a.gym_id = c.gym_id
  JOIN horarios_clase h ON h.actividad_id = a.id AND h.dia_semana = c.dia_semana
  WHERE s2.horario_id IS NULL
) sub
WHERE s.id = sub.sesion_id;

-- Limpieza
DROP TABLE IF EXISTS _clase_actividad_map;


-- ---------------------------------------------------------------------------
-- 9. Verificación post-migración (ejecutar para confirmar)
-- ---------------------------------------------------------------------------
/*
SELECT COUNT(*) AS actividades_creadas FROM actividades;
SELECT COUNT(*) AS horarios_creados FROM horarios_clase;
SELECT COUNT(*) AS sesiones_vinculadas FROM sesiones WHERE actividad_id IS NOT NULL;
SELECT COUNT(*) AS sesiones_sin_vincular FROM sesiones WHERE actividad_id IS NULL;
*/
