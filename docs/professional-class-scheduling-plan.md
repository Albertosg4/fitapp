# Plan: Modelo profesional de clases — JGS Fight Team

## Objetivo

Profesionalizar el sistema de clases pasando del modelo simple (`clases` con `dia_semana`) a un modelo que distinga entre:

- **Actividades**: qué es una clase (nombre, descripción, color).
- **Horarios recurrentes**: cuándo se repite semanalmente.
- **Sesiones**: instancias concretas de una clase en una fecha. Las reservas siempre van contra sesiones.

---

## Modelo objetivo

```
actividades
  id, gym_id, nombre, descripcion, color, activa

horarios_clase
  id, gym_id, actividad_id, dia_semana (0=Lun..6=Dom),
  hora_inicio, duracion_min, aforo_max, profesor,
  fecha_inicio, fecha_fin (null=sin fin), activo

sesiones
  id, clase_id (LEGACY FK a clases), horario_id, actividad_id,
  fecha (YYYY-MM-DD), hora_inicio, duracion_min, aforo_max,
  profesor, notas, estado (activa|cancelada), es_puntual

reservas  ← sin cambios, siempre apuntan a sesiones.id
```

### Regla clave
Las reservas **nunca** apuntan a `clases` ni a `horarios_clase`, siempre a `sesiones.id`.
Esto ya es así en el modelo actual y se mantiene.

---

## Por qué no se migra todo de golpe

1. **Riesgo de datos**: hay reservas existentes ligadas a `sesiones.clase_id`. Migrar sin contar exactamente cuántas sesiones hay y si tienen reservas activas puede romper historial y check-in.
2. **Complejidad de backfill**: para migrar `clases` → `actividades + horarios_clase` necesitamos saber qué sesiones de producción tienen reservas confirmadas futuras.
3. **El código actual funciona**: admin, socio, check-in y pagos funcionan correctamente con el modelo legacy. Romperlo sin red de seguridad no tiene sentido.

---

## Fases de implementación

### ✅ Fase A — Preparación (completada)
- Crear `lib/domain/fechas.ts` con helpers de fechas seguros.
- Actualizar `types/domain.ts` añadiendo nuevos tipos sin eliminar `Clase`.
- Parchear `CalendarioMes.tsx` y `ClasesTab.tsx` para usar helpers.
- Crear migración SQL no destructiva (`actividades`, `horarios_clase`, ampliar `sesiones`).
- Esta documentación.

### Fase B — Activar nuevo modelo en BD
**Prerequisito**: ejecutar SQL de inspección (ver abajo) y confirmar datos actuales.
1. Aplicar migración `20250424_prepare_professional_class_model.sql` en Supabase.
2. Crear actividades desde las clases existentes (backfill manual o script SQL).
3. Crear horarios_clase desde las clases existentes.
4. Vincular sesiones existentes a `horario_id` y `actividad_id` donde sea posible.

### Fase C — Admin nuevo
1. Añadir pestaña "Actividades" en admin.
2. Añadir pestaña "Horarios recurrentes" en admin.
3. Añadir pestaña "Clases puntuales" en admin.
4. Mantener pestaña "Clases (legacy)" hasta que el backfill esté validado.

### Fase D — Socio nuevo
1. Actualizar `useSocioData` para cargar sesiones por fecha en lugar de clases por `dia_semana`.
2. Las sesiones virtuales (horarios sin sesión materializada) se crean al reservar.
3. Sesiones canceladas no se muestran al socio.

### Fase E — Deprecar modelo legacy
1. Ocultar pestaña "Clases (legacy)" en admin.
2. Marcar `clase_id` en sesiones como nullable (ya lo es).
3. Documentar fecha de deprecación de la tabla `clases`.

---

## Checklist antes de aplicar la migración en Supabase

- [ ] Ejecutar SQL de inspección (ver sección siguiente).
- [ ] Confirmar que `sesiones.clase_id` tiene FK activa (o no).
- [ ] Confirmar que no hay sesiones con `clase_id = null` que tengan reservas.
- [ ] Hacer backup de Supabase (punto de restauración).
- [ ] Aplicar migración en entorno de staging si existe.
- [ ] Verificar que la migración no falla en el SQL editor de Supabase.
- [ ] Confirmar que `actividades` y `horarios_clase` se crean vacías.
- [ ] Confirmar que las columnas nuevas de `sesiones` existen con `\d sesiones`.

---

## SQL de inspección — ejecutar antes de Fase B

```sql
-- 1. Contar clases
SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE activa) AS activas
FROM clases;

-- 2. Estado de sesiones
SELECT COUNT(*) AS total,
       MIN(fecha) AS primera,
       MAX(fecha) AS ultima,
       COUNT(*) FILTER (WHERE clase_id IS NULL) AS sin_clase
FROM sesiones;

-- 3. Reservas activas en el futuro
SELECT COUNT(*) AS reservas_futuras_confirmadas
FROM reservas r
JOIN sesiones s ON s.id = r.sesion_id
WHERE r.estado = 'confirmada'
  AND s.fecha >= CURRENT_DATE;

-- 4. Clases con reservas futuras (las más críticas a preservar)
SELECT c.nombre, COUNT(r.id) AS reservas_futuras
FROM clases c
JOIN sesiones s ON s.clase_id = c.id
JOIN reservas r ON r.sesion_id = s.id
WHERE r.estado = 'confirmada' AND s.fecha >= CURRENT_DATE
GROUP BY c.id, c.nombre
ORDER BY reservas_futuras DESC;

-- 5. Verificar columnas actuales de sesiones
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'sesiones'
ORDER BY ordinal_position;
```

---

## Convenciones del proyecto

- `dia_semana`: lunes=0, martes=1, ..., domingo=6 (siempre)
- Fechas de calendario: usar `formatLocalDate()` de `lib/domain/fechas.ts`, nunca `toISOString().split('T')[0]`
- Timestamps técnicos en BD (no calendario): `toISOString()` es aceptable en server-side
- Las reservas siempre van contra `sesiones.id`, nunca contra clases ni horarios directamente
