# 03 · Riesgos y deuda técnica

## Crítico
### 1) Divergencia RLS/policies entre lo documentado y lo desplegado
- **Descripción:** hay scripts de políticas faseadas y también indicios de policies antiguas activas.
- **Impacto:** riesgo de fuga de datos multi-gym o bloqueo accidental de operaciones críticas.
- **Dónde está:** `supabase/fase3_seguridad.sql`, `supabase/fase3_verificacion.sql`, entorno Supabase real.
- **Fase recomendada:** **Fase 3D** (limpieza y normalización definitiva RLS/policies).

## Alto
### 2) Escrituras admin aún desde cliente Supabase
- **Descripción:** varias acciones admin siguen escribiendo directo desde frontend en vez de API protegida.
- **Impacto:** dependencia fuerte de RLS; mayor superficie de error/abuso si policies no están perfectas.
- **Dónde está:** `features/admin/components/*.tsx`, `features/admin/hooks/useAdminData.ts`.
- **Fase recomendada:** **Fase 3C**.

### 3) Filtros `gym_id` incompletos en lecturas admin
- **Descripción:** ciertas consultas admin no filtran explícitamente por gimnasio en cliente.
- **Impacto:** si RLS falla o está inconsistente, puede haber mezcla de datos entre gimnasios.
- **Dónde está:** especialmente `useAdminData.loadSocios()` y métricas de `sesiones/perfiles`.
- **Fase recomendada:** **Fase 3B-2**.

## Medio
### 4) UX de reservas confusa (doble clic / estado acción)
- **Descripción:** el usuario puede no percibir claramente si va a reservar o cancelar.
- **Impacto:** fricción operativa, tickets de soporte, sensación de error aunque la BD quede consistente.
- **Dónde está:** modal de reservas en `app/socio/page.tsx`, interacción `useSocioData.reservar`.
- **Fase recomendada:** **Fase 3B-1**.

### 5) Convivencia prolongada de modelo legacy y modelo nuevo
- **Descripción:** existen trazas de `clases` legacy mientras se usa `actividades/horarios/sesiones`.
- **Impacto:** complejidad mental, riesgo de regresiones y consultas mezcladas.
- **Dónde está:** `types/domain.ts`, componentes admin legacy, migraciones.
- **Fase recomendada:** **Fase 3F**.

## Bajo
### 6) Cobertura de pruebas manuales no formalizada en un runbook único
- **Descripción:** hay validaciones dispersas, pero no un checklist unificado de regresión integral.
- **Impacto:** mayor probabilidad de omitir verificaciones antes de despliegues.
- **Dónde está:** ausencia de runbook versionado.
- **Fase recomendada:** **Fase 5** (QA final y estabilización).
