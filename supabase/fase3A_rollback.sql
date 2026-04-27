-- ============================================================
-- JGS Fight Team — Fase 3A: ROLLBACK
-- Ejecutar si necesitas revertir fase3A_seguridad.sql.
-- No toca RLS (no estaba activo en 3A).
-- ============================================================

-- 1. Eliminar función RPC
DROP FUNCTION IF EXISTS toggle_reserva(uuid, date);

-- 2. Eliminar constraints de unicidad
DROP INDEX IF EXISTS reservas_sesion_user_confirmada_unique;
DROP INDEX IF EXISTS sesiones_horario_fecha_unique;

-- 3. Eliminar índices de rendimiento
DROP INDEX IF EXISTS idx_reservas_sesion_estado;
DROP INDEX IF EXISTS idx_reservas_user_estado;
DROP INDEX IF EXISTS idx_sesiones_horario_fecha;
DROP INDEX IF EXISTS idx_sesiones_fecha;
DROP INDEX IF EXISTS idx_horarios_clase_gym_activo;
DROP INDEX IF EXISTS idx_perfiles_gym_rol;
DROP INDEX IF EXISTS idx_asistencia_user;
DROP INDEX IF EXISTS idx_pagos_user;
DROP INDEX IF EXISTS idx_pagos_gym;

-- Verificación post-rollback:
-- SELECT indexname FROM pg_indexes
-- WHERE schemaname = 'public'
--   AND indexname LIKE 'idx_%'
--    OR indexname IN ('reservas_sesion_user_confirmada_unique','sesiones_horario_fecha_unique');
-- Esperado: 0 filas

-- SELECT routine_name FROM information_schema.routines
-- WHERE routine_schema = 'public' AND routine_name = 'toggle_reserva';
-- Esperado: 0 filas
