SELECT pg_get_functiondef('public.toggle_reserva(uuid,date)'::regprocedure);

SELECT
  id,
  gym_id,
  horario_id,
  actividad_id,
  fecha,
  hora_inicio,
  cancelada,
  es_puntual
FROM public.sesiones
ORDER BY fecha DESC, hora_inicio DESC
LIMIT 20;

-- Validación esperada:
-- tras reservar nueva clase en fecha sin sesión, la sesión creada debe tener gym_id del gym.
