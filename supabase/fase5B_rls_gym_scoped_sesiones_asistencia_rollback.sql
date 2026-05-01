BEGIN;

-- Rollback vuelve a policies más amplias. Usar solo si hay regresión.

DROP POLICY IF EXISTS "sesiones_select_gym_scoped" ON public.sesiones;
DROP POLICY IF EXISTS "sesiones_update_admin_gym_scoped" ON public.sesiones;

CREATE POLICY "sesiones_select"
ON public.sesiones
FOR SELECT
TO public
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "sesiones_update_admin"
ON public.sesiones
FOR UPDATE
TO authenticated
USING (
  (
    clase_id IN (
      SELECT c.id
      FROM public.clases c
      WHERE c.gym_id IN (
        SELECT perfiles.gym_id
        FROM public.perfiles
        WHERE perfiles.id = auth.uid()
          AND perfiles.rol = 'admin'::text
      )
    )
  )
  OR (
    horario_id IN (
      SELECT h.id
      FROM public.horarios_clase h
      WHERE h.gym_id IN (
        SELECT perfiles.gym_id
        FROM public.perfiles
        WHERE perfiles.id = auth.uid()
          AND perfiles.rol = 'admin'::text
      )
    )
  )
  OR (
    actividad_id IN (
      SELECT a.id
      FROM public.actividades a
      WHERE a.gym_id IN (
        SELECT perfiles.gym_id
        FROM public.perfiles
        WHERE perfiles.id = auth.uid()
          AND perfiles.rol = 'admin'::text
      )
    )
  )
);

DROP POLICY IF EXISTS "admin_ver_asistencia_gym_scoped" ON public.asistencia;
DROP POLICY IF EXISTS "socio_ver_propia_asistencia" ON public.asistencia;

CREATE POLICY "admin_ver_toda_asistencia"
ON public.asistencia
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1
    FROM public.perfiles
    WHERE perfiles.id = auth.uid()
      AND perfiles.rol = 'admin'::text
  )
);

CREATE POLICY "socio_ver_propia_asistencia"
ON public.asistencia
FOR SELECT
TO public
USING (auth.uid() = user_id);

COMMIT;
