# 01 · Arquitectura de la App

## Resumen

- Framework: **Next.js (App Router)**.
- Auth: **Supabase Auth**.
- Datos: Supabase (lecturas client-side donde sigue aplicando + escrituras sensibles server-side).
- Seguridad de escritura: APIs con `requireAdmin` / `requireSocio`.

## Capas actuales

### 1) Frontend (App Router)

- Rutas principales: `/`, `/admin`, `/socio`, `/checkin`.
- Componentes cliente para UX, formularios, tablas y calendario.
- Se mantiene uso de cliente Supabase browser en lecturas no sensibles y en flujos que aún dependen de ello.

### 2) Autenticación y autorización

- Supabase Auth para sesión de usuario.
- API protegida:
  - `requireAdmin` para operaciones administrativas.
  - `requireSocio` para operaciones de socio.
- `gym_id` de seguridad se obtiene de contexto server-side, no del payload cliente en escrituras sensibles.

### 3) APIs server-side

APIs protegidas activas para operaciones clave:

- Admin:
  - `/api/admin/actividades`
  - `/api/admin/horarios`
  - `/api/admin/sesiones`
  - `/api/admin/socios/toggle`
- Compartidas/admin:
  - `/api/register-socio`
  - `/api/pagos`
  - `/api/pagos/manual`
- Socio:
  - `/api/reservas/toggle`
- Operación de acceso:
  - `/api/checkin`

## Flujo Admin (estado actual)

- **Lecturas** administrativas filtradas por `gym_id`.
- **Escrituras críticas** encapsuladas en API protegida (ya no directas desde browser en los módulos principales migrados).
- Gestión de socios/membresía pasando por endpoints server-side.

## Flujo Socio (estado actual)

- Reservas: alta/cancelación por `/api/reservas/toggle`.
- Historial/pagos: lectura según módulos actuales y endpoints disponibles.
- Check-in: vía `/api/checkin`.

## Membresías (fuente única)

Fuente única de dominio:

- `lib/domain/membresias.ts`

Reglas vigentes:

- Cálculo por **meses reales** usando `calcularNuevaFechaVencimiento()`.
- Pago `pagado` o `cortesía` renueva.
- Pago `pendiente` no renueva hasta confirmación.
- Reactivar socio (`membresia_activa=true`) no altera `membresia_vence`.
