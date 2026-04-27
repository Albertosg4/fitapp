-- ============================================================
-- JGS Fight Team — Fase 3: RLS, constraints e índices
-- Archivo: supabase/fase3_seguridad.sql
-- Orden de ejecución: ejecutar en Supabase SQL Editor
-- IMPORTANTE: leer cada bloque antes de ejecutar
-- ============================================================


-- ============================================================
-- BLOQUE 1: ÍNDICES DE RENDIMIENTO
-- Seguros de aplicar en cualquier orden, no rompen datos.
-- ============================================================

-- reservas: búsquedas por sesion + estado (aforo, toggle)
CREATE INDEX IF NOT EXISTS idx_reservas_sesion_estado
  ON reservas (sesion_id, estado);

-- reservas: historial del socio
CREATE INDEX IF NOT EXISTS idx_reservas_user_estado
  ON reservas (user_id, estado);

-- sesiones: buscar sesión por horario+fecha (operación más frecuente)
CREATE INDEX IF NOT EXISTS idx_sesiones_horario_fecha
  ON sesiones (horario_id, fecha);

-- sesiones: filtrar por fecha para checkin
CREATE INDEX IF NOT EXISTS idx_sesiones_fecha
  ON sesiones (fecha);

-- horarios_clase: filtrar por gym+activo (carga inicial del socio)
CREATE INDEX IF NOT EXISTS idx_horarios_clase_gym_activo
  ON horarios_clase (gym_id, activo);

-- perfiles: filtrar socios por gym
CREATE INDEX IF NOT EXISTS idx_perfiles_gym_rol
  ON perfiles (gym_id, rol);

-- asistencia: historial por usuario
CREATE INDEX IF NOT EXISTS idx_asistencia_user
  ON asistencia (user_id);

-- pagos: historial por usuario
CREATE INDEX IF NOT EXISTS idx_pagos_user
  ON pagos (user_id);

-- pagos: filtrar por gym
CREATE INDEX IF NOT EXISTS idx_pagos_gym
  ON pagos (gym_id);


-- ============================================================
-- BLOQUE 2: CONSTRAINTS DE UNICIDAD
-- ADVERTENCIA: ejecutar solo si no existen ya.
-- Si hay datos duplicados, el constraint fallará — ver queries
-- de verificación al final antes de ejecutar.
-- ============================================================

-- Evita reservas confirmadas duplicadas para el mismo usuario+sesión
-- (protege contra race conditions aunque la API ya las gestiona)
CREATE UNIQUE INDEX IF NOT EXISTS reservas_sesion_user_confirmada_unique
  ON reservas (sesion_id, user_id)
  WHERE estado = 'confirmada';

-- Evita materializar la misma sesión dos veces para el mismo horario+fecha
CREATE UNIQUE INDEX IF NOT EXISTS sesiones_horario_fecha_unique
  ON sesiones (horario_id, fecha)
  WHERE horario_id IS NOT NULL;


-- ============================================================
-- BLOQUE 3: ACTIVAR RLS EN TABLAS SENSIBLES
-- Si RLS ya está activo, estas líneas son idempotentes.
-- ============================================================

ALTER TABLE perfiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservas         ENABLE ROW LEVEL SECURITY;
ALTER TABLE horarios_clase   ENABLE ROW LEVEL SECURITY;
ALTER TABLE sesiones         ENABLE ROW LEVEL SECURITY;
ALTER TABLE actividades      ENABLE ROW LEVEL SECURITY;
ALTER TABLE asistencia       ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE gimnasios        ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- BLOQUE 4: FUNCIÓN AUXILIAR — gym_id del usuario autenticado
-- Evita subconsultas repetidas en cada policy.
-- security definer = se ejecuta como el owner, no como el user.
-- ============================================================

CREATE OR REPLACE FUNCTION auth_gym_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT gym_id
  FROM perfiles
  WHERE id = auth.uid()
  LIMIT 1;
$$;


-- ============================================================
-- BLOQUE 5: POLICIES — perfiles
-- ============================================================

-- Limpiar policies anteriores si existen
DROP POLICY IF EXISTS "socio_lee_su_perfil"         ON perfiles;
DROP POLICY IF EXISTS "admin_lee_perfiles_su_gym"   ON perfiles;
DROP POLICY IF EXISTS "admin_update_perfiles_su_gym" ON perfiles;
DROP POLICY IF EXISTS "service_role_all_perfiles"   ON perfiles;

-- Socio: solo puede leer su propio perfil
CREATE POLICY "socio_lee_su_perfil"
  ON perfiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Admin: lee todos los perfiles de su gym (incluye socios para el panel)
-- NOTA: esta policy permite que el admin vea su propio perfil Y los socios de su gym
CREATE POLICY "admin_lee_perfiles_su_gym"
  ON perfiles FOR SELECT
  TO authenticated
  USING (
    gym_id = auth_gym_id()
    AND EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid() AND p.rol = 'admin'
    )
  );

-- Admin: puede actualizar perfiles de su gym (membresia_activa, etc.)
-- ADVERTENCIA: esta policy permite UPDATE amplio — las columnas sensibles
-- como gym_id, rol, qr_token solo deberían modificarse via service_role (APIs)
CREATE POLICY "admin_update_perfiles_su_gym"
  ON perfiles FOR UPDATE
  TO authenticated
  USING (
    gym_id = auth_gym_id()
    AND EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid() AND p.rol = 'admin'
    )
  );

-- NOTA SOBRE GIMNASIOS CON UN SOLO ADMIN:
-- Si el admin tiene rol='admin' y gym_id='X', las dos policies de SELECT
-- se solapan (lee su propio perfil por la primera, y también por la segunda).
-- Esto es correcto y no genera conflicto — Postgres aplica OR entre policies.


-- ============================================================
-- BLOQUE 6: POLICIES — reservas
-- ============================================================

DROP POLICY IF EXISTS "socio_lee_sus_reservas"      ON reservas;
DROP POLICY IF EXISTS "admin_lee_reservas_su_gym"   ON reservas;

-- Socio: solo sus propias reservas
CREATE POLICY "socio_lee_sus_reservas"
  ON reservas FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admin: todas las reservas de sesiones de su gym
-- (necesario para ClasesTab — ver reservas por sesión)
CREATE POLICY "admin_lee_reservas_su_gym"
  ON reservas FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid() AND p.rol = 'admin'
    )
    AND EXISTS (
      SELECT 1 FROM sesiones s
      JOIN horarios_clase h ON s.horario_id = h.id
      WHERE s.id = reservas.sesion_id
        AND h.gym_id = auth_gym_id()
    )
  );

-- INSERT/UPDATE en reservas: SOLO via service_role (API /api/reservas/toggle)
-- No se añade policy de escritura para authenticated — el cliente no escribe reservas


-- ============================================================
-- BLOQUE 7: POLICIES — horarios_clase
-- ============================================================

DROP POLICY IF EXISTS "socio_lee_horarios_su_gym"  ON horarios_clase;
DROP POLICY IF EXISTS "admin_lee_horarios_su_gym"  ON horarios_clase;

-- Socio y admin: leen horarios activos de su gym
CREATE POLICY "socio_lee_horarios_su_gym"
  ON horarios_clase FOR SELECT
  TO authenticated
  USING (gym_id = auth_gym_id());

-- NOTA: una sola policy cubre socio y admin para SELECT.
-- Admin necesita también poder ver horarios inactivos para el panel.
-- Si el admin necesita ver todos (activos e inactivos), esta policy es suficiente
-- porque no filtra por 'activo' — eso lo hace la query en el cliente.


-- ============================================================
-- BLOQUE 8: POLICIES — sesiones
-- ============================================================

DROP POLICY IF EXISTS "socio_lee_sesiones_su_gym"  ON sesiones;
DROP POLICY IF EXISTS "admin_lee_sesiones_su_gym"  ON sesiones;

-- Socio y admin: leen sesiones de horarios de su gym
CREATE POLICY "socio_lee_sesiones_su_gym"
  ON sesiones FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM horarios_clase h
      WHERE h.id = sesiones.horario_id
        AND h.gym_id = auth_gym_id()
    )
    -- Incluir sesiones puntuales que no tienen horario_id pero sí gym_id (si aplica)
    -- Si sesiones tiene gym_id directo, añadir: OR gym_id = auth_gym_id()
  );

-- INSERT en sesiones: SOLO via service_role (API /api/reservas/toggle)


-- ============================================================
-- BLOQUE 9: POLICIES — actividades
-- ============================================================

DROP POLICY IF EXISTS "auth_lee_actividades_su_gym" ON actividades;

-- Todos los usuarios autenticados leen actividades de su gym
CREATE POLICY "auth_lee_actividades_su_gym"
  ON actividades FOR SELECT
  TO authenticated
  USING (gym_id = auth_gym_id());


-- ============================================================
-- BLOQUE 10: POLICIES — asistencia
-- ============================================================

DROP POLICY IF EXISTS "socio_lee_su_asistencia"    ON asistencia;
DROP POLICY IF EXISTS "admin_lee_asistencia_su_gym" ON asistencia;

-- Socio: solo su propio historial
CREATE POLICY "socio_lee_su_asistencia"
  ON asistencia FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admin: historial de todos los socios de su gym
CREATE POLICY "admin_lee_asistencia_su_gym"
  ON asistencia FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid() AND p.rol = 'admin'
    )
    AND EXISTS (
      SELECT 1 FROM perfiles sp
      WHERE sp.id = asistencia.user_id
        AND sp.gym_id = auth_gym_id()
    )
  );


-- ============================================================
-- BLOQUE 11: POLICIES — pagos
-- ============================================================

DROP POLICY IF EXISTS "socio_lee_sus_pagos"        ON pagos;
DROP POLICY IF EXISTS "admin_lee_pagos_su_gym"     ON pagos;

-- Socio: solo sus propios pagos (necesario para HistorialPagos)
CREATE POLICY "socio_lee_sus_pagos"
  ON pagos FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admin: todos los pagos de su gym (necesario para PagosTab via API)
-- NOTA: PagosTab ya usa la API protegida, pero el admin también podría
-- leer directamente — esta policy lo limita a su gym
CREATE POLICY "admin_lee_pagos_su_gym"
  ON pagos FOR SELECT
  TO authenticated
  USING (
    gym_id = auth_gym_id()
    AND EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid() AND p.rol = 'admin'
    )
  );

-- INSERT/UPDATE en pagos: SOLO via service_role (APIs /api/pagos/*)


-- ============================================================
-- BLOQUE 12: POLICIES — gimnasios
-- ============================================================

DROP POLICY IF EXISTS "admin_lee_su_gimnasio" ON gimnasios;

-- Admin: solo puede leer su propio gimnasio
CREATE POLICY "admin_lee_su_gimnasio"
  ON gimnasios FOR SELECT
  TO authenticated
  USING (
    id = auth_gym_id()
    AND EXISTS (
      SELECT 1 FROM perfiles p
      WHERE p.id = auth.uid() AND p.rol = 'admin'
    )
  );


-- ============================================================
-- BLOQUE 13: FUNCIÓN RPC — toggle_reserva (reserva atómica)
-- Ejecuta toda la lógica dentro de una transacción con advisory lock
-- para evitar race conditions de aforo bajo carga concurrente.
-- Se llama con: SELECT * FROM toggle_reserva(horario_id, fecha)
-- Requiere que el caller sea el usuario autenticado (auth.uid()).
-- ============================================================

CREATE OR REPLACE FUNCTION toggle_reserva(
  p_horario_id  uuid,
  p_fecha       date
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER  -- se ejecuta como owner (postgres), puede bypassear RLS
AS $$
DECLARE
  v_user_id       uuid := auth.uid();
  v_gym_id        uuid;
  v_memb_activa   boolean;
  v_memb_vence    date;
  v_horario       record;
  v_sesion        record;
  v_sesion_id     uuid;
  v_reserva       record;
  v_ocupadas      integer;
  v_lock_key      bigint;
BEGIN
  -- 1. Obtener datos del perfil del usuario autenticado
  SELECT gym_id, membresia_activa, membresia_vence::date
    INTO v_gym_id, v_memb_activa, v_memb_vence
  FROM perfiles
  WHERE id = v_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Perfil no encontrado');
  END IF;

  -- 2. Validar membresía
  IF NOT v_memb_activa THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Tu membresía no está activa. Renuévala para reservar.');
  END IF;

  IF v_memb_vence IS NOT NULL AND v_memb_vence < CURRENT_DATE THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Tu membresía ha caducado. Renuévala para reservar.');
  END IF;

  -- 3. Obtener y validar horario
  SELECT id, gym_id, actividad_id, hora_inicio, duracion_min, aforo_max, profesor, activo
    INTO v_horario
  FROM horarios_clase
  WHERE id = p_horario_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Horario no encontrado');
  END IF;

  IF v_horario.gym_id != v_gym_id THEN
    RETURN jsonb_build_object('ok', false, 'error', 'No puedes reservar clases de otro gimnasio');
  END IF;

  IF NOT v_horario.activo THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Este horario no está activo');
  END IF;

  -- 4. Advisory lock por horario+fecha para serializar reservas concurrentes
  -- La clave combina los primeros 4 bytes de cada uuid
  v_lock_key := ('x' || left(p_horario_id::text, 8))::bit(32)::bigint
              + ('x' || left(p_fecha::text, 4))::bit(16)::bigint;
  PERFORM pg_advisory_xact_lock(v_lock_key);

  -- 5. Buscar o crear sesión materializada
  SELECT id, cancelada INTO v_sesion
  FROM sesiones
  WHERE horario_id = p_horario_id AND fecha = p_fecha;

  IF FOUND AND v_sesion.cancelada THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Esta sesión está cancelada');
  END IF;

  IF NOT FOUND THEN
    INSERT INTO sesiones (horario_id, actividad_id, fecha, hora_inicio, duracion_min, aforo_max, profesor, es_puntual, cancelada)
    VALUES (p_horario_id, v_horario.actividad_id, p_fecha, v_horario.hora_inicio, v_horario.duracion_min, v_horario.aforo_max, v_horario.profesor, false, false)
    ON CONFLICT (horario_id, fecha) WHERE horario_id IS NOT NULL DO NOTHING
    RETURNING id INTO v_sesion_id;

    -- Si el INSERT fue ignorado por ON CONFLICT, obtener el id existente
    IF v_sesion_id IS NULL THEN
      SELECT id INTO v_sesion_id FROM sesiones WHERE horario_id = p_horario_id AND fecha = p_fecha;
    END IF;
  ELSE
    v_sesion_id := v_sesion.id;
  END IF;

  -- 6. Buscar reserva existente del usuario para esta sesión
  SELECT id, estado INTO v_reserva
  FROM reservas
  WHERE sesion_id = v_sesion_id AND user_id = v_user_id;

  -- 7. Si existe reserva confirmada → cancelar
  IF FOUND AND v_reserva.estado = 'confirmada' THEN
    UPDATE reservas SET estado = 'cancelada' WHERE id = v_reserva.id;
    RETURN jsonb_build_object('ok', true, 'accion', 'cancelada', 'sesion_id', v_sesion_id);
  END IF;

  -- 8. Verificar aforo antes de crear
  SELECT COUNT(*) INTO v_ocupadas
  FROM reservas
  WHERE sesion_id = v_sesion_id AND estado = 'confirmada';

  IF v_ocupadas >= v_horario.aforo_max THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Aforo completo. No hay plazas disponibles.');
  END IF;

  -- 9. Crear o reactivar reserva
  IF FOUND THEN
    -- Reactivar reserva cancelada
    UPDATE reservas SET estado = 'confirmada' WHERE id = v_reserva.id;
  ELSE
    -- Nueva reserva
    INSERT INTO reservas (sesion_id, user_id, estado)
    VALUES (v_sesion_id, v_user_id, 'confirmada');
  END IF;

  RETURN jsonb_build_object('ok', true, 'accion', 'confirmada', 'sesion_id', v_sesion_id);

EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Ya tienes una reserva para esta clase');
  WHEN OTHERS THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Error interno: ' || SQLERRM);
END;
$$;

-- Revocar ejecución pública y conceder solo a usuarios autenticados
REVOKE EXECUTE ON FUNCTION toggle_reserva(uuid, date) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION toggle_reserva(uuid, date) TO authenticated;
GRANT  EXECUTE ON FUNCTION toggle_reserva(uuid, date) TO service_role;
