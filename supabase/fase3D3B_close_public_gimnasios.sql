-- Cierra la lectura pública anónima de public.gimnasios eliminando la policy abierta "leer gimnasios".
BEGIN;
DROP POLICY IF EXISTS "leer gimnasios" ON public.gimnasios;
COMMIT;
