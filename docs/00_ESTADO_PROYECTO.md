# 00 · Estado del Proyecto

## Datos generales

| Campo | Valor |
|-------|-------|
| Nombre | JGS Fight Team |
| Tipo | App de gestión de gimnasio (SaaS single-tenant por ahora) |
| URL producción | https://fitapp-neon.vercel.app |
| Repo | https://github.com/Albertosg4/fitapp |
| Stack | Next.js 16, Supabase, Vercel, TypeScript |
| PWA | Sí — manifest + sw.js, instalable en iOS y Android |

## Credenciales de prueba

| Rol | Email | Password |
|-----|-------|----------|
| Admin | admin@fitapp.com | Admin1234! |
| Socio | socio@fitapp.com | Socio1234! |

> **Nunca commitear valores reales de variables de entorno.**

## Último commit estable conocido

```
ca21e69  security(fase3A): RPC atomica toggle_reserva, indices y constraints sin RLS
```

> Hay un commit mencionado en contexto como `ecf25e1` (post-refactor admin) y `b6db980` (fix eliminar clases).
> El commit más reciente en remoto es `ca21e69`. Verificar en local con `git log --oneline`.

## Fases ya aplicadas

| Fase | Descripción | Estado |
|------|-------------|--------|
| Fase 1 | Stripe checkout + webhook con Bearer auth e idempotencia | ✅ Aplicada |
| Fase 1.5 | Validaciones estrictas pagos, fuente única membresías, pagos por userId vía API | ✅ Aplicada |
| Fase 2 | Reservas vía API protegida `/api/reservas/toggle`, aislamiento gym_id, validación membresía y aforo | ✅ Aplicada |
| Fase 3 | RLS policies, constraints, RPC atómica, índices de rendimiento | ✅ Aplicada (parcialmente — ver dudas abiertas) |
| Fase 3A | RPC `toggle_reserva` atómica, índices y constraints sin cambiar RLS existente | ✅ Aplicada |
| Fase D | Vista socio usa modelo nuevo (horarios_clase + actividades) | ✅ Aplicada |
| Refactor admin | Extracción de hooks y tabs en `features/admin/` | ✅ Aplicada |
| Refactor socio | Extracción de hooks y tabs en `features/socio/` | ✅ Aplicada |

## Qué funciona

### Autenticación
- Login con roles (admin / socio)
- Redirección por rol tras login
- Sesión persistente con `fitapp-session` key

### Admin
- Ver, crear y eliminar/desactivar clases (modelo legacy `clases`)
- Ver reservas por clase y fecha
- Ver socios, activar/desactivar
- Registrar socios desde admin (vía `/api/register-socio`)
- Ver historial de asistencia por socio
- Registrar pagos manuales (efectivo, transferencia, cortesía)
- Registrar pagos pendientes
- Confirmar pagos pendientes
- Ver pagos globales con filtros
- Renovación de membresía al registrar/confirmar pago
- Gestión de Actividades (modelo nuevo)
- Gestión de Horarios recurrentes (modelo nuevo)
- Gestión de Clases puntuales (modelo nuevo)

### Socio
- Calendario semanal navegable
- Reservar y cancelar clases vía API protegida
- Ver ocupación de clases
- Ver QR de acceso generado en cliente
- Perfil con estado de membresía
- Avisos de membresía caducada o próxima a vencer (< 7 días)
- Historial de asistencia
- Historial de pagos
- Pago vía Stripe (checkout iniciado, webhook procesado)

### Check-in
- Check-in QR funcional vía `/api/checkin`
- Registra asistencia en tabla `asistencia`
- Valida `qr_token` del perfil
- Valida estado de membresía
- Previene duplicados (mismo día / misma reserva)
- Acceso libre si no hay reserva hoy

### Pagos
- Pagos manuales (efectivo, transferencia, cortesía)
- Pagos pendientes + confirmación
- Stripe checkout + webhook con idempotencia por `stripe_payment_id`
- Renovación acumulativa de membresía (suma a fecha vence actual)

### PWA
- Instalable en iOS (Safari) y Android (Chrome)
- Manifest con iconos 192 y 512
- Service worker en `public/sw.js`

## Qué está pendiente

| Ítem | Prioridad | Fase |
|------|-----------|------|
| Bug UI reservas: doble clic en "Reservar plaza", texto "Cancelar reserva" no siempre claro | Alta | 3B-1 |
| Filtros gym_id en escrituras directas desde admin (ActividadesTab, HorariosTab, ClasesPuntualesTab usan `supabase` browser con gymId como prop — no protegido en servidor) | Alta | 3B-2 / 3C |
| Mover escrituras admin sensibles a APIs protegidas con `requireAdmin` | Alta | 3C |
| Limpieza y auditoría RLS/policies en Supabase | Media | 3D |
| Pruebas multi-gimnasio reales | Media | 3E |
| Limpieza legacy (tipo `Clase`, `ClasesTab` marcado LEGACY) | Baja | 3F |
| Stripe completo (emails, confirmación, gestión de fallos) | Media | 4 |
| QA final y deploy estable documentado | Alta | 5 |

## Riesgos abiertos (resumen)

- Las tabs de admin `ActividadesTab`, `HorariosTab`, `ClasesPuntualesTab` escriben directamente en Supabase desde el cliente con `gymId` recibido como prop. Si RLS no está correctamente configurado, un admin podría insertar datos en otro `gym_id`.
- El webhook de Stripe no usa `SUPABASE_SERVICE_ROLE_KEY` validado contra un gimnasio — si hubiera multi-tenancy real, habría que mapear Stripe customer a `gym_id` correctamente.
- La tabla `asistencia` usa `check_in_at` para deduplicación de acceso libre — si hay drift de zona horaria en el servidor, podrían escaparse duplicados.
- RLS activo pero políticas no auditadas en todos los flujos — ver `02_SUPABASE_ESTADO.md`.
- `stripe_customer_id` se escribe en `perfiles` (requiere columna en BD — verificar si existe).
