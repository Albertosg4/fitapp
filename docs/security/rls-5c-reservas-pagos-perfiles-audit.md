# Fase 5C - Auditoría RLS reservas, pagos, perfiles y legacy

## Objetivo
Auditar las policies restantes después de 5A/5B y preparar hardening posterior sin aplicar cambios en Supabase.

## Estado base
- Fase 5A aplicada/validada.
- Fase 5B aplicada/validada.
- auth_gym_id() existe.
- sesiones/asistencia ya están gym-scoped.
- reservas/pagos/perfiles/clases quedan pendientes.

## Riesgos conocidos por tabla

Tabla reservas:
- policies actuales esperadas:
  - reservas_insert
  - reservas_select
  - reservas_update
- Riesgo:
  - admin global por get_user_rol() puede ver/update reservas de otros gyms si existen.
- Dependencia positiva:
  - reservas se puede aislar por reservas.sesion_id -> sesiones.gym_id.
- Recomendación:
  - preparar hardening por gym usando sesiones.gym_id.
  - valorar cerrar INSERT/UPDATE directo y forzar RPC/API, pero no hacerlo todavía sin verificar consumo.

Tabla pagos:
- policies actuales esperadas:
  - Admin lee todos los pagos
  - admin_ver_todos_pagos
  - socio_ver_propios_pagos
- Riesgo:
  - admin global por rol admin.
  - duplicidad de policies admin.
- Dependencia positiva:
  - pagos tiene gym_id directo.
- Recomendación:
  - reemplazar policies admin duplicadas por una única admin_ver_pagos_gym_scoped.
  - mantener socio propio.
  - no tocar Stripe hasta validar webhook/API.

Tabla perfiles:
- policies actuales esperadas:
  - perfiles_select_propio
  - perfiles_update_propio
  - perfiles_insert_admin
- Riesgo:
  - update propio demasiado amplio.
  - admin global por get_user_rol().
- Recomendación:
  - mover escrituras sensibles a APIs protegidas si falta alguna.
  - restringir UPDATE directo o eliminarlo después de inventariar uso cliente.
  - no tocar todavía en SQL principal.

Tabla clases legacy:
- policies actuales esperadas:
  - clases_select / insert / update / delete con roles public.
- Riesgo:
  - tabla legacy sin datos ahora, pero policies antiguas siguen abiertas por patrón viejo.
- Recomendación:
  - fase posterior: deprecate/close legacy.
  - no tocar si aún hay código histórico dependiente.

Tabla gimnasios:
- SELECT público ya cerrado en Fase 3D-3B.
- Verificar que solo queda gimnasios_auth.

## Propuesta de fases posteriores

- Fase 5C-A: aplicar hardening reservas.
- Fase 5C-B: aplicar hardening pagos.
- Fase 5C-C: cerrar/reducir perfiles_update_propio.
- Fase 5C-D: deprecate/close clases legacy.
- Fase 5C-E: prueba multi-gym real.

## Criterios antes de aplicar hardening
- precheck ejecutado.
- confirmar que no hay consumo cliente directo incompatible.
- panel socio/admin OK.
- reservas/cancelación OK.
- pagos socio/admin OK.
- Stripe checkout/webhook no afectado.
- test multi-gym preparado o documentado.

## Resultado Fase 5C-A reservas

- Estado: aplicado y validado.
- SQL aplicado: `supabase/fase5C_A_rls_reservas_gym_scoped.sql`.
- Policies nuevas:
  - `reservas_insert_gym_scoped`
  - `reservas_select_gym_scoped`
  - `reservas_update_gym_scoped`
- Conteos:
  - total_reservas = 4
  - reservas_con_sesion_gym_id = 4
  - reservas_sin_sesion_gym_id = 0
- Validación funcional:
  - socio reservas OK
  - reservar/cancelar/reactivar OK
  - admin OK
  - check-in QR OK
- Pendiente:
  - pagos
  - perfiles
  - clases legacy
  - multi-gym real


## Fase 5C-B pagos (preparada, NO aplicada)

- Estado: **preparada**, pendiente de ejecución manual en Supabase.
- SQL principal preparado: `supabase/fase5C_B_rls_pagos_gym_scoped.sql`.
- SQL verificación preparado: `supabase/fase5C_B_rls_pagos_gym_scoped_verificacion.sql`.
- SQL rollback preparado: `supabase/fase5C_B_rls_pagos_gym_scoped_rollback.sql`.
- Alcance:
  - hardening RLS de `public.pagos` usando `gym_id` directo + `public.auth_gym_id()`.
  - consolidación de policies admin duplicadas/globales hacia policy gym-scoped.
  - mantenimiento de lectura de socio sobre sus propios pagos.
- Fuera de alcance explícito:
  - Stripe, checkout y webhooks.
  - UI/lógica de pagos.
  - perfiles.
  - clases legacy.

### Ejecución manual recomendada (en orden)

1. Ejecutar precheck/auditoría si procede:
   - `supabase/fase5C_rls_audit_precheck.sql`
2. Ejecutar hardening pagos:
   - `supabase/fase5C_B_rls_pagos_gym_scoped.sql`
3. Ejecutar verificación de pagos:
   - `supabase/fase5C_B_rls_pagos_gym_scoped_verificacion.sql`
4. Probar flujos funcionales:
   - admin ve pagos de su gym
   - socio ve solo sus pagos
   - Stripe checkout/webhook siguen operativos (sin cambios en esta fase)
5. Solo si todo OK, hacer PR documental posterior marcando Fase 5C-B como aplicada/validada.

### Rollback

- Si falla Fase 5C-B, ejecutar:
  - `supabase/fase5C_B_rls_pagos_gym_scoped_rollback.sql`
- El rollback restaura las policies previas documentadas y no borra datos.
