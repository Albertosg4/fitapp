-- Fase 5F — Inventario de índices post-5C (SOLO LECTURA)
-- Objetivo: listar índices existentes en tablas principales y apoyar revisión manual.
-- No borrar índices en esta fase.

-- Inventario detallado
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'perfiles', 'pagos', 'reservas', 'sesiones', 'asistencia',
    'gimnasios', 'clases', 'actividades', 'horarios_clase'
  )
ORDER BY tablename, indexname;

-- Agrupación por definición normalizada (heurística para detectar sospechosos)
WITH idx AS (
  SELECT
    schemaname,
    tablename,
    indexname,
    regexp_replace(indexdef, 'INDEX\s+[^\s]+\s+ON\s+', 'INDEX <name> ON ') AS normalized_indexdef
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND tablename IN (
      'perfiles', 'pagos', 'reservas', 'sesiones', 'asistencia',
      'gimnasios', 'clases', 'actividades', 'horarios_clase'
    )
)
SELECT
  schemaname,
  tablename,
  normalized_indexdef,
  COUNT(*)::int AS indexes_with_same_normalized_def,
  string_agg(indexname, ', ' ORDER BY indexname) AS index_names
FROM idx
GROUP BY schemaname, tablename, normalized_indexdef
HAVING COUNT(*) > 1
ORDER BY tablename, indexes_with_same_normalized_def DESC;

-- Nota:
-- Esta detección es orientativa (normalización textual), no prueba inequívoca de duplicado funcional.
-- Cualquier limpieza de índices debe hacerse en PR/fase separada con análisis de uso/EXPLAIN.
