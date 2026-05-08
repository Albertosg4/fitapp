# Smoke test comercial de app real gimnasio

Este smoke test sirve para validar la app real de gimnasio antes de enseñarla a un cliente.

- Es una validación funcional y comercial, no destructiva.
- No sustituye una auditoría de seguridad completa.
- No valida multi-sector real en runtime.
- La demo multi-sector vive aparte en `/demo`.
- El objetivo es confirmar que `/admin`, `/socio`, reservas, pagos y QR se entienden y funcionan.

## Antes de empezar

- [ ] Confirmar URL de producción.
- [ ] Confirmar usuario admin de prueba.
- [ ] Confirmar usuario socio de prueba.
- [ ] Confirmar que no se usarán credenciales reales de clientes.
- [ ] Confirmar navegador desktop.
- [ ] Confirmar prueba móvil.
- [ ] Confirmar que no se va a tocar Supabase manualmente.
- [ ] Confirmar que no se va a ejecutar SQL.
- [ ] Confirmar que no se va a hacer reset de datos.
- [ ] Confirmar que no se va a tocar Stripe Dashboard durante la demo.

## Smoke test admin

| Paso | Acción | Resultado esperado | OK/ERROR | Comentario |
|---|---|---|---|---|
| 1 | Abrir `/admin`. | Carga el panel de administración del gimnasio. |  |  |
| 2 | Login admin si aplica. | Acceso correcto sin errores técnicos visibles. |  |  |
| 3 | Ver header JGS Fight Team Admin. | El header se ve claro y consistente. |  |  |
| 4 | Ver métricas. | Se ven tarjetas de métricas sin romper diseño. |  |  |
| 5 | Ver tabs (Actividades, Horarios, Puntuales, Socios, Pagos, Nuevo socio). | Las tabs están visibles y navegables. |  |  |
| 6 | Abrir Actividades. | Contenido carga sin errores técnicos. |  |  |
| 7 | Abrir Horarios. | Contenido carga sin errores técnicos. |  |  |
| 8 | Abrir Puntuales. | Contenido carga sin errores técnicos. |  |  |
| 9 | Abrir Socios. | Contenido carga sin errores técnicos. |  |  |
| 10 | Abrir Pagos. | Contenido carga sin errores técnicos. |  |  |
| 11 | Abrir Nuevo socio. | Formulario se entiende y renderiza bien. |  |  |
| 12 | Revisar que no aparecen textos técnicos. | No se muestran stacks, códigos internos ni mensajes crudos. |  |  |
| 13 | Revisar que no aparece demo multi-sector. | `/admin` se mantiene como app real de gimnasio. |  |  |
| 14 | Salir/logout. | La sesión se cierra correctamente. |  |  |

## Smoke test socio

| Paso | Acción | Resultado esperado | OK/ERROR | Comentario |
|---|---|---|---|---|
| 1 | Abrir `/socio`. | Carga el área de socio. |  |  |
| 2 | Login socio si aplica. | Acceso correcto sin errores técnicos visibles. |  |  |
| 3 | Ver Área de socio. | Título/encabezado de área privada visible. |  |  |
| 4 | Ver saludo/perfil. | Se muestran datos básicos del socio. |  |  |
| 5 | Ver tabs (Clases, Historial, Pagos, Mi QR, Perfil). | Las tabs están visibles y navegables. |  |  |
| 6 | Abrir Clases. | Calendario/listado de clases carga correctamente. |  |  |
| 7 | Seleccionar día con clase. | Se muestran clases del día elegido. |  |  |
| 8 | Abrir modal de reserva. | El modal abre y se entiende. |  |  |
| 9 | Reservar plaza. | Reserva se confirma sin error técnico. |  |  |
| 10 | Ver estado Reservada. | La UI muestra estado reservado. |  |  |
| 11 | Cancelar reserva. | Cancelación se procesa correctamente. |  |  |
| 12 | Ver estado no reservada/disponible. | La UI vuelve a estado disponible. |  |  |
| 13 | Abrir Historial. | Historial carga sin errores técnicos. |  |  |
| 14 | Abrir Pagos. | Sección de pagos carga sin errores técnicos. |  |  |
| 15 | Abrir Mi QR. | QR/token se visualiza según flujo actual. |  |  |
| 16 | Abrir Perfil. | Perfil y acciones principales se ven correctas. |  |  |
| 17 | Salir/logout. | La sesión se cierra correctamente. |  |  |

## Smoke test check-in QR

| Paso | Acción | Resultado esperado | OK/ERROR | Comentario |
|---|---|---|---|---|
| 1 | Abrir `/checkin`. | Pantalla de check-in disponible. |  |  |
| 2 | Escanear o usar QR/token según flujo actual. | El sistema recibe token válido. |  |  |
| 3 | Confirmar acceso válido. | Mensaje claro de check-in correcto. |  |  |
| 4 | Repetir check-in si aplica. | Se puede probar control de duplicado. |  |  |
| 5 | Ver que el duplicado se gestiona correctamente. | Se informa “ya registrado” o equivalente sin fallo técnico. |  |  |
| 6 | Confirmar que no aparecen errores técnicos. | Mensajes orientados a usuario final. |  |  |

Si no se puede probar QR por falta de dispositivo/cámara, documentar:

"Pendiente de prueba con móvil/cámara real."

## Smoke test pagos

| Paso | Acción | Resultado esperado | OK/ERROR | Comentario |
|---|---|---|---|---|
| 1 | Entrar como socio. | Login correcto para validar pagos del socio. |  |  |
| 2 | Abrir Pagos. | Sección carga sin errores técnicos. |  |  |
| 3 | Revisar planes/membresía. | Información de membresía se entiende. |  |  |
| 4 | Pulsar renovar/pagar si se usa entorno seguro. | Acción responde sin romper flujo. |  |  |
| 5 | Confirmar que redirige a checkout Stripe si está configurado. | Redirección esperada y clara. |  |  |
| 6 | Cancelar pago. | Flujo de cancelación vuelve a la app. |  |  |
| 7 | Volver a la app. | Retorno a `/socio` correcto. |  |  |
| 8 | Confirmar mensaje claro de cancelación. | Mensaje entendible para usuario. |  |  |
| 9 | No introducir tarjetas reales salvo entorno controlado. | Seguridad comercial básica respetada. |  |  |
| 10 | Si no se prueba pago real, marcar como "Pendiente de auditoría Stripe". | El estado queda explícito y trazable. |  |  |

## Smoke test móvil

- [ ] `/admin` se ve aceptable en móvil.
- [ ] `/socio` se ve bien en móvil.
- [ ] Menú inferior socio no tapa contenido importante.
- [ ] Modal reserva se ve bien.
- [ ] QR se ve bien.
- [ ] Botones son fáciles de pulsar.
- [ ] No hay scroll roto.

## Resultado final

| Bloque | Estado | Comentario |
|---|---|---|
| Admin |  |  |
| Socio |  |  |
| Reservas |  |  |
| Check-in QR |  |  |
| Pagos |  |  |
| Móvil |  |  |
| Demo online separada |  |  |
| Seguridad básica visible |  |  |
| Documentación |  |  |

Estados permitidos:
- OK
- ERROR
- PENDIENTE

## Criterio para enseñar a cliente

Se puede enseñar si:

- Admin OK.
- Socio OK.
- Reservas OK.
- QR al menos validado o marcado como pendiente controlado.
- Pagos claramente validados o marcados como pendiente de auditoría.
- No aparecen errores técnicos.
- No aparecen credenciales.
- No aparece demo multi-sector dentro de `/admin` o `/socio`.

No se debe enseñar si:

- Login falla.
- Reserva/cancelación falla.
- Aparecen errores técnicos.
- La app muestra datos que no deberían enseñarse.
- Pagos redirige mal sin explicación.
- QR no carga y no está explicado.
- Se mezcla demo multi-sector con app real.

## Nota Fase 8E (pagos Stripe)

- La validación profunda de pagos se hace en `docs/qa/stripe-payment-validation-checklist.md`.
- Si Stripe no está validado, marcar pagos como `PENDIENTE` y no prometer pagos listos.
