# Fase 6E — Expanded vertical labels (UI)

## Objetivo
Expandir el uso de `getDefaultVerticalLabels()` en copy visible de bajo riesgo para avanzar en cobertura multi-vertical sin cambios funcionales.

## Cobertura aplicada
- Sustitución incremental de copy visible en componentes UI seleccionados.
- Uso de labels por defecto para términos como cliente/socio, reservas, clases y pagos.
- Aplicación localizada sin refactor masivo.

## Fuera de alcance
- Sin cambios en SQL, migraciones, schema, constraints o RLS.
- Sin cambios en Supabase live, Auth, Stripe o webhooks.
- Sin cambios en rutas, APIs, permisos ni lógica de negocio.
- Sin cambios de nombres internos de tipos/entidades (`Socio`, `Reserva`, `Actividad`, etc.).

## Default vertical
- `gym` se mantiene como vertical por defecto.

## Confirmaciones técnicas
- No SQL aplicado ni preparado para ejecución.
- Sin cambios de Supabase/RLS/Auth/Stripe.
- Sin cambios de rutas ni permisos.
- Sin cambios de comportamiento funcional.

## Checklist de validación funcional
- [ ] Panel admin carga igual.
- [ ] Socios admin carga igual.
- [ ] Pagos admin carga igual.
- [ ] Actividades/horarios/puntuales cargan igual.
- [ ] Panel socio carga igual.
- [ ] Clases socio carga igual.
- [ ] Historial socio carga igual.
- [ ] Pagos socio carga igual.
- [ ] QR socio carga igual.
- [ ] Reservar/cancelar sigue igual.
- [ ] Check-in QR sigue igual.
