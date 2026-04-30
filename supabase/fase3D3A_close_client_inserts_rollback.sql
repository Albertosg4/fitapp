BEGIN;
CREATE POLICY "sesiones_insert"
ON public.sesiones
FOR INSERT
TO public
WITH CHECK (auth.role() = 'authenticated'::text);

CREATE POLICY "asistencia_insert"
ON public.asistencia
FOR INSERT
TO public
WITH CHECK (auth.role() = 'authenticated'::text);
COMMIT;
