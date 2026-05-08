-- Fase 9A precheck (read-only, safe before main SQL)
-- Output format: check_name | status | detail

with
pagos_cols as (
  select unnest(array[
    'id','user_id','gym_id','importe','tipo_membresia','meses','metodo','estado',
    'stripe_payment_id','stripe_session_id','stripe_event_id','created_at'
  ]) as col
),
perfiles_cols as (
  select unnest(array['id','gym_id','membresia_activa','membresia_vence','tipo_membresia']) as col
),
existing_pagos as (
  select column_name from information_schema.columns where table_schema='public' and table_name='pagos'
),
existing_perfiles as (
  select column_name from information_schema.columns where table_schema='public' and table_name='perfiles'
),
stripe_payment_dupes as (
  select count(*) as dup_values
  from (
    select stripe_payment_id
    from public.pagos
    where stripe_payment_id is not null
    group by stripe_payment_id
    having count(*) > 1
  ) d
),
has_session as (
  select exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='pagos' and column_name='stripe_session_id'
  ) as ok
),
session_dupes as (
  select case
    when (select ok from has_session) then (
      select count(*)
      from (
        select stripe_session_id
        from public.pagos
        where stripe_session_id is not null
        group by stripe_session_id
        having count(*) > 1
      ) s
    )
    else null
  end as dup_values
),
has_event as (
  select exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='pagos' and column_name='stripe_event_id'
  ) as ok
),
event_dupes as (
  select case
    when (select ok from has_event) then (
      select count(*)
      from (
        select stripe_event_id
        from public.pagos
        where stripe_event_id is not null
        group by stripe_event_id
        having count(*) > 1
      ) e
    )
    else null
  end as dup_values
),
rpc_exists as (
  select exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname='public' and p.proname='registrar_pago_stripe_membresia'
  ) as ok
)
select 'pagos_required_columns' as check_name,
       case when count(*) filter (where ep.column_name is not null) = count(*) then 'OK' else 'ERROR' end as status,
       format('present %s/%s: %s',
         count(*) filter (where ep.column_name is not null),
         count(*),
         string_agg(pc.col || '=' || case when ep.column_name is not null then 'present' else 'missing' end, ', ' order by pc.col)
       ) as detail
from pagos_cols pc
left join existing_pagos ep on ep.column_name = pc.col

union all

select 'perfiles_required_columns' as check_name,
       case when count(*) filter (where ep.column_name is not null) = count(*) then 'OK' else 'ERROR' end as status,
       format('present %s/%s: %s',
         count(*) filter (where ep.column_name is not null),
         count(*),
         string_agg(pc.col || '=' || case when ep.column_name is not null then 'present' else 'missing' end, ', ' order by pc.col)
       ) as detail
from perfiles_cols pc
left join existing_perfiles ep on ep.column_name = pc.col

union all

select 'stripe_payment_id_duplicates' as check_name,
       case when dup_values = 0 then 'OK' else 'ERROR' end as status,
       case when dup_values = 0 then '0 duplicate values' else dup_values::text || ' duplicate values' end as detail
from stripe_payment_dupes

union all

select 'stripe_session_id_duplicates' as check_name,
       case
         when not (select ok from has_session) then 'SKIPPED'
         when (select dup_values from session_dupes) = 0 then 'OK'
         else 'ERROR'
       end as status,
       case
         when not (select ok from has_session) then 'column does not exist yet'
         when (select dup_values from session_dupes) = 0 then '0 duplicate values'
         else (select dup_values from session_dupes)::text || ' duplicate values'
       end as detail

union all

select 'stripe_event_id_duplicates' as check_name,
       case
         when not (select ok from has_event) then 'SKIPPED'
         when (select dup_values from event_dupes) = 0 then 'OK'
         else 'ERROR'
       end as status,
       case
         when not (select ok from has_event) then 'column does not exist yet'
         when (select dup_values from event_dupes) = 0 then '0 duplicate values'
         else (select dup_values from event_dupes)::text || ' duplicate values'
       end as detail

union all

select 'rpc_registrar_pago_stripe_membresia_exists' as check_name,
       case when ok then 'OK' else 'ERROR' end as status,
       case when ok then 'function exists' else 'function does not exist yet' end as detail
from rpc_exists
order by check_name;
