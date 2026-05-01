-- Verificación Fase 5C-A (reservas gym-scoped)

-- 1) Policies antiguas ausentes
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'reservas'
  AND policyname IN ('reservas_select', 'reservas_update', 'reservas_insert')
ORDER BY policyname;

-- 2) Policies nuevas presentes
SELECT tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'reservas'
  AND policyname IN (
    'reservas_select_gym_scoped',
    'reservas_update_gym_scoped',
    'reservas_insert_gym_scoped'
  )
ORDER BY policyname;

-- 3) RLS activo en reservas
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'reservas';

-- 4) Conteos de reservas con sesiones.gym_id
SELECT
  COUNT(*) AS total_reservas,
  COUNT(*) FILTER (WHERE s.gym_id IS NOT NULL) AS reservas_con_sesion_gym_id,
  COUNT(*) FILTER (WHERE s.gym_id IS NULL) AS reservas_sin_sesion_gym_id
FROM public.reservas r
LEFT JOIN public.sesiones s ON s.id = r.sesion_id;

-- 5) Validación funcional manual esperada
-- - socio ve sus reservas.
-- - socio reserva/cancela.
-- - admin ve reservas del gym.
-- - admin no ve reservas de otro gym cuando exista fixture multi-gym.
