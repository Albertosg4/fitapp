-- Fase 5F — Candidatos a NOT NULL (SOLO LECTURA)
-- No añade constraints. Solo audita nullabilidad real.

WITH candidates AS (
  SELECT 'public.perfiles'::text AS table_name, 'gym_id'::text AS column_name,
         (SELECT COUNT(*)::bigint FROM public.perfiles) AS total_rows,
         (SELECT COUNT(*)::bigint FROM public.perfiles WHERE gym_id IS NULL) AS null_rows
  UNION ALL
  SELECT 'public.pagos', 'gym_id',
         (SELECT COUNT(*)::bigint FROM public.pagos),
         (SELECT COUNT(*)::bigint FROM public.pagos WHERE gym_id IS NULL)
  UNION ALL
  SELECT 'public.sesiones', 'gym_id',
         (SELECT COUNT(*)::bigint FROM public.sesiones),
         (SELECT COUNT(*)::bigint FROM public.sesiones WHERE gym_id IS NULL)
  UNION ALL
  SELECT 'public.asistencia', 'gym_id',
         (SELECT COUNT(*)::bigint FROM public.asistencia),
         (SELECT COUNT(*)::bigint FROM public.asistencia WHERE gym_id IS NULL)
  UNION ALL
  SELECT 'public.actividades', 'gym_id',
         (SELECT COUNT(*)::bigint FROM public.actividades),
         (SELECT COUNT(*)::bigint FROM public.actividades WHERE gym_id IS NULL)
  UNION ALL
  SELECT 'public.horarios_clase', 'gym_id',
         (SELECT COUNT(*)::bigint FROM public.horarios_clase),
         (SELECT COUNT(*)::bigint FROM public.horarios_clase WHERE gym_id IS NULL)
  UNION ALL
  SELECT 'public.clases', 'gym_id',
         (SELECT COUNT(*)::bigint FROM public.clases),
         (SELECT COUNT(*)::bigint FROM public.clases WHERE gym_id IS NULL)
)
SELECT
  table_name,
  column_name,
  total_rows,
  null_rows,
  (total_rows - null_rows) AS non_null_rows,
  CASE
    WHEN null_rows = 0 AND total_rows > 0 THEN 'OK_CANDIDATO_NOT_NULL'
    WHEN null_rows = 0 AND total_rows = 0 THEN 'OK_CANDIDATO_NOT_NULL_TABLA_VACIA'
    ELSE 'NO_APTO_TODAVIA'
  END AS recommendation,
  CASE
    WHEN null_rows = 0 THEN 'Sin nulos detectados en la columna candidata.'
    ELSE 'Hay nulos: requiere saneo previo + plan de rollout/rollback en PR separado.'
  END AS notes
FROM candidates
ORDER BY table_name;

-- Sección final: resumen de preparación para futura Fase 5G
WITH base AS (
  SELECT
    table_name,
    CASE
      WHEN null_rows = 0 THEN true
      ELSE false
    END AS is_candidate
  FROM (
    SELECT 'public.perfiles'::text AS table_name,
           (SELECT COUNT(*)::bigint FROM public.perfiles WHERE gym_id IS NULL) AS null_rows
    UNION ALL SELECT 'public.pagos', (SELECT COUNT(*)::bigint FROM public.pagos WHERE gym_id IS NULL)
    UNION ALL SELECT 'public.sesiones', (SELECT COUNT(*)::bigint FROM public.sesiones WHERE gym_id IS NULL)
    UNION ALL SELECT 'public.asistencia', (SELECT COUNT(*)::bigint FROM public.asistencia WHERE gym_id IS NULL)
    UNION ALL SELECT 'public.actividades', (SELECT COUNT(*)::bigint FROM public.actividades WHERE gym_id IS NULL)
    UNION ALL SELECT 'public.horarios_clase', (SELECT COUNT(*)::bigint FROM public.horarios_clase WHERE gym_id IS NULL)
    UNION ALL SELECT 'public.clases', (SELECT COUNT(*)::bigint FROM public.clases WHERE gym_id IS NULL)
  ) s
)
SELECT
  'candidatas_reales_fase_5g' AS section,
  COALESCE(string_agg(table_name, ', ' ORDER BY table_name), '(ninguna)') AS tables,
  'Columnas con null_rows = 0. Aun así, cualquier NOT NULL requiere PR separado con rollback y ventana controlada.' AS notes
FROM base
WHERE is_candidate = true
UNION ALL
SELECT
  'no_tocar_aun' AS section,
  COALESCE(string_agg(table_name, ', ' ORDER BY table_name), '(ninguna)') AS tables,
  'Columnas con null_rows > 0: no aptas todavía para NOT NULL.' AS notes
FROM base
WHERE is_candidate = false;
