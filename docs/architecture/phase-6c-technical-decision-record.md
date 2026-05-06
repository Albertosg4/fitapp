# ADR / Fase 6C — Decisión técnica tenant/location/vertical

## Estado

**Accepted / Aceptada como dirección técnica inicial**.

## Decisión

Se adopta un camino progresivo tipo **Opción B**:

- `tenant` será empresa/cuenta cliente.
- `location` será sede/local/unidad operativa.
- `vertical` será configuración de sector.
- `gym_id` se mantiene como scope técnico actual.
- `public.gimnasios` evolucionará conceptualmente hacia `locations`.

## Decisiones explícitas de esta fase

- No refactor gigante.
- No renombrar `gym_id` ahora.
- No añadir `tenant_id` en esta PR.
- No aplicar 5G todavía.
- No mover UI a multi-sector hasta tener capa de labels.

## Consecuencias

### Positivas

- Menos riesgo inmediato.
- Más compatibilidad con producción actual.
- Menor probabilidad de regresiones por cambios estructurales prematuros.

### Costes / trade-offs

- Más deuda semántica temporal (nombres legacy en internals).
- Necesidad de fases posteriores explícitas para schema, API, UI y RLS.
- La transición tenant/location requiere diseño SQL/rollback antes de ejecución.

## Justificación resumida

El inventario real del repo confirma acoplamiento transversal alto en torno a `gym_id` y `gimnasios` (schema, policies, API y parte de UI). La vía más segura es evolucionar por capas, empezando por abstracción semántica (labels verticales) antes de tocar base de datos.
