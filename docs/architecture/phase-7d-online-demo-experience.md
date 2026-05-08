# Fase 7D — Online demo experience

## Objetivo

Implementar una experiencia de demo online compartible para discovery comercial de FITAPP por vertical, sin introducir todavía cuentas demo reales ni persistencia tenant/location.

## Enfoque

- Se añade una página pública `/demo` centrada en producto y flujos.
- La vertical se selecciona solo en cliente reutilizando el preview actual.
- El contenido explica qué se puede probar hoy y qué queda para fases siguientes.

## Qué habilita esta fase

- Presentación clara de FITAPP y sus verticales (`gym`, `clinic`, `academy`, `beauty`, `generic`).
- Guía de “qué probar” por vertical.
- Explicación de flujos (admin, usuario final, reservas/citas, pagos, QR/check-in cuando aplica).
- Mensajes de seguridad para evitar confusión con producción.

## Qué NO hace esta fase

- No crea usuarios demo todavía.
- No habilita credenciales demo reales.
- No toca Auth/Supabase.
- No toca SQL, RLS, schema ni migraciones.
- No cambia permisos ni aislamiento de datos.

## Seguridad del enfoque

- La demo es visual y client-side.
- No consume datos reales de clientes.
- No modifica datos reales ni configuración de tenants/location.
- La preparación de cuentas demo controladas queda explícitamente para fase separada.

## Checklist manual

- `/demo` carga sin login.
- Se puede cambiar vertical en la propia página.
- El overview cambia por vertical.
- Hero y capability cards se actualizan por vertical.
- No aparecen emails/contraseñas ni credenciales reales.
- `admin` y `socio` mantienen funcionamiento existente.

## Nota posterior (Fase 7E)

- `/demo` se mantiene como demo general multi-vertical.
- `/demo/gimnasio`, `/demo/clinica`, `/demo/academia`, `/demo/peluqueria` y `/demo/generico` se usan como demos enfocadas para envío comercial.
- Estas páginas no crean usuarios ni credenciales demo.
- No tocan Auth ni Supabase.
