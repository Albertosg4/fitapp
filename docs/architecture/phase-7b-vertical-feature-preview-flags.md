# Fase 7B — Vertical feature preview flags

## Objetivo

Aplicar `settings.features` en UI client-side no crítica para que el modo preview vertical no solo cambie labels, sino también módulos visibles por vertical.

## Alcance técnico

- Solo preview visual en cliente.
- Uso de feature flags:
  - `attendanceEnabled`
  - `qrCheckinEnabled`
  - `paymentsEnabled`
  - `capacityEnabled`
  - `recurringScheduleEnabled`
- Sin cambios server-side.

## Garantías de seguridad/alcance

- No afecta permisos backend.
- No afecta datos ni aislamiento.
- No modifica reservas reales.
- No modifica pagos reales.
- No modifica check-in real.
- Sin Supabase en esta fase.
- Sin SQL en esta fase.
- Sin RLS/Auth/Stripe/APIs/rutas.

## Comportamiento esperado por vertical (preview visual)

- `gym`: todo visible (default).
- `clinic`: QR OFF, asistencia/visita ON, capacidad OFF.
- `academy`: asistencia ON, capacidad ON, QR OFF.
- `beauty`: QR OFF, asistencia OFF, capacidad OFF.
- `generic`: QR OFF, asistencia OFF, capacidad OFF.

## Notas clave

- El selector preview usa `localStorage` (`fitapp.verticalPreview`) solo como estado visual local.
- No es persistencia tenant/location real.

## Checklist manual

- Cambiar vertical desde admin y validar resumen ON/OFF de features.
- Validar en socio:
  - QR oculto o mensaje demo cuando `qrCheckinEnabled=false`.
  - Historial oculto o mensaje demo cuando `attendanceEnabled=false`.
  - Pagos oculto o mensaje demo cuando `paymentsEnabled=false`.
- Validar que en `gym` no cambia el comportamiento funcional.
- Resetear a gym y comprobar UI original.
