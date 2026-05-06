# Fase 6B · Diseño de configuración por vertical (documental)

## Objetivo

Diseñar cómo soportar varios sectores (verticales) sin programar una app distinta por sector.

## Verticales objetivo

- `gym`
- `clinic`
- `academy`
- `beauty`
- `generic`

## Configuración conceptual

### labels

- `customerLabel`
- `serviceLabel`
- `bookingLabel`
- `staffLabel`
- `locationLabel`

### features

- `attendanceEnabled`
- `qrCheckinEnabled`
- `paymentsEnabled`
- `capacityEnabled`
- `recurringScheduleEnabled`

## Ejemplos conceptuales

### gym

- `customerLabel` = socio
- `serviceLabel` = clase
- `bookingLabel` = reserva
- `staffLabel` = entrenador/profesor

### clinic

- `customerLabel` = paciente
- `serviceLabel` = tratamiento
- `bookingLabel` = cita
- `staffLabel` = profesional

### beauty

- `customerLabel` = cliente
- `serviceLabel` = servicio
- `bookingLabel` = cita
- `staffLabel` = profesional

## Principios de implementación futura

- Configuración por tenant (y potencialmente por location).
- Mantener un core funcional común.
- Evitar bifurcaciones de producto por vertical.

## Alcance de Fase 6B

- No se implementa todavía.
- No se toca UI.
- Esta fase solo diseña.
