# Fase 6B · Estrategia de migración de gym a location (documental)

## Objetivo

Definir una estrategia de transición de lenguaje y modelo evitando riesgos operativos y deuda técnica innecesaria.

## Estrategia por horizontes

### Fase corta

- Mantener nombres de DB actuales (`gym_id`, `gimnasios`).
- Abstraer progresivamente en documentación y producto hacia términos de location/sede.

### Fase media

- Introducir tenant/location por encima del modelo actual.
- Añadir semántica multi-negocio sin romper el scope operativo actual.

### Fase larga

- Valorar rename real a `location_id` / `locations` en una fase mayor, planificada y reversible.

## Por qué no renombrar ahora

Renombrar en esta etapa tiene impacto alto y transversal en:

- RLS.
- APIs.
- Frontend.
- SQL histórico y scripts operativos.
- Documentación técnica y funcional.
- Datos existentes y compatibilidad.

Conclusión: riesgo alto con valor inmediato bajo.

## Reglas de transición

- No romper datos existentes.
- Mantener compatibilidad con JGS.
- Todo cambio de schema debe incluir rollback explícito.
- Cualquier RLS tenant/location debe hacerse en fase separada.

## Tabla de decisión

| Decisión | Estado recomendado |
|---|---|
| Mantener `gym_id` temporalmente | Recomendado ahora |
| Añadir `tenant_id` progresivamente | Recomendado futuro |
| Renombrar `gym_id` a `location_id` | Diferir |

## Decisión marco

No refactor gigante. Evolución progresiva y reversible.
