-- Fase 9A main SQL (manual, no ejecutado por PR)
alter table public.pagos add column if not exists stripe_session_id text;
alter table public.pagos add column if not exists stripe_event_id text;

create unique index if not exists pagos_stripe_payment_id_uq on public.pagos (stripe_payment_id) where stripe_payment_id is not null;
create unique index if not exists pagos_stripe_session_id_uq on public.pagos (stripe_session_id) where stripe_session_id is not null;
create unique index if not exists pagos_stripe_event_id_uq on public.pagos (stripe_event_id) where stripe_event_id is not null;

create or replace function public.registrar_pago_stripe_membresia(
  p_user_id uuid,
  p_tipo_membresia text,
  p_importe numeric,
  p_meses integer,
  p_stripe_payment_id text,
  p_stripe_session_id text,
  p_stripe_event_id text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existente_id uuid;
  v_pago_id uuid;
  v_gym_id uuid;
  v_membresia_vence date;
  v_base date;
  v_nueva_vence date;
begin
  if p_user_id is null or coalesce(trim(p_tipo_membresia), '') = '' or coalesce(trim(p_stripe_payment_id), '') = ''
     or coalesce(trim(p_stripe_session_id), '') = '' or coalesce(trim(p_stripe_event_id), '') = '' then
    raise exception 'invalid payload';
  end if;

  select id into v_existente_id
  from public.pagos
  where stripe_payment_id = p_stripe_payment_id
     or stripe_session_id = p_stripe_session_id
     or stripe_event_id = p_stripe_event_id
  order by created_at desc
  limit 1;

  if v_existente_id is not null then
    return jsonb_build_object('status','duplicate','pago_id',v_existente_id::text);
  end if;

  select gym_id, membresia_vence
  into v_gym_id, v_membresia_vence
  from public.perfiles
  where id = p_user_id
  for update;

  if v_gym_id is null then
    raise exception 'perfil sin gym_id';
  end if;

  v_base := greatest(current_date, coalesce(v_membresia_vence, current_date));
  v_nueva_vence := (v_base + make_interval(months => p_meses))::date;

  update public.perfiles
  set membresia_activa = true,
      membresia_vence = v_nueva_vence,
      tipo_membresia = p_tipo_membresia
  where id = p_user_id;

  insert into public.pagos (
    user_id, gym_id, importe, tipo_membresia, meses, metodo, estado,
    stripe_payment_id, stripe_session_id, stripe_event_id
  ) values (
    p_user_id, v_gym_id, p_importe, p_tipo_membresia, p_meses, 'stripe', 'pagado',
    p_stripe_payment_id, p_stripe_session_id, p_stripe_event_id
  ) returning id into v_pago_id;

  return jsonb_build_object('status','processed','pago_id',v_pago_id::text,'membresia_vence',to_char(v_nueva_vence,'YYYY-MM-DD'));
exception
  when unique_violation then
    select id into v_existente_id
    from public.pagos
    where stripe_payment_id = p_stripe_payment_id
       or stripe_session_id = p_stripe_session_id
       or stripe_event_id = p_stripe_event_id
    order by created_at desc
    limit 1;
    return jsonb_build_object('status','duplicate','pago_id',coalesce(v_existente_id::text,''));
end;
$$;
