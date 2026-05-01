-- ============================================================
-- Rollback Fase 5A RPC: restaurar toggle_reserva Fase 4E
-- Restaura versión sin insertar gym_id al crear sesiones desde toggle_reserva.
-- ============================================================
-- SECURITY DEFINER hardening:
-- se fija search_path = public, pg_temp para evitar resolución
-- insegura de objetos durante la ejecución de la función.
-- ============================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.toggle_reserva(
  p_horario_id  uuid,
  p_fecha       date
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'No autorizado: usuario no identificado');
  END IF;

  SELECT gym_id, membresia_activa, membresia_vence::date
    INTO v_gym_id, v_memb_activa, v_memb_vence
  FROM perfiles
  WHERE id = v_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Perfil no encontrado');
  END IF;

  IF NOT v_memb_activa THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Tu membresía no está activa. Renuévala para reservar.');
  END IF;

  IF v_memb_vence IS NOT NULL AND v_memb_vence < CURRENT_DATE THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Tu membresía ha caducado. Renuévala para reservar.');
  END IF;

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

  v_lock_key := hashtext(p_horario_id::text || p_fecha::text);
  PERFORM pg_advisory_xact_lock(v_lock_key);

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

  SELECT id, estado INTO v_reserva
  FROM reservas
  WHERE sesion_id = v_sesion_id AND user_id = v_user_id;

  v_reserva_existe := FOUND;

  IF v_reserva_existe AND v_reserva.estado = 'confirmada' THEN
    UPDATE reservas
    SET
      estado = 'cancelada',
      cancelled_at = now(),
      cancelled_by = v_user_id,
      cancelled_source = 'socio',
      cancellation_reason = NULL,
      updated_at = now()
    WHERE id = v_reserva.id;

    RETURN jsonb_build_object('ok', true, 'accion', 'cancelada', 'sesion_id', v_sesion_id);
  END IF;

  SELECT COUNT(*) INTO v_ocupadas
  FROM reservas
  WHERE sesion_id = v_sesion_id AND estado = 'confirmada';

  IF v_ocupadas >= v_horario.aforo_max THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Aforo completo. No hay plazas disponibles.');
  END IF;

  IF v_reserva_existe THEN
    UPDATE reservas
    SET
      estado = 'confirmada',
      cancelled_at = NULL,
      cancelled_by = NULL,
      cancelled_source = NULL,
      cancellation_reason = NULL,
      updated_at = now()
    WHERE id = v_reserva.id;
  ELSE
    INSERT INTO reservas (
      sesion_id,
      user_id,
      estado,
      created_by,
      created_source,
      updated_at,
      cancelled_at,
      cancelled_by,
      cancelled_source,
      cancellation_reason
    )
    VALUES (
      v_sesion_id,
      v_user_id,
      'confirmada',
      v_user_id,
      'socio',
      NULL,
      NULL,
      NULL,
      NULL,
      NULL
    );
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

COMMIT;
