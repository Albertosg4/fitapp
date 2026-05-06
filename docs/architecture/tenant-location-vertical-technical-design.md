# Fase 6B · Diseño técnico tenant/location/vertical (documental)

## Propósito

Traducir la visión conceptual de Fase 6A a un diseño técnico inicial, sin aplicar cambios en base de datos, aplicación o infraestructura.

## Decisión técnica recomendada (dirección progresiva)

Se recomienda explícitamente una evolución progresiva (alineada con Opción B):

- **tenant** = empresa/cuenta cliente.
- **location** = sede/local/unidad operativa.
- **vertical** = sector de negocio del tenant o, si se requiere granularidad adicional, de la sede.
- **`gym_id` actual** se mantiene temporalmente como scope operativo heredado.

## Estado del modelo actual y continuidad

- `public.gimnasios` puede evolucionar conceptualmente hacia el rol de `locations`.
- **No se renombra `gimnasios` en esta fase**.
- **`tenant_id` no se añade todavía en 6B**; en esta fase solo se diseña la dirección.

## Estrategia de evolución recomendada

1. Añadir `tenants` en una fase futura.
2. Relacionar `gimnasios`/locations con `tenant_id`.
3. Añadir configuración de vertical (por tenant y/o por location).
4. Mantener `gym_id` durante la transición para compatibilidad.
5. Valorar rename a `location_id` solo en una fase mayor.

## Diagrama textual de referencia

```text
platform
  tenant
    location
      services
      schedules
      sessions/slots
      bookings
      payments
      attendance/check-ins
```

## Principio de ejecución por fases

**No refactor gigante. Evolución progresiva y reversible.**

## Alcance explícito de esta fase

- Solo documentación de arquitectura.
- Sin SQL ejecutable.
- Sin migraciones.
- Sin RLS/constraints.
- Sin cambios de código en app, API o UI.
