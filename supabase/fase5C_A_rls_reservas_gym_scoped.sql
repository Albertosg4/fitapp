BEGIN;

-- Requiere Fase 5A/5B: sesiones.gym_id y auth_gym_id() disponibles.

DROP POLICY IF EXISTS "reservas_select" ON public.reservas;
DROP POLICY IF EXISTS "reservas_select_gym_scoped" ON public.reservas;

CREATE POLICY "reservas_select_gym_scoped"
ON public.reservas
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.sesiones s
    WHERE s.id = reservas.sesion_id
      AND s.gym_id = auth_gym_id()
      AND (
        auth.uid() = reservas.user_id
        OR EXISTS (
          SELECT 1
          FROM public.perfiles p
          WHERE p.id = auth.uid()
            AND p.rol = 'admin'
            AND p.gym_id = s.gym_id
        )
      )
  )
);

DROP POLICY IF EXISTS "reservas_update" ON public.reservas;
DROP POLICY IF EXISTS "reservas_update_gym_scoped" ON public.reservas;

CREATE POLICY "reservas_update_gym_scoped"
ON public.reservas
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.sesiones s
    WHERE s.id = reservas.sesion_id
      AND s.gym_id = auth_gym_id()
      AND (
        auth.uid() = reservas.user_id
        OR EXISTS (
          SELECT 1
          FROM public.perfiles p
          WHERE p.id = auth.uid()
            AND p.rol = 'admin'
            AND p.gym_id = s.gym_id
        )
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.sesiones s
    WHERE s.id = reservas.sesion_id
      AND s.gym_id = auth_gym_id()
      AND (
        auth.uid() = reservas.user_id
        OR EXISTS (
          SELECT 1
          FROM public.perfiles p
          WHERE p.id = auth.uid()
            AND p.rol = 'admin'
            AND p.gym_id = s.gym_id
        )
      )
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
