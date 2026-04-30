BEGIN;
CREATE POLICY "leer gimnasios"
ON public.gimnasios
FOR SELECT
TO public
USING (true);
COMMIT;
