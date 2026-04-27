# 00 · Estado del Proyecto

## Datos generales

| Campo | Valor |
|---|---|
| URL producción | https://fitapp-neon.vercel.app |
| Repo | https://github.com/Albertosg4/fitapp |
| Último commit estable conocido | `b64a56e` |
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

## APIs protegidas activas

- `/api/admin/actividades`
- `/api/admin/horarios`
- `/api/admin/sesiones`
- `/api/admin/socios/toggle`
- `/api/register-socio`
- `/api/pagos`
- `/api/pagos/manual`
- `/api/reservas/toggle`
- `/api/checkin`

## Estado funcional resumido

- Producción operativa en Vercel.
- Flujo socio de reservas operando por API protegida.
- Gestión admin crítica migrada a server-side.
- Gestión de pagos manuales y confirmaciones operativa.

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
