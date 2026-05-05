# Glosario de dominio: gimnasio actual -> modelo genérico

| Dominio actual (gym) | Dominio genérico futuro | Nota |
|---|---|---|
| gimnasio | sede / location / negocio (según contexto) | `gimnasio` puede representar entidad operativa o marca según el flujo |
| socio | cliente / persona / paciente / alumno (según vertical) | La semántica cambia por vertical |
| actividad | servicio | Actividad deportiva, tratamiento, clase o servicio comercial |
| horario_clase | horario recurrente | Plantilla de agenda |
| sesion | sesión / slot / cita materializada | Instancia concreta en fecha/hora |
| reserva | booking / cita / reserva / inscripción | Dependiendo del vertical |
| asistencia | asistencia / check-in / visita | Puede o no aplicar según servicio |
| pago | pago | Concepto transversal |
| admin | operador / administrador del tenant o sede | Rol operativo interno |

## Regla de documentación

Los nombres actuales pueden mantenerse en base de datos a corto plazo, pero toda documentación nueva orientada al futuro multi-negocio debe expresarse en términos genéricos cuando describa arquitectura objetivo.
