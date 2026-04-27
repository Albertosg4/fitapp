# 06 · Decisiones Técnicas

> Registro de decisiones de arquitectura y seguridad ya tomadas.
> No cambiar sin consenso explícito y sin actualizar este documento.

---

## DT-01 · `requireAdmin` para todas las APIs de admin

**Decisión:** Toda ruta API que modifique o lea datos sensibles del gimnasio (pagos, socios)
debe validar el Bearer token con `requireAdmin` antes de ejecutar cualquier lógica.

**Por qué:**
- Previene acceso no autorizado aunque alguien conozca la URL de la API.
- `requireAdmin` obtiene el `gymId` del token (no del cliente), lo que garantiza que
  el admin solo actúa sobre su propio gimnasio.
- El `gymId` nunca se acepta del cuerpo de la request en estas APIs.

**Archivos afectados:**
- `lib/auth/requireAdmin.ts` — implementación
- `app/api/register-socio/route.ts`
- `app/api/pagos/route.ts`
- `app/api/pagos/manual/route.ts`

**Excepción conocida:** `/api/stripe/checkout` no usa `requireAdmin` ni `requireSocio` — pendiente corregir en Fase 4 (ver R-03).

---

## DT-02 · `requireSocio` para APIs de socio

**Decisión:** Las rutas API del socio (actualmente solo `/api/reservas/toggle`) deben validar
el Bearer token con `requireSocio`, que devuelve `{ userId, gymId, membresiaActiva, membresiaVence }`.

**Por qué:**
- El socio solo puede actuar sobre recursos de su propio gimnasio.
- La membresía se valida en servidor, no en cliente.
- El `userId` se extrae del token JWT, nunca del body.

**Archivos afectados:**
- `lib/auth/requireSocio.ts` — implementación
- `app/api/reservas/toggle/route.ts`

---

## DT-03 · Reservas vía API/RPC — nunca escritura directa desde cliente

**Decisión:** El socio nunca escribe directamente en las tablas `reservas` o `sesiones`
desde el browser. Toda operación de reserva/cancelación pasa por `/api/reservas/toggle`.

**Por qué:**
- Permite validar membresía, aforo y pertenencia al gimnasio en servidor.
- La RPC `toggle_reserva` garantiza atomicidad y previene duplicados.
- Si la RPC no existe, el fallback JS aplica las mismas validaciones.
- RLS no es suficiente para validar reglas de negocio complejas (aforo, estado membresía).

**Flujo:**
```
Cliente → POST /api/reservas/toggle { horarioId, fecha }
  → requireSocio (valida token + obtiene userId/gymId)
  → isMembresiaValida (valida membresía)
  → RPC toggle_reserva (atómica) | fallback JS
  → { ok, accion, sesionId }
```

---

## DT-04 · `gym_id` nunca se acepta desde el cliente en escrituras sensibles

**Decisión:** En todas las APIs con `requireAdmin` o `requireSocio`, el `gym_id` que se usa
para filtrar o escribir datos siempre viene del token (vía `requireAdmin`/`requireSocio`),
nunca del body o query params de la request.

**Por qué:** Si el cliente enviara `gym_id`, un atacante podría manipularlo para actuar
sobre datos de otro gimnasio.

**Implementación:**
- `requireAdmin` extrae `gymId` del perfil del usuario autenticado en BD.
- `requireSocio` ídem.
- Todas las APIs usan `result.context.gymId`, nunca `body.gymId`.

**Excepción pendiente:** Las tabs de admin `ActividadesTab`, `HorariosTab`, `ClasesPuntualesTab`
usan escritura directa con `gymId` como prop. Ver R-01 y Fase 3C.

---

## DT-05 · No activar ni cambiar RLS sin fase específica

**Decisión:** No modificar políticas RLS en Supabase fuera de una fase dedicada (3D)
con auditoría previa, rollback preparado y pruebas completas.

**Por qué:** Un cambio de RLS puede romper accesos que funcionen actualmente sin errores
visibles, especialmente los que usan `supabaseAdmin` (service_role bypasea RLS).
El riesgo de romper el sistema en producción es alto.

**Proceso correcto:**
1. Auditar estado actual con queries de solo lectura.
2. Documentar cada policy existente.
3. Proponer cambios en un PR con justificación.
4. Probar en Supabase staging si está disponible.
5. Aplicar con rollback documentado.

---

## DT-06 · No tocar Supabase sin verificación previa y rollback

**Decisión:** Ningún cambio en el esquema de Supabase (tablas, columnas, índices, constraints,
RPCs, triggers) se aplica sin:
1. Verificar el estado actual (queries de solo lectura).
2. Tener el SQL de rollback escrito antes de aplicar.
3. Probar en local o staging primero.
4. Documentar el cambio en `02_SUPABASE_ESTADO.md`.

**Por qué:** Supabase en producción no tiene entorno de staging automático. Un cambio
incorrecto puede romper datos o accesos de usuarios reales.

---

## DT-07 · `supabaseAdmin` (service_role) solo en rutas API server-side

**Decisión:** El cliente `supabaseAdmin` de `lib/supabase/admin.ts` solo puede importarse
en archivos bajo `app/api/` o en `lib/auth/`. Nunca en componentes client-side ni en
hooks con `'use client'`.

**Por qué:** La service_role key bypasea RLS y tiene acceso completo a la BD.
Exponer este cliente en el browser sería una vulnerabilidad crítica.

**Implementación:** El archivo usa `SUPABASE_SERVICE_ROLE_KEY` (sin `NEXT_PUBLIC_`),
lo que impide que Next.js lo incluya en el bundle del cliente.

---

## DT-08 · Fuente única de verdad para membresías

**Decisión:** Todos los tipos, importes, duraciones y lógica de estado de membresías
se definen en `lib/domain/membresias.ts` y se importan desde ahí en todas las APIs y componentes.

**Por qué:** Evitar inconsistencias entre lo que cobra Stripe, lo que registra el admin
y lo que muestra el socio.

**Excepción conocida:** `app/api/stripe/webhook/route.ts` define sus propias constantes
(ver R-10). Pendiente corregir en Fase 4.

---

## DT-09 · RPC `toggle_reserva` con fallback JS

**Decisión:** La ruta `/api/reservas/toggle` intenta la RPC atómica primero.
Si la RPC no existe en BD (error PGRST202), usa un fallback JS con `supabaseAdmin`.

**Por qué:**
- La RPC garantiza atomicidad y previene race conditions.
- El fallback permite que la app funcione aunque la RPC no esté desplegada.
- En el fallback, las mismas validaciones de negocio se aplican en JS.

**Nota:** El fallback NO depende de `auth.uid()` porque usa `userId` del token.
La RPC SÍ depende de `auth.uid()` y por eso se ejecuta con cliente autenticado
(anon key + Bearer JWT), no con service_role.

---

## DT-10 · Cliente autenticado para RPC (no service_role)

**Decisión:** Para llamar a la RPC `toggle_reserva`, se crea un cliente Supabase con
la anon key + JWT del usuario (no con service_role).

**Por qué:** Con service_role, `auth.uid()` en PostgreSQL es NULL. La RPC necesita
`auth.uid()` para identificar al socio. La solución es inyectar el JWT del usuario
en el header `Authorization` del cliente anon, para que PostgREST lo pase a PostgreSQL.

**Código relevante:** `createUserClient(token)` en `app/api/reservas/toggle/route.ts`.
