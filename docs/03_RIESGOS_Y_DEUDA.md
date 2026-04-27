# 03 · Riesgos y Deuda Técnica

> Clasificación: 🔴 Crítico · 🟠 Alto · 🟡 Medio · 🟢 Bajo

---

## 🔴 Crítico

### R-01 · Escrituras admin sin validación server-side en ActividadesTab, HorariosTab, ClasesPuntualesTab

**Descripción:**
Las tabs `ActividadesTab`, `HorariosTab` y `ClasesPuntualesTab` escriben directamente en Supabase
desde el cliente browser usando el `gymId` recibido como prop desde `useAdminData`.
Si RLS no exige que el `gym_id` insertado coincida con el `gym_id` del usuario autenticado,
un admin podría manipular el DOM o interceptar la petición y enviar un `gym_id` diferente.

**Impacto:**
- En multi-tenancy: un admin podría crear/modificar/eliminar datos de otro gimnasio.
- En single-tenant actual: riesgo bajo operacionalmente, pero es deuda de seguridad seria.

**Dónde está:**
- `features/admin/components/ActividadesTab.tsx` — insert/update/delete `actividades`
- `features/admin/components/HorariosTab.tsx` — insert/update/delete `horarios_clase`
- `features/admin/components/ClasesPuntualesTab.tsx` — insert `sesiones`

**Fase recomendada:** 3C — mover escrituras a APIs protegidas con `requireAdmin`

---

### R-02 · RLS no auditado en tablas con escritura directa desde browser

**Descripción:**
No hay confirmación de que `actividades`, `horarios_clase` y `sesiones` tengan políticas RLS
que fuercen `gym_id = (SELECT gym_id FROM perfiles WHERE id = auth.uid())`.
Si no las tienen, R-01 es explotable sin necesidad de manipular el cliente.

**Impacto:** Ídem R-01, potencialmente explotable desde cualquier cliente HTTP.

**Dónde está:** Supabase — políticas de las tablas mencionadas.

**Fase recomendada:** 3D — auditoría y limpieza RLS

---

## 🟠 Alto

### R-03 · `/api/stripe/checkout` no usa `requireSocio`

**Descripción:**
La ruta valida el Bearer token manualmente con un cliente anon en vez de usar `requireSocio`.
No hereda las validaciones de membresía ni el `gymId` del socio.
Además, duplica lógica de autenticación que ya existe en `requireSocio`.

**Impacto:**
- Inconsistencia de seguridad respecto al resto de APIs del socio.
- No valida que el socio pertenece al gimnasio correcto.
- Si se añaden validaciones a `requireSocio`, esta ruta no las heredará.

**Dónde está:** `app/api/stripe/checkout/route.ts`

**Fase recomendada:** 4 (junto con Stripe completo)

---

### R-04 · `stripe_customer_id` y `stripe_payment_id` — columnas no confirmadas en BD

**Descripción:**
El código escribe `stripe_customer_id` en `perfiles` y `stripe_payment_id` en `pagos`,
pero no hay evidencia documental de que esas columnas existan en la BD real.
Si no existen, las operaciones de Stripe fallarán silenciosamente o con error 500.

**Impacto:** Stripe no funcionará en producción si las columnas no existen.

**Dónde está:**
- `app/api/stripe/checkout/route.ts` — lectura/escritura `stripe_customer_id`
- `app/api/stripe/webhook/route.ts` — lectura/escritura `stripe_payment_id`

**Fase recomendada:** 4 — verificar antes de activar Stripe en producción

---

### R-05 · Bug UI reservas: doble clic y texto ambiguo

**Descripción:**
Al pulsar "Reservar plaza" o "Cancelar reserva" no hay protección contra doble envío en el cliente
(el botón no se deshabilita mientras la petición está en vuelo).
El texto "Cancelar reserva" puede no ser suficientemente visible/claro para el usuario.
No hay duplicados reales en BD (la RPC/fallback previene eso), pero la UX es confusa.

**Impacto:**
- UX deficiente — el socio puede creer que la reserva falló.
- Sin duplicados reales, pero posibles llamadas API redundantes.

**Dónde está:** `app/socio/page.tsx` — botón en modal de reserva

**Fase recomendada:** 3B-1

---

### R-06 · `useAdminData` carga socios sin filtrar por `gym_id`

**Descripción:**
`loadSocios` hace `select('*').eq('rol', 'socio')` sin filtrar por `gym_id`.
Si hay múltiples gimnasios en BD, el admin podría ver socios de otro gimnasio.

**Impacto:** Fuga de datos entre gimnasios en multi-tenancy.

**Dónde está:** `features/admin/hooks/useAdminData.ts` — `loadSocios`

**Fase recomendada:** 3B-2

---

### R-07 · `loadStats` no filtra socios activos por `gym_id`

**Descripción:**
`supabase.from('perfiles').select('id', { count: 'exact', head: true }).eq('rol', 'socio').eq('membresia_activa', true)`
no filtra por `gym_id`. El count de socios activos incluye todos los gymnasios.

**Impacto:** Estadísticas incorrectas en multi-tenancy.

**Dónde está:** `features/admin/hooks/useAdminData.ts` — `loadStats`

**Fase recomendada:** 3B-2

---

## 🟡 Medio

### R-08 · `HistorialAsistencia` lee directamente de Supabase sin pasar por API

**Descripción:**
`components/HistorialAsistencia.tsx` usa `supabase` browser para leer la tabla `asistencia`.
Depende de que RLS esté correctamente configurado. Si RLS falla, un socio podría leer
el historial de otro.

**Impacto:** Potencial fuga de historial de asistencia si RLS no es correcto.

**Dónde está:** `components/HistorialAsistencia.tsx`

**Fase recomendada:** 3D — revisar RLS, considerar mover a API

---

### R-09 · Deduplicación de acceso libre en check-in usa zona horaria UTC

**Descripción:**
La deduplicación de acceso libre usa `check_in_at >= YYYY-MM-DDT00:00:00` en UTC.
Si el servidor está en UTC pero el gimnasio está en UTC+2 (España), el "día de hoy"
en BD puede no coincidir con el día real del gimnasio.

**Impacto:** Un socio podría hacer check-in dos veces si entra cerca de medianoche UTC.

**Dónde está:** `app/api/checkin/route.ts` — lógica de deduplicación acceso libre

**Fase recomendada:** 3E (pruebas) o 3F (limpieza)

---

### R-10 · `MESES_POR_TIPO` duplicado en webhook de Stripe

**Descripción:**
`app/api/stripe/webhook/route.ts` define su propio `MESES_POR_TIPO` y `IMPORTE_POR_TIPO`
en lugar de importar de `lib/domain/membresias.ts`. Si se cambian los valores en la fuente
única, el webhook quedará desactualizado.

**Impacto:** Inconsistencia de datos si se cambian importes o duraciones.

**Dónde está:** `app/api/stripe/webhook/route.ts`

**Fase recomendada:** 4

---

### R-11 · `lib/supabase/client.ts` — posible cliente duplicado

**Descripción:**
Existe `lib/supabase/client.ts` además de `lib/supabase.ts`. Si ambos crean instancias
separadas del cliente Supabase, puede haber conflictos de sesión o estado.

**Impacto:** Comportamiento imprevisible de sesión.

**Dónde está:** `lib/supabase.ts` y `lib/supabase/client.ts`

**Fase recomendada:** 3F — verificar si `lib/supabase/client.ts` está en uso y unificar

---

### R-12 · `ModalHistorialSocio` — uso incierto (posible legacy)

**Descripción:**
`components/ModalHistorialSocio.tsx` existe pero no se verifica si sigue en uso activo
o si fue reemplazado por la lógica inline en `SociosTab`.

**Impacto:** Dead code — no hay riesgo funcional pero añade ruido.

**Dónde está:** `components/ModalHistorialSocio.tsx`

**Fase recomendada:** 3F

---

## 🟢 Bajo

### R-13 · Tipo `Clase` y `ClasesTab` marcados LEGACY pero aún en uso

**Descripción:**
`types/domain.ts` marca `Clase` como LEGACY. `features/admin/components/ClasesTab.tsx`
tiene comentario `LEGACY: componente no visible en UI`. Pero el tipo sigue importado
en `useAdminData.ts` (como `Socio`) y ClasesTab sigue existiendo.

**Impacto:** Confusión en mantenimiento. Sin impacto funcional.

**Dónde está:** `types/domain.ts`, `features/admin/components/ClasesTab.tsx`

**Fase recomendada:** 3F

---

### R-14 · `proxy.ts` en raíz del proyecto — propósito no documentado

**Descripción:**
Existe `proxy.ts` en la raíz pero no está claro si es un archivo de configuración activo,
un helper de desarrollo o un residuo.

**Impacto:** Sin impacto conocido. Puede confundir a nuevos colaboradores.

**Dónde está:** `proxy.ts`

**Fase recomendada:** 3F

---

### R-15 · QR generado en cliente — token expuesto en memoria browser

**Descripción:**
El `qr_token` se carga desde Supabase en `cargarPerfil()` y se convierte en imagen QR
en el cliente. Esto es aceptable pero implica que el token está visible en el DOM
y en la memoria del browser. Si el QR se comparte por pantalla, el token queda expuesto.

**Impacto:** Bajo en uso normal. Sin rotación de tokens, si el QR se compromete, el acceso
sigue siendo válido indefinidamente.

**Dónde está:** `features/socio/hooks/useSocioData.ts` — `cargarPerfil`

**Fase recomendada:** Futuro — añadir rotación de `qr_token` o TTL si se requiere

---

## Resumen por prioridad

| ID | Severidad | Fase | Descripción breve |
|----|-----------|------|-------------------|
| R-01 | 🔴 Crítico | 3C | Escrituras admin sin validación server-side |
| R-02 | 🔴 Crítico | 3D | RLS no auditado en tablas con escritura browser |
| R-03 | 🟠 Alto | 4 | `/api/stripe/checkout` no usa `requireSocio` |
| R-04 | 🟠 Alto | 4 | Columnas Stripe no confirmadas en BD |
| R-05 | 🟠 Alto | 3B-1 | Bug UI doble clic + texto ambiguo en reservas |
| R-06 | 🟠 Alto | 3B-2 | `loadSocios` sin filtro gym_id |
| R-07 | 🟠 Alto | 3B-2 | `loadStats` socios sin filtro gym_id |
| R-08 | 🟡 Medio | 3D | `HistorialAsistencia` lee BD directamente |
| R-09 | 🟡 Medio | 3E | Deduplicación check-in usa UTC |
| R-10 | 🟡 Medio | 4 | `MESES_POR_TIPO` duplicado en webhook Stripe |
| R-11 | 🟡 Medio | 3F | Posible cliente Supabase duplicado |
| R-12 | 🟡 Medio | 3F | `ModalHistorialSocio` posible legacy |
| R-13 | 🟢 Bajo | 3F | Tipo `Clase` y `ClasesTab` legacy sin limpiar |
| R-14 | 🟢 Bajo | 3F | `proxy.ts` sin propósito documentado |
| R-15 | 🟢 Bajo | Futuro | QR sin rotación de token |
