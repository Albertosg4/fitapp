-- Fase 9A precheck (read-only)
-- 1) Columnas en public.pagos
select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'pagos'
  and column_name in ('id','user_id','gym_id','importe','tipo_membresia','meses','metodo','estado','stripe_payment_id','stripe_session_id','stripe_event_id')
order by column_name;

-- 2) Columnas en public.perfiles
select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'perfiles'
  and column_name in ('id','gym_id','membresia_activa','membresia_vence','tipo_membresia')
order by column_name;

-- 3) Duplicados por stripe_payment_id
select stripe_payment_id, count(*) as total
from public.pagos
where stripe_payment_id is not null
group by stripe_payment_id
having count(*) > 1
order by total desc;

-- 4) Duplicados por stripe_session_id (si la columna existe)
select stripe_session_id, count(*) as total
from public.pagos
where stripe_session_id is not null
group by stripe_session_id
having count(*) > 1
order by total desc;

-- 5) Duplicados por stripe_event_id (si la columna existe)
select stripe_event_id, count(*) as total
from public.pagos
where stripe_event_id is not null
group by stripe_event_id
having count(*) > 1
order by total desc;

-- 6) Verificar si ya existe la función
select n.nspname as schema_name, p.proname as function_name
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'registrar_pago_stripe_membresia';
