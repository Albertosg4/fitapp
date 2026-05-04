-- Fase 5C-C (VERIFICACION)
-- Ejecutar manualmente después del SQL principal.

-- 1) Confirmar ausencia explícita de policies UPDATE legacy/sensibles
with expected_absent(policyname) as (
  values
    ('perfiles_update_propio'::text),
    ('admin_update_perfiles_su_gym'::text),
    ('usuarios pueden actualizar su perfil'::text),
    ('actualizar perfil propio'::text)
)
select
  e.policyname,
  case
    when p.policyname is null then 'OK: ausente'
    else 'WARNING: sigue presente'
  end as status
from expected_absent e
left join pg_policies p
  on p.schemaname = 'public'
 and p.tablename = 'perfiles'
 and p.cmd = 'UPDATE'
 and p.policyname = e.policyname
order by e.policyname;

-- 2) Policies UPDATE activas en perfiles (esperado final: 0 filas)
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

-- 2b) Resumen legible para pegar en ChatGPT
select
  case
    when count(*) = 0 then 'OK: 0 policies UPDATE en public.perfiles'
    else 'WARNING: quedan ' || count(*)::text || ' policies UPDATE en public.perfiles (revisar salida de bloque 2)'
  end as check_update_policies
from pg_policies
where schemaname = 'public'
  and tablename = 'perfiles'
  and cmd = 'UPDATE';

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
