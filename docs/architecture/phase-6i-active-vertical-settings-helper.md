# Fase 6I — Active vertical settings helper

## Objetivo

Implementar un helper central de settings verticales activos para que la UI consuma `settings.labels` sin cambiar comportamiento funcional.

## Cambio principal de dominio

- Se incorpora `getActiveVerticalSettings()` en `lib/domain/vertical-settings.ts`.
- El origen actual de vertical activa sigue siendo `getActiveBusinessVertical()`.
- En esta fase el resultado efectivo continúa en `gym` como default.

## Migración de UI

- La UI cubierta deja de usar `getActiveVerticalLabels()` y pasa a usar `getActiveVerticalSettings()`.
- Los textos migrados consumen `settings.labels`.
- `settings.features` existe en contrato, pero **no se usa todavía** para ocultar/mostrar o alterar comportamiento de UI.

## Límites explícitos de la fase

- No hay persistencia en esta fase.
- No se lee configuración desde Supabase.
- No se lee desde `localStorage`.
- No se lee desde variables de entorno.
- No se lee desde query params.

## Preparación para fases futuras

Este helper central prepara el cambio de origen de settings activos (tenant/location/settings) sin tener que retocar consumidores UI ya migrados.

## Confirmaciones de alcance

- Sin SQL.
- Sin cambios de schema.
- Sin cambios de RLS.
- Sin cambios de Auth.
- Sin cambios de Stripe.
- Sin cambios de APIs.
- Sin cambios de rutas.
- Sin cambio funcional visible.

## Checklist funcional

- [ ] Panel admin carga igual.
- [ ] Panel socio carga igual.
- [ ] Clases admin carga igual.
- [ ] Pagos admin carga igual.
- [ ] Historial socio carga igual.
- [ ] Pagos socio carga igual.
- [ ] Perfil socio carga igual.
- [ ] QR socio carga igual.
- [ ] Reservar/cancelar mantiene comportamiento.
- [ ] Check-in QR mantiene comportamiento.
