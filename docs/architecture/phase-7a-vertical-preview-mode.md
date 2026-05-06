# Fase 7A — Vertical preview mode (UI)

## Objetivo

Implementar un modo de preview visual multi-vertical en cliente para demo y product discovery.

## Qué hace

- Introduce un provider client-side de vertical settings.
- Permite seleccionar vertical de preview (`gym`, `clinic`, `academy`, `beauty`, `generic`) desde admin.
- Persiste únicamente estado de demo local en `localStorage`.
- Usa fallback seguro a `gym` para valores inválidos.

## Qué NO hace

- No configura tenant/location real.
- No persiste vertical en backend.
- No usa Supabase ni SQL.
- No cambia RLS, Auth, Stripe, APIs ni rutas.
- No impacta seguridad, permisos, reservas, pagos ni aislamiento de datos.

## Detalles de implementación

- Clave de storage: `fitapp.verticalPreview`.
- Estado inicial en cliente: `gym` (default seguro).
- Lectura de `localStorage` solo tras montar en cliente para evitar hydration mismatch.
- Si el valor guardado es inválido, se resuelve por `resolveBusinessVertical()` y cae a `gym`.

## Qué se puede probar

- Admin como gimnasio.
- Admin como clínica.
- Admin como academia.
- Admin como peluquería/estética.
- Admin como genérico.

## Checklist funcional

- [ ] El admin carga igual que antes.
- [ ] El selector de preview vertical aparece en admin marcado como modo demo.
- [ ] Cambiar a `clinic` refleja labels de pacientes/tratamientos/citas en UI cubierta.
- [ ] Cambiar a `beauty` refleja labels de clientes/servicios/citas en UI cubierta.
- [ ] Reset vuelve a `gym`.
- [ ] Recargar mantiene preview por `localStorage`.
- [ ] Limpiar storage vuelve a `gym`.
- [ ] Socio carga igual sin impacto en permisos/reservas/pagos/check-in.
