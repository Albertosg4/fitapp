# Fase 6C ampliada · Inventario de impacto real + decisión técnica + plan seguro

## Resumen ejecutivo

Esta Fase 6C amplía el trabajo previsto originalmente para pasar de un simple inventario a un paquete completo de decisión:

1. Inventario real de acoplamientos en repo (terminología, schema, APIs, UI y documentación).
2. Decisión técnica explícita para la evolución tenant/location/vertical.
3. Plan de ejecución por fases grandes pero seguras.

Esta fase es **documentación-only** y **no aplica cambios de runtime, Supabase, SQL, RLS o código funcional**.

## Contexto de la fase

- 6A definió la visión multi-negocio.
- 6B definió diseño técnico inicial tenant/location/vertical.
- 6C consolida evidencia del repo y fija dirección de ejecución para evitar decisiones prematuras de schema.

## Inventario de impacto (evidencia real del repo)

> Base del inventario: búsquedas `rg` sobre términos obligatorios (`gym_id`, `gimnasios`, `socio/cliente/paciente/alumno`, `clase/actividad/servicio`, `reserva/cita/booking/inscripción`, `asistencia/check-in/QR`, `pagos/Stripe`, `JGS/FITAPP Demo Gym/gym2`).

### 1) Database / schema / Supabase SQL

- **Términos encontrados**: `gym_id`, `gimnasios`, `auth_gym_id`, `reservas`, `pagos`, `asistencia`, `actividades`, `horarios_clase`, `clases`.
- **Rutas representativas**:
  - `supabase/fase3_seguridad.sql`
  - `supabase/fase5C_A_rls_reservas_gym_scoped.sql`
  - `supabase/fase5C_B_rls_pagos_gym_scoped.sql`
  - `supabase/migrations/20250424_prepare_professional_class_model.sql`
- **Tipo de acoplamiento**: estructural (keys, filtros, relaciones y naming técnico centrado en `gym_id`/`gimnasios`).
- **Riesgo**: **alto**.
- **Recomendación**: **migrar después** (con diseño SQL separado, rollback y verificación; no en esta fase).

### 2) RLS / policies / RPC

- **Términos encontrados**: `auth_gym_id()`, `toggle_reserva`, policies gym-scoped, referencias a reservas/pagos/sesiones/asistencia.
- **Rutas representativas**:
  - `supabase/fase3_seguridad.sql`
  - `supabase/fase5B_rls_gym_scoped_sesiones_asistencia.sql`
  - `supabase/fase5C_A_rls_reservas_gym_scoped.sql`
  - `supabase/fase5C_B_rls_pagos_gym_scoped.sql`
- **Tipo de acoplamiento**: seguridad de acceso con scope actual `gym_id`.
- **Riesgo**: **alto**.
- **Recomendación**: **mantener** ahora; **revisar** tras diseño tenant/location definitivo.

### 3) APIs / server-side

- **Términos encontrados**: validaciones “otro gimnasio”, checks por `gym_id`, flujos de reservas/check-in/pagos.
- **Rutas representativas**:
  - `app/api/reservas/toggle/route.ts`
  - `app/api/checkin/route.ts`
  - `app/api/pagos/route.ts`
  - `app/api/admin/actividades/route.ts`
  - `app/api/stripe/webhook/route.ts`
- **Tipo de acoplamiento**: lógica de autorización y partición funcional por gimnasio.
- **Riesgo**: **medio-alto**.
- **Recomendación**: **abstraer** progresivamente por capa de dominio, sin renames masivos iniciales.

### 4) Frontend / UI labels

- **Términos encontrados**: “gym”, “socio”, “clases”, “Mi QR”, labels orientados a gimnasio.
- **Rutas representativas**:
  - `app/admin/page.tsx`
  - `app/socio/page.tsx`
  - `features/socio/components/SocioQRTab.tsx`
  - `features/admin/components/SociosTab.tsx`
  - `public/manifest.json`
- **Tipo de acoplamiento**: semántico/visual.
- **Riesgo**: **medio**.
- **Recomendación**: **abstraer** primero mediante foundation de labels por vertical.

### 5) Domain naming

- **Términos encontrados**: `socio`, `clase`, `gimnasio`, `booking`, equivalencias verticales en docs de arquitectura.
- **Rutas representativas**:
  - `types/domain.ts`
  - `docs/architecture/domain-glossary.md`
  - `docs/architecture/vertical-configuration-design.md`
- **Tipo de acoplamiento**: nomenclatura de dominio mixta (legacy gym + visión multi-vertical).
- **Riesgo**: **medio**.
- **Recomendación**: **mantener + abstraer** (no renombrar internals todavía).

### 6) Demo / seed / test data

- **Términos encontrados**: `JGS Fight Team`, `FITAPP Demo Gym 2`, `admin.demo.gym2`, `socio.demo.gym2`.
- **Rutas representativas**:
  - `supabase/fase5C_E_multigym_control_setup.sql`
  - `supabase/fase5C_E_multigym_control_verificacion.sql`
  - `docs/02_SUPABASE_ESTADO.md`
- **Tipo de acoplamiento**: fixtures explícitos centrados en naming gym/JGS.
- **Riesgo**: **bajo-medio**.
- **Recomendación**: **revisar** más adelante; mantener como referencia de aislamiento mientras no se migra modelo.

### 7) Documentation

- **Términos encontrados**: multi-gym, gym-scoped, referencias históricas a fases de hardening.
- **Rutas representativas**:
  - `docs/03_RIESGOS_Y_DEUDA.md`
  - `docs/04_PLAN_DE_FASES.md`
  - `docs/02_SUPABASE_ESTADO.md`
  - `docs/architecture/tenant-location-vertical-technical-design.md`
- **Tipo de acoplamiento**: narrativo/histórico, alineado al estado real de producción.
- **Riesgo**: **bajo**.
- **Recomendación**: **mantener** y seguir actualizando con fases progresivas.

## Conclusión de Fase 6C

- **No tocar `gym_id` todavía.**
- **No añadir `tenant_id` todavía.**
- **No renombrar `gimnasios` todavía.**
- Decisión recomendada: **evolución progresiva tenant/location/vertical** con compatibilidad controlada.
