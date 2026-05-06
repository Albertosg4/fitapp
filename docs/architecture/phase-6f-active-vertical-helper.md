# Fase 6F — Active vertical helper

## Objetivo

Introducir una capa central para resolver la **vertical activa** y sus labels sin cambiar el comportamiento funcional actual de la app.

## Qué se implementa

- Se mantiene `DEFAULT_VERTICAL = 'gym'`.
- Se mantiene `getDefaultVerticalLabels()` por compatibilidad.
- Se añade `getActiveBusinessVertical()` como helper central de vertical activa.
- Se añade `getActiveVerticalLabels()` como helper central de labels de vertical activa.
- Se migra UI ya cubierta para consumir `getActiveVerticalLabels()`.

## Diferencias entre helpers

- `DEFAULT_VERTICAL`
  - Constante de fallback por defecto de dominio.
  - En esta fase sigue siendo `'gym'`.

- `getDefaultVerticalLabels()`
  - Devuelve labels del default (`gym`).
  - Se mantiene por compatibilidad y transición.

- `getActiveBusinessVertical()`
  - Resuelve la vertical activa de la app.
  - En esta fase es estática y retorna `DEFAULT_VERTICAL`.

- `getActiveVerticalLabels()`
  - Devuelve labels de la vertical activa usando `getActiveBusinessVertical()`.
  - Es la nueva puerta de entrada recomendada para UI.

## Estado funcional en esta fase

- La vertical activa **sigue siendo gym**.
- **No hay persistencia** de vertical.
- **No se lee** vertical desde Supabase.
- **No se lee** vertical desde localStorage.
- **No se leen** variables de entorno para vertical.
- El cambio prepara una futura resolución desde tenant/location/settings.

## Confirmaciones de alcance

- Sin SQL.
- Sin cambios de schema.
- Sin cambios de RLS.
- Sin cambios de Auth.
- Sin cambios de Stripe.
- Sin cambios de rutas/API.
- Sin cambios funcionales en lógica de negocio.

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
