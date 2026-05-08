# Auditoría flujo de pagos Stripe — App real gimnasio

## Resumen ejecutivo

Esta fase audita el flujo real de pagos Stripe de FITAPP para la app de gimnasio real (JGS Fight Team).

- Esta fase **no cambia código funcional**.
- Esta fase **no toca Stripe backend**.
- Esta fase **no toca Supabase**.
- Esta fase **no ejecuta pagos**.
- Esta fase busca saber si el flujo está listo para validación comercial o si necesita hardening adicional antes de vender.

## Superficies revisadas

| Superficie | Archivo/ruta | Qué hace | Estado |
|---|---|---|---|
| UI pagos socio | `features/socio/components/SocioPagosTab.tsx` | Renderiza experiencia de pagos en área socio. | Revisar |
| Entrada área socio | `app/socio/page.tsx` | Punto de acceso a tabs del socio, incluida pestaña Pagos. | Casi listo |
| Historial pagos socio | `components/HistorialPagos.tsx` | Muestra pagos ya registrados al socio. | Casi listo |
| Pagos admin | `features/admin/components/PagosTab.tsx` | Vista de pagos para administración. | Revisar |
| Checkout Stripe | `app/api/stripe/checkout/route.ts` | Inicia sesión de checkout y redirección a Stripe. | Revisar |
| Retorno pago ok/cancel | `/socio?pago=ok|cancel` (consumido por UI de socio) | Muestra resultado visual tras volver desde Stripe. | Pendiente de prueba real |
| Webhook Stripe | `app/api/stripe/webhook/route.ts` | Confirma pago server-side y dispara actualización esperada. | Pendiente de prueba real |
| Actualización membresía | `lib/domain/membresias.ts` | Define dominio de membresías (estado/fechas/reglas). | Casi listo |
| Auditoría comercial existente | `docs/product/real-gym-sales-readiness-audit.md` | Marco comercial de preparación actual. | Listo |
| Smoke test comercial | `docs/qa/real-gym-sales-smoke-test.md` | Validación funcional general no destructiva. | Listo |

## Flujo actual esperado

1. Socio entra en `/socio`.
2. Abre pestaña Pagos.
3. Selecciona renovar/pagar membresía.
4. Frontend llama a `/api/stripe/checkout`.
5. Backend crea sesión de Stripe si está configurado.
6. Usuario va a checkout Stripe.
7. Usuario paga o cancela.
8. App recibe retorno pago ok/cancel.
9. Webhook, si está implementado, confirma pago y actualiza estado.
10. Admin/socio pueden ver pagos o membresía actualizada.

Diferencias clave a validar:

- **Retorno visual del usuario:** mensaje que ve al volver desde Stripe (ok/cancel).
- **Confirmación real vía webhook:** confirmación server-side del pago válido.
- **Actualización real de membresía:** extensión/activación correcta según dominio.
- **Historial de pagos:** reflejo consistente para socio y admin.

## Estado de preparación

| Bloque | Estado | Comentario |
|---|---:|---|
| UI pagos socio | Casi listo | Superficie presente y separada; requiere prueba de mensajes finales con casos reales de test. |
| Botón de pago | Casi listo | Flujo de inicio existe; falta confirmar robustez UX en cancelaciones y errores controlados. |
| Checkout Stripe | Revisar | Endpoint existe, pero la validación comercial aún no está ejecutada end-to-end en esta fase. |
| Retorno cancelado | Pendiente de prueba real | Debe comprobarse que el estado no induce a error ni modifica membresía. |
| Retorno correcto | Pendiente de prueba real | Debe validarse mensaje de éxito y consistencia con backend. |
| Webhook | Revisar | Superficie existe; falta validación operativa controlada en test mode. |
| Actualización membresía | Revisar | Debe validarse que se actualiza una sola vez y con fechas correctas. |
| Historial pagos socio | Casi listo | Componente presente; falta validar sincronización tras pago correcto/cancelado. |
| Pagos admin | Casi listo | Superficie existe; falta confirmar lectura completa tras eventos Stripe. |
| Seguridad credenciales | Revisar | Debe verificarse que no hay secretos expuestos en UI/logs visibles. |
| Entorno test/live | No listo | Requiere checklist explícito y disciplina operativa antes de pruebas de pago. |
| Mensajes de error | Casi listo | Existe hardening general, pero falta validación específica en errores de Stripe. |
| Trazabilidad | Revisar | Se necesita confirmar evidencia trazable de cada intento de pago y estado final. |
| Reintentos/idempotencia | Revisar | Debe comprobarse frente a repetición de webhook o reintentos de usuario. |
| Documentación QA | Listo | Esta fase incorpora checklist dedicado para validación de Stripe. |

## Riesgos específicos de pagos

| Riesgo | Impacto | Probabilidad | Mitigación recomendada |
|---|---:|---:|---|
| Usar claves live por error en pruebas | Alto | Media | Confirmar test mode antes de iniciar y bloquear uso de tarjetas reales. |
| Webhook no configurado o mal configurado | Alto | Media | Validar endpoint/firma en entorno test controlado antes de cualquier venta. |
| Pago correcto pero membresía no actualizada | Alto | Media | Verificar cadena checkout→webhook→membresía→historial con caso completo. |
| Usuario cancela pago y la app muestra estado confuso | Medio | Media | Revisar copy y estado visual de cancelación en `/socio`. |
| Error Stripe visible al usuario | Medio | Media | Mantener mensajes seguros y sin detalles técnicos internos. |
| Falta de idempotencia | Alto | Baja/Media | Validar que eventos repetidos no dupliquen efectos en pagos/membresías. |
| Duplicidad de pagos | Alto | Baja/Media | Revisar llaves de deduplicación y reconciliación admin/socio. |
| Falta de trazabilidad | Medio | Media | Asegurar evidencia de intento, resultado y confirmación final. |
| Entorno test/live mezclado | Alto | Media | Checklist operativo previo + revisión explícita del entorno. |
| Secretos expuestos en logs o frontend | Alto | Baja | Revisión técnica y monitoreo de mensajes visibles. |
| Admin ve pagos incompletos o incorrectos | Medio | Media | Verificación cruzada admin/socio tras pago de prueba controlado. |
| Usuario cree que pagó pero no se confirma | Alto | Media | Diferenciar claramente “retorno visual” vs “confirmación webhook”. |
| Renovación de membresía con fechas incorrectas | Alto | Media | Validar reglas de dominio y resultado final en membresía vigente. |

## Qué NO tocar todavía

- No tocar Stripe hasta fase de implementación separada.
- No cambiar webhook todavía.
- No cambiar checkout todavía.
- No cambiar actualización de membresía todavía.
- No crear pagos de prueba reales todavía.
- No usar tarjetas reales.
- No tocar SQL/RLS/Auth.
- No tocar credenciales.
- No mezclar pagos con multi-sector.

## Próximas fases recomendadas

### Fase 8F — Validación controlada Stripe test mode

- Probar checkout en entorno test.
- Confirmar retorno ok/cancel.
- Confirmar webhook.
- No tocar producción live.

### Fase 8G — Hardening técnico Stripe

- Idempotencia.
- Mensajes.
- Logs server-side seguros.
- Validación webhook.
- Rollback.

### Fase 8H — Documentación operativa pagos

- Cómo probar pagos.
- Qué revisar en Stripe Dashboard.
- Cómo responder si pago falla.

No se implementan estas fases en este PR.

## Criterio para decir “pagos listos para vender”

- [ ] Checkout test funciona.
- [ ] Cancelación vuelve correctamente.
- [ ] Pago correcto vuelve correctamente.
- [ ] Webhook confirma pago.
- [ ] Membresía se actualiza correctamente.
- [ ] Historial pagos refleja el pago.
- [ ] Admin puede revisar pagos.
- [ ] No hay errores técnicos visibles.
- [ ] No hay claves expuestas.
- [ ] Entorno test/live está claro.
- [ ] Hay proceso de soporte si un pago falla.
