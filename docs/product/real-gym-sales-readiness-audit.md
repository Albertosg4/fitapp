# Fase 8A - Auditoria de preparacion comercial app gimnasio real

## 1. Resumen ejecutivo

FITAPP vuelve a estar enfocada en su origen: una app real de gimnasio para JGS Fight Team. Las fases 7G y 7H separaron la demo multi-sector de la app operativa y añadieron guardarrailes para que `/admin` y `/socio` no vuelvan a mezclarse con componentes de demo.

La demo multi-sector queda bajo `/demo` y sus rutas hijas. Sirve para discovery comercial, no para operar el gimnasio real.

Esta auditoria revisa si la app real de gimnasio esta cerca de poder venderse o enseñarse a clientes con seguridad. La respuesta corta: hay mucho producto real ya construido, pero antes de vender conviene cerrar una validacion manual completa, pulir la experiencia visual, endurecer mensajes de error y auditar pagos/Stripe en una fase separada.

En esta fase no se han aplicado cambios funcionales. No se ha tocado backend, Supabase, SQL, Auth, Stripe, APIs, rutas reales ni datos reales.

## 2. Mapa de producto actual

| Area | Ruta/archivos | Que hace | Estado |
|---|---|---|---|
| Landing/login | `/`, `app/page.tsx`, `lib/supabase.ts` | Login con email y clave; redirige a `/admin` si el perfil es admin y a `/socio` si no lo es. | Casi listo |
| Admin | `/admin`, `app/admin/page.tsx`, `features/admin/*` | Panel operativo del gimnasio con stats, tabs de actividades, horarios, clases puntuales, socios, pagos y alta de socio. | Casi listo |
| Socio | `/socio`, `app/socio/page.tsx`, `features/socio/*` | Area privada del socio con clases, reservas, historial, pagos, QR y perfil. | Casi listo |
| Check-in QR | `/checkin`, `app/checkin/page.tsx`, `app/api/checkin/route.ts` | Procesa un token QR, valida membresia y registra asistencia con control de duplicados. | Casi listo |
| Actividades | `features/admin/components/ActividadesTab.tsx`, `app/api/admin/actividades/route.ts` | Lista, crea y activa/desactiva actividades del gimnasio. | Casi listo |
| Horarios | `features/admin/components/HorariosTab.tsx`, `app/api/admin/horarios/route.ts` | Gestiona horarios recurrentes asociados a actividades y gimnasio. | Casi listo |
| Clases puntuales | `features/admin/components/ClasesPuntualesTab.tsx`, `app/api/admin/sesiones/route.ts` | Gestiona sesiones puntuales, con soporte para sesiones y fallback legacy. | Revisar |
| Reservas | `features/socio/hooks/useSocioData.ts`, `app/api/reservas/toggle/route.ts` | Socio reserva/cancela clase; valida membresia, aforo, gimnasio y sesion. | Casi listo |
| Socios | `features/admin/components/SociosTab.tsx`, `app/api/admin/socios/toggle/route.ts`, `app/api/register-socio/route.ts` | Lista socios, alterna membresia y permite registrar nuevos socios desde admin. | Casi listo |
| Pagos | `features/admin/components/PagosTab.tsx`, `components/HistorialPagos.tsx`, `app/api/pagos/*` | Consulta pagos, registra pagos manuales y renueva membresias. | Revisar |
| Membresia | `lib/domain/membresias.ts` | Centraliza tipos, importes, meses, estado y calculo de vencimiento de membresia. | Casi listo |
| Perfil socio | `features/socio/components/SocioPerfilTab.tsx` | Muestra datos del socio, resumen de reservas y salida. | Casi listo |
| Historial/asistencia | `features/socio/components/SocioHistorialTab.tsx`, `components/HistorialAsistencia.tsx` | Muestra asistencias/check-ins del socio. | Casi listo |
| Stripe checkout | `app/api/stripe/checkout/route.ts`, `features/socio/components/SocioPagosTab.tsx` | Crea sesion Stripe para renovar membresia y vuelve a `/socio?pago=ok/cancel`. | Revisar |
| Webhook Stripe | `app/api/stripe/webhook/route.ts` | Valida firma, aplica idempotencia, actualiza membresia e inserta pago. | Revisar |
| APIs admin | `app/api/admin/*`, `app/api/register-socio/route.ts`, `app/api/pagos/manual/route.ts` | Operaciones server-side protegidas por `requireAdmin` y `gym_id`. | Casi listo |
| APIs socio/reservas | `app/api/reservas/toggle/route.ts`, `app/api/pagos/route.ts`, `app/api/stripe/checkout/route.ts` | Operaciones de socio con bearer token, membresia y aislamiento por gimnasio. | Casi listo |
| Supabase/Auth | `lib/supabase.ts`, `lib/supabase/*`, `lib/auth/*` | Clientes Supabase y helpers `requireAdmin`/`requireSocio`. | Revisar |
| Documentacion | `docs/*`, `docs/architecture/*`, `docs/security/*`, `docs/product/*` | Historial de fases, decisiones, riesgos, RLS, demo y fronteras app real/demo. | Casi listo |
| Demo online | `/demo`, `/demo/*`, `components/InteractiveDemoPage.tsx`, componentes OnlineDemo/VerticalDemo | Demo comercial multi-sector separada. No es la app real. | Separada/no app real |

## 3. Flujos reales detectados

### Admin

- Iniciar sesion desde `/` con credenciales reales.
- Entrar en `/admin` si el perfil autenticado tiene rol `admin`.
- Ver panel con stats de socios activos, actividades activas, horarios activos y clases puntuales proximas.
- Crear y gestionar actividades desde la pestaña Actividades.
- Crear y gestionar horarios recurrentes desde la pestaña Horarios.
- Crear y gestionar clases puntuales desde la pestaña Puntuales.
- Ver y gestionar socios desde la pestaña Socios.
- Registrar socio desde la pestaña `+ Nuevo socio`; el `gym_id` se toma del admin autenticado, no del cliente.
- Gestionar pagos manuales y revisar pagos desde la pestaña Pagos, si aplica al flujo comercial.
- Salir con el boton de logout del header.

### Socio

- Iniciar sesion desde `/` con credenciales reales.
- Entrar en `/socio` como usuario autenticado.
- Ver clases disponibles por calendario y horarios activos del gimnasio del socio.
- Reservar una clase desde el modal de clase.
- Cancelar una reserva existente desde el mismo flujo.
- Ver historial de asistencia.
- Ver pagos y renovar membresia si el flujo Stripe esta configurado.
- Ver QR personal para check-in.
- Ver perfil y resumen de actividad.
- Salir desde el perfil.

### Check-in

- Abrir `/checkin?token=...` desde el QR del socio.
- Enviar el token a `/api/checkin`.
- Validar que el token existe y pertenece a un perfil.
- Validar que la membresia esta activa y no caducada.
- Buscar reserva confirmada del dia si existe.
- Registrar asistencia asociada a reserva o acceso libre.
- Controlar duplicados:
  - Si ya existe acceso libre del dia, responde como ya registrado.
  - Si ya existe check-in para la reserva, responde como ya registrado.
- Aplicar rate limit en memoria por IP/token como proteccion best-effort.

### Pagos

- Desde `/socio`, el socio puede iniciar checkout de Stripe para renovar membresia.
- `/api/stripe/checkout` valida token, tipo de membresia, perfil y crea la sesion de pago.
- Stripe devuelve al usuario a `/socio?pago=ok` o `/socio?pago=cancel`.
- `/api/stripe/webhook` existe y procesa `checkout.session.completed`:
  - valida firma,
  - comprueba metadatos,
  - aplica idempotencia por `stripe_payment_id`,
  - actualiza membresia,
  - inserta pago.
- Los pagos manuales de admin existen en `app/api/pagos/manual/route.ts`.

## 4. Estado de venta

| Bloque | Estado | Se puede enseñar a cliente | Se puede vender ya | Comentario |
|---|---:|---:|---:|---|
| Admin real | Casi listo | Si | No | Hay producto real, pero necesita pulido visual, estados vacios y checklist manual. |
| Socio real | Casi listo | Si | No | El flujo principal existe; falta validar experiencia movil completa y mensajes de error. |
| Reservas | Casi listo | Si | No | Tiene validaciones importantes; conviene prueba manual con datos controlados. |
| Pagos | Revisar | Con cautela | No | Checkout/webhook existen, pero requieren auditoria y prueba end-to-end separada. |
| QR/check-in | Casi listo | Si | No | Flujo real implementado; falta validar QR real, duplicados y edge cases en entorno comercial. |
| Seguridad basica | Revisar | Con cautela | No | Hay helpers server-side y guardarrailes; RLS/policies siguen como tema de fase separada. |
| Demo online | Listo | Si | No aplica | Separada bajo `/demo`; no es app operativa real. |
| Documentacion comercial | Revisar | Parcialmente | No | Esta fase crea base, pero falta material final de venta y guion demo validado. |
| Multi-gym | Revisar | No | No | Hay aislamiento por `gym_id` en muchos flujos, pero producto multi-gimnasio vendible requiere fase propia. |
| Multi-sector real | No listo | No | No | Debe seguir fuera de runtime real. Solo demo comercial bajo `/demo`. |
| Datos demo reales | No listo | No | No | No hay cuenta demo real persistida segura para enseñar sin tocar datos reales. |

## 5. Riesgos pendientes antes de vender

| Riesgo | Impacto | Probabilidad | Recomendacion |
|---|---:|---:|---|
| Dependencia de Google Fonts en build | Medio | Media | Documentar si el build falla por red externa/Geist; usar fallback o fase separada si bloquea despliegue. |
| Experiencia visual movil insuficiente | Alto | Media | Fase 8B de pulido visual seguro en `/admin` y `/socio`, sin backend. |
| Flujos sin datos o estados vacios pobres | Alto | Alta | Añadir estados vacios claros y guion de datos de prueba en fase segura. |
| Errores de Supabase/Auth visibles para usuario | Medio | Media | Fase 8C para normalizar mensajes y ocultar detalles tecnicos. |
| Pagos/Stripe no validados end-to-end | Alto | Media | Fase 8E dedicada solo a auditoria Stripe y prueba controlada. |
| Webhook Stripe no probado en entorno comercial | Alto | Media | Validar firma, idempotencia, update de membresia e insercion de pago en fase separada. |
| RLS/policies pendientes o con deuda residual | Alto | Media | No tocar en esta fase; abrir fase de seguridad con SQL, rollback y validacion. |
| Scripts destructivos antiguos | Alto | Baja | Mantener inventario y no ejecutar scripts de reset sin confirmacion, backup y rollback. |
| PRs antiguas abiertas o decisiones antiguas en docs | Medio | Media | Revisar docs/roadmap antes de cada fase para evitar retomar caminos multi-sector no deseados. |
| Multi-gym real no empaquetado como producto | Alto | Media | No vender como multi-gimnasio hasta tener onboarding, permisos y pruebas dedicadas. |
| Backup/rollback operativo no definido para venta | Alto | Media | Crear runbook de backup/rollback antes de operaciones sensibles o demo real persistida. |
| Onboarding de primer gimnasio no cerrado | Alto | Alta | Definir pasos: crear gimnasio, admin, socios iniciales, actividades, horarios, pagos y QR. |
| Ausencia de cuenta demo real persistida | Alto | Alta | Crear solo en Fase 8F, con datos seguros, entorno controlado y rollback. |
| Logs/errores tecnicos visibles | Medio | Media | Revisar pantallas de error y mensajes para usuarios no tecnicos. |
| Service role debe quedar solo server-side | Alto | Baja | Mantener `supabaseAdmin` solo en rutas server/lib server; verificar en revisiones. |
| Separacion demo/app real puede romperse en futuras fases | Alto | Media | Ejecutar siempre `node scripts/verify-real-gym-boundaries.mjs`. |

## 6. Que NO tocar todavia

- No avanzar multi-sector real todavia.
- No renombrar `gym_id` todavia.
- No migrar `public.gimnasios` todavia.
- No tocar RLS sin fase separada.
- No tocar Stripe sin fase separada.
- No hacer reset demo con datos reales sin confirmacion.
- No mezclar UI comercial multi-sector con `/admin` o `/socio`.
- No crear usuarios demo reales hasta fase separada.
- No crear credenciales nuevas en documentacion ni codigo.
- No tocar datos reales para preparar una demo comercial sin backup y rollback.

## 7. Proximas fases recomendadas

### Fase 8B - Pulido visual seguro de app real de gimnasio

- Mejorar `/admin` y `/socio` para que parezcan producto vendible.
- Añadir estados vacios claros.
- Mejorar mensajes de interfaz y jerarquia visual.
- No tocar backend, APIs, Supabase, SQL, Auth ni Stripe.

### Fase 8C - Hardening de errores y mensajes usuario

- Normalizar errores de reserva.
- Normalizar errores de pagos.
- Normalizar errores de auth y sesion.
- Evitar mensajes tecnicos visibles para usuarios finales.
- Sin cambios destructivos ni SQL.

### Fase 8D - Checklist funcional de venta

- Preparar pruebas manuales reales por rol.
- Añadir script de health/check no destructivo si procede.
- Crear docs para demo comercial de gimnasio real.
- Validar build, lint y guardarrailes.

### Fase 8E - Pagos/Stripe audit separado

- Revisar checkout.
- Revisar webhook.
- Revisar idempotencia, membresia y pagos.
- No aplicar cambios hasta PR especifico.

### Fase 8F - Demo real controlada de gimnasio

- Crear solo si se decide.
- Preparar usuarios demo reales de forma segura.
- Definir datos demo, backup y rollback.
- Separar completamente datos demo de datos reales de cliente.

## 8. Criterio de "lista para vender"

- [ ] Admin puede gestionar gimnasio sin errores visibles.
- [ ] Socio puede reservar/cancelar.
- [ ] QR funciona.
- [ ] Pagos funcionan o estan claramente fuera de alcance.
- [ ] Hay datos demo seguros o entorno demo controlado.
- [ ] No hay credenciales visibles.
- [ ] No hay mezcla multi-sector en app real.
- [ ] Hay backup/rollback para operaciones sensibles.
- [ ] Build/lint verificados.
- [ ] Checklist manual pasado.
