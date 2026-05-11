# Fase 9A SQL manual

SQL prepared but not executed.

IMPORTANT:
Este SQL debe ejecutarse y verificarse antes de desplegar el webhook que depende de la función RPC `registrar_pago_stripe_membresia`.

Orden seguro:
1. Ejecutar `00_precheck.sql`.
2. Revisar resultado.
3. Ejecutar `01_main.sql` solo tras aprobación.
4. Ejecutar `02_verify.sql`.
5. Ejecutar `99_rollback.sql` solo con fallo confirmado y aprobación explícita.


Notas operativas:
- El precheck (`00_precheck.sql`) está diseñado para no fallar aunque `stripe_session_id` o `stripe_event_id` todavía no existan.
- Pega en el PR/comentario los resultados completos del precheck antes de ejecutar `01_main.sql`.
- No hacer merge/deploy del webhook si `01_main.sql` + `02_verify.sql` no están aplicados y validados (o si se decide no aplicar SQL).
