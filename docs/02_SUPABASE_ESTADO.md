# 02 · Supabase — Estado conocido

> **Nota:** Este documento se infiere 100% del código. No se ha ejecutado ninguna query en BD.
> Las columnas marcadas con `(inferida)` son las que aparecen en selects/inserts del código pero
> no están confirmadas con un `describe` de la tabla real.

## Datos de conexión

| Campo | Valor |
|-------|-------|
| URL | https://bfhifmvndqyxhseqrivu.supabase.co |
| gym_id principal | b94be501-cdb4-4e48-a525-e0a669ad0967 |
| Anon key | En `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Service role key | En `SUPABASE_SERVICE_ROLE_KEY` — NUNCA al cliente |

## Tablas detectadas

### `gimnasios`
| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid PK | Se usa en `useAdminData.init()` |

**Accesos:** `supabase.from('gimnasios').select('id').single()` — desde admin browser.

---

### `perfiles`
| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid PK | FK a `auth.users.id` |
| gym_id | uuid | FK a `gimnasios.id` |
| nombre | text | |
| rol | text | `'socio'` \| `'admin'` |
| tipo_membresia | text | `TipoMembresia`: mensual/trimestral/semestral/anual |
| membresia_activa | boolean | |
| membresia_vence | date | `YYYY-MM-DD` |
| qr_token | text | Token único para check-in QR |
| telefono | text | nullable |
| stripe_customer_id | text (inferida) | Escrito en `/api/stripe/checkout` — verificar si columna existe |

**Accesos:**
- Browser (admin): `select('*').eq('rol', 'socio')` — carga socios
- Browser (socio): `select('*').eq('id', uid)` — carga perfil propio
- Browser (socio): `select('gym_id').eq('id', uid)` — obtiene gymId
- Server (requireAdmin): `select('rol, gym_id').eq('id', userId)` vía `supabaseAdmin`
- Server (requireSocio): `select('gym_id, membresia_activa, membresia_vence').eq('id', userId)` vía `supabaseAdmin`
- Server (checkin): `select('id, nombre, membresia_activa, membresia_vence').eq('qr_token', token)` vía `supabaseAdmin`
- Server (pagos/manual): update `membresia_activa, membresia_vence, tipo_membresia`
- Server (register-socio): insert perfil completo vía `supabaseAdmin`
- Server (stripe/webhook): update membresía + escribe `stripe_customer_id`

---

### `actividades`
| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid PK | |
| gym_id | uuid | FK a `gimnasios.id` |
| nombre | text | |
| descripcion | text | nullable |
| color | text | nullable (hex) |
| activa | boolean | |
| created_at | timestamptz | |

**Accesos:**
- Browser (admin ActividadesTab): select/insert/update filtrado por `gym_id`
- Browser (admin HorariosTab): select activas por `gym_id`
- Browser (socio useSocioData): join en `horarios_clase` → `actividad:actividades(nombre, color)`

---

### `horarios_clase`
| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid PK | |
| gym_id | uuid | FK a `gimnasios.id` |
| actividad_id | uuid | FK a `actividades.id` |
| dia_semana | int | 0=Lunes … 6=Domingo |
| hora_inicio | time | `HH:MM` |
| duracion_min | int | |
| aforo_max | int | |
| profesor | text | nullable |
| fecha_inicio | date | desde cuándo aplica |
| fecha_fin | date | nullable |
| activo | boolean | |
| created_at | timestamptz | |

**Accesos:**
- Browser (admin HorariosTab): select/insert/update/delete filtrado por `gym_id`
- Browser (socio useSocioData): select `activo=true` filtrado por `gym_id` con join a actividades
- Server (reservas/toggle): select por `id` vía `supabaseAdmin` para validar `gym_id` y `activo`
- Server (estadísticas admin): count `activo=true, gym_id`

---

### `sesiones`
| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid PK | |
| horario_id | uuid | nullable, FK a `horarios_clase.id` |
| actividad_id | uuid | nullable, FK a `actividades.id` |
| clase_id | uuid | nullable, FK legacy a `clases.id` |
| fecha | date | `YYYY-MM-DD` |
| hora_inicio | time | nullable (override) |
| duracion_min | int | nullable (override) |
| aforo_max | int | nullable (override) |
| profesor | text | nullable |
| notas | text | nullable |
| es_puntual | boolean | true si clase puntual |
| cancelada | boolean | true = no visible al socio |
| created_at | timestamptz | nullable |

**Accesos:**
- Browser (socio useSocioData): select `id` por `horario_id, fecha` para calcular ocupación
- Browser (admin ClasesTab legacy): select por `clase_id, fecha`
- Browser (admin ClasesPuntualesTab): select `es_puntual=true`
- Server (reservas/toggle): select/insert por `horario_id, fecha` vía `supabaseAdmin`
- Server (checkin): select `id` por `fecha` vía `supabaseAdmin`
- Server (stats admin): count `es_puntual=true, cancelada=false, fecha>=hoy`

---

### `reservas`
| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid PK | |
| sesion_id | uuid | FK a `sesiones.id` |
| user_id | uuid | FK a `auth.users.id` |
| estado | text | `'confirmada'` \| `'cancelada'` |

**Accesos:**
- Browser (socio useSocioData): select con join a `sesiones(horario_id, actividad_id, fecha)` por `user_id, estado=confirmada`
- Browser (socio useSocioData): select count `sesion_id, estado=confirmada` para ocupación
- Browser (admin ClasesTab legacy): select por `sesion_id, estado=confirmada`
- Server (reservas/toggle): select/insert/update vía `supabaseAdmin`
- Server (checkin): select por `user_id, estado=confirmada, sesion_id IN [...]` vía `supabaseAdmin`

---

### `asistencia`
| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid PK | |
| user_id | uuid | FK a `auth.users` — añadido en Fase 3A |
| reserva_id | uuid | nullable, FK a `reservas.id` |
| metodo | text | `'qr'` |
| check_in_at | timestamptz | timestamp del check-in |

**Accesos:**
- Browser (HistorialAsistencia): select por `user_id` con order
- Server (checkin): select deduplicación por `user_id, check_in_at` o `reserva_id` vía `supabaseAdmin`
- Server (checkin): insert `{ user_id, metodo }` (acceso libre) o `{ reserva_id, user_id, metodo }`

**Índices conocidos (Fase 3A):** sobre `user_id` y posiblemente `reserva_id`.

---

### `pagos`
| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid PK | |
| user_id | uuid | FK a `auth.users.id` |
| gym_id | uuid | nullable, FK a `gimnasios.id` |
| importe | numeric | |
| tipo_membresia | text | TipoMembresia |
| meses | int | |
| metodo | text | `efectivo` \| `transferencia` \| `cortesia` \| `stripe` |
| estado | text | `pagado` \| `pendiente` |
| notas | text | nullable |
| fecha_pago | timestamptz | |
| created_at | timestamptz | |
| stripe_payment_id | text (inferida) | para idempotencia en webhook |

**Accesos:**
- Server (pagos GET): select por `gym_id` + optional `user_id` vía `supabaseAdmin`
- Server (pagos/manual POST): insert vía `supabaseAdmin`
- Server (pagos/manual PATCH): update `estado, fecha_pago` vía `supabaseAdmin`
- Server (stripe/webhook): select deduplicación por `stripe_payment_id`, insert vía `supabaseAdmin`

---

### `clases` (LEGACY)
| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid PK | |
| gym_id | uuid | |
| nombre | text | |
| dia_semana | int | |
| hora_inicio | time | |
| duracion_min | int | |
| aforo_max | int | |
| activa | boolean | |

> Tabla legacy mantenida para `ClasesTab.tsx`. No usar en nuevas funcionalidades.

---

### `monitores` (posible)
- Mencionada en documentación inicial del proyecto.
- No aparece en ningún archivo de código actual.
- Estado: desconocido — puede no existir aún o estar sin uso.

## RLS conocido

| Tabla | RLS activo | Política conocida | Fuente |
|-------|-----------|-------------------|--------|
| perfiles | Sí (inferido) | Socio ve solo su fila; admin ve todas del gimnasio | Comentario en código |
| asistencia | Sí | Socio ve solo su historial; admin ve todo | Comentario en código (Fase 3A) |
| reservas | Sí (inferido) | Socio ve solo las suyas | Inferido del diseño |
| horarios_clase | Posiblemente | Filtro de `gym_id` se hace en código — RLS no confirmado | Inferido |
| actividades | Posiblemente | ídem | Inferido |
| sesiones | Desconocido | — | Sin datos |
| pagos | Sí (inferido) | Admin lee por gym_id; socio puede no tener acceso directo | Inferido del uso |
| gimnasios | Desconocido | — | Sin datos |

> **Advertencia:** Las tabs de admin `ActividadesTab`, `HorariosTab`, `ClasesPuntualesTab` escriben
> directamente vía cliente browser. Si RLS no exige que `gym_id = auth.uid().gym_id`, un admin
> podría manipular datos de otro gimnasio enviando un `gym_id` falso como prop.

## RPCs conocidas

### `toggle_reserva(p_horario_id uuid, p_fecha date)`
- **Propósito:** Reservar o cancelar una clase de forma atómica
- **Ejecuta como:** Usuario real (auth.uid() activo) — NO service_role
- **Respuesta:** `{ ok: boolean, error?: string, accion?: string, sesion_id?: uuid }`
- **Fallback:** Si la RPC no existe (PGRST202), la ruta usa fallback JS con `supabaseAdmin`
- **Estado:** Aplicada en Fase 3A — verificar que existe en Supabase

## Índices conocidos (Fase 3A)

- `asistencia(user_id)` — para historial de asistencia
- Posiblemente `asistencia(reserva_id)` — para deduplicación
- Posiblemente `reservas(sesion_id, user_id)` — para toggle atómico

## Constraints conocidos (Fase 3A)

- Constraint de unicidad en `reservas(sesion_id, user_id)` — previene duplicados
  → Error `23505` capturado en fallback de `/api/reservas/toggle`

## Dudas abiertas

1. ¿Existe la columna `stripe_customer_id` en `perfiles`? El código intenta escribirla pero no hay confirmación de que la columna exista en BD.
2. ¿Existe la columna `stripe_payment_id` en `pagos`? Igual que arriba.
3. ¿Qué políticas RLS existen exactamente en `horarios_clase` y `actividades`? Las writes desde admin browser dependen de esto.
4. ¿La RPC `toggle_reserva` está efectivamente desplegada en Supabase? Si no, todas las reservas van por fallback JS.
5. ¿Qué tablas tienen RLS desactivado? Puede haber tablas sin RLS por error o por decisión no documentada.
6. ¿La tabla `monitores` existe? ¿Tiene datos? ¿Está en uso?
7. ¿El índice en `asistencia(user_id)` se aplicó correctamente en Fase 3A?

## Queries de auditoría recomendadas (NO ejecutar sin autorización)

```sql
-- Verificar columnas de perfiles
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'perfiles'
ORDER BY ordinal_position;

-- Verificar columnas de pagos
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'pagos'
ORDER BY ordinal_position;

-- Verificar RLS activo por tabla
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Ver políticas RLS
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Verificar índices
SELECT indexname, tablename, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename;

-- Verificar si existe la RPC
SELECT proname, prosrc
FROM pg_proc
WHERE proname = 'toggle_reserva';

-- Verificar constraints de unicidad
SELECT conname, contype, conrelid::regclass, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE contype = 'u' AND conrelid::regclass::text IN ('reservas', 'asistencia');
```
