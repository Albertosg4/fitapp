# 06 · Decisiones técnicas vigentes

## 1) `requireAdmin` para APIs de administración
- Toda API administrativa sensible valida bearer token + rol admin + `gym_id` desde perfil.
- El `gym_id` operativo se toma del contexto autenticado, no del payload cliente.

## 2) `requireSocio` para APIs de socio
- Las operaciones del socio en server validan token y contexto (`userId`, `gymId`, estado de membresía para decisiones posteriores).

## 3) Reservas vía API/RPC
- El cliente no escribe directamente en `reservas`.
- La acción de reservar/cancelar se centraliza en `/api/reservas/toggle`.
- Prioridad: RPC atómica `toggle_reserva`; fallback server-side seguro si RPC no existe.

## 4) `gym_id` no se acepta desde cliente en escrituras sensibles
- En alta de socio, pagos manuales y rutas administrativas, el gimnasio se deriva del token del actor autorizado.
- Objetivo: evitar escalamiento horizontal manipulando payload.

## 5) No activar/cambiar RLS sin fase específica
- Cambios de RLS y policies requieren fase dedicada, verificación previa y checklist posterior.
- Evitar cambios ad-hoc mezclados con desarrollo funcional.

## 6) No tocar Supabase sin verificación previa y rollback
- Antes de SQL: inventario, backup/punto de restauración y queries de pre-check.
- Después de SQL: queries de verificación, pruebas críticas y plan de reversión.

## 7) Enfoque de seguridad por capas (estado actual)
- Capa API con `requireAdmin`/`requireSocio`.
- Capa SQL (RPC/índices/constraints y RLS según fase).
- Capa cliente limitada a lecturas y acciones no sensibles idealmente.

## 8) Estrategia de migración gradual
- Mantener continuidad operativa mientras se reduce legacy.
- Aplicar cambios en fases pequeñas con rollback fácil.
