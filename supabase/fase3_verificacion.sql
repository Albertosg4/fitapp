-- ============================================================
-- JGS Fight Team — Fase 3: queries de verificación
-- Ejecutar DESPUÉS de fase3_seguridad.sql para comprobar
-- que todo se aplicó correctamente.
-- ============================================================

-- 1. Verificar RLS activo en todas las tablas
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('perfiles','reservas','horarios_clase','sesiones','actividades','asistencia','pagos','gimnasios')
ORDER BY tablename;
-- Esperado: rowsecurity = true en todas

-- 2. Listar todas las policies creadas
SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
-- Esperado: ver las 12+ policies del script

-- 3. Verificar índices creados
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN (
    'idx_reservas_sesion_estado',
    'idx_reservas_user_estado',
    'idx_sesiones_horario_fecha',
    'idx_sesiones_fecha',
    'idx_horarios_clase_gym_activo',
    'idx_perfiles_gym_rol',
    'idx_asistencia_user',
    'idx_pagos_user',
    'idx_pagos_gym',
    'reservas_sesion_user_confirmada_unique',
    'sesiones_horario_fecha_unique'
  )
ORDER BY tablename;
-- Esperado: todos los índices presentes

-- 4. Verificar función toggle_reserva existe
SELECT routine_name, routine_type, security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'toggle_reserva';
-- Esperado: 1 fila, security_type = DEFINER

-- 5. Verificar función auth_gym_id existe
SELECT routine_name, routine_type, security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'auth_gym_id';
-- Esperado: 1 fila

-- 6. ANTES de aplicar constraints: verificar que no hay duplicados
-- (ejecutar ANTES de fase3_seguridad.sql si tienes dudas)
SELECT sesion_id, user_id, COUNT(*)
FROM reservas
WHERE estado = 'confirmada'
GROUP BY sesion_id, user_id
HAVING COUNT(*) > 1;
-- Esperado: 0 filas. Si hay filas, hay duplicados — limpiar antes de aplicar constraint.

SELECT horario_id, fecha, COUNT(*)
FROM sesiones
WHERE horario_id IS NOT NULL
GROUP BY horario_id, fecha
HAVING COUNT(*) > 1;
-- Esperado: 0 filas. Si hay filas, hay sesiones duplicadas — limpiar antes.

-- 7. Verificar permisos de toggle_reserva
SELECT grantee, privilege_type
FROM information_schema.routine_privileges
WHERE routine_schema = 'public'
  AND routine_name = 'toggle_reserva';
-- Esperado: authenticated y service_role con EXECUTE
