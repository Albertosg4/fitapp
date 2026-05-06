# Fase 6G — Vertical resolution hardening

## Objetivo

Endurecer la resolución de verticales de negocio con helpers puros y seguros antes de introducir settings reales.

## Qué se implementa en esta fase

- `BUSINESS_VERTICALS`: listado explícito de verticales soportadas por dominio.
- `isBusinessVertical(value)`: type guard para validar si un valor pertenece al dominio permitido.
- `resolveBusinessVertical(value)`: resolución segura con fallback a `DEFAULT_VERTICAL`.
- `getActiveBusinessVertical()`: mantiene vertical activa estática (`gym`) en esta fase.
- `getActiveVerticalLabels()`: mantiene consumo de labels activos sin cambiar comportamiento funcional.

## Comportamiento y garantías

- `DEFAULT_VERTICAL` sigue siendo `gym`.
- Cualquier valor inválido/desconocido cae de forma segura a `DEFAULT_VERTICAL`.
- No hay cambios funcionales visibles.
- No hay persistencia de vertical todavía.

## Fuera de alcance explícito en 6G

- No se lee vertical desde Supabase.
- No se lee vertical desde `localStorage`.
- No se lee vertical desde variables de entorno.
- No se lee vertical desde query params.
- No se introduce multi-tenant real ni multi-vertical completo en producción.

## Confirmaciones técnicas

- Sin SQL.
- Sin cambios de schema.
- Sin RLS.
- Sin Auth.
- Sin Stripe.
- Sin cambios de rutas/APIs.
- Sin cambios en lógica de negocio.

## Preparación para fases futuras

Esta fase deja encapsulada la validación/resolución de vertical para que una futura fase de settings pueda cambiar el origen (tenant/location/configuración) sin tener que modificar todos los consumidores UI.

## Checklist funcional

- [ ] Panel admin carga igual.
- [ ] Socios admin carga igual.
- [ ] Pagos admin carga igual.
- [ ] Clases admin carga igual.
- [ ] Panel socio carga igual.
- [ ] Historial socio carga igual.
- [ ] Pagos socio carga igual.
- [ ] QR socio carga igual.
- [ ] Reservar/cancelar sigue igual.
- [ ] Check-in QR sigue igual.
