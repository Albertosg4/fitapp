BEGIN;

DROP POLICY IF EXISTS "reservas_select_gym_scoped" ON public.reservas;
DROP POLICY IF EXISTS "reservas_update_gym_scoped" ON public.reservas;
DROP POLICY IF EXISTS "reservas_insert_gym_scoped" ON public.reservas;

DROP POLICY IF EXISTS "reservas_select" ON public.reservas;
DROP POLICY IF EXISTS "reservas_update" ON public.reservas;
DROP POLICY IF EXISTS "reservas_insert" ON public.reservas;

CREATE POLICY "reservas_insert"
ON public.reservas
FOR INSERT
TO public
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reservas_select"
ON public.reservas
FOR SELECT
TO public
USING ((auth.uid() = user_id) OR (get_user_rol() = 'admin'::text));

CREATE POLICY "reservas_update"
ON public.reservas
FOR UPDATE
TO public
USING ((auth.uid() = user_id) OR (get_user_rol() = 'admin'::text));

COMMIT;
