# 01 · Arquitectura de la App

## Árbol de carpetas relevante

```
fitapp/
├── app/
│   ├── page.tsx                          # Login (ruta raíz)
│   ├── layout.tsx                        # Layout global con PWA meta tags
│   ├── admin/
│   │   └── page.tsx                      # Panel admin (usa features/admin/)
│   ├── socio/
│   │   └── page.tsx                      # Vista socio (usa features/socio/)
│   ├── checkin/
│   │   └── page.tsx                      # Escáner QR → llama /api/checkin
│   └── api/
│       ├── checkin/route.ts              # POST — check-in QR con service role
│       ├── register-socio/route.ts       # POST — registro de socios (admin)
│       ├── reservas/
│       │   └── toggle/route.ts           # POST — reservar/cancelar (socio)
│       ├── pagos/
│       │   ├── route.ts                  # GET — listar pagos (admin)
│       │   └── manual/route.ts           # POST/PATCH — pago manual / confirmar
│       └── stripe/
│           ├── checkout/route.ts         # POST — iniciar checkout Stripe
│           └── webhook/route.ts          # POST — webhook Stripe (sin auth Bearer)
│
├── features/
│   ├── admin/
│   │   ├── hooks/
│   │   │   └── useAdminData.ts           # Estado base admin: socios, gymId, stats
│   │   └── components/
│   │       ├── ActividadesTab.tsx        # CRUD actividades (modelo nuevo)
│   │       ├── HorariosTab.tsx           # CRUD horarios recurrentes (modelo nuevo)
│   │       ├── ClasesPuntualesTab.tsx    # CRUD clases puntuales (modelo nuevo)
│   │       ├── ClasesTab.tsx             # [LEGACY] horarios modelo antiguo
│   │       ├── SociosTab.tsx             # Socios, pagos por socio, historial
│   │       └── PagosTab.tsx              # Pagos globales con filtros
│   └── socio/
│       ├── hooks/
│       │   └── useSocioData.ts           # Estado base socio: perfil, horarios, reservas, ocupación
│       └── components/
│           ├── SocioClasesTab.tsx        # Calendario + modal reserva
│           ├── SocioHistorialTab.tsx     # Historial de asistencia
│           ├── SocioPagosTab.tsx         # Historial de pagos + pago Stripe
│           ├── SocioQRTab.tsx            # QR de acceso
│           └── SocioPerfilTab.tsx        # Perfil, membresía, logout
│
├── components/
│   ├── CalendarioMes.tsx                 # Selector semanal reutilizable
│   ├── HistorialAsistencia.tsx           # Historial asistencia (reutilizable)
│   ├── HistorialPagos.tsx                # Historial pagos (reutilizable)
│   └── ModalHistorialSocio.tsx           # Modal historial para admin (posible legacy)
│
├── lib/
│   ├── supabase.ts                       # Cliente browser (anon key)
│   ├── supabase/
│   │   ├── admin.ts                      # Cliente service role — SOLO server-side
│   │   └── client.ts                     # (segundo cliente browser — verificar si en uso)
│   ├── auth/
│   │   ├── requireAdmin.ts               # Middleware auth: valida Bearer + rol admin
│   │   └── requireSocio.ts               # Middleware auth: valida Bearer + devuelve contexto socio
│   └── domain/
│       ├── membresias.ts                 # Tipos, importes, duración, lógica estado membresía
│       └── fechas.ts                     # Helpers de fechas locales
│
├── types/
│   └── domain.ts                         # Tipos TS: Clase(legacy), Actividad, HorarioClase,
│                                         #           Sesion, Socio, Pago, Reserva
│
├── public/
│   ├── manifest.json                     # PWA manifest
│   ├── sw.js                             # Service worker
│   └── icons/
│       ├── icon-192.png
│       └── icon-512.png
│
└── proxy.ts                              # (verificar si en uso activo)
```

## Páginas principales

| Ruta | Archivo | Rol | Descripción |
|------|---------|-----|-------------|
| `/` | `app/page.tsx` | Todos | Login con Supabase Auth |
| `/admin` | `app/admin/page.tsx` | Admin | Panel de gestión completo |
| `/socio` | `app/socio/page.tsx` | Socio | Vista personal: clases, perfil, QR, pagos |
| `/checkin` | `app/checkin/page.tsx` | Público* | Escáner QR (la validación es en la API) |

> *La página `/checkin` es accesible sin autenticación de usuario. La seguridad está en la API.

## APIs existentes

| Endpoint | Método | Auth | Descripción |
|----------|--------|------|-------------|
| `/api/checkin` | POST | Sin auth (valida `qr_token`) | Check-in por QR |
| `/api/register-socio` | POST | `requireAdmin` | Crea usuario auth + perfil |
| `/api/reservas/toggle` | POST | `requireSocio` | Reservar o cancelar clase |
| `/api/pagos` | GET | `requireAdmin` | Listar pagos (global o por userId) |
| `/api/pagos/manual` | POST | `requireAdmin` | Registrar pago manual |
| `/api/pagos/manual` | PATCH | `requireAdmin` | Confirmar pago pendiente |
| `/api/stripe/checkout` | POST | Bearer manual (no `requireSocio`) | Iniciar checkout Stripe |
| `/api/stripe/webhook` | POST | Sin Bearer (firma Stripe) | Webhook Stripe |

## Componentes principales

| Componente | Uso | Notas |
|-----------|-----|-------|
| `CalendarioMes` | SocioClasesTab | Selector semanal navegable |
| `HistorialAsistencia` | SocioHistorialTab, SociosTab (admin) | Lee directamente de Supabase client |
| `HistorialPagos` | SocioPagosTab | Posiblemente sustituido por lógica inline |
| `ModalHistorialSocio` | Verificar uso activo | Puede ser legacy |

## Hooks principales

### `useSocioData` (`features/socio/hooks/useSocioData.ts`)
Estado completo del socio:
- `perfil`: datos del socio (Socio)
- `horarios`: lista de HorarioSocio activos del gimnasio
- `reservas`: reservas confirmadas del socio con join a sesiones
- `ocupacion`: mapa `{horarioId}_{fecha}` → `{ sesionId, count }`
- `qrUrl`: data URL del QR generado en cliente
- `userId`, `loading`, `reservaError`
- Funciones: `cargarPerfil`, `cargarHorarios`, `cargarReservas`, `actualizarOcupacion`, `reservar`, `getHorariosDelDia`

### `useAdminData` (`features/admin/hooks/useAdminData.ts`)
Estado base del admin:
- `socios`: lista de perfiles con rol=socio
- `gymId`: id del gimnasio del admin
- `stats`: `{ actividadesActivas, horariosActivos, puntualesProximas, sociosActivos }`
- `loading`, `error`
- Funciones: `loadSocios`, `loadStats`, `toggleActivarSocio`, `logout`

## Flujo socio

```
Login (/page.tsx)
  → auth.getUser()
  → redirige a /socio

/socio/page.tsx (SocioPageInner)
  → useSocioData()
    → cargarPerfil(userId)   — supabase.from('perfiles')
    → cargarHorarios(gymId)  — supabase.from('horarios_clase') + actividades join
    → cargarReservas(userId) — supabase.from('reservas') + sesiones join

Tabs disponibles:
  [Clases]    → SocioClasesTab   → CalendarioMes → seleccionarDia → actualizarOcupacion
                                  → modal con botón Reservar/Cancelar
                                  → handleReservar → useSocioData.reservar()
                                    → POST /api/reservas/toggle (Bearer token)
  [Historial] → SocioHistorialTab → HistorialAsistencia
  [Pagos]     → SocioPagosTab    → GET /api/pagos?userId=... (a implementar completamente)
                                  → POST /api/stripe/checkout (Stripe)
  [Mi QR]     → SocioQRTab       → muestra qrUrl generado localmente
  [Perfil]    → SocioPerfilTab   → datos membresía + logout
```

## Flujo admin

```
Login (/page.tsx)
  → redirige a /admin

/admin/page.tsx
  → useAdminData()
    → supabase.from('gimnasios').select('id')  — obtiene gymId
    → supabase.from('perfiles')                — carga socios
    → stats: queries count en actividades, horarios_clase, sesiones, perfiles

Tabs disponibles:
  [Actividades]      → ActividadesTab(gymId)  — CRUD actividades vía supabase browser
  [Horarios]         → HorariosTab(gymId)     — CRUD horarios recurrentes vía supabase browser
  [Clases Puntuales] → ClasesPuntualesTab(gymId) — CRUD sesiones puntuales vía supabase browser
  [Clases LEGACY]    → ClasesTab              — tabla clases antigua, marcada LEGACY
  [Socios]           → SociosTab              — ver socios, historial, registrar pagos
                        → POST /api/register-socio (Bearer)
                        → GET/POST/PATCH /api/pagos (Bearer)
  [Pagos]            → PagosTab               — pagos globales
                        → GET /api/pagos (Bearer)
                        → PATCH /api/pagos/manual (Bearer)
```

## Flujo pagos

```
Admin registra pago manual:
  SociosTab → form → POST /api/pagos/manual
    → requireAdmin (valida Bearer + rol admin)
    → valida userId pertenece al gymId del admin
    → calcula importe y meses desde IMPORTES / MESES_POR_TIPO
    → si estado=pagado: actualiza perfiles (membresia_activa, membresia_vence, tipo_membresia)
    → inserta en pagos (gym_id del token)

Admin confirma pago pendiente:
  SociosTab/PagosTab → PATCH /api/pagos/manual { pagoId }
    → requireAdmin
    → valida pago pertenece a gymId del admin
    → actualiza estado=pagado + fecha_pago
    → actualiza membresía del socio

Socio paga con Stripe:
  SocioPagosTab → POST /api/stripe/checkout { tipoMembresia }
    → valida Bearer manualmente (sin requireSocio — ⚠️ pendiente unificar)
    → crea/recupera Stripe customer
    → crea Stripe Checkout session
    → redirige a Stripe

Stripe → webhook:
  POST /api/stripe/webhook
    → valida firma Stripe
    → verifica idempotencia (stripe_payment_id)
    → actualiza membresía y registra pago en BD
```

## Flujo reservas

```
Socio abre modal de clase:
  SocioClasesTab → handleReservar(horarioId, fecha)
    → useSocioData.reservar()
      → supabase.auth.getSession() → token
      → POST /api/reservas/toggle { horarioId, fecha } + Bearer token

/api/reservas/toggle:
  1. requireSocio(req) → { userId, gymId, membresiaActiva, membresiaVence }
  2. isMembresiaValida() → 403 si caducada
  3. valida payload (horarioId, fecha)
  4. Intenta RPC toggle_reserva con cliente autenticado (auth.uid() = userId real)
     → Si RPC ok: devuelve { ok, accion, sesionId }
     → Si RPC no existe (PGRST202): fallback JS con supabaseAdmin
  5. Fallback JS:
     - valida horario existe y pertenece al gymId del socio
     - busca sesión o la crea (materializa)
     - cancela si reserva confirmada existe
     - verifica aforo
     - crea o reactiva reserva

Respuesta al cliente:
  { ok: true, accion: 'confirmada' | 'cancelada', sesionId }
  → useSocioData actualiza ocupación optimistamente
  → recarga reservas reales desde BD
```

## Flujo check-in

```
/checkin (página pública)
  → escanea QR → extrae token de URL (?token=xxx)
  → POST /api/checkin { token }

/api/checkin:
  1. valida token no vacío
  2. busca perfil por qr_token en perfiles
  3. valida membresía con isMembresiaValida()
  4. busca sesiones de hoy → busca reserva confirmada del usuario
  5. Si no hay reserva hoy:
     - comprueba si ya hay registro de acceso libre hoy (deduplicación)
     - inserta asistencia { user_id, metodo: 'qr' }
  6. Si hay reserva:
     - comprueba si ya hay check-in para esa reserva
     - inserta asistencia { reserva_id, user_id, metodo: 'qr' }
  → devuelve { ok, nombre, msg }
```
