-- Main SQL Fase 9A (manual, not executed)
alter table public.pagos add column if not exists stripe_event_id text;
alter table public.pagos add column if not exists stripe_session_id text;
create unique index if not exists pagos_stripe_event_id_uq on public.pagos(stripe_event_id) where stripe_event_id is not null;
create unique index if not exists pagos_stripe_session_id_uq on public.pagos(stripe_session_id) where stripe_session_id is not null;
