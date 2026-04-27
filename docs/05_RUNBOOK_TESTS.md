# 05 · Runbook de pruebas manuales

## Preparación general
- Confirmar variables de entorno en local/staging/prod.
- Tener al menos 2 gimnasios de prueba y usuarios admin/socio por gimnasio.
- Limpiar caché de navegador y repetir pruebas en sesión nueva cuando aplique.

## Checklist socio
- [ ] Login correcto y redirección a `/socio`.
- [ ] Render de perfil y estado de membresía.
- [ ] Visualización de horarios del gimnasio correcto.
- [ ] Reserva de clase disponible.
- [ ] Cancelación de reserva existente.
- [ ] Manejo de clase completa.
- [ ] Historial visible solo del socio autenticado.
- [ ] Logout y expiración de sesión.

## Checklist admin
- [ ] Login admin y acceso a `/admin`.
- [ ] Visualización de socios del gimnasio esperado.
- [ ] Alta de socio por API y aparición en listado.
- [ ] Cambio de estado membresía (si mantiene flujo vigente).
- [ ] CRUD de actividades/horarios/puntuales (según fase activa).
- [ ] Verificación de no acceso a datos de otro gimnasio.

## Checklist pagos
- [ ] Pago manual `pagado` extiende membresía.
- [ ] Pago manual `pendiente` no extiende membresía hasta confirmación.
- [ ] PATCH de pago pendiente a pagado actualiza membresía.
- [ ] Histórico admin por socio y global.
- [ ] Histórico socio visible y consistente.

## Checklist reservas
- [ ] Flujo reservar/cancelar sin inconsistencias de UI.
- [ ] Validación de membresía caducada.
- [ ] Validación de aforo.
- [ ] No duplicados de reserva en BD (`confirmada`).
- [ ] Comportamiento correcto si RPC no está disponible (fallback).

## Checklist check-in
- [ ] QR válido con membresía activa permite acceso.
- [ ] QR inválido devuelve error controlado.
- [ ] Membresía caducada bloquea acceso.
- [ ] No duplicar check-in por reserva.
- [ ] Acceso libre sin reserva se registra una sola vez por día.

## Checklist Supabase (solo auditoría)
- [ ] `pg_tables` confirma estado RLS esperado por tabla.
- [ ] `pg_policies` lista policies esperadas y sin duplicados conflictivos.
- [ ] `information_schema.routines` confirma `toggle_reserva` y `auth_gym_id`.
- [ ] `pg_indexes` confirma índices y constraints de fase 3A.
- [ ] Query de duplicados en `reservas` y `sesiones` devuelve 0 filas.

## Checklist Vercel
- [ ] Build de producción sin errores.
- [ ] Variables de entorno correctas en proyecto Vercel.
- [ ] Verificación de rutas API críticas con logs.
- [ ] Health check manual post-deploy (login, socio, admin, reservas, pagos).
- [ ] Monitoreo de errores durante 30-60 min tras despliegue.
