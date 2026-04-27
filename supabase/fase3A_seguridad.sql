-- ============================================================
-- JGS Fight Team — Fase 3A: índices, constraints y RPC atómica
-- Archivo: supabase/fase3A_seguridad.sql
--
-- SEGURO DE EJECUTAR: no activa RLS, no rompe escrituras admin.
-- RLS completo se aplica en Fase 3C, después de mover las
-- escrituras admin directas a APIs protegidas (Fase 3B).
--
-- Orden de ejecución recomendado:
--   1. Ejecutar fase3A_verificacion_previa.sql (verificar duplicados)
--   2. Ejecutar este archivo bloque a bloque
--   3. Verificar con las queries al final
-- ============================================================


-- ============================================================
-- BLOQUE 1: ÍNDICES DE RENDIMIENTO
-- Seguros en cualquier orden. No afectan datos ni permisos.
-- ============================================================

-- reservas: búsquedas por sesión + estado (aforo, toggle)
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

-- horarios_clase: carga inicial del socio y del admin
CREATE INDEX IF NOT EXISTS idx_horarios_clase_gym_activo
  ON horarios_clase (gym_id, activo);

-- perfiles: filtrar socios por gym y rol
CREATE INDEX IF NOT EXISTS idx_perfiles_gym_rol
  ON perfiles (gym_id, rol);

-- asistencia: historial por usuario
CREATE INDEX IF NOT EXISTS idx_asistencia_user
  ON asistencia (user_id);

-- pagos: historial por usuario y por gym
CREATE INDEX IF NOT EXISTS idx_pagos_user
  ON pagos (user_id);

CREATE INDEX IF NOT EXISTS idx_pagos_gym
  ON pagos (gym_id);


-- ============================================================
-- BLOQUE 2: CONSTRAINTS DE UNICIDAD
--
-- ADVERTENCIA: ejecutar las queries de verificación previa
-- ANTES de este bloque. Si hay duplicados, el constraint fallará.
--
-- Verificar antes:
--   SELECT sesion_id, user_id, COUNT(*)
--   FROM reservas WHERE estado = 'confirmada'
--   GROUP BY sesion_id, user_id HAVING COUNT(*) > 1;
--   -- Esperado: 0 filas
--
--   SELECT horario_id, fecha, COUNT(*)
--   FROM sesiones WHERE horario_id IS NOT NULL
--   GROUP BY horario_id, fecha HAVING COUNT(*) > 1;
--   -- Esperado: 0 filas
-- ============================================================

-- Evita reservas confirmadas duplicadas para el mismo usuario+sesión
-- Protege contra race conditions aunque la API ya las gestione en código
CREATE UNIQUE INDEX IF NOT EXISTS reservas_sesion_user_confirmada_unique
  ON reservas (sesion_id, user_id)
  WHERE estado = 'confirmada';

-- Evita materializar la misma sesión dos veces para el mismo horario+fecha
CREATE UNIQUE INDEX IF NOT EXISTS sesiones_horario_fecha_unique
  ON sesiones (horario_id, fecha)
  WHERE horario_id IS NOT NULL;


-- ============================================================
-- BLOQUE 3: FUNCIÓN RPC — toggle_reserva (reserva atómica)
--
-- Por qué es segura sin RLS:
--   La función es SECURITY DEFINER (se ejecuta como owner de BD).
--   No depende de policies RLS para funcionar.
--   auth.uid() se popula correctamente cuando la API llama
--   con createUserClient(token) — cliente con anon key + JWT usuario.
--   La primera comprobación (auth.uid() IS NULL) actúa como
--   salvaguarda si por error se llama sin JWT de usuario.
--
-- Llamada desde la API:
--   La ruta /api/reservas/toggle usa createUserClient(token)
--   con la anon key + el JWT del socio en Authorization header.
--   PostgREST decodifica el JWT y PostgreSQL obtiene auth.uid()
--   = user_id real del socio. No se usa supabaseAdmin para la RPC.
-- ============================================================

CREATE OR REPLACE FUNCTION toggle_reserva(
  p_horario_id  uuid,
  p_fecha       date
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
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
  -- Salvaguarda: si auth.uid() es NULL, fue llamada sin JWT de usuario
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'No autorizado: usuario no identificado');
  END IF;

  -- 1. Obtener perfil del usuario autenticado
  SELECT gym_id, membresia_activa, membresia_vence::date
    INTO v_gym_id, v_memb_activa, v_memb_vence
  FROM perfiles
  WHERE id = v_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Perfil no encontrado');
  END IF;

  -- 2. Validar membresía activa
  IF NOT v_memb_activa THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Tu membresía no está activa. Renuévala para reservar.');
  END IF;

  IF v_memb_vence IS NOT NULL AND v_memb_vence < CURRENT_DATE THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Tu membresía ha caducado. Renuévala para reservar.');
  END IF;

  -- 3. Validar horario
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

  -- 4. Advisory lock por horario+fecha: serializa reservas concurrentes
  --    hashtext produce un bigint estable y único para cada combinación
  v_lock_key := hashtext(p_horario_id::text || p_fecha::text);
  PERFORM pg_advisory_xact_lock(v_lock_key);

  -- 5. Buscar o crear sesión materializada
  SELECT id, cancelada INTO v_sesion
  FROM sesiones
  WHERE horario_id = p_horario_id AND fecha = p_fecha;

  IF FOUND AND v_sesion.cancelada THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Esta sesión está cancelada');
  END IF;

  IF NOT FOUND THEN
    -- INSERT con ON CONFLICT por si dos requests llegan simultáneamente
    INSERT INTO sesiones (
      horario_id, actividad_id, fecha, hora_inicio,
      duracion_min, aforo_max, profesor, es_puntual, cancelada
    )
    VALUES (
      p_horario_id, v_horario.actividad_id, p_fecha, v_horario.hora_inicio,
      v_horario.duracion_min, v_horario.aforo_max, v_horario.profesor, false, false
    )
    ON CONFLICT (horario_id, fecha) WHERE horario_id IS NOT NULL
    DO NOTHING
    RETURNING id INTO v_sesion_id;

    -- ON CONFLICT DO NOTHING no devuelve id: obtenerlo explícitamente
    IF v_sesion_id IS NULL THEN
      SELECT id INTO v_sesion_id
      FROM sesiones
      WHERE horario_id = p_horario_id AND fecha = p_fecha;
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

  -- 8. Verificar aforo dentro del lock (lectura serializada)
  SELECT COUNT(*) INTO v_ocupadas
  FROM reservas
  WHERE sesion_id = v_sesion_id AND estado = 'confirmada';

  IF v_ocupadas >= v_horario.aforo_max THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Aforo completo. No hay plazas disponibles.');
  END IF;

  -- 9. Crear o reactivar reserva
  IF FOUND THEN
    -- v_reserva existe con estado cancelada → reactivar
    UPDATE reservas SET estado = 'confirmada' WHERE id = v_reserva.id;
  ELSE
    INSERT INTO reservas (sesion_id, user_id, estado)
    VALUES (v_sesion_id, v_user_id, 'confirmada');
  END IF;

  RETURN jsonb_build_object('ok', true, 'accion', 'confirmada', 'sesion_id', v_sesion_id);

EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Ya tienes una reserva para esta clase');
  WHEN OTHERS THEN
    RAISE WARNING '[toggle_reserva] error inesperado: %', SQLERRM;
    RETURN jsonb_build_object('ok', false, 'error', 'Error interno: ' || SQLERRM);
END;
$$;

-- Permisos: solo usuarios autenticados y service_role
REVOKE EXECUTE ON FUNCTION toggle_reserva(uuid, date) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION toggle_reserva(uuid, date) TO authenticated;
GRANT  EXECUTE ON FUNCTION toggle_reserva(uuid, date) TO service_role;


-- ============================================================
-- VERIFICACIÓN POST-EJECUCIÓN
-- Ejecutar después de aplicar este script para confirmar.
-- ============================================================

-- 1. Verificar índices
-- SELECT indexname, tablename FROM pg_indexes
-- WHERE schemaname = 'public'
--   AND indexname IN (
--     'idx_reservas_sesion_estado', 'idx_reservas_user_estado',
--     'idx_sesiones_horario_fecha', 'idx_sesiones_fecha',
--     'idx_horarios_clase_gym_activo', 'idx_perfiles_gym_rol',
--     'idx_asistencia_user', 'idx_pagos_user', 'idx_pagos_gym',
--     'reservas_sesion_user_confirmada_unique', 'sesiones_horario_fecha_unique'
--   )
-- ORDER BY tablename;
-- Esperado: 11 filas

-- 2. Verificar función RPC
-- SELECT routine_name, security_type FROM information_schema.routines
-- WHERE routine_schema = 'public' AND routine_name = 'toggle_reserva';
-- Esperado: 1 fila, security_type = DEFINER

-- 3. Verificar que RLS sigue DESACTIVADO (no debe estar activo en 3A)
-- SELECT tablename, rowsecurity FROM pg_tables
-- WHERE schemaname = 'public'
--   AND tablename IN ('actividades','horarios_clase','sesiones','perfiles','reservas')
-- ORDER BY tablename;
-- Esperado: rowsecurity = false en todas (RLS se activa en Fase 3C)
