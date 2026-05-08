-- Verify Fase 9A
select column_name from information_schema.columns where table_schema='public' and table_name='pagos' and column_name in ('stripe_event_id','stripe_session_id');
select indexname from pg_indexes where schemaname='public' and tablename='pagos' and indexname in ('pagos_stripe_event_id_uq','pagos_stripe_session_id_uq');
