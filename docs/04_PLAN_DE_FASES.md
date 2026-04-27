# 04 · Plan de Fases

## Estado actualizado

### Completadas

- ✅ 3B-1 — Reservas socio
- ✅ 3B-2 — Lecturas admin por `gym_id`
- ✅ 3C-1 — Actividades admin vía API protegida
- ✅ 3C-2 — Horarios admin vía API protegida
- ✅ 3C-3 — Clases puntuales admin vía API protegida
- ✅ 3C-4 — Socios/membresías vía API protegida + vencimientos unificados

## Siguiente fase recomendada

### 3C-5 — Auditoría de escrituras directas restantes

**Objetivo:** mapear escrituras aún no migradas y priorizar cierre.

**Búsquedas obligatorias en todo el repo:**

- `.insert(`
- `.update(`
- `.delete(`
- `.upsert(`

**Foco principal:**

- componentes cliente
- hooks
- utilidades invocadas desde cliente

**Entregable de la fase:**

- mapa de escrituras restantes (archivo, operación, tabla, criticidad, propuesta de migración)

**Regla de alcance:**

- no modificar todavía salvo hallazgos pequeños, seguros y muy acotados

## Secuencia posterior

- 3D — Auditoría y limpieza RLS/policies
- 3E — Pruebas multi-gimnasio
- 3F — Limpieza legacy
- 4 — Stripe completo
- 5 — QA final
