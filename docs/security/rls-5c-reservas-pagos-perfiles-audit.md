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


## Resultado Fase 5C-B pagos

- Estado: aplicado y validado.
- SQL aplicado: `supabase/fase5C_B_rls_pagos_gym_scoped.sql`.
- Verificación ejecutada: `supabase/fase5C_B_rls_pagos_gym_scoped_verificacion.sql`.
- Rollback: no ejecutado.
- Policies finales activas:
  - `admin_ver_pagos_gym_scoped`
  - `socio_ver_propios_pagos_gym_scoped`
- Conteos de verificación:
  - `total_pagos = 10`
  - `pagos_con_gym_id = 10`
  - `pagos_sin_gym_id = 0`
- Validación funcional post-aplicación:
  - admin login: OK
  - admin pagos: OK
  - ficha socio pagos: OK
  - panel socio: OK
  - historial pagos socio: OK
  - reservas/calendario: OK
  - check-in QR: OK
- Fuera de alcance y no tocado:
  - Stripe
  - checkout
  - webhooks
  - UI/lógica de pagos
  - perfiles
  - clases legacy

## Resultado Fase 5C-E multi-gym controlada

- Estado: **aplicada y validada**.
- SQL ejecutados:
  - Setup: `supabase/fase5C_E_multigym_control_setup.sql`
  - Verificación: `supabase/fase5C_E_multigym_control_verificacion.sql`
- Rollback: **no ejecutado**.
- IDs demo principales:
  - `gym_id` real JGS: `b94be501-cdb4-4e48-a525-e0a669ad0967`
  - `gym_id` demo: `b89abc75-8eb2-4dbf-8b32-f4586c75cccf`
  - admin demo auth user id: `28070f8a-b271-49e6-8343-649b2c1d0bfb`
  - socio demo auth user id: `b87084ff-124c-4b90-a96b-6bf0f52c16bc`
  - pago demo id: `7af31e24-78fc-48f6-bb17-7f5f23975004`
  - sesión demo id: `2011c378-93ce-438c-b058-3a9eba67cfa6`
  - reserva demo id: `77f3024b-af3b-4e3f-a942-e99a221092e3`
- Checks de aislamiento:
  - `pagos_user_gym_mismatch = 0`
  - `reservas_user_session_gym_mismatch = 0`
- Validación funcional app: **OK** (admin/socio JGS y demo con aislamiento correcto).
- Alcance:
  - Sin cambios de policies RLS en 5C-E.
  - `perfiles_update_propio` y `clases` legacy siguen pendientes.
  - Stripe/checkout/webhooks fuera de alcance y sin cambios.

## Resultado Fase 5C-C perfiles_update_propio

- Estado: **aplicada y validada**.
- SQL aplicado: `supabase/fase5C_C_rls_perfiles_update_hardening.sql`.
- Verificación ejecutada: `supabase/fase5C_C_rls_perfiles_update_hardening_verificacion.sql`.
- Rollback disponible: `supabase/fase5C_C_rls_perfiles_update_hardening_rollback.sql` (**no ejecutado**).
- Policies UPDATE cerradas en `public.perfiles`:
  - `actualizar perfil propio`: ausente
  - `admin_update_perfiles_su_gym`: ausente
  - `perfiles_update_propio`: ausente
  - `usuarios pueden actualizar su perfil`: ausente
- Resultado consolidado: **0 policies UPDATE** en `public.perfiles`.
- `perfiles_select_propio` sigue activa.
- Validación funcional app: **OK** (admin/socio JGS y demo, incluyendo socios, pagos manuales, QR, reservas/calendario e historial de pagos).
- Stripe/Auth/checkout/webhooks fuera de alcance y sin cambios.
- Sin cambios sobre reservas/pagos/sesiones/asistencia en esta fase; no se ejecutó rollback.

## Resultado Fase 5C-D clases legacy (preparada, NO aplicada)

- Estado: **preparada, NO aplicada**.
- Auditoría de código (repo):
  - No se detectaron usos runtime de `.from('clases')` / `.from("clases")` en frontend ni APIs activas.
  - Las referencias vigentes de `clases` son mayoritariamente:
    - tipado legacy (`types/domain.ts`, interfaz `Clase`)
    - SQL histórico/migraciones
    - documentación
    - joins de lectura histórica en asistencia/sesiones
- SQL manual preparado:
  - `supabase/fase5C_D_rls_clases_legacy_precheck.sql`
  - `supabase/fase5C_D_rls_clases_legacy_hardening.sql`
  - `supabase/fase5C_D_rls_clases_legacy_verificacion.sql`
  - `supabase/fase5C_D_rls_clases_legacy_rollback.sql`
- Ejecución manual prevista: precheck → hardening → verificación (rollback solo si falla).
- Alcance fuera de fase: Stripe/checkout/webhooks/Auth.
- Nota: **No SQL was applied in Supabase by this PR.**
