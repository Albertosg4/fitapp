# Fase 5F — Auditoría final post-5C

## Objetivo
Consolidar una auditoría técnica final post-5C para validar estado RLS, coherencia de `gym_id`, inventario demo multi-gym y revisión de índices antes de nuevos endurecimientos.

## Qué NO hace esta fase
- No aplica SQL de cambio (solo lectura).
- No modifica datos ni borra registros.
- No toca RLS/policies.
- No añade constraints.
- No toca Stripe.
- No toca checkout/webhooks.
- No toca Auth.
- No toca UI.
- No avanza `tenant_settings` ni multi-sector.

## Orden de ejecución
1. `supabase/fase5F_post_5c_final_audit.sql`
2. `supabase/fase5F_post_5c_not_null_candidates.sql`
3. `supabase/fase5F_post_5c_demo_data_inventory.sql`
4. `supabase/fase5F_post_5c_indexes_inventory.sql`

## Qué resultados pegar en ChatGPT
Pegar todas las salidas tabulares de las cuatro ejecuciones, especialmente:
- Mismatches y estado `OK/WARNING`.
- Candidatos `NOT NULL` con `null_rows`.
- Inventario demo con recomendación `KEEP_DEMO_DATA` / `CLEANUP_CANDIDATE`.
- Índices potencialmente duplicados (si aparecen en agrupación).

## Cómo interpretar resultados
- **OK**: condición esperada y sin hallazgos bloqueantes.
- **WARNING**: requiere revisión antes de endurecer, pero no bloquea operación diaria inmediata.
- **BLOCKER**: no avanzar a endurecimientos estructurales hasta corregir (por ejemplo, nulos críticos o inconsistencias de gym).

## Criterios para pasar a 5G
- `0` mismatches en checks de consistencia.
- `0` nulos en candidatos críticos de `gym_id`.
- Sin errores funcionales en app tras auditoría.
- Decisión explícita sobre conservar o limpiar datos demo multi-gym.

## Checklist funcional post-auditoría
- Admin JGS login.
- Panel admin.
- Pagos.
- Reservas/calendario.
- Socio JGS.
- Admin demo.
- Socio demo.

## Rollback
No aplica: esta fase es solo lectura.

## Fuera de alcance
- Stripe
- Auth
- checkout/webhooks
- tenant_settings
- multi-sector
- constraints
- limpieza demo


## Nota sobre `toggle_reserva` y firma con argumentos nombrados

- En algunos entornos, `pg_get_function_identity_arguments` devuelve la firma de `toggle_reserva` como `p_horario_id uuid, p_fecha date` (con nombres), no como `uuid, date`.
- Si `toggle_reserva` no aparece en la salida del bloque de helpers/RPC, usar la versión corregida de `supabase/fase5F_post_5c_final_audit.sql`, que valida tipos reales en `pg_proc` (`pronargs = 2` + `proargtypes = [uuid, date]`) y evita falsos positivos por nombres de argumentos.
- Esta corrección es **solo lectura** y no introduce DDL/DML.
