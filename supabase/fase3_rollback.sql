-- ============================================================
-- JGS Fight Team — Fase 3: ROLLBACK COMPLETO
-- Ejecutar si algo sale mal y necesitas revertir.
-- Orden inverso al script principal.
-- ============================================================

-- 1. Eliminar función RPC
DROP FUNCTION IF EXISTS toggle_reserva(uuid, date);
DROP FUNCTION IF EXISTS auth_gym_id();

-- 2. Eliminar policies — gimnasios
DROP POLICY IF EXISTS "admin_lee_su_gimnasio"          ON gimnasios;

-- 3. Eliminar policies — pagos
DROP POLICY IF EXISTS "socio_lee_sus_pagos"            ON pagos;
DROP POLICY IF EXISTS "admin_lee_pagos_su_gym"         ON pagos;

-- 4. Eliminar policies — asistencia
DROP POLICY IF EXISTS "socio_lee_su_asistencia"        ON asistencia;
DROP POLICY IF EXISTS "admin_lee_asistencia_su_gym"    ON asistencia;

-- 5. Eliminar policies — actividades
DROP POLICY IF EXISTS "auth_lee_actividades_su_gym"    ON actividades;

-- 6. Eliminar policies — sesiones
DROP POLICY IF EXISTS "socio_lee_sesiones_su_gym"      ON sesiones;
DROP POLICY IF EXISTS "admin_lee_sesiones_su_gym"      ON sesiones;

-- 7. Eliminar policies — horarios_clase
DROP POLICY IF EXISTS "socio_lee_horarios_su_gym"      ON horarios_clase;
DROP POLICY IF EXISTS "admin_lee_horarios_su_gym"      ON horarios_clase;

-- 8. Eliminar policies — reservas
DROP POLICY IF EXISTS "socio_lee_sus_reservas"         ON reservas;
DROP POLICY IF EXISTS "admin_lee_reservas_su_gym"      ON reservas;

-- 9. Eliminar policies — perfiles
DROP POLICY IF EXISTS "socio_lee_su_perfil"            ON perfiles;
DROP POLICY IF EXISTS "admin_lee_perfiles_su_gym"      ON perfiles;
DROP POLICY IF EXISTS "admin_update_perfiles_su_gym"   ON perfiles;
DROP POLICY IF EXISTS "service_role_all_perfiles"      ON perfiles;

-- 10. Desactivar RLS (vuelve al estado anterior sin restricciones)
ALTER TABLE perfiles         DISABLE ROW LEVEL SECURITY;
ALTER TABLE reservas         DISABLE ROW LEVEL SECURITY;
ALTER TABLE horarios_clase   DISABLE ROW LEVEL SECURITY;
ALTER TABLE sesiones         DISABLE ROW LEVEL SECURITY;
ALTER TABLE actividades      DISABLE ROW LEVEL SECURITY;
ALTER TABLE asistencia       DISABLE ROW LEVEL SECURITY;
ALTER TABLE pagos            DISABLE ROW LEVEL SECURITY;
ALTER TABLE gimnasios        DISABLE ROW LEVEL SECURITY;

-- 11. Eliminar constraints de unicidad (con cuidado — solo si no hay datos que dependan)
DROP INDEX IF EXISTS reservas_sesion_user_confirmada_unique;
DROP INDEX IF EXISTS sesiones_horario_fecha_unique;

-- 12. Eliminar índices de rendimiento (opcionales — no rompen datos)
DROP INDEX IF EXISTS idx_reservas_sesion_estado;
DROP INDEX IF EXISTS idx_reservas_user_estado;
DROP INDEX IF EXISTS idx_sesiones_horario_fecha;
DROP INDEX IF EXISTS idx_sesiones_fecha;
DROP INDEX IF EXISTS idx_horarios_clase_gym_activo;
DROP INDEX IF EXISTS idx_perfiles_gym_rol;
DROP INDEX IF EXISTS idx_asistencia_user;
DROP INDEX IF EXISTS idx_pagos_user;
DROP INDEX IF EXISTS idx_pagos_gym;
