# Checklist de validacion comercial app gimnasio real

Esta checklist es para preparar y revisar una demo comercial de la app real de gimnasio. La idea es llegar a la reunion sin improvisar y sin enseñar partes internas que no hacen falta.

## Antes de enseñar la app

- [ ] Confirmar URL de produccion.
- [ ] Confirmar usuario admin que se va a usar.
- [ ] Confirmar usuario socio que se va a usar.
- [ ] Confirmar datos de prueba seguros: actividades, horarios, socio, pagos y QR.
- [ ] Probar en navegador desktop antes de la reunion.
- [ ] Probar en movil antes de la reunion.
- [ ] Tener claro que no se enseña Supabase.
- [ ] Tener claro que no se enseña GitHub.
- [ ] Tener claro que no se enseñan credenciales.
- [ ] Tener preparado que pagos reales pueden estar fuera de alcance si no se han validado.

## Demo admin

- [ ] Entrar como admin.
- [ ] Ver dashboard.
- [ ] Crear actividad.
- [ ] Crear horario.
- [ ] Crear clase puntual.
- [ ] Ver socios.
- [ ] Crear socio.
- [ ] Ver pagos.
- [ ] Salir.

## Demo socio

- [ ] Entrar como socio.
- [ ] Ver clases.
- [ ] Reservar clase.
- [ ] Cancelar reserva.
- [ ] Ver historial.
- [ ] Ver pagos.
- [ ] Ver perfil.
- [ ] Ver QR.
- [ ] Salir.

## Demo check-in

- [ ] Abrir `/checkin`.
- [ ] Escanear QR o introducir token segun el flujo existente.
- [ ] Validar acceso correcto.
- [ ] Validar duplicado si aplica.
- [ ] Validar mensaje si la membresia esta caducada o inactiva.

## Cosas que NO enseñar todavia

- [ ] Multi-sector real.
- [ ] Supabase.
- [ ] SQL.
- [ ] Stripe dashboard.
- [ ] Credenciales.
- [ ] Scripts de reset.
- [ ] Rutas internas si no estan listas.
- [ ] Datos reales de clientes que no formen parte de la demo acordada.

## Resultado de demo

| Punto | OK/ERROR | Comentario |
|---|---|---|
| Login admin |  |  |
| Dashboard admin |  |  |
| Crear actividad |  |  |
| Crear horario |  |  |
| Crear clase puntual |  |  |
| Ver socios |  |  |
| Crear socio |  |  |
| Ver pagos admin |  |  |
| Login socio |  |  |
| Ver clases socio |  |  |
| Reservar clase |  |  |
| Cancelar reserva |  |  |
| Ver historial |  |  |
| Ver pagos socio |  |  |
| Ver perfil |  |  |
| Ver QR |  |  |
| Check-in QR |  |  |
| Duplicado check-in |  |  |
| Logout admin/socio |  |  |
| Movil |  |  |
| Desktop |  |  |
| Comentarios del cliente |  |  |
