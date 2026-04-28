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
-- Objetivo: cortar acceso anónimo efectivo y mantener RPC operativa
-- para roles de aplicación.
--
-- IMPORTANTE:
-- - PUBLIC aplica a todos los roles (incluido anon).
-- - Por eso se revoca tanto FROM PUBLIC como FROM anon para cortar
--   acceso anónimo efectivo.
-- - Se reafirman grants a authenticated y service_role porque la app
--   y los flujos RPC los necesitan.
--
-- Firma confirmada en repo para toggle_reserva: (uuid, date).
-- Firma esperada para get_user_rol: ().
-- Si en entorno destino la firma difiere, ajustar antes de ejecutar.
-- ------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.get_user_rol() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_rol() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_user_rol() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_rol() TO service_role;

REVOKE EXECUTE ON FUNCTION public.toggle_reserva(uuid, date) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.toggle_reserva(uuid, date) FROM anon;
GRANT EXECUTE ON FUNCTION public.toggle_reserva(uuid, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_reserva(uuid, date) TO service_role;

-- ------------------------------------------------------------
-- D) Fuera de alcance en 3D-2A (NO tocar aquí)
--   - sesiones_insert
--   - asistencia_insert
--   - perfiles_update_propio
--   - tablas gimnasios / pagos
--   - índices duplicados
-- ------------------------------------------------------------
