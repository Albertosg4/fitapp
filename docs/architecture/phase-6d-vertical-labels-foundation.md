# Fase 6D · Vertical labels foundation

## Objetivo

Fase 6D implementa una base de labels semánticos por vertical para empezar a desacoplar el lenguaje visible de FITAPP del vertical gimnasio sin introducir cambios de comportamiento.

## Qué incluye

- Foundation de labels tipados en `lib/domain/verticals.ts`.
- Verticales soportados inicialmente:
  - `gym`
  - `clinic`
  - `academy`
  - `beauty`
  - `generic`
- `gym` se mantiene como vertical por defecto (`DEFAULT_VERTICAL = 'gym'`).
- Helper seguro para resolver labels con fallback.
- Aplicación gradual en textos visibles de bajo riesgo.

## Qué NO incluye

- No hay persistencia de vertical en base de datos.
- No se lee vertical desde Supabase todavía.
- No hay SQL nuevo ni SQL preparado para ejecutar en esta fase.
- No hay cambios en schema, RLS, Auth, Stripe, webhooks o rutas.

## Tabla de labels principales por vertical

| Vertical | Cliente | Servicio | Reserva | Staff | Sede | Asistencia | Pago |
|---|---|---|---|---|---|---|---|
| gym | Socio / Socios | Clase / Clases | Reserva / Reservas | Profesor / Profesores | Gimnasio / Gimnasios | Asistencia | Pago / Pagos |
| clinic | Paciente / Pacientes | Tratamiento / Tratamientos | Cita / Citas | Profesional / Profesionales | Clínica / Clínicas | Visita | Pago / Pagos |
| academy | Alumno / Alumnos | Clase/curso / Clases/cursos | Inscripción / Inscripciones | Profesor / Profesores | Academia / Academias | Asistencia | Pago / Pagos |
| beauty | Cliente / Clientes | Servicio / Servicios | Cita / Citas | Profesional / Profesionales | Centro / Centros | Visita | Pago / Pagos |
| generic | Cliente / Clientes | Servicio / Servicios | Reserva / Reservas | Profesional / Profesionales | Sede / Sedes | Registro | Pago / Pagos |

## Estrategia de despliegue

Esta fase habilita una migración por etapas:

1. Centralizar labels con default gym.
2. Reemplazar textos visibles simples en puntos de bajo riesgo.
3. Expandir cobertura por fases posteriores sin refactor masivo.

## Checklist de aceptación

- [x] La app sigue funcionando igual para gym.
- [x] Labels centralizados en capa de dominio.
- [x] Sin cambios de schema.
- [x] Sin cambios de rutas.
- [x] Sin cambios de permisos.
