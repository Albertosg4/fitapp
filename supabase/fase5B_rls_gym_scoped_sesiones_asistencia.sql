BEGIN;

-- Requiere Fase 5A aplicada y validada: sesiones.gym_id/asistencia.gym_id presentes.

DROP POLICY IF EXISTS "sesiones_select" ON public.sesiones;
DROP POLICY IF EXISTS "sesiones_select_gym_scoped" ON public.sesiones;
CREATE POLICY "sesiones_select_gym_scoped"
ON public.sesiones
FOR SELECT
TO authenticated
USING (gym_id = auth_gym_id());

DROP POLICY IF EXISTS "sesiones_update_admin" ON public.sesiones;
DROP POLICY IF EXISTS "sesiones_update_admin_gym_scoped" ON public.sesiones;
CREATE POLICY "sesiones_update_admin_gym_scoped"
ON public.sesiones
FOR UPDATE
TO authenticated
USING (
  gym_id = auth_gym_id()
  AND EXISTS (
    SELECT 1
    FROM public.perfiles p
    WHERE p.id = auth.uid()
      AND p.rol = 'admin'
  )
)
WITH CHECK (
  gym_id = auth_gym_id()
  AND EXISTS (
    SELECT 1
    FROM public.perfiles p
    WHERE p.id = auth.uid()
      AND p.rol = 'admin'
  )
);

DROP POLICY IF EXISTS "admin_ver_toda_asistencia" ON public.asistencia;
DROP POLICY IF EXISTS "admin_ver_asistencia_gym_scoped" ON public.asistencia;
CREATE POLICY "admin_ver_asistencia_gym_scoped"
ON public.asistencia
FOR SELECT
TO authenticated
USING (
  gym_id = auth_gym_id()
  AND EXISTS (
    SELECT 1
    FROM public.perfiles p
    WHERE p.id = auth.uid()
      AND p.rol = 'admin'
  )
);

DROP POLICY IF EXISTS "socio_ver_propia_asistencia" ON public.asistencia;
CREATE POLICY "socio_ver_propia_asistencia"
ON public.asistencia
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

COMMIT;
