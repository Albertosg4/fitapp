-- Fase 9A rollback (solo ante fallo confirmado y aprobación)
drop function if exists public.registrar_pago_stripe_membresia(uuid,text,numeric,integer,text,text,text);
drop index if exists public.pagos_stripe_event_id_uq;
drop index if exists public.pagos_stripe_session_id_uq;
drop index if exists public.pagos_stripe_payment_id_uq;
alter table public.pagos drop column if exists stripe_event_id;
alter table public.pagos drop column if exists stripe_session_id;
