BEGIN;

-- Requiere Fase 5A/5B: sesiones.gym_id y auth_gym_id() disponibles.

DROP POLICY IF EXISTS "reservas_select" ON public.reservas;
DROP POLICY IF EXISTS "reservas_select_gym_scoped" ON public.reservas;

CREATE POLICY "reservas_select_gym_scoped"
ON public.reservas
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1
    FROM public.perfiles p
    JOIN public.sesiones s ON s.gym_id = p.gym_id
    WHERE p.id = auth.uid()
      AND p.rol = 'admin'
      AND s.id = reservas.sesion_id
      AND s.gym_id = auth_gym_id()
  )
);

DROP POLICY IF EXISTS "reservas_update" ON public.reservas;
DROP POLICY IF EXISTS "reservas_update_gym_scoped" ON public.reservas;

CREATE POLICY "reservas_update_gym_scoped"
ON public.reservas
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1
    FROM public.perfiles p
    JOIN public.sesiones s ON s.gym_id = p.gym_id
    WHERE p.id = auth.uid()
      AND p.rol = 'admin'
      AND s.id = reservas.sesion_id
      AND s.gym_id = auth_gym_id()
  )
)
WITH CHECK (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1
    FROM public.perfiles p
    JOIN public.sesiones s ON s.gym_id = p.gym_id
    WHERE p.id = auth.uid()
      AND p.rol = 'admin'
      AND s.id = reservas.sesion_id
      AND s.gym_id = auth_gym_id()
  )
);

DROP POLICY IF EXISTS "reservas_insert" ON public.reservas;
DROP POLICY IF EXISTS "reservas_insert_gym_scoped" ON public.reservas;

CREATE POLICY "reservas_insert_gym_scoped"
ON public.reservas
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1
    FROM public.sesiones s
    WHERE s.id = reservas.sesion_id
      AND s.gym_id = auth_gym_id()
  )
);

COMMIT;
