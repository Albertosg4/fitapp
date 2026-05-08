# Runbook validación Stripe lifecycle (Fase 9A)

## Regla crítica previa
Si esta PR se mergea sin SQL aplicado y verificado, **no probar pagos**.

## Orden seguro
1. Revisar PR y aprobar cambios.
2. Ejecutar `00_precheck.sql`.
3. Ejecutar `01_main.sql` solo si se aprueba.
4. Ejecutar `02_verify.sql`.
5. Merge/deploy.
6. Probar Stripe test mode.

## Pruebas funcionales (test mode)
- Pago cancelado: volver a `/socio?pago=cancel`, sin cambio de membresía.
- Pago correcto: volver a `/socio?pago=ok`.
- Webhook: `checkout.session.completed` procesado por RPC con respuesta 200.
- Membresía: renovada una sola vez.
- Historial socio y admin pagos: reflejan el pago de forma consistente.
