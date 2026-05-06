# Roadmap de implementación tenant/location/vertical (bloques grandes y seguros)

## Principio general

Priorizar cambios de alto impacto funcional con **baja superficie de riesgo estructural** al inicio.

## Fase 6D — Preparar capa de labels por vertical

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
- **Riesgo**: medio.
- **Validación esperada**: scripts revisables, rollback claro y checklist pre/post.

## Fase 6G — Aplicar tenants/location mínimo

- **Objetivo**: crear tenants y relacionar gimnasios con tenant_id, solo si 6F se aprueba.
- **Alcance**: despliegue controlado mínimo con rollback y validación.
- **Fuera de alcance**: renombrado masivo de variables/código interno.
- **Riesgo**: medio/alto.
- **Validación esperada**: aislamiento y compatibilidad existentes intactos; métricas de no-cruce en 0.

## Fase 6H — Labels UI por vertical

- **Objetivo**: activar labels visibles por vertical de forma progresiva.
- **Alcance**: textos visibles y copy contextual por vertical.
- **Fuera de alcance**: rename interno masivo (`gym_id`, tablas legacy).
- **Riesgo**: medio.
- **Validación esperada**: UX por vertical sin regresiones funcionales ni de seguridad.

## Fase 5G — NOT NULL (diferida)

- **Estado**: sigue después, solo cuando se confirme scope definitivo.
- **Objetivo**: endurecimiento estructural final sobre columnas objetivo.
- **Condición previa**: arquitectura tenant/location ya consolidada y validada.
