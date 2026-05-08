# Roadmap de implementación tenant/location/vertical (bloques grandes y seguros)

## Principio general

Priorizar cambios de alto impacto funcional con **baja superficie de riesgo estructural** al inicio.

## Fase 6D — Preparar capa de labels por vertical ✅ Implementada

- **Objetivo**: diseñar/configurar foundation de labels por vertical sin cambiar flujos.
- **Alcance**: diccionario base de términos UI (gym/clinic/academy/beauty) con default gym.
- **Fuera de alcance**: schema, RLS, migraciones, SQL live.
- **Riesgo**: bajo/medio.
- **Validación esperada**: app se comporta igual en gym; textos centralizados sin romper rutas ni permisos.

## Fase 6E — Inventario técnico automatizado o helpers de dominio

- **Objetivo**: preparar utilidades/abstracciones para labels y dominio.
- **Alcance**: helpers de resolución de labels y convenciones de naming semántico.
- **Fuera de alcance**: cambios de datos o permisos.
- **Riesgo**: bajo.
- **Validación esperada**: cobertura de labels consistente; cero cambios de comportamiento en datos.

## Fase 6F — Diseño SQL real para tenants/location

- **Objetivo**: preparar SQL manual, rollback y verificación.
- **Alcance**: diseño técnico ejecutable documentado (sin ejecutar todavía).
- **Fuera de alcance**: aplicación en Supabase live.
- **Riesgo**: bajo.
- **Validación esperada**: scripts revisables, rollback claro y checklist pre/post.

## Fase 6G — Hardening de resolución de vertical ✅ Implementada/en curso

- **Objetivo**: endurecer la resolución de vertical con fallback seguro antes de settings reales.
- **Alcance**: `BUSINESS_VERTICALS`, `isBusinessVertical()`, `resolveBusinessVertical()` y uso seguro en helpers activos.
- **Fuera de alcance**: Supabase, persistencia, query params, env, localStorage.
- **Riesgo**: bajo.
- **Validación esperada**: `gym` sigue como default; valores inválidos caen a fallback seguro; sin cambios funcionales.

## Fase 6H — Vertical settings contract ✅ Implementada/en curso

- **Objetivo**: establecer contrato tipado de settings verticales con fallback seguro.
- **Alcance**: feature flags por vertical, composición de settings efectivos y defaults seguros.
- **Fuera de alcance**: Supabase, persistencia, SQL, schema, RLS, Auth, Stripe, APIs y rutas.
- **Riesgo**: bajo.
- **Validación esperada**: `gym` sigue como default, sin cambios funcionales y sin lecturas externas.

## Fase 5G — NOT NULL (diferida)

- **Estado**: sigue después, solo cuando se confirme scope definitivo.
- **Objetivo**: endurecimiento estructural final sobre columnas objetivo.
- **Condición previa**: arquitectura tenant/location ya consolidada y validada.


### Estado de avance 2026-05-06

- Fase 6D implementada/en curso con foundation de labels por vertical.
- Sin cambios de schema.
- Sin lectura de vertical desde Supabase.


## Estado 6E
- Implementada/en curso: expansión de labels visibles en UI de bajo riesgo.
- Sin cambios de schema.
- Sin cambios en Supabase.

## Estado 6F
- Implementada/en curso: helper de vertical activa en dominio (`getActiveBusinessVertical` + `getActiveVerticalLabels`).
- Sin lectura de vertical desde Supabase.
- Sin persistencia de vertical en esta fase.
- `gym` se mantiene como default efectivo.


## Estado 6G
- Implementada/en curso: hardening de resolución de vertical en dominio.
- Fallback seguro activo hacia `DEFAULT_VERTICAL` (`gym`).
- Sin Supabase y sin persistencia en esta fase.


## Estado 6H
- Implementada/en curso: contrato de vertical settings y feature flags por vertical.
- Sin Supabase en esta fase.
- Sin persistencia en esta fase.
- `gym` se mantiene como default efectivo.


## Fase 6I — Active vertical settings helper ✅ Implementada/en curso

- **Objetivo**: centralizar settings verticales activos para consumo UI con fallback seguro.
- **Alcance**: `getActiveVerticalSettings()` y migración de UI cubierta a `settings.labels`.
- **Fuera de alcance**: Supabase, persistencia, SQL, schema, RLS, Auth, Stripe, APIs y rutas.
- **Riesgo**: bajo.
- **Validación esperada**: `gym` sigue como default, sin cambios funcionales y sin lecturas externas.

## Estado 6I
- Implementada/en curso: helper de active vertical settings + UI cubierta consume `settings.labels`.
- Sin Supabase en esta fase.
- Sin persistencia en esta fase.
- `gym` se mantiene como default efectivo.

## Fase 7A — Vertical preview mode ✅ Implementada/en curso

- Provider client-side de vertical preview.
- Selector demo en admin.
- `localStorage` solo para estado de preview UI.
- Sin Supabase.
- Sin persistencia real tenant/location.

## Fase 7B — Vertical feature preview flags ✅ Implementada/en curso

- `settings.features` aplicados en UI preview no crítica.
- Sin Supabase.
- Sin persistencia real.
- Sin cambios de seguridad/permisos.

## Estado Fase 7C (implementada)
- Commercial demo profiles por vertical.
- Hero comercial por vertical.
- Capability cards de preview visual.
- Copy socio ligero por vertical.
- Sin Supabase y sin persistencia real.

## Estado Fase 7D (implementada/en curso)

- Página pública `/demo`.
- Experiencia online demo por vertical.
- Sin Auth.
- Sin Supabase.
- Sin datos reales.
- Sin credenciales demo reales todavía.

## Fase 7E — Focused vertical demo pages

- Focused vertical demo pages.
- Enlaces comerciales por sector.
- Sin Supabase.
- Sin Auth.
- Sin datos reales.


## Fase 7F — interactive demo simulator

- Interactive demo simulator por vertical.
- Mock data local.
- Sin Supabase/Auth/datos reales.
- Base previa a cuentas demo reales.
