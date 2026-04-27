# 04 · Plan de fases desde estado actual

## Fase 3B-1 · Arreglar UI reservas
- **Objetivo:** eliminar doble clic y clarificar CTA “Reservar” vs “Cancelar”.
- **Archivos probables:** `app/socio/page.tsx`, `features/socio/hooks/useSocioData.ts`, `features/socio/components/SocioClasesTab.tsx`.
- **SQL:** **No**.
- **Riesgo:** Medio.
- **Pruebas manuales:** reservar, cancelar, re-reservar, latencia simulada, error de red, clase llena.
- **Rollback:** revertir commit UI; sin impacto en datos.

## Fase 3B-2 · Corregir filtros `gym_id` en admin
- **Objetivo:** asegurar aislamiento por gimnasio en todas las lecturas admin (aunque haya RLS).
- **Archivos probables:** `features/admin/hooks/useAdminData.ts`, tabs admin con queries cliente.
- **SQL:** **No**.
- **Riesgo:** Alto.
- **Pruebas manuales:** validar métricas/socios/horarios con cuentas de gimnasios distintos.
- **Rollback:** revertir cambios de query y volver al comportamiento anterior.

## Fase 3C · Mover escrituras admin a APIs protegidas
- **Objetivo:** eliminar writes sensibles desde cliente y centralizar reglas en server (`requireAdmin`).
- **Archivos probables:** nuevos `app/api/admin/*`, `features/admin/components/*`, `features/admin/hooks/useAdminData.ts`.
- **SQL:** **No** (salvo ajustes mínimos no destructivos opcionales).
- **Riesgo:** Alto.
- **Pruebas manuales:** alta socio, activar/desactivar, crear/editar actividad/horario/sesión puntual, pagos manuales.
- **Rollback:** mantener endpoints antiguos y feature-flag temporal o revert de commits.

## Fase 3D · Limpiar RLS/policies
- **Objetivo:** dejar una política única y coherente con la arquitectura final (server APIs + lecturas controladas).
- **Archivos probables:** `supabase/fase3_seguridad.sql` (o nuevo script consolidado), `supabase/*verificacion*.sql`, docs.
- **SQL:** **Sí** (controlado y con backup previo).
- **Riesgo:** Crítico.
- **Pruebas manuales:** smoke multi-rol, multi-gym, lecturas y escrituras críticas, ejecución de queries de verificación.
- **Rollback:** script explícito + restauración punto de recuperación de Supabase.

## Fase 3E · Pruebas multi-gimnasio
- **Objetivo:** certificar aislamiento entre gimnasios en todos los flujos.
- **Archivos probables:** docs de QA, posibles fixtures/scripts de prueba.
- **SQL:** **No** (solo consultas de auditoría si hace falta).
- **Riesgo:** Medio.
- **Pruebas manuales:** matriz admin/socio A vs admin/socio B en reservas, pagos, perfiles, métricas, check-in.
- **Rollback:** no aplica (fase de validación).

## Fase 3F · Limpieza legacy
- **Objetivo:** retirar restos de `clases` legacy y simplificar dominio a modelo profesional.
- **Archivos probables:** `types/domain.ts`, componentes legacy admin/socio, migraciones de deprecación.
- **SQL:** **Posible sí** (si se depreca estructura legacy en BD).
- **Riesgo:** Medio.
- **Pruebas manuales:** regresión completa de clases, reservas, check-in e historial.
- **Rollback:** mantener compatibilidad temporal y revertir migración deprecatoria.

## Fase 4 · Stripe y pagos finales
- **Objetivo:** cerrar el circuito de pagos online y conciliación con pagos manuales.
- **Archivos probables:** `app/api/stripe/*`, `app/api/pagos/*`, componentes pagos socio/admin.
- **SQL:** **No** (normalmente).
- **Riesgo:** Alto.
- **Pruebas manuales:** pagos ok/cancel, webhook duplicado, renovación de membresía, consistencia de historial.
- **Rollback:** desactivar checkout desde UI y mantener pago manual.

## Fase 5 · QA final y deploy estable
- **Objetivo:** congelar release candidato, ejecutar checklist completo y desplegar versión estable.
- **Archivos probables:** `docs/05_RUNBOOK_TESTS.md`, notas de release, ajustes mínimos detectados en QA.
- **SQL:** **No** (salvo hotfix controlado).
- **Riesgo:** Medio.
- **Pruebas manuales:** runbook completo end-to-end, verificación de logs y monitoreo post-deploy.
- **Rollback:** redeploy del build estable anterior + revert de commits de release.
