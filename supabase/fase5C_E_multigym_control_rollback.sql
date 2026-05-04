-- Fase 5C-E (preparación) - Rollback multi-gym controlado
-- Borra solo datos demo marcados con tag F5CE_DEMO_GYM2_2026_05.
-- NO borra auth.users (si se desea, eliminar manualmente en Supabase Dashboard > Authentication > Users).

BEGIN;

DO $$
DECLARE
  v_demo_tag CONSTANT text := 'F5CE_DEMO_GYM2_2026_05';
  v_demo_gym_name CONSTANT text := 'FITAPP Demo Gym 2';
  v_jgs_name CONSTANT text := 'JGS Fight Team';
  v_demo_gym_id uuid;
  v_jgs_gym_id uuid;
  v_non_demo_rows integer;
BEGIN
  SELECT id INTO v_demo_gym_id FROM public.gimnasios WHERE nombre = v_demo_gym_name LIMIT 1;
  SELECT id INTO v_jgs_gym_id FROM public.gimnasios WHERE nombre = v_jgs_name LIMIT 1;

  IF v_demo_gym_id IS NULL THEN
    RAISE NOTICE 'No existe gym demo (%). Nada que rollbackear.', v_demo_gym_name;
    RETURN;
  END IF;

  IF v_demo_gym_id = v_jgs_gym_id THEN
    RAISE EXCEPTION 'Guard rail: gym demo y JGS comparten ID. Abortando.';
  END IF;

  -- Seguridad: no borrar si hay pagos en gym demo sin tag demo.
  SELECT COUNT(*) INTO v_non_demo_rows
  FROM public.pagos pg
  WHERE pg.gym_id = v_demo_gym_id
    AND COALESCE(pg.notas, '') NOT LIKE v_demo_tag || '%';
  IF v_non_demo_rows > 0 THEN
    RAISE EXCEPTION 'Guard rail: hay % pagos no-demo en gym demo. Abortando rollback.', v_non_demo_rows;
  END IF;

  -- Seguridad: no borrar si hay sesiones en gym demo sin tag demo.
  SELECT COUNT(*) INTO v_non_demo_rows
  FROM public.sesiones s
  WHERE s.gym_id = v_demo_gym_id
    AND COALESCE(s.notas, '') NOT LIKE v_demo_tag || '%';
  IF v_non_demo_rows > 0 THEN
    RAISE EXCEPTION 'Guard rail: hay % sesiones no-demo en gym demo. Abortando rollback.', v_non_demo_rows;
  END IF;

  -- Seguridad: no borrar si hay perfiles no demo dentro del gym demo.
  SELECT COUNT(*) INTO v_non_demo_rows
  FROM public.perfiles p
  WHERE p.gym_id = v_demo_gym_id
    AND p.nombre NOT IN ('Admin Demo Gym 2', 'Socio Demo Gym 2');
  IF v_non_demo_rows > 0 THEN
    RAISE EXCEPTION 'Guard rail: hay % perfiles no-demo en gym demo. Abortando rollback.', v_non_demo_rows;
  END IF;

  -- 1) Reservas demo.
  DELETE FROM public.reservas r
  USING public.sesiones s
  WHERE r.sesion_id = s.id
    AND s.gym_id = v_demo_gym_id
    AND COALESCE(s.notas, '') LIKE v_demo_tag || '%';

  -- 2) Sesiones demo.
  DELETE FROM public.sesiones s
  WHERE s.gym_id = v_demo_gym_id
    AND COALESCE(s.notas, '') LIKE v_demo_tag || '%';

  -- 3) Pagos demo.
  DELETE FROM public.pagos pg
  WHERE pg.gym_id = v_demo_gym_id
    AND COALESCE(pg.notas, '') LIKE v_demo_tag || '%';

  -- 4) Perfiles demo.
  DELETE FROM public.perfiles p
  WHERE p.gym_id = v_demo_gym_id
    AND p.nombre IN ('Admin Demo Gym 2', 'Socio Demo Gym 2');

  -- 5) Gym demo.
  DELETE FROM public.gimnasios g
  WHERE g.id = v_demo_gym_id
    AND g.nombre = v_demo_gym_name;

  RAISE NOTICE 'Rollback Fase 5C-E completado para gym demo %.', v_demo_gym_name;
END $$;

COMMIT;
