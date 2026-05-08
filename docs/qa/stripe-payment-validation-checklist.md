# Checklist validación pagos Stripe

Checklist práctico para Alberto antes de enseñar o vender pagos con Stripe.

## Antes de probar

- [ ] Confirmar si se usará entorno Stripe test.
- [ ] Confirmar que NO se usarán tarjetas reales.
- [ ] Confirmar URL de producción/preview.
- [ ] Confirmar usuario socio de prueba.
- [ ] Confirmar usuario admin de prueba.
- [ ] Confirmar que no se tocará Supabase manualmente.
- [ ] Confirmar que no se ejecutará SQL.
- [ ] Confirmar que no se cambiarán variables de entorno.
- [ ] Confirmar que no se tocará Stripe Dashboard salvo revisión visual.

## Prueba pago cancelado

| Paso | Acción | Resultado esperado | OK/ERROR | Comentario |
|---|---|---|---|---|
| 1 | Entrar como socio. | Acceso correcto al área de socio. |  |  |
| 2 | Abrir Pagos. | Sección pagos visible y estable. |  |  |
| 3 | Pulsar renovar/pagar. | Se inicia el flujo sin error técnico. |  |  |
| 4 | Confirmar redirección a Stripe Checkout. | Navegación a Stripe correcta. |  |  |
| 5 | Cancelar pago. | Stripe permite cancelar sin bloqueo. |  |  |
| 6 | Volver a la app. | Retorno correcto a FITAPP. |  |  |
| 7 | Confirmar mensaje de cancelación claro. | Usuario entiende que no se completó el pago. |  |  |
| 8 | Confirmar que membresía no cambia indebidamente. | Sin renovación accidental. |  |  |
| 9 | Confirmar que no aparece error técnico. | Sin stacktrace ni detalles internos. |  |  |

## Prueba pago correcto en test mode

> Advertencia: No ejecutar esta prueba si no está confirmado que el entorno es test.

| Paso | Acción | Resultado esperado | OK/ERROR | Comentario |
|---|---|---|---|---|
| 1 | Entrar como socio. | Acceso correcto al área de socio. |  |  |
| 2 | Abrir Pagos. | Sección pagos visible y estable. |  |  |
| 3 | Pulsar renovar/pagar. | Flujo de pago inicia correctamente. |  |  |
| 4 | Usar tarjeta de test de Stripe si entorno test está confirmado. | Pago de prueba aceptado por Stripe. |  |  |
| 5 | Completar pago. | Checkout finaliza sin error técnico. |  |  |
| 6 | Volver a la app. | Retorno correcto desde Stripe. |  |  |
| 7 | Confirmar mensaje de pago correcto. | Feedback claro para el socio. |  |  |
| 8 | Confirmar membresía actualizada. | Estado/fechas acordes al plan pagado. |  |  |
| 9 | Confirmar historial pagos. | Pago visible en historial del socio. |  |  |
| 10 | Confirmar admin pagos. | Pago visible en vista de administración. |  |  |
| 11 | Confirmar webhook recibido si se revisa Stripe Dashboard. | Evento de confirmación recibido/procesado. |  |  |

## Prueba error controlado

| Paso | Acción | Resultado esperado | OK/ERROR | Comentario |
|---|---|---|---|---|
| 1 | Simular fallo si se puede sin tocar backend. | Se reproduce error controlado de inicio de pago. |  |  |
| 2 | Verificar mensaje visible. | Se muestra: “No se ha podido iniciar el pago. Inténtalo de nuevo.” |  |  |
| 3 | Revisar contenido del error. | No aparecen detalles Stripe/API/token. |  |  |

## Resultado final

| Bloque | OK/ERROR/PENDIENTE | Comentario |
|---|---|---|
| Checkout inicia |  |  |
| Cancelación |  |  |
| Pago correcto test |  |  |
| Webhook |  |  |
| Membresía |  |  |
| Historial socio |  |  |
| Pagos admin |  |  |
| Mensajes de error |  |  |
| Seguridad credenciales |  |  |
| Entorno test/live |  |  |

## Decisión

- [ ] Pagos listos para enseñar.
- [ ] Pagos enseñables con limitaciones.
- [ ] Pagos pendientes de hardening.
- [ ] No enseñar pagos todavía.
