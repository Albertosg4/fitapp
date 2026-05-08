# Checklist validación pagos Stripe (Fase 9A)

## Gate previo
- [ ] SQL Fase 9A aplicado y verificado manualmente (`00_precheck` -> `01_main` -> `02_verify`).
- [ ] Confirmado que webhook usa RPC `registrar_pago_stripe_membresia`.

## Flujo
- [ ] Checkout inicia desde usuario autenticado.
- [ ] Cancelación vuelve a `/socio?pago=cancel` con mensaje claro.
- [ ] Pago correcto test vuelve a `/socio?pago=ok` con mensaje claro.
- [ ] Webhook procesa `checkout.session.completed` con firma válida.
- [ ] Membresía se actualiza una vez (sin duplicar).
- [ ] Historial socio refleja pago correcto.
- [ ] Admin pagos refleja el mismo pago.
- [ ] Reintento webhook no duplica (`stripe_payment_id` / `stripe_session_id` / `stripe_event_id`).
- [ ] Sin errores técnicos visibles al usuario.
