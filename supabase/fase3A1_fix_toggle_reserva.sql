-- ============================================================
-- JGS Fight Team — Fase 3A1: fix lógico RPC toggle_reserva
-- Archivo: supabase/fase3A1_fix_toggle_reserva.sql
--
-- Objetivo:
--   Evitar dependencia de FOUND tras SELECT COUNT(*) y usar
--   bandera explícita v_reserva_existe para decidir update/insert.
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
  v_user_id         uuid := auth.uid();
  v_gym_id          uuid;
  v_memb_activa     boolean;
  v_memb_vence      date;
  v_horario         record;
  v_sesion          record;
  v_sesion_id       uuid;
  v_reserva         record;
  v_reserva_existe  boolean := false;
  v_ocupadas        integer;
  v_lock_key        bigint;
  v_updated_rows    integer := 0;
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

  v_reserva_existe := FOUND;

  -- 7. Si existe reserva confirmada → cancelar
  IF v_reserva_existe AND v_reserva.estado = 'confirmada' THEN
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

  -- 9. Crear o reactivar reserva (sin depender de FOUND tras COUNT)
  IF v_reserva_existe THEN
    IF v_reserva.id IS NULL THEN
      RETURN jsonb_build_object('ok', false, 'error', 'Error interno: reserva previa inválida');
    END IF;

    UPDATE reservas
    SET estado = 'confirmada'
    WHERE id = v_reserva.id;

    GET DIAGNOSTICS v_updated_rows = ROW_COUNT;
    IF v_updated_rows = 0 THEN
      RETURN jsonb_build_object('ok', false, 'error', 'No se pudo reactivar la reserva');
    END IF;
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

REVOKE EXECUTE ON FUNCTION toggle_reserva(uuid, date) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION toggle_reserva(uuid, date) TO authenticated;
GRANT  EXECUTE ON FUNCTION toggle_reserva(uuid, date) TO service_role;

-- ============================================================
-- Verificación posterior sugerida (ejecutar manualmente)
-- ============================================================
-- 1) Comprobar que existe la función
-- SELECT routine_schema, routine_name
-- FROM information_schema.routines
-- WHERE routine_schema = 'public' AND routine_name = 'toggle_reserva';
--
-- 2) Después de reservar desde la app, comprobar reserva confirmada
-- SELECT r.id, r.user_id, r.sesion_id, r.estado, s.horario_id, s.fecha
-- FROM reservas r
-- JOIN sesiones s ON s.id = r.sesion_id
-- WHERE r.user_id = '<USER_ID>'
--   AND s.horario_id = '<HORARIO_ID>'
--   AND s.fecha = '<YYYY-MM-DD>'
-- ORDER BY r.id DESC;
