-- =============================================================================
-- Migración: preparar modelo profesional de clases
-- Fecha: 20250424
-- Objetivo: crear tablas nuevas y ampliar sesiones SIN modificar datos existentes.
--
-- SEGURIDAD:
--   - NO borra tablas existentes
--   - NO borra columnas existentes
--   - NO modifica reservas
--   - NO migra datos todavía (eso es Fase B)
--   - Usa IF NOT EXISTS en todo
-- =============================================================================


-- ---------------------------------------------------------------------------
-- 1. Tabla: actividades
-- Define qué es una clase (nombre, descripción, color).
-- Una actividad puede tener múltiples horarios recurrentes.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS actividades (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id       uuid NOT NULL REFERENCES gimnasios(id) ON DELETE CASCADE,
  nombre       text NOT NULL,
  descripcion  text,
  color        text,                    -- hex o nombre para UI, ej: '#c8f542'
  activa       boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_actividades_gym_id ON actividades(gym_id);
CREATE INDEX IF NOT EXISTS idx_actividades_gym_activa ON actividades(gym_id, activa);


-- ---------------------------------------------------------------------------
-- 2. Tabla: horarios_clase
-- Define recurrencias semanales: "Boxeo cada lunes a las 18:00".
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS horarios_clase (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id        uuid NOT NULL REFERENCES gimnasios(id) ON DELETE CASCADE,
  actividad_id  uuid NOT NULL REFERENCES actividades(id) ON DELETE CASCADE,
  dia_semana    smallint NOT NULL CHECK (dia_semana BETWEEN 0 AND 6), -- 0=Lun, 6=Dom
  hora_inicio   time NOT NULL,
  duracion_min  smallint NOT NULL CHECK (duracion_min > 0),
  aforo_max     smallint NOT NULL CHECK (aforo_max > 0),
  profesor      text,
  fecha_inicio  date NOT NULL DEFAULT CURRENT_DATE,
  fecha_fin     date,                   -- NULL = sin fecha de fin
  activo        boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT chk_horarios_fechas CHECK (fecha_fin IS NULL OR fecha_fin > fecha_inicio)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_horarios_gym_id ON horarios_clase(gym_id);
CREATE INDEX IF NOT EXISTS idx_horarios_actividad ON horarios_clase(actividad_id);
CREATE INDEX IF NOT EXISTS idx_horarios_dia_semana ON horarios_clase(dia_semana);
CREATE INDEX IF NOT EXISTS idx_horarios_activo ON horarios_clase(gym_id, activo);


-- ---------------------------------------------------------------------------
-- 3. Ampliar tabla: sesiones
-- Añadir columnas nuevas con IF NOT EXISTS vía bloques DO $$.
-- La columna clase_id existente se mantiene para compatibilidad con reservas.
-- ---------------------------------------------------------------------------

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sesiones' AND column_name = 'horario_id'
  ) THEN
    ALTER TABLE sesiones ADD COLUMN horario_id uuid REFERENCES horarios_clase(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sesiones' AND column_name = 'actividad_id'
  ) THEN
    ALTER TABLE sesiones ADD COLUMN actividad_id uuid REFERENCES actividades(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sesiones' AND column_name = 'hora_inicio'
  ) THEN
    ALTER TABLE sesiones ADD COLUMN hora_inicio time;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sesiones' AND column_name = 'duracion_min'
  ) THEN
    ALTER TABLE sesiones ADD COLUMN duracion_min smallint;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sesiones' AND column_name = 'aforo_max'
  ) THEN
    ALTER TABLE sesiones ADD COLUMN aforo_max smallint;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sesiones' AND column_name = 'profesor'
  ) THEN
    ALTER TABLE sesiones ADD COLUMN profesor text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sesiones' AND column_name = 'notas'
  ) THEN
    ALTER TABLE sesiones ADD COLUMN notas text;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sesiones' AND column_name = 'estado'
  ) THEN
    ALTER TABLE sesiones ADD COLUMN estado text NOT NULL DEFAULT 'activa'
      CHECK (estado IN ('activa', 'cancelada'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sesiones' AND column_name = 'es_puntual'
  ) THEN
    ALTER TABLE sesiones ADD COLUMN es_puntual boolean NOT NULL DEFAULT false;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sesiones' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE sesiones ADD COLUMN created_at timestamptz NOT NULL DEFAULT now();
  END IF;
END $$;

-- Índices nuevos para sesiones
CREATE INDEX IF NOT EXISTS idx_sesiones_horario_id   ON sesiones(horario_id);
CREATE INDEX IF NOT EXISTS idx_sesiones_actividad_id ON sesiones(actividad_id);
CREATE INDEX IF NOT EXISTS idx_sesiones_estado        ON sesiones(estado);
CREATE INDEX IF NOT EXISTS idx_sesiones_fecha_estado  ON sesiones(fecha, estado);


-- ---------------------------------------------------------------------------
-- 4. RLS — actividades
-- ---------------------------------------------------------------------------

ALTER TABLE actividades ENABLE ROW LEVEL SECURITY;

-- Admin del gimnasio puede ver y gestionar actividades de su gym
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'actividades' AND policyname = 'admin_manage_actividades'
  ) THEN
    CREATE POLICY admin_manage_actividades ON actividades
      FOR ALL
      TO authenticated
      USING (
        gym_id IN (
          SELECT gym_id FROM perfiles WHERE id = auth.uid() AND rol = 'admin'
        )
      );
  END IF;
END $$;

-- Socio autenticado puede ver actividades activas de su gym
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'actividades' AND policyname = 'socio_read_actividades'
  ) THEN
    CREATE POLICY socio_read_actividades ON actividades
      FOR SELECT
      TO authenticated
      USING (
        activa = true
        AND gym_id IN (
          SELECT gym_id FROM perfiles WHERE id = auth.uid()
        )
      );
  END IF;
END $$;


-- ---------------------------------------------------------------------------
-- 5. RLS — horarios_clase
-- ---------------------------------------------------------------------------

ALTER TABLE horarios_clase ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'horarios_clase' AND policyname = 'admin_manage_horarios'
  ) THEN
    CREATE POLICY admin_manage_horarios ON horarios_clase
      FOR ALL
      TO authenticated
      USING (
        gym_id IN (
          SELECT gym_id FROM perfiles WHERE id = auth.uid() AND rol = 'admin'
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'horarios_clase' AND policyname = 'socio_read_horarios'
  ) THEN
    CREATE POLICY socio_read_horarios ON horarios_clase
      FOR SELECT
      TO authenticated
      USING (
        activo = true
        AND gym_id IN (
          SELECT gym_id FROM perfiles WHERE id = auth.uid()
        )
      );
  END IF;
END $$;


-- ---------------------------------------------------------------------------
-- 6. SQL de inspección — ejecutar ANTES de Fase B para contar datos existentes
-- (Comentado — copiar y ejecutar manualmente en Supabase SQL editor)
-- ---------------------------------------------------------------------------

/*
-- Contar clases activas
SELECT COUNT(*) AS total_clases, COUNT(*) FILTER (WHERE activa) AS activas
FROM clases;

-- Contar sesiones y su distribución
SELECT COUNT(*) AS total_sesiones,
       MIN(fecha) AS primera_sesion,
       MAX(fecha) AS ultima_sesion
FROM sesiones;

-- Contar reservas activas
SELECT COUNT(*) AS total_reservas,
       COUNT(*) FILTER (WHERE estado = 'confirmada') AS confirmadas,
       COUNT(*) FILTER (WHERE estado = 'cancelada') AS canceladas
FROM reservas;

-- Ver si sesiones tienen clase_id null (sesiones huérfanas)
SELECT COUNT(*) AS sesiones_sin_clase FROM sesiones WHERE clase_id IS NULL;

-- Ver clases con más sesiones
SELECT c.nombre, COUNT(s.id) AS num_sesiones
FROM clases c
LEFT JOIN sesiones s ON s.clase_id = c.id
GROUP BY c.id, c.nombre
ORDER BY num_sesiones DESC
LIMIT 10;
*/
