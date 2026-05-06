# 04 · Plan de Fases

## Estado actualizado

### Completadas

- ✅ 3B-1 — Reservas socio
- ✅ 3B-2 — Lecturas admin por `gym_id`
- ✅ 3C-1 — Actividades admin vía API protegida
- ✅ 3C-2 — Horarios admin vía API protegida
- ✅ 3C-3 — Clases puntuales admin vía API protegida
- ✅ 3C-4 — Socios/membresías vía API protegida + vencimientos unificados
- ✅ 3C-5 — Auditoría de escrituras directas restantes (sin cambios)
- ✅ 3C-6A — Hardening mínimo de check-in QR
- ✅ 3C-6B — Auditoría de `/api/reservas/toggle` (sin cambios)
- ✅ Stripe-1 — Auditoría Stripe actual (sin cambios)
- ✅ Stripe-2 — Unificación Stripe con dominio de membresías
- ✅ 3D-1 — Auditoría live RLS/policies
- ✅ 3D-2A — Preparación limpieza RLS crítica (scripts)
- ✅ 3D-2B — Aplicación limpieza RLS crítica en Supabase live

## Siguiente bloque recomendado

- 3D-3 — Limpieza RLS secundaria
- 3E — Pruebas multi-gimnasio
- 3F — Limpieza legacy
- QA final

## Notas de alcance para siguientes fases

- No se recomienda seguir tocando RLS crítico fuera de una fase específica dedicada.
- No se recomienda tocar el fallback de reservas en esta etapa salvo fase específica futura.
- Stripe queda parcialmente cerrado en checkout/webhook; pendiente solo de pruebas end-to-end reales si aplica.

## Replanificación post-5F (2026-05-05)

- ✅ Estado cerrado hasta Fase 5F (auditoría final post-5C completada y validada).
- ✅ **Fase 6A** abierta: reenfoque documental multi-negocio (producto + arquitectura).
- ⏸️ **Fase 5G (`NOT NULL`) diferida** hasta decidir dirección tenant/location/vertical.
- 🚫 En esta fase no se toca SQL ni se ejecutan cambios de schema.

### Siguiente secuencia propuesta

1. **6A** — Documentación multi-negocio.
2. **6B** — Diseño técnico tenant/location/vertical.
3. **6C** — Inventario de impacto en schema/UI/API.
4. **6D** — Decisión de migración progresiva.
5. **5G** — `NOT NULL` solo si se confirma que `gym_id` mantiene scope correcto o se define transición explícita.

## Actualización Fase 6B (2026-05-05)

- ✅ **Fase 6A** documentación multi-negocio — completada.
- 🧭 **Fase 6B** diseño técnico tenant/location/vertical — actual.
- 📄 Fase 6B es **solo documental**.
- 🚫 Sin SQL.
- 🚫 Sin código.
- 🎯 Resultado esperado: decisión técnica inicial antes del inventario de impacto 6C.

### Secuencia vigente

1. **6A** documentación multi-negocio — completada.
2. **6B** diseño técnico tenant/location/vertical — actual.
3. **6C** inventario de impacto schema/UI/API.
4. **6D** decisión de migración progresiva.
5. **5G** `NOT NULL` solo después.


## Actualización Fase 6C (2026-05-06)

- ✅ **Fase 6A** (visión multi-negocio) completada.
- ✅ **Fase 6B** (diseño técnico tenant/location/vertical) completada.
- 🧭 **Fase 6C actual**: inventario de impacto + decisión técnica + roadmap de implementación segura.
- ▶️ **Fase 6D siguiente implementable segura**: foundation de labels por vertical.
- ⏸️ **Fase 5G (`NOT NULL`) se mantiene pausada** hasta consolidar scope tenant/location.

### Secuencia vigente (bloques grandes y seguros)

1. **6C** inventario + decisión + roadmap (actual).
2. **6D** labels foundation por vertical (siguiente).
3. **6E** helpers/abstracciones de dominio.
4. **6F** diseño SQL tenant/location (sin ejecutar).
5. **6G** aplicación mínima tenant/location (condicionada a 6F).
6. **6H** activación gradual de labels UI por vertical.
7. **5G** NOT NULL al final, con arquitectura ya estabilizada.


## Actualización Fase 6D (2026-05-06)

- ✅ **Fase 6D** implementada: foundation de labels verticales (`gym`, `clinic`, `academy`, `beauty`, `generic`).
- ✅ Implementación segura y progresiva en textos visibles de bajo riesgo.
- ✅ Sin SQL y sin cambios en Supabase.
- ✅ `gym` se mantiene como default.
- ▶️ Siguiente recomendado: aplicar labels gradualmente en más UI visible o preparar helper de vertical activa (sin persistencia todavía).
