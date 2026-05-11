-- Fase 9A verify
select column_name
from information_schema.columns
where table_schema='public' and table_name='pagos'
  and column_name in ('stripe_session_id','stripe_event_id')
order by column_name;

select indexname
from pg_indexes
where schemaname='public' and tablename='pagos'
  and indexname in ('pagos_stripe_payment_id_uq','pagos_stripe_session_id_uq','pagos_stripe_event_id_uq')
order by indexname;

select n.nspname as schema_name, p.proname as function_name, p.prosecdef as is_security_definer
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname='public' and p.proname='registrar_pago_stripe_membresia';

select stripe_payment_id, count(*) as total
from public.pagos
where stripe_payment_id is not null
group by stripe_payment_id
having count(*) > 1;

select stripe_session_id, count(*) as total
from public.pagos
where stripe_session_id is not null
group by stripe_session_id
having count(*) > 1;

select stripe_event_id, count(*) as total
from public.pagos
where stripe_event_id is not null
group by stripe_event_id
having count(*) > 1;
