# 04 · Plan de Fases

> Estado actual: Fases 1–3A aplicadas. Refactor de admin y socio completo.
> Punto de partida: commit `ca21e69`

---

## Fase 3B-1 · Fix UI reservas

**Objetivo:** Corregir UX del modal de reserva en `/socio` — doble clic y texto ambiguo.

**Archivos probables:**
- `app/socio/page.tsx` — botón del modal de reserva
- `features/socio/hooks/useSocioData.ts` — posiblemente añadir flag `reservando`

**SQL:** No

**Cambios:**
- Añadir estado `reservando: boolean` en `useSocioData` (o local en página)
- Deshabilitar botón mientras `reservando === true`
- Mostrar texto claro: "Reservando..." durante la petición
- Revisar que "Cancelar reserva" es visualmente distinto de "Reservar plaza"
- No cambiar lógica de negocio

**Riesgo:** Bajo — solo UI, sin cambios en API ni BD

**Pruebas manuales:**
- [ ] Pulsar "Reservar plaza" — el botón se deshabilita durante la petición
- [ ] Pulsar "Cancelar reserva" — ídem
- [ ] Doble clic rápido no genera dos llamadas API
- [ ] El estado vuelve a normal tras la respuesta
- [ ] El modal muestra correctamente "Reservar plaza" / "Cancelar reserva" según estado

**Rollback:** `git revert` del commit — sin impacto en BD

---

## Fase 3B-2 · Filtros gym_id en admin

**Objetivo:** Añadir filtro `gym_id` en `loadSocios` y `loadStats` del hook admin.

**Archivos probables:**
- `features/admin/hooks/useAdminData.ts` — `loadSocios`, `loadStats`

**SQL:** No

**Cambios:**
- `loadSocios`: añadir `.eq('gym_id', gymId)` — requiere que `gymId` esté disponible
  - Nota: `loadSocios` se llama en `init()` junto con `loadStats(gym.id)` —
    pasar `gymId` como parámetro a `loadSocios` también
- `loadStats`: añadir filtro `gym_id` al count de socios activos

**Riesgo:** Bajo-medio — en single tenant no cambia comportamiento.
En multi-tenant, el admin solo verá sus socios. Verificar en local.

**Pruebas manuales:**
- [ ] Admin ve solo sus socios
- [ ] Estadísticas de socios activos son correctas
- [ ] No se rompe ningún flujo de admin

**Rollback:** `git revert` — sin impacto en BD

---

## Fase 3C · Escrituras admin vía APIs protegidas

**Objetivo:** Mover operaciones de escritura de `ActividadesTab`, `HorariosTab` y
`ClasesPuntualesTab` a rutas API protegidas con `requireAdmin`.

**Archivos probables:**
- `app/api/actividades/route.ts` — nueva API (GET, POST, PATCH, DELETE)
- `app/api/horarios/route.ts` — nueva API
- `app/api/sesiones/puntuales/route.ts` — nueva API
- `features/admin/components/ActividadesTab.tsx` — reemplazar writes directos
- `features/admin/components/HorariosTab.tsx` — ídem
- `features/admin/components/ClasesPuntualesTab.tsx` — ídem

**SQL:** No — solo cambio de cómo se hacen las escrituras, no el esquema

**Riesgo:** Alto — mucho código a mover. Hacer una tab a la vez.
Los reads desde browser pueden mantenerse si RLS es correcto.
Solo las escrituras (insert/update/delete) deben ir a APIs.

**Pruebas manuales:**
- [ ] Crear actividad desde admin funciona
- [ ] Editar/desactivar actividad funciona
- [ ] Crear horario recurrente funciona
- [ ] Editar/eliminar horario funciona
- [ ] Crear clase puntual funciona
- [ ] Cancelar clase puntual funciona
- [ ] Los errores se muestran correctamente al usuario

**Rollback:** Revertir las nuevas APIs y restaurar writes directos a supabase browser

---

## Fase 3D · Auditoría y limpieza RLS/policies

**Objetivo:** Confirmar qué tablas tienen RLS activo y qué policies existen.
Añadir o corregir las que sean necesarias.

**Archivos probables:**
- Ninguno en el repo — solo scripts SQL en Supabase
- Documentar resultado en `docs/02_SUPABASE_ESTADO.md`

**SQL:** Sí — queries de auditoría (ver `02_SUPABASE_ESTADO.md`) + posibles ALTER POLICY

**Riesgo:** Alto — cambiar RLS puede romper accesos existentes.
Hacer en entorno de staging o con rollback preparado.

**Pruebas manuales:**
- [ ] Socio ve solo sus datos (reservas, asistencia, perfil)
- [ ] Admin ve los datos de su gimnasio
- [ ] Admin NO puede ver datos de otro gimnasio
- [ ] Checkin sigue funcionando (usa service_role — no afectado por RLS)
- [ ] APIs de pagos siguen funcionando

**Rollback:** `ALTER POLICY` o `DROP POLICY` + restaurar desde backup

---

## Fase 3E · Pruebas multi-gimnasio

**Objetivo:** Verificar que el aislamiento de datos entre gimnasios es completo.

**Archivos probables:**
- No hay cambios de código — solo pruebas con datos de dos gimnasios

**SQL:** Sí — crear segundo gimnasio de prueba y segundo admin

**Riesgo:** Bajo — solo pruebas, sin cambios en producción

**Pruebas manuales:**
- [ ] Admin gym A no ve socios de gym B
- [ ] Admin gym A no puede registrar pagos de socios de gym B
- [ ] Socio gym A no ve clases de gym B
- [ ] Check-in con QR de gym B falla si el lector es de gym A (si aplica)
- [ ] Borrar datos de prueba al finalizar

**Rollback:** Eliminar datos de prueba del segundo gimnasio

---

## Fase 3F · Limpieza legacy

**Objetivo:** Eliminar o marcar explícitamente el código legacy que ya no se usa.

**Archivos probables:**
- `features/admin/components/ClasesTab.tsx` — verificar si sigue montado en `app/admin/page.tsx`
- `types/domain.ts` — eliminar tipo `Clase` si ya no se usa
- `components/ModalHistorialSocio.tsx` — verificar si está en uso
- `lib/supabase/client.ts` — verificar si duplica `lib/supabase.ts`
- `proxy.ts` — verificar propósito y eliminar si es residuo

**SQL:** No

**Riesgo:** Bajo — solo limpieza. Verificar en local antes de eliminar.

**Pruebas manuales:**
- [ ] `npm run build` sin errores tras eliminar archivos
- [ ] `npm run lint` sin warnings
- [ ] Admin y socio funcionan igual que antes

**Rollback:** `git revert`

---

## Fase 4 · Stripe y pagos finales

**Objetivo:** Completar el flujo Stripe: confirmar columnas en BD, unificar auth con
`requireSocio`, importar constantes desde fuente única, añadir manejo de errores y emails.

**Archivos probables:**
- `app/api/stripe/checkout/route.ts` — usar `requireSocio`, validar gym_id
- `app/api/stripe/webhook/route.ts` — importar desde `lib/domain/membresias.ts`
- SQL: verificar/añadir `stripe_customer_id` en `perfiles` y `stripe_payment_id` en `pagos`

**SQL:** Posiblemente sí — añadir columnas si no existen

**Riesgo:** Alto — toca flujo de pagos real. Probar en modo test de Stripe primero.

**Pruebas manuales:**
- [ ] Iniciar checkout desde SocioPagosTab
- [ ] Completar pago en Stripe (modo test)
- [ ] Webhook recibe evento y actualiza membresía
- [ ] Idempotencia: reenviar mismo evento no duplica pago
- [ ] Stripe customer se crea correctamente
- [ ] Error en checkout muestra mensaje al usuario

**Rollback:** Revertir cambios en API. Las columnas nuevas no rompen nada al revertir el código.

---

## Fase 5 · QA final y deploy estable

**Objetivo:** Checklist completo de todas las funcionalidades antes de considerar el proyecto
en estado de producción estable documentado.

**Archivos probables:**
- `docs/05_RUNBOOK_TESTS.md` — ejecutar checklist completo
- Sin cambios de código salvo fixes puntuales encontrados en QA

**SQL:** No — solo lectura para verificar datos

**Riesgo:** Ninguno si no hay cambios de código

**Pruebas manuales:** Ver `docs/05_RUNBOOK_TESTS.md` completo

**Rollback:** No aplica

---

## Resumen del plan

| Fase | Objetivo | SQL | Riesgo | Estado |
|------|----------|-----|--------|--------|
| 3B-1 | Fix UI reservas | No | Bajo | ⏳ Pendiente |
| 3B-2 | Filtros gym_id admin | No | Bajo | ⏳ Pendiente |
| 3C | Escrituras admin a APIs | No | Alto | ⏳ Pendiente |
| 3D | Auditoría RLS | Sí | Alto | ⏳ Pendiente |
| 3E | Pruebas multi-gimnasio | Sí (test) | Bajo | ⏳ Pendiente |
| 3F | Limpieza legacy | No | Bajo | ⏳ Pendiente |
| 4 | Stripe completo | Posiblemente | Alto | ⏳ Pendiente |
| 5 | QA final | No | Ninguno | ⏳ Pendiente |
