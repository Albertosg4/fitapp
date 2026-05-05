# FITAPP multi-business vision (Fase 6A)

## Contexto

FITAPP evoluciona formalmente de una app centrada en gimnasio (JGS Fight Team) a una plataforma SaaS multi-negocio, multi-sede y configurable por vertical.

JGS Fight Team se mantiene como primer caso de uso validado en producción, pero deja de ser el límite conceptual del producto.

## Verticales objetivo

- `gym`
- `clinic`
- `academy`
- `beauty`
- `generic`

## Producto base común

El núcleo funcional de FITAPP debe modelarse como capacidades transversales para negocios basados en clientes, servicios y agenda:

- Gestión de clientes/personas.
- Gestión de servicios/actividades.
- Gestión de horarios.
- Gestión de reservas/citas/inscripciones.
- Gestión de pagos.
- Gestión de asistencia/check-in cuando aplique.
- Operación multi-sede.

## Ejemplos por vertical

- Gimnasio: socio + clase + reserva.
- Clínica: paciente + tratamiento + cita.
- Academia: alumno + clase/curso + inscripción.
- Peluquería/estética: cliente + servicio + cita.

## Principio de diseño de producto

A partir de Fase 6A, la documentación y las decisiones de arquitectura deben evitar acoplar FITAPP, tanto en lenguaje como en funcionalidad, a un único vertical (gimnasio).

La meta es consolidar un core reutilizable y extender particularidades por vertical sin romper la base común.
