# 00 · Estado del proyecto

## Identificación
- **Proyecto:** JGS Fight Team / fitapp
- **Repositorio:** `Albertosg4/fitapp`
- **Producción:** https://fitapp-neon.vercel.app
- **Stack principal:** Next.js 16 (App Router), React 19, TypeScript, Supabase, Stripe, Vercel.

## Último commit estable conocido
- **Commit:** `ca21e69`
- **Mensaje:** `security(fase3A): RPC atomica toggle_reserva, indices y constraints sin RLS`
- **Fecha de referencia de este inventario:** 2026-04-27.

## Fases ya aplicadas (según historial y SQL en repo)
- **Fase 1.5:** validaciones estrictas de pagos y normalización de membresías.
- **Fase 2:** reservas por API protegida y validaciones de membresía/aforo.
- **Fase 3 (propuesta completa en SQL):** RLS + policies + helper `auth_gym_id` + índices + constraints.
- **Fase 3A (aplicada):** índices + constraints + RPC `toggle_reserva` sin forzar activación global de RLS desde esa fase.
- **Modelo profesional de clases:** base preparada y pestañas de admin nuevas (actividades/horarios/puntuales), con conviviendo legacy.

## Qué funciona hoy
- Login y redirección por rol (`admin` / `socio`).
- Alta de socios por API `POST /api/register-socio` con `requireAdmin` y `gym_id` tomado del token.
- Pagos admin por APIs protegidas (`/api/pagos`, `/api/pagos/manual`) con validación de pertenencia por gimnasio.
- Reservas de socios centralizadas en `/api/reservas/toggle`, con intento de RPC atómica y fallback seguro en server.
- Check-in QR vía `/api/checkin` con validación de membresía y control de duplicados diarios.
- Flujo Stripe básico (`/api/stripe/checkout`, `/api/stripe/webhook`) con idempotencia por `stripe_payment_id`.

## Qué está pendiente (sin tocar aún)
- Corregir UX de reservas (doble clic / claridad de estado cancelar/reservar).
- Revisar y cerrar filtros por `gym_id` en lecturas/escrituras admin que aún usan cliente Supabase.
- Terminar migración de escrituras admin sensibles a APIs protegidas (evitar writes directos desde cliente).
- Consolidar estrategia RLS/policies reales de producción vs SQL histórico del repo.
- Ejecutar plan formal de pruebas multi-gimnasio y regresión completa.

## Riesgos abiertos
- Inconsistencia potencial entre RLS realmente activa en producción y políticas históricas presentes en scripts.
- Escrituras directas desde cliente en panel admin (dependencia fuerte de RLS para aislamiento correcto).
- Algunas lecturas admin no filtran explícitamente por `gym_id` en query cliente.
- Flujo de reservas con estado UI mejorable puede inducir acciones repetidas del usuario.
- Riesgo operativo si se cambia RLS sin secuencia faseada y rollback explícito.
