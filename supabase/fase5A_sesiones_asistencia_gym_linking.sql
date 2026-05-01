BEGIN;

ALTER TABLE public.sesiones
  ADD COLUMN IF NOT EXISTS gym_id uuid REFERENCES public.gimnasios(id) ON DELETE CASCADE;

UPDATE public.sesiones s
SET gym_id = h.gym_id
FROM public.horarios_clase h
WHERE s.gym_id IS NULL
  AND s.horario_id = h.id;

UPDATE public.sesiones s
SET gym_id = a.gym_id
FROM public.actividades a
WHERE s.gym_id IS NULL
  AND s.actividad_id = a.id;

UPDATE public.sesiones s
SET gym_id = c.gym_id
FROM public.clases c
WHERE s.gym_id IS NULL
  AND s.clase_id = c.id;

CREATE INDEX IF NOT EXISTS idx_sesiones_gym_fecha
  ON public.sesiones (gym_id, fecha);

ALTER TABLE public.asistencia
  ADD COLUMN IF NOT EXISTS gym_id uuid REFERENCES public.gimnasios(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS sesion_id uuid REFERENCES public.sesiones(id) ON DELETE SET NULL;

UPDATE public.asistencia ast
SET sesion_id = r.sesion_id
FROM public.reservas r
WHERE ast.sesion_id IS NULL
  AND ast.reserva_id = r.id;

UPDATE public.asistencia ast
SET gym_id = s.gym_id
FROM public.sesiones s
WHERE ast.gym_id IS NULL
  AND ast.sesion_id = s.id
  AND s.gym_id IS NOT NULL;

UPDATE public.asistencia ast
SET gym_id = p.gym_id
FROM public.perfiles p
WHERE ast.gym_id IS NULL
  AND ast.user_id = p.id;

CREATE INDEX IF NOT EXISTS idx_asistencia_gym_fecha
  ON public.asistencia (gym_id, check_in_at DESC);

CREATE INDEX IF NOT EXISTS idx_asistencia_sesion
  ON public.asistencia (sesion_id);

COMMIT;
