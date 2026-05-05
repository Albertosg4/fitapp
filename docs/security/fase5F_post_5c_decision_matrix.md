# Fase 5F — Matriz de decisión post-5C

| Línea | Cuándo hacerla | Precondiciones | Riesgo | Rollback/plan de seguridad | Notas |
|---|---|---|---|---|---|
| **A) Fase 5G — NOT NULL gym_id** | Después de 5F con checks consistentes. | `0` mismatches + `0` nulos en columnas objetivo. | Medio (impacto estructural). | PR separado con ventana controlada y script rollback. | Candidatas: `perfiles.gym_id`, `pagos.gym_id`, `sesiones.gym_id`, `asistencia.gym_id`, `actividades.gym_id`, `horarios_clase.gym_id`, `clases.gym_id` (solo si aplica). Orden recomendado: perfiles/pagos → actividades/horarios → sesiones/asistencia → clases (si sigue viva). |
| **B) Fase 5H — limpieza opcional de datos demo multi-gym** | Solo con decisión explícita de producto/operación. | Backup/export previo y confirmación de qué conservar. | Medio (riesgo de borrar entorno de prueba útil). | Ejecutar por lotes; mantener IDs y snapshots para restauración. | Toca datos demo en tablas de dominio; **no** tocar datos productivos reales. Auth demo se borra manualmente desde Dashboard/Auth si procede. |
| **C) Fase QR — rotación QR y rate-limit distribuido** | Tras cerrar base de datos crítica. | Revisión de diseño y observabilidad. | Medio-Alto (seguridad + UX). | Despliegue gradual con métricas y fallback. | Evaluar Redis/Upstash o tabla de rate-limit persistente/distribuida para sustituir memoria local. |
| **D) Fase índices — limpieza de índices duplicados** | Solo después de inventario 5F. | Confirmar duplicados funcionales con EXPLAIN/uso real. | Medio (riesgo de degradación por borrado erróneo). | PR dedicado con drop selectivo + rollback claro. | No borrar por nombre; comparar definición y uso primero. |
| **E) Tenant settings / multi-sector** | Futuro, no ahora. | Base de seguridad cerrada + decisiones de producto multi-tenant. | Alto (impacto transversal). | Diseño por etapas y migración controlada. | Mantener diferido intencionalmente tras cierre técnico post-5C. |

## Recomendación explícita de secuencia
1. Fase 5F ya ejecutada/validada: mantener baseline documentada.
2. Siguiente recomendado: Fase 5G (NOT NULL de `gym_id`) empezando por tablas con mayor seguridad y rollback claro.
3. No limpiar demo multi-gym todavía salvo decisión explícita.
4. No tocar índices duplicados todavía sin fase separada dedicada.
5. Luego abordar QR/rate-limit distribuido y dejar multi-sector para más adelante.
