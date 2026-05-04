-- Fase 5C-E (preparación) - Setup multi-gym controlado
-- IMPORTANTE:
-- 1) NO inserta en auth.users.
-- 2) Crear primero 2 usuarios demo manualmente en Supabase Dashboard > Authentication > Users.
-- 3) Reemplazar placeholders antes de ejecutar:
--    __DEMO_ADMIN_AUTH_USER_ID__
--    __DEMO_SOCIO_AUTH_USER_ID__
-- 4) No toca Stripe/checkout/webhooks.

BEGIN;

DO $$
DECLARE
  v_demo_tag CONSTANT text := 'F5CE_DEMO_GYM2_2026_05';
  v_demo_gym_name CONSTANT text := 'FITAPP Demo Gym 2';
  v_admin_uuid_text CONSTANT text := '__DEMO_ADMIN_AUTH_USER_ID__';
  v_socio_uuid_text CONSTANT text := '__DEMO_SOCIO_AUTH_USER_ID__';
  v_admin_uuid uuid;
  v_socio_uuid uuid;
  v_demo_gym_id uuid;
  v_demo_sesion_id uuid;
BEGIN
  -- Guard rail: placeholders obligatorios.
  IF v_admin_uuid_text LIKE '__DEMO_%' OR v_socio_uuid_text LIKE '__DEMO_%' THEN
    RAISE EXCEPTION 'Reemplaza placeholders __DEMO_ADMIN_AUTH_USER_ID__ y __DEMO_SOCIO_AUTH_USER_ID__ antes de ejecutar setup.';
  END IF;

  -- Validación UUID parseable.
  BEGIN
    v_admin_uuid := v_admin_uuid_text::uuid;
    v_socio_uuid := v_socio_uuid_text::uuid;
  EXCEPTION WHEN others THEN
    RAISE EXCEPTION 'Uno o ambos placeholders no son UUID válidos. admin=%, socio=%', v_admin_uuid_text, v_socio_uuid_text;
  END;

  -- Deben ser distintos.
  IF v_admin_uuid = v_socio_uuid THEN
    RAISE EXCEPTION 'Admin y socio demo no pueden compartir el mismo auth user id.';
  END IF;

  -- Idempotencia segura: recuperar/crear gym demo por nombre exacto.
  SELECT id INTO v_demo_gym_id
  FROM public.gimnasios
  WHERE nombre = v_demo_gym_name
  LIMIT 1;

  IF v_demo_gym_id IS NULL THEN
    INSERT INTO public.gimnasios (nombre)
    VALUES (v_demo_gym_name)
    RETURNING id INTO v_demo_gym_id;
  END IF;

  -- Guard rail: si existe mismo nombre pero perfiles ajenos al demo-tag, no continuar.
  IF EXISTS (
    SELECT 1
    FROM public.perfiles p
    WHERE p.gym_id = v_demo_gym_id
      AND p.id NOT IN (v_admin_uuid, v_socio_uuid)
  ) THEN
    RAISE EXCEPTION 'El gym demo % ya tiene perfiles no esperados. Abortando para evitar mezclar datos reales/demo.', v_demo_gym_name;
  END IF;

  -- Perfil admin demo.
  INSERT INTO public.perfiles (id, gym_id, nombre, rol, tipo_membresia, membresia_activa)
  VALUES (v_admin_uuid, v_demo_gym_id, 'Admin Demo Gym 2', 'admin', 'mensual', true)
  ON CONFLICT (id) DO UPDATE
    SET gym_id = EXCLUDED.gym_id,
        nombre = EXCLUDED.nombre,
        rol = EXCLUDED.rol,
        tipo_membresia = EXCLUDED.tipo_membresia,
        membresia_activa = EXCLUDED.membresia_activa;

  -- Perfil socio demo.
  INSERT INTO public.perfiles (id, gym_id, nombre, rol, tipo_membresia, membresia_activa)
  VALUES (v_socio_uuid, v_demo_gym_id, 'Socio Demo Gym 2', 'socio', 'mensual', true)
  ON CONFLICT (id) DO UPDATE
    SET gym_id = EXCLUDED.gym_id,
        nombre = EXCLUDED.nombre,
        rol = EXCLUDED.rol,
        tipo_membresia = EXCLUDED.tipo_membresia,
        membresia_activa = EXCLUDED.membresia_activa;

  -- Pago demo mínimo (idempotente por user+tag en notas).
  INSERT INTO public.pagos (user_id, gym_id, importe, tipo_membresia, meses, metodo, estado, notas)
  SELECT v_socio_uuid, v_demo_gym_id, 0, 'mensual', 1, 'manual', 'pagado',
         'F5CE_DEMO_GYM2_2026_05 | pago demo controlado'
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.pagos pg
    WHERE pg.user_id = v_socio_uuid
      AND pg.gym_id = v_demo_gym_id
      AND pg.notas LIKE v_demo_tag || '%'
  );

  -- Sesión demo mínima (idempotente por gym+fecha+nota).
  INSERT INTO public.sesiones (gym_id, fecha, hora_inicio, duracion_min, aforo_max, profesor, notas, es_puntual, cancelada)
  SELECT v_demo_gym_id, CURRENT_DATE + 7, '09:00'::time, 60, 10, 'Staff Demo Gym 2',
         'F5CE_DEMO_GYM2_2026_05 | sesion demo controlada', true, false
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.sesiones s
    WHERE s.gym_id = v_demo_gym_id
      AND s.notas LIKE v_demo_tag || '%'
  )
  RETURNING id INTO v_demo_sesion_id;

  IF v_demo_sesion_id IS NULL THEN
    SELECT s.id INTO v_demo_sesion_id
    FROM public.sesiones s
    WHERE s.gym_id = v_demo_gym_id
      AND s.notas LIKE v_demo_tag || '%'
    ORDER BY s.fecha DESC
    LIMIT 1;
  END IF;

  -- Reserva demo mínima (idempotente).
  INSERT INTO public.reservas (
    sesion_id, user_id, estado,
    created_by, created_source,
    cancelled_at, cancelled_by, cancelled_source, cancellation_reason
  )
  SELECT v_demo_sesion_id, v_socio_uuid, 'confirmada',
         v_admin_uuid, 'admin',
         NULL, NULL, NULL, NULL
  WHERE v_demo_sesion_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.reservas r
      WHERE r.sesion_id = v_demo_sesion_id
        AND r.user_id = v_socio_uuid
    );

  RAISE NOTICE 'Fase 5C-E setup preparado/aplicado. gym_id=%, tag=%', v_demo_gym_id, v_demo_tag;
END $$;

COMMIT;
