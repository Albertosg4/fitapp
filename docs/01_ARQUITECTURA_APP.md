# 01 · Arquitectura de la app

## Árbol de carpetas importante
```text
app/
  page.tsx                  # login
  admin/page.tsx            # panel admin
  socio/page.tsx            # panel socio
  checkin/page.tsx          # lector QR / check-in
  api/
    register-socio/route.ts
    pagos/route.ts
    pagos/manual/route.ts
    reservas/toggle/route.ts
    checkin/route.ts
    stripe/checkout/route.ts
    stripe/webhook/route.ts

features/
  admin/
    hooks/useAdminData.ts
    components/{SociosTab,PagosTab,ActividadesTab,HorariosTab,ClasesPuntualesTab,ClasesTab}.tsx
  socio/
    hooks/useSocioData.ts
    components/{SocioClasesTab,SocioHistorialTab,SocioPagosTab,SocioQRTab,SocioPerfilTab}.tsx

lib/
  auth/{requireAdmin,requireSocio}.ts
  supabase/{admin,client}.ts + supabase.ts
  domain/{membresias,fechas}.ts

types/domain.ts
supabase/
  fase3*.sql
  migrations/*.sql
```

## Páginas principales
- `/` → login y routing por rol.
- `/admin` → dashboard admin con tabs de actividades, horarios, puntuales, socios, pagos y alta de socio.
- `/socio` → dashboard socio con tabs de clases, historial, pagos, QR y perfil.
- `/checkin` → interfaz de check-in por token QR.

## APIs existentes
- `POST /api/register-socio` (admin): crea usuario auth + perfil socio.
- `GET /api/pagos` (admin): listado pagos global o por socio (`userId`).
- `POST|PATCH /api/pagos/manual` (admin): alta pago manual y marcado de pendientes.
- `POST /api/reservas/toggle` (socio): confirma/cancela reserva, con RPC `toggle_reserva` + fallback JS.
- `POST /api/checkin`: valida QR, membresía y registra asistencia.
- `POST /api/stripe/checkout`: crea sesión Stripe Checkout para socio autenticado.
- `POST /api/stripe/webhook`: confirma pago Stripe, renueva membresía e inserta registro de pago.

## Componentes principales
- **Admin:** `SociosTab`, `PagosTab`, `ActividadesTab`, `HorariosTab`, `ClasesPuntualesTab`, `ClasesTab`.
- **Socio:** `SocioClasesTab`, `SocioHistorialTab`, `SocioPagosTab`, `SocioQRTab`, `SocioPerfilTab`.
- **Compartidos legacy:** historial de asistencia y pagos en `components/`.

## Hooks principales
- `useAdminData`: bootstrap admin (auth, gym, socios, stats, logout).
- `useSocioData`: perfil, horarios, reservas, ocupación, QR, acción reservar/cancelar vía API.

## Flujo socio
1. Login en `/`.
2. Carga perfil y `gym_id`.
3. Carga horarios activos (filtrados por gym cuando disponible).
4. Reserva/cancelación únicamente vía `/api/reservas/toggle`.
5. Visualiza historial/pagos/QR/perfil.

## Flujo admin
1. Login en `/`.
2. Inicializa `gymId` + socios + métricas.
3. Alta de socio por API protegida.
4. Gestión de pagos por APIs protegidas.
5. Gestión de actividades/horarios/puntuales actualmente con consultas/escrituras directas de Supabase client en UI admin.

## Flujo pagos
- **Manual:** admin crea pago con `POST /api/pagos/manual`; si estado final es pagado se extiende membresía.
- **Consulta:** admin consulta `/api/pagos` y socio ve su histórico en cliente.
- **Stripe:** socio inicia checkout, webhook registra pago e impacta membresía.

## Flujo reservas
1. Socio pulsa reservar/cancelar desde modal de clases.
2. Front llama `POST /api/reservas/toggle` con bearer token.
3. API valida socio + membresía + payload.
4. API intenta RPC atómica `toggle_reserva`; si no existe, ejecuta fallback server-side con mismas validaciones.
5. Cliente recarga reservas y actualiza ocupación.

## Flujo check-in
1. QR del socio apunta a token (`qr_token`) en perfil.
2. `/api/checkin` busca perfil por token.
3. Valida membresía.
4. Si hay reserva confirmada del día, registra check-in ligado a reserva.
5. Si no hay reserva, registra acceso libre (una vez por día).
