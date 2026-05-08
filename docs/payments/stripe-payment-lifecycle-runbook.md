# Runbook validación Stripe lifecycle (Fase 9A)

1. Probar pago cancelado (`/socio`, ir a Stripe y cancelar): esperar mensaje cancelado sin cambio de membresía.
2. Probar pago correcto en test mode: esperar redirección OK y actualización posterior por webhook.
3. Verificar webhook: evento `checkout.session.completed` recibido y 200.
4. Verificar membresía en socio: tipo y fecha renovados.
5. Verificar historial socio: pago visible con método tarjeta y estado pagado.
6. Verificar admin pagos: pago visible con socio, fecha, importe y estado.
7. Guardar capturas: checkout inicio, retorno cancelado, retorno OK, historial socio, admin pagos.
8. Parar inmediatamente si hay error técnico visible, duplicado de pago, o membresía no sincronizada.
