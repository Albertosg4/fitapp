-- Fase 5C-E (preparación) - Verificación multi-gym controlada
-- Nota: este script ayuda a validar aislamiento. No cambia RLS ni Stripe.

-- 1) Confirmar que hay 2 gyms (o más) y que existe el demo esperado.
SELECT COUNT(*) AS total_gyms FROM public.gimnasios;

SELECT id, nombre, created_at
FROM public.gimnasios
WHERE nombre IN ('JGS Fight Team', 'FITAPP Demo Gym 2')
ORDER BY nombre;

-- 2) Confirmar perfiles demo admin/socio dentro del gym demo.
SELECT p.id, p.nombre, p.rol, p.gym_id, g.nombre AS gym_nombre
FROM public.perfiles p
JOIN public.gimnasios g ON g.id = p.gym_id
WHERE g.nombre = 'FITAPP Demo Gym 2'
  AND p.nombre IN ('Admin Demo Gym 2', 'Socio Demo Gym 2')
ORDER BY p.rol;

-- 3) Confirmar pagos demo y gym_id correcto.
SELECT pg.id, pg.user_id, pg.gym_id, g.nombre AS gym_nombre, pg.estado, pg.notas
FROM public.pagos pg
JOIN public.gimnasios g ON g.id = pg.gym_id
WHERE pg.notas LIKE 'F5CE_DEMO_GYM2_2026_05%'
ORDER BY pg.created_at DESC NULLS LAST;

-- 4) Confirmar sesión/reserva demo y consistencia de gym.
SELECT s.id AS sesion_id, s.gym_id AS sesion_gym_id, g.nombre AS sesion_gym_nombre,
       r.id AS reserva_id, r.user_id,
       p.gym_id AS perfil_gym_id, gp.nombre AS perfil_gym_nombre,
       r.estado, s.notas
FROM public.sesiones s
LEFT JOIN public.reservas r ON r.sesion_id = s.id
LEFT JOIN public.perfiles p ON p.id = r.user_id
LEFT JOIN public.gimnasios g ON g.id = s.gym_id
LEFT JOIN public.gimnasios gp ON gp.id = p.gym_id
WHERE s.notas LIKE 'F5CE_DEMO_GYM2_2026_05%'
ORDER BY s.fecha, s.hora_inicio;

-- 5) Chequeos de no-cruce (globales): pagos/perfil y reservas/sesión/perfil.
SELECT COUNT(*) AS pagos_user_gym_mismatch
FROM public.pagos pg
JOIN public.perfiles p ON p.id = pg.user_id
WHERE pg.gym_id IS DISTINCT FROM p.gym_id;

SELECT COUNT(*) AS reservas_user_session_gym_mismatch
FROM public.reservas r
JOIN public.perfiles p ON p.id = r.user_id
JOIN public.sesiones s ON s.id = r.sesion_id
WHERE p.gym_id IS DISTINCT FROM s.gym_id;

-- 6) Consultas guía para test con sesión autenticada (RLS real).
-- Ejecutar como usuario admin demo autenticado.
-- Esperado: solo datos de 'FITAPP Demo Gym 2'.
-- SELECT id, nombre, rol, gym_id FROM public.perfiles ORDER BY created_at DESC NULLS LAST LIMIT 50;
-- SELECT id, user_id, gym_id, estado, notas FROM public.pagos ORDER BY created_at DESC NULLS LAST LIMIT 50;
-- SELECT id, gym_id, fecha, hora_inicio, notas FROM public.sesiones ORDER BY fecha DESC LIMIT 50;
-- SELECT r.id, r.user_id, r.estado, s.gym_id, s.notas
-- FROM public.reservas r JOIN public.sesiones s ON s.id = r.sesion_id
-- ORDER BY r.created_at DESC NULLS LAST LIMIT 50;

-- Ejecutar como usuario admin JGS autenticado.
-- Esperado: NO ver filas demo con tag F5CE_DEMO_GYM2_2026_05.
-- SELECT id, user_id, gym_id, estado, notas
-- FROM public.pagos
-- WHERE notas LIKE 'F5CE_DEMO_GYM2_2026_05%';
-- SELECT id, gym_id, fecha, hora_inicio, notas
-- FROM public.sesiones
-- WHERE notas LIKE 'F5CE_DEMO_GYM2_2026_05%';

-- 7) Checklist manual de app (ejecutar fuera de SQL):
-- [ ] Login admin JGS: paneles/pagos/reservas sin datos demo.
-- [ ] Login admin demo: solo datos del gym demo.
-- [ ] Login socio demo: solo sus datos demo.
-- [ ] Revisar panel pagos/reservas/calendario en ambos gyms.
