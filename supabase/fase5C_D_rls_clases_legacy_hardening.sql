-- Fase 5C-D (preparación) — Hardening/deprecación de public.clases legacy
-- EJECUCIÓN MANUAL CONTROLADA.
-- Objetivo: cerrar policies legacy de acceso directo.
-- No borra datos. No elimina tabla. No modifica Auth/Stripe.

BEGIN;

-- Cerrar policies legacy conocidas (idempotente)
DROP POLICY IF EXISTS "clases_select" ON public.clases;
DROP POLICY IF EXISTS "clases_insert" ON public.clases;
DROP POLICY IF EXISTS "clases_update" ON public.clases;
DROP POLICY IF EXISTS "clases_delete" ON public.clases;
DROP POLICY IF EXISTS "admin puede gestionar clases" ON public.clases;
DROP POLICY IF EXISTS "socios pueden leer clases" ON public.clases;

-- Comentario de deprecación (sin cambio de esquema)
COMMENT ON TABLE public.clases IS
'Tabla legacy/deprecada (Fase 5C-D). Modelo activo: actividades + horarios_clase + sesiones. No usar para acceso directo de cliente.';

COMMIT;
