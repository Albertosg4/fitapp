BEGIN;

-- Fase 5C-B (pagos) - hardening RLS gym-scoped.
-- Ejecutar manualmente en Supabase SQL Editor.
-- No toca Stripe/webhooks/checkout ni borra datos.
-- Supuesto: public.pagos.gym_id ya existe (se usa tal cual, sin alter de estructura).

-- Limpieza de policies legacy/globales o duplicadas conocidas.
DROP POLICY IF EXISTS "Admin lee todos los pagos" ON public.pagos;
DROP POLICY IF EXISTS "admin_ver_todos_pagos" ON public.pagos;
DROP POLICY IF EXISTS "admin_ver_pagos_gym_scoped" ON public.pagos;

-- Policy admin gym-scoped única.
CREATE POLICY "admin_ver_pagos_gym_scoped"
ON public.pagos
FOR SELECT
TO authenticated
USING (
  gym_id IS NOT NULL
  AND gym_id = auth_gym_id()
  AND EXISTS (
    SELECT 1
    FROM public.perfiles p
    WHERE p.id = auth.uid()
      AND p.rol = 'admin'
      AND p.gym_id = pagos.gym_id
  )
);

-- Mantener policy de socio propio, reemplazándola por variante explícita.
DROP POLICY IF EXISTS "socio_ver_propios_pagos" ON public.pagos;
DROP POLICY IF EXISTS "socio_ver_propios_pagos_gym_scoped" ON public.pagos;

CREATE POLICY "socio_ver_propios_pagos_gym_scoped"
ON public.pagos
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  AND gym_id IS NOT NULL
  AND gym_id = auth_gym_id()
);

COMMIT;
