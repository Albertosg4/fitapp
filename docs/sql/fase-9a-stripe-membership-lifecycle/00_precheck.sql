-- Fase 9A precheck (safe before main SQL)
-- Allowed objects: pg_temp only

create temporary table if not exists pg_temp.fase_9a_precheck_results (
  check_name text,
  status text,
  detail text
) on commit drop;

truncate pg_temp.fase_9a_precheck_results;

do $$
declare
  v_missing text;
  v_dup_count bigint;
  v_has_col boolean;
  v_has_rpc boolean;
begin
  -- A) pagos_required_columns
  select string_agg(req.col, ', ' order by req.col)
  into v_missing
  from (
    select unnest(array[
      'id','user_id','gym_id','importe','tipo_membresia','meses','metodo','estado',
      'stripe_payment_id','stripe_session_id','stripe_event_id','created_at'
    ]) as col
  ) req
  left join information_schema.columns c
    on c.table_schema='public' and c.table_name='pagos' and c.column_name=req.col
  where c.column_name is null;

  insert into pg_temp.fase_9a_precheck_results(check_name, status, detail)
  values (
    'pagos_required_columns',
    case when v_missing is null then 'OK' else 'ERROR' end,
    case when v_missing is null then 'all required columns are present' else 'missing columns: ' || v_missing end
  );

  -- B) perfiles_required_columns
  select string_agg(req.col, ', ' order by req.col)
  into v_missing
  from (
    select unnest(array['id','gym_id','membresia_activa','membresia_vence','tipo_membresia']) as col
  ) req
  left join information_schema.columns c
    on c.table_schema='public' and c.table_name='perfiles' and c.column_name=req.col
  where c.column_name is null;

  insert into pg_temp.fase_9a_precheck_results(check_name, status, detail)
  values (
    'perfiles_required_columns',
    case when v_missing is null then 'OK' else 'ERROR' end,
    case when v_missing is null then 'all required columns are present' else 'missing columns: ' || v_missing end
  );

  -- C) stripe_payment_id_duplicates
  select exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='pagos' and column_name='stripe_payment_id'
  ) into v_has_col;

  if not v_has_col then
    insert into pg_temp.fase_9a_precheck_results(check_name, status, detail)
    values ('stripe_payment_id_duplicates', 'ERROR', 'column stripe_payment_id is missing');
  else
    execute $q$
      select count(*)
      from (
        select stripe_payment_id
        from public.pagos
        where stripe_payment_id is not null
        group by stripe_payment_id
        having count(*) > 1
      ) d
    $q$ into v_dup_count;

    insert into pg_temp.fase_9a_precheck_results(check_name, status, detail)
    values (
      'stripe_payment_id_duplicates',
      case when v_dup_count = 0 then 'OK' else 'ERROR' end,
      case when v_dup_count = 0 then '0 duplicate values' else v_dup_count::text || ' duplicate values' end
    );
  end if;

  -- D) stripe_session_id_duplicates
  select exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='pagos' and column_name='stripe_session_id'
  ) into v_has_col;

  if not v_has_col then
    insert into pg_temp.fase_9a_precheck_results(check_name, status, detail)
    values ('stripe_session_id_duplicates', 'SKIPPED', 'column does not exist yet');
  else
    execute $q$
      select count(*)
      from (
        select stripe_session_id
        from public.pagos
        where stripe_session_id is not null
        group by stripe_session_id
        having count(*) > 1
      ) d
    $q$ into v_dup_count;

    insert into pg_temp.fase_9a_precheck_results(check_name, status, detail)
    values (
      'stripe_session_id_duplicates',
      case when v_dup_count = 0 then 'OK' else 'ERROR' end,
      case when v_dup_count = 0 then '0 duplicate values' else v_dup_count::text || ' duplicate values' end
    );
  end if;

  -- E) stripe_event_id_duplicates
  select exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='pagos' and column_name='stripe_event_id'
  ) into v_has_col;

  if not v_has_col then
    insert into pg_temp.fase_9a_precheck_results(check_name, status, detail)
    values ('stripe_event_id_duplicates', 'SKIPPED', 'column does not exist yet');
  else
    execute $q$
      select count(*)
      from (
        select stripe_event_id
        from public.pagos
        where stripe_event_id is not null
        group by stripe_event_id
        having count(*) > 1
      ) d
    $q$ into v_dup_count;

    insert into pg_temp.fase_9a_precheck_results(check_name, status, detail)
    values (
      'stripe_event_id_duplicates',
      case when v_dup_count = 0 then 'OK' else 'ERROR' end,
      case when v_dup_count = 0 then '0 duplicate values' else v_dup_count::text || ' duplicate values' end
    );
  end if;

  -- F) rpc_registrar_pago_stripe_membresia_exists
  select exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname='public' and p.proname='registrar_pago_stripe_membresia'
  ) into v_has_rpc;

  insert into pg_temp.fase_9a_precheck_results(check_name, status, detail)
  values (
    'rpc_registrar_pago_stripe_membresia_exists',
    case when v_has_rpc then 'OK' else 'MISSING' end,
    case when v_has_rpc then 'function exists' else 'function does not exist yet' end
  );
end $$;

select check_name, status, detail
from pg_temp.fase_9a_precheck_results
order by check_name;
