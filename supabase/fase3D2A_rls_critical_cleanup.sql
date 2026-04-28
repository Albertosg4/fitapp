-- ============================================================
-- JGS Fight Team — Fase 3D-2A: limpieza RLS crítica (PREPARACIÓN)
-- Archivo: supabase/fase3D2A_rls_critical_cleanup.sql
--
-- IMPORTANTE:
-- - Este archivo SOLO prepara SQL para aplicar en ventana controlada.
-- - NO ejecutar automáticamente contra producción.
-- - Objetivo: eliminar policies legacy críticas y revocar EXECUTE innecesario a anon.
-- ============================================================

-- ------------------------------------------------------------
-- A) Tabla public.perfiles
-- Riesgo detectado en auditoría 3D-1:
--   - "leer perfiles" con qual=true (exposición global)
--   - "usuarios pueden leer su perfil" duplicada respecto a "perfiles_select_propio"
-- Resultado esperado:
--   - Se elimina apertura global/duplicación.
--   - Permanece la policy select específica: "perfiles_select_propio".
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "leer perfiles" ON public.perfiles;
DROP POLICY IF EXISTS "usuarios pueden leer su perfil" ON public.perfiles;

-- ------------------------------------------------------------
-- B) Tabla public.clases
-- Riesgo detectado en auditoría 3D-1:
--   - "admin puede gestionar clases" con qual=true / with_check=true
--   - "socios pueden leer clases" con qual=true
-- Resultado esperado:
--   - Se eliminan políticas amplias.
--   - Permanecen policies específicas: clases_select / clases_insert /
--     clases_update / clases_delete.
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "admin puede gestionar clases" ON public.clases;
DROP POLICY IF EXISTS "socios pueden leer clases" ON public.clases;

-- ------------------------------------------------------------
-- C) Funciones sensibles
-- Objetivo: retirar privilegio EXECUTE para role anon.
--
-- Firma confirmada en repo para toggle_reserva: (uuid, date).
-- Firma esperada para get_user_rol: ().
-- Si en entorno destino la firma difiere, ajustar antes de ejecutar.
-- ------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.get_user_rol() FROM anon;
REVOKE EXECUTE ON FUNCTION public.toggle_reserva(uuid, date) FROM anon;

-- ------------------------------------------------------------
-- D) Fuera de alcance en 3D-2A (NO tocar aquí)
--   - sesiones_insert
--   - asistencia_insert
--   - perfiles_update_propio
--   - tablas gimnasios / pagos
--   - índices duplicados
-- ------------------------------------------------------------
