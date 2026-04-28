# 00 · Estado del Proyecto

## Datos generales

| Campo | Valor |
|---|---|
| URL producción | https://fitapp-neon.vercel.app |
| Repo | https://github.com/Albertosg4/fitapp |
| Último commit estable conocido | `354b3c8` |
| Estado de producción | ✅ Validado OK |
| `npm run lint` | ✅ OK (validado) |
| `npm run build` | ✅ OK (validado) |

## Fases completadas (estado real)

- ✅ **Fase 3B-1** — Reservas socio.
- ✅ **Fase 3B-2** — Lecturas admin por `gym_id`.
- ✅ **Fase 3C-1** — Actividades admin vía API protegida.
- ✅ **Fase 3C-2** — Horarios admin vía API protegida.
- ✅ **Fase 3C-3** — Clases puntuales admin vía API protegida.
- ✅ **Fase 3C-4** — Socios/membresías vía API protegida + vencimientos unificados.
- ✅ **Fase 3C-5** — Auditoría de escrituras directas restantes.
- ✅ **Fase 3C-6A** — Hardening mínimo de check-in QR.
- ✅ **Fase 3C-6B** — Auditoría de `/api/reservas/toggle`.
- ✅ **Fase Stripe-1** — Auditoría Stripe actual.
- ✅ **Fase Stripe-2** — Unificación Stripe con dominio de membresías.

## APIs protegidas activas

### APIs admin protegidas

- `/api/admin/actividades`
- `/api/admin/horarios`
- `/api/admin/sesiones`
- `/api/admin/socios/toggle`
- `/api/register-socio`
- `/api/pagos`
- `/api/pagos/manual`
- `/api/reservas/toggle`

### Endpoints Stripe revisados/endurecidos

- `/api/stripe/checkout`
- `/api/stripe/webhook`

### Endpoint de check-in endurecido

- `/api/checkin`

## Estado funcional resumido

- Producción operativa en Vercel y validada OK tras Stripe-2.
- Flujo socio de reservas operando por API protegida.
- Gestión admin crítica migrada a server-side.
- Gestión de pagos manuales y confirmaciones operativa.
- Stripe checkout/webhook alineados con la lógica de `lib/domain/membresias.ts`.
- `/api/checkin` endurecido con medidas mínimas de hardening.

## Escrituras admin principales ya migradas (no directas desde browser)

Las escrituras críticas del panel admin ya **no** dependen de inserciones/updates directos con cliente browser para:

- `actividades`
- `horarios_clase`
- sesiones puntuales (`sesiones`)
- `perfiles.membresia_activa`

## Membresías: criterio unificado

La lógica de renovación de vencimientos se centraliza en:

- `calcularNuevaFechaVencimiento()` en `lib/domain/membresias.ts`.

Estado esperado vigente:

- Pago **pagado** o **cortesía**: renueva vencimiento.
- Pago **pendiente**: no renueva hasta confirmación.
- Baja/reactivar socio: cambia `membresia_activa`, **no** recalcula vencimiento.
- Stripe registra pago **pagado** y renueva con `calcularNuevaFechaVencimiento()`.
