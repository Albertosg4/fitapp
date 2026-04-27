# 05 · Runbook de Tests

> Checklist manual actualizado tras completar 3B y 3C (hasta 3C-4).

## 1) Reservas socio

| Caso | Resultado esperado | Estado |
|---|---|---|
| Reservar clase | Reserva confirmada y feedback correcto | |
| Cancelar reserva | Reserva cancelada y feedback correcto | |
| Ocupación sube al reservar | Contador +1 consistente | |
| Ocupación baja al cancelar | Contador -1 consistente | |
| Doble clic bloqueado | No duplica acción ni deja estado inconsistente | |

## 2) Admin actividades

| Caso | Resultado esperado | Estado |
|---|---|---|
| Crear actividad | Se crea correctamente vía API protegida | |
| Desactivar actividad | Cambia estado a inactiva | |
| Reactivar actividad | Vuelve a estado activa | |

## 3) Admin horarios

| Caso | Resultado esperado | Estado |
|---|---|---|
| Crear horario | Se crea correctamente vía API protegida | |
| Desactivar horario | Cambia estado a inactivo | |
| Reactivar horario | Vuelve a estado activo | |

## 4) Admin clases puntuales

| Caso | Resultado esperado | Estado |
|---|---|---|
| Crear clase puntual con actividad | Alta correcta | |
| Cancelar clase puntual | Estado cancelado | |
| Reactivar clase puntual | Estado activo nuevamente | |
| Crear sin actividad | Bloqueo esperado con mensaje de validación | |

## 5) Admin socios / membresías

| Caso | Resultado esperado | Estado |
|---|---|---|
| Dar de baja socio | `membresia_activa=false`, sin cambio de vencimiento | |
| Reactivar socio | `membresia_activa=true`, sin cambio de vencimiento | |
| Pago pagado | Renueva vencimiento | |
| Cortesía | Renueva vencimiento | |
| Pago pendiente | No renueva hasta confirmar | |
| Confirmar pendiente | Sí renueva al confirmar | |
| Modal de pago | Actualiza fecha de vencimiento sin cerrar modal | |
| Alta de socio | Crea vencimiento inicial | |

## 6) Validaciones técnicas

| Check | Resultado esperado | Estado |
|---|---|---|
| `npm run lint` | OK | |
| `npm run build` | OK | |
| Producción (`https://fitapp-neon.vercel.app`) | OK | |
