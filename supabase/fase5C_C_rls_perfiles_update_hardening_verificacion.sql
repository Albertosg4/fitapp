-- Fase 5C-C (VERIFICACION)
-- Ejecutar manualmente después del SQL principal.

-- 1) Confirmar que no existe la policy legacy
select
  case
    when exists (
      select 1
      from pg_policies
      where schemaname = 'public'
        and tablename = 'perfiles'
        and policyname = 'perfiles_update_propio'
    )
    then 'WARNING: perfiles_update_propio sigue presente'
    else 'OK: perfiles_update_propio ausente'
  end as check_perfiles_update_propio;

-- 2) Policies UPDATE activas en perfiles (debe ser 0 para authenticated)
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

-- 3) Confirmar SELECT esperado (propio/admin) sigue activo si aplica
select
  policyname,
  roles,
  cmd
from pg_policies
where schemaname = 'public'
  and tablename = 'perfiles'
  and cmd = 'SELECT'
order by policyname;

-- 4) Conteos de perfiles por rol/gym (control de drift)
select
  coalesce(rol::text, '<<NULL>>') as rol,
  gym_id,
  count(*) as total
from public.perfiles
group by 1, 2
order by 1, 2;

-- 5) Confirmar perfiles sin gym_id
select
  case
    when count(*) = 0 then 'OK: no hay perfiles sin gym_id'
    else 'WARNING: existen perfiles sin gym_id = ' || count(*)::text
  end as check_perfiles_sin_gym
from public.perfiles
where gym_id is null;
