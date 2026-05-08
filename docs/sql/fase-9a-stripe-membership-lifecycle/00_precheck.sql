-- Fase 9A precheck (read-only, safe before main SQL)

-- A) Columnas existentes en public.pagos (incluye created_at si existe)
select
  'pagos_columns' as check_name,
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'pagos'
  and column_name in (
    'id','user_id','gym_id','importe','tipo_membresia','meses','metodo','estado',
    'stripe_payment_id','stripe_session_id','stripe_event_id','created_at'
  )
order by column_name;

-- B) Columnas existentes en public.perfiles
select
  'perfiles_columns' as check_name,
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'perfiles'
  and column_name in ('id','gym_id','membresia_activa','membresia_vence','tipo_membresia')
order by column_name;

-- C) Duplicados por stripe_payment_id (columna existente en flujo actual)
select
  'duplicates_stripe_payment_id' as check_name,
  stripe_payment_id,
  count(*) as total
from public.pagos
where stripe_payment_id is not null
group by stripe_payment_id
having count(*) > 1
order by total desc;

-- D/E) Duplicados por stripe_session_id / stripe_event_id sin fallar si no existen
-- (read-only: solo SELECT dinámico + NOTICE)
do $$
declare
  v_has_session boolean;
  v_has_event boolean;
  v_sql text;
begin
  select exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='pagos' and column_name='stripe_session_id'
  ) into v_has_session;

  if v_has_session then
    raise notice 'Checking duplicates for stripe_session_id';
    v_sql := $q$
      select stripe_session_id, count(*) as total
      from public.pagos
      where stripe_session_id is not null
      group by stripe_session_id
      having count(*) > 1
      order by total desc
    $q$;
    execute v_sql;
  else
    raise notice 'stripe_session_id does not exist yet; skipping duplicate check.';
  end if;

  select exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='pagos' and column_name='stripe_event_id'
  ) into v_has_event;

  if v_has_event then
    raise notice 'Checking duplicates for stripe_event_id';
    v_sql := $q$
      select stripe_event_id, count(*) as total
      from public.pagos
      where stripe_event_id is not null
      group by stripe_event_id
      having count(*) > 1
      order by total desc
    $q$;
    execute v_sql;
  else
    raise notice 'stripe_event_id does not exist yet; skipping duplicate check.';
  end if;
end $$;

-- F) Comprobar existencia de función public.registrar_pago_stripe_membresia
select
  'rpc_function_presence' as check_name,
  n.nspname as schema_name,
  p.proname as function_name
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'registrar_pago_stripe_membresia';
