# Fase 6H — Vertical settings contract foundation

## Objetivo

Fase 6H introduce una base de contrato tipado para settings verticales en dominio, sin persistencia y sin cambios funcionales visibles.

This PR adds a pure vertical settings contract foundation.

## Qué se implementa en esta fase

- Contrato tipado para flags de funcionalidad por vertical (`VerticalFeatureFlags`).
- Contrato de entrada para composición de settings (`VerticalSettingsInput`).
- Contrato efectivo resultante con fallback seguro (`EffectiveVerticalSettings`).
- Defaults de features por vertical (`DEFAULT_VERTICAL_FEATURES`).
- Helpers puros para resolver settings efectivos (`resolveVerticalSettings`).
- `gym` se mantiene como default vía `DEFAULT_VERTICAL`.

## Modelo conceptual

### Vertical labels

Son términos de UI (por ejemplo: Socio, Reserva, Profesor) ya definidos en `verticals.ts`.

### Vertical feature flags

Son toggles de capacidades por vertical (por ejemplo: `qrCheckinEnabled`, `capacityEnabled`) y no alteran flujos en esta fase.

### Vertical settings input

Es una entrada parcial y tolerante a valores faltantes/invalidos:

- `vertical?: unknown`
- `labels?: Partial<VerticalLabels> | null`
- `features?: Partial<VerticalFeatureFlags> | null`

### Effective vertical settings

Es la salida resuelta y segura:

- `vertical` validada con fallback a `gym`.
- `labels` completas (base + overrides).
- `features` completas (defaults + overrides).


## Notas de seguridad del contrato

- Los feature overrides se sanitizan antes de componer settings efectivos.
- Solo valores booleanos explícitos pueden sobrescribir defaults de features.
- Los defaults de features se devuelven como copia para evitar mutación global accidental.

## Persistencia (explícitamente fuera de alcance)

Esta fase todavía **no** persiste settings ni lee fuentes externas.

- This phase does not read settings from Supabase, localStorage, environment variables or query params.
- No SQL is applied or prepared for execution.
- No schema, RLS, Auth, Stripe, API or route changes are included.

Además:

- Sin migraciones.
- Sin constraints.
- Sin cambios en permisos.
- Sin cambios en lógica de reservas/pagos/check-in.
- No business logic was changed.

This PR does not make FITAPP fully multi-tenant or fully multi-vertical yet.

## Tabla de feature flags por vertical

| Vertical | attendanceEnabled | qrCheckinEnabled | paymentsEnabled | capacityEnabled | recurringScheduleEnabled |
|---|---:|---:|---:|---:|---:|
| gym | true | true | true | true | true |
| clinic | true | false | true | false | true |
| academy | true | false | true | true | true |
| beauty | false | false | true | false | true |
| generic | false | false | true | false | true |

## Checklist funcional de la fase

- [x] Existe contrato tipado de settings verticales en dominio.
- [x] Existe fallback seguro a `DEFAULT_VERTICAL` (`gym`).
- [x] Helpers son puros y sin side effects.
- [x] No hay lectura de Supabase/localStorage/env/query params.
- [x] No hay SQL, schema ni RLS.
- [x] No hay cambios funcionales visibles.
- [x] Queda base preparada para futura fase `tenant_settings`/`vertical_settings`.
