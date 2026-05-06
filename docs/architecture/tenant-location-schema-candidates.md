# Fase 6B · Candidatos de schema tenant/location (solo diseño)

## Importante

Documento de diseño. **No SQL ejecutable**.

- No ejecutar.
- No crear migraciones.
- No aplicar constraints.
- No modificar RLS.

## Tablas candidatas futuras (conceptuales)

### `public.tenants`

- `id`
- `name`
- `slug`
- `status`
- `default_vertical`
- `created_at`
- `updated_at`

### `public.tenant_members`

- `id`
- `tenant_id`
- `user_id`
- `role`
- `created_at`

### `public.vertical_settings` o `public.tenant_settings`

- `id`
- `tenant_id`
- `vertical`
- `labels` (`jsonb`)
- `features` (`jsonb`)
- `created_at`
- `updated_at`

## Evolución conceptual de `public.gimnasios`

- Seguiría existiendo temporalmente.
- Añadiría `tenant_id` en fase futura.
- Actuaría como location/sede en el modelo multi-negocio.
- Posible rename futuro a `locations`, no ahora.

## Columnas candidatas por tabla (análisis de impacto)

- `gimnasios`: `tenant_id`, `vertical` opcional.
- `perfiles`: `tenant_id` opcional futuro; `gym_id` actual se conserva.
- `pagos`: `tenant_id` opcional futuro o derivable por `gym_id`.
- `reservas`: `tenant_id` derivable vía sesiones/`gym_id`; no añadir sin diseño detallado.
- `sesiones`: `tenant_id` derivable vía `gym_id`.
- `actividades` / `horarios_clase`: `tenant_id` derivable vía `gym_id`.

## Nota de gobernanza técnica

Este documento no autoriza cambios directos en Supabase ni ejecución de scripts. Es una base para inventario de impacto (Fase 6C) y decisión de migración (Fase 6D).
