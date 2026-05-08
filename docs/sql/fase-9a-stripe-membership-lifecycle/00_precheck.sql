-- Precheck Fase 9A
select column_name from information_schema.columns where table_schema='public' and table_name='pagos' and column_name in ('stripe_event_id','stripe_session_id','stripe_payment_id');
