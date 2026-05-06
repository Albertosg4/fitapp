# Mapa de impacto transversal: schema / API / UI

> Este documento es **mapa de impacto**. No es plan ejecutable ni instrucción de migración en producción.

## Tabla transversal de impacto

| área | archivos/rutas principales | dependencia actual | equivalente futuro | riesgo | recomendación |
|---|---|---|---|---|---|
| Schema/Supabase | `supabase/fase3_seguridad.sql`, `supabase/fase5C_A_rls_reservas_gym_scoped.sql`, `supabase/fase5C_B_rls_pagos_gym_scoped.sql` | scope técnico por `gym_id` + `gimnasios` | `tenant` + `location` + `vertical` | Alto | Mantener ahora; migrar por fases posteriores |
| APIs/server | `app/api/admin/*`, `app/api/reservas/toggle/route.ts`, `app/api/pagos/*`, `app/api/checkin/route.ts` | autorización y filtros por `gym_id` | resolución de scope por tenant/location | Medio-Alto | Abstraer progresivo; sin rename masivo inicial |
| UI/frontend | `app/admin/page.tsx`, `app/socio/page.tsx`, `features/*` | labels gym/socio/clase/reserva | labels por vertical configurables | Medio | Empezar por capa de labels, sin romper flujos |
| Documentación | `docs/02_SUPABASE_ESTADO.md`, `docs/03_RIESGOS_Y_DEUDA.md`, `docs/architecture/*` | narrativa centrada en fases gym-scoped | narrativa tenant/location/vertical por etapas | Bajo | Actualización incremental y trazable |
| Demo/test data | `supabase/fase5C_E_multigym_control_*`, `docs/02_SUPABASE_ESTADO.md` | fixtures JGS + Demo Gym | fixtures multi-tenant controlados | Bajo-Medio | Mantener datos actuales hasta diseño SQL aprobado |

## A) Schema / Supabase

Entidades clasificadas y su impacto:

- `gimnasios`: hoy tabla operativa de referencia por sede; futuro conceptual `locations`.
- `gym_id`: scope técnico actual en múltiples tablas y policies.
- `perfiles`: enlaza usuarios/roles al scope `gym_id`.
- `pagos`: aislamiento por `gym_id` aplicado en hardening previo.
- `reservas`: aislamiento derivado desde `sesiones`/`gym_id`.
- `sesiones`: entidad agenda ya sensible a aislamiento por gym.
- `asistencia`: check-in ligado a usuario/sesión/gym.
- `actividades`: catálogo operativo por gym.
- `horarios_clase`: agenda recurrente por gym.
- `clases`: legacy deprecada, aún presente a nivel histórico.
- `auth_gym_id`: función base de policies gym-scoped.
- `toggle_reserva`: RPC de reserva dependiente de contexto auth y modelo actual.

## B) APIs / server

- Dependencia fuerte de `requireAdmin`/`requireSocio` devolviendo `gymId`.
- Mensajes y validaciones explícitas de “otro gimnasio”.
- Endpoints de reservas/pagos/check-in y admin construidos sobre el scope actual.

## C) UI / frontend

- Persisten términos de vertical gimnasio en textos visibles.
- Estructura funcional estable y validada; no conviene mezclar migración de datos con cambio semántico UI.

## D) Documentación

- Documentación técnica refleja correctamente estado real gym-scoped y fases 5C/5F/6A/6B.
- 6C amplía ese estado con decisión y roadmap.

## E) Demo / test data

- Fixtures de validación (`JGS Fight Team` y `FITAPP Demo Gym 2`) útiles para control de aislamiento.
- Deben mantenerse hasta cerrar el diseño SQL y plan de rollback de tenant/location.
