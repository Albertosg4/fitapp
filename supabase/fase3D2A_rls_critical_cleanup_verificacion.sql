-- ============================================================
-- JGS Fight Team — Fase 3D-2A: verificación post-aplicación
-- Archivo: supabase/fase3D2A_rls_critical_cleanup_verificacion.sql
--
-- Solo consultas read-only para validar el estado tras aplicar el fix.
-- ============================================================

-- A) Verificar que policies críticas eliminadas ya no existen
-- Esperado: 0 filas
select tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and (
    (tablename = 'perfiles' and policyname in ('leer perfiles', 'usuarios pueden leer su perfil'))
    or
    (tablename = 'clases' and policyname in ('admin puede gestionar clases', 'socios pueden leer clases'))
  )
order by tablename, policyname;

-- B) Verificar policies restantes en perfiles y clases
select tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('perfiles', 'clases')
order by tablename, policyname;

-- C) Verificar posibles policies peligrosas restantes en public
select tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and (
    roles::text like '%public%'
    or qual = 'true'
    or with_check = 'true'
    or cmd = 'ALL'
  )
order by tablename, policyname;

-- D) Verificar ACL de funciones sensibles
-- D1) Verificación principal: permisos efectivos (no solo proacl)
-- Esperado tras cleanup:
-- - anon_can_execute = false
-- - authenticated_can_execute = true
-- - service_role_can_execute = true
select
  'public.get_user_rol()' as function_signature,
  has_function_privilege('anon', 'public.get_user_rol()', 'EXECUTE') as anon_can_execute,
  has_function_privilege('authenticated', 'public.get_user_rol()', 'EXECUTE') as authenticated_can_execute,
  has_function_privilege('service_role', 'public.get_user_rol()', 'EXECUTE') as service_role_can_execute
union all
select
  'public.toggle_reserva(uuid, date)' as function_signature,
  has_function_privilege('anon', 'public.toggle_reserva(uuid, date)', 'EXECUTE') as anon_can_execute,
  has_function_privilege('authenticated', 'public.toggle_reserva(uuid, date)', 'EXECUTE') as authenticated_can_execute,
  has_function_privilege('service_role', 'public.toggle_reserva(uuid, date)', 'EXECUTE') as service_role_can_execute;

-- D2) Información adicional: ACL cruda
select
  n.nspname as schema,
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as args,
  p.proacl
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('get_user_rol', 'toggle_reserva')
order by p.proname, args;
