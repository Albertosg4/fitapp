-- Rollback Fase 9A (use only if approved)
drop index if exists public.pagos_stripe_event_id_uq;
drop index if exists public.pagos_stripe_session_id_uq;
alter table public.pagos drop column if exists stripe_event_id;
alter table public.pagos drop column if exists stripe_session_id;
