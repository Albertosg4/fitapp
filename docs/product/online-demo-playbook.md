# Online demo playbook

## Guía rápida

La demo online permite enseñar FITAPP por vertical sin tocar datos reales ni entregar credenciales reales en esta fase.

## Qué enseñar por vertical

- **Gym**: socios, clases, reservas, pagos y check-in QR.
- **Clinic**: pacientes, tratamientos, citas, pagos y visitas.
- **Academy**: alumnos, cursos, inscripciones, pagos y asistencia.
- **Beauty**: clientes, servicios, citas y pagos.
- **Generic**: clientes, servicios, reservas y pagos con base flexible.

## Qué puede probar un posible cliente

- Experiencia visual por vertical.
- Mensajería y lenguaje del sector.
- Flujos principales de admin y usuario final (a nivel demo).
- Cobertura funcional visible de reservas/citas, pagos y check-in cuando aplica.

## Qué NO debe hacerse todavía

- No compartir credenciales reales.
- No crear usuarios reales para “demo pública”.
- No mezclar datos reales con entornos demo.
- No presentar esta fase como multi-tenant completo.

## Plantilla de mensaje para cliente

> Hola, te paso la demo online de FITAPP para que puedas ver cómo funcionaría adaptada a [sector]. En esta fase puedes revisar la experiencia visual y flujos principales. Las credenciales demo controladas se habilitarán en una fase separada.

## Checklist antes de enviar demo

- `/demo` carga correctamente.
- Vertical seleccionada correcta para el cliente.
- No hay datos reales sensibles visibles.
- No hay credenciales reales publicadas.
- `admin` / `socio` siguen funcionando.

## Qué enlace enviar según cliente

| Cliente | Enlace |
|---|---|
| Gimnasio | `/demo/gimnasio` |
| Clínica | `/demo/clinica` |
| Academia | `/demo/academia` |
| Peluquería/estética | `/demo/peluqueria` |
| Otro negocio | `/demo/generico` |
| Discovery general | `/demo` |

- No enviar `/demo` general a un cliente que espera una propuesta específica salvo que se quiera enseñar la visión multi-sector.
