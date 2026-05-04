-- Fase 5C-C (PRECHECK)
-- Objetivo: inventariar estado de RLS/policies de public.perfiles antes de endurecer perfiles_update_propio.
-- Ejecutar manualmente en Supabase SQL Editor. Solo lectura.

-- 1) Estado RLS de public.perfiles
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'perfiles';

-- 2) Policies activas en public.perfiles
select
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'perfiles'
order by cmd, policyname;

-- 3) Policies UPDATE en public.perfiles (detalle)
select
  policyname,
  roles,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'perfiles'
  and cmd = 'UPDATE'
order by policyname;

-- 4) Conteos de perfiles por rol/gym
select
  coalesce(rol::text, '<<NULL>>') as rol,
  gym_id,
  count(*) as total
from public.perfiles
group by 1, 2
order by 1, 2;

-- 5) Perfiles sin gym_id
select count(*) as perfiles_sin_gym_id
from public.perfiles
where gym_id is null;

-- 6) Helpers relevantes para policies
select
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as args,
  pg_get_function_result(p.oid) as returns,
  p.prosecdef as security_definer
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('auth_gym_id', 'get_user_rol')
order by p.proname;

-- 7) Columnas de public.perfiles
select
  ordinal_position,
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'perfiles'
order by ordinal_position;

-- 8) Muestra limitada (sin datos sensibles innecesarios)
select
  id,
  gym_id,
  rol,
  membresia_activa,
  tipo_membresia,
  membresia_vence,
  created_at
from public.perfiles
order by created_at desc nulls last
limit 20;
