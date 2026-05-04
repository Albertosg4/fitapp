BEGIN;

-- ROLLBACK FASE 5C-B (pagos)
-- SOLO EJECUTAR SI FALLA la aplicación de Fase 5C-B.
-- No borra datos y no toca Stripe/webhooks/checkout.

DROP POLICY IF EXISTS "admin_ver_pagos_gym_scoped" ON public.pagos;
DROP POLICY IF EXISTS "socio_ver_propios_pagos_gym_scoped" ON public.pagos;

-- Restauración de policies previas documentadas para pagos.
DROP POLICY IF EXISTS "Admin lee todos los pagos" ON public.pagos;
CREATE POLICY "Admin lee todos los pagos"
ON public.pagos
FOR SELECT
TO public
USING (get_user_rol() = 'admin'::text);

DROP POLICY IF EXISTS "admin_ver_todos_pagos" ON public.pagos;
CREATE POLICY "admin_ver_todos_pagos"
ON public.pagos
FOR SELECT
TO public
USING (get_user_rol() = 'admin'::text);

DROP POLICY IF EXISTS "socio_ver_propios_pagos" ON public.pagos;
CREATE POLICY "socio_ver_propios_pagos"
ON public.pagos
FOR SELECT
TO public
USING (auth.uid() = user_id);

COMMIT;
