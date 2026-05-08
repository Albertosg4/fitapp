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
