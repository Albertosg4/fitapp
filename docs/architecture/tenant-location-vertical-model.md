# Modelo conceptual tenant/location/vertical (Fase 6A)

## Objetivo

Definir una dirección de arquitectura para soportar múltiples negocios y sedes, sin forzar en esta fase cambios de esquema o migraciones.

## Entidades conceptuales futuras

- **tenant**: empresa o cuenta cliente dentro de FITAPP.
- **location / sede**: local físico o unidad operativa del tenant.
- **vertical**: sector de negocio (`gym`, `clinic`, `academy`, `beauty`, `generic`).
- **user / profile**: usuario interno (staff/admin) o cliente final.
- **service**: actividad, servicio, tratamiento o clase.
- **slot / session**: sesión/cita materializada en agenda.
- **booking**: reserva, cita o inscripción.
- **payment**: pago.

## Estado actual (realidad técnica)

- `public.gimnasios` representa hoy, en la práctica, la sede/gimnasio operativo.
- `gym_id` representa hoy el scope operativo principal.
- `gym_id` debe tratarse en esta etapa como identificador técnico heredado de sede hasta decidir una migración/abstracción mayor.

## Decisión provisional de Fase 6A

- No renombrar `gym_id` todavía.
- No añadir `tenant_id` todavía.
- No aplicar endurecimiento `NOT NULL` todavía.
- Antes de tocar esquema, preparar una fase separada de diseño SQL con rollback explícito.

## Opciones de evolución consideradas

### Opción A

Mantener `gym_id` internamente como identificador técnico y abstraer en UI/documentación a términos genéricos de location/sede.

### Opción B

Añadir `tenant_id` por encima y mantener `gym_id` como identificador de sede/location.

### Opción C

Migrar/renombrar `gym_id` a `location_id` en una fase mayor con plan de transición completo.

## Recomendación de camino futuro

- Introducir el modelo tenant/location/vertical de forma progresiva.
- Mantener compatibilidad con los datos y flujos actuales.
- Evitar un refactor gigante de una sola vez.
- Priorizar decisiones reversibles por fase, con validación operativa y rollback.

## Ampliación de Fase 6B (diseño técnico inicial)

- Fase 6B amplía este modelo conceptual con un diseño técnico documental de tenant/location/vertical.
- Decisión recomendada: evolución progresiva tipo **Opción B**.
- No ejecutar cambios todavía: sin SQL, sin migraciones y sin cambios de código en esta fase.
