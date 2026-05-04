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

## Resultado Fase 5C-E (preparación multi-gym controlada)

- Estado: **preparada, no aplicada**.
- Se prepararon scripts SQL manuales:
  - `supabase/fase5C_E_multigym_control_precheck.sql`
  - `supabase/fase5C_E_multigym_control_setup.sql`
  - `supabase/fase5C_E_multigym_control_verificacion.sql`
  - `supabase/fase5C_E_multigym_control_rollback.sql`
- Condiciones de ejecución:
  - Crear usuarios demo manualmente en Auth Dashboard.
  - Reemplazar placeholders `__DEMO_ADMIN_AUTH_USER_ID__` y `__DEMO_SOCIO_AUTH_USER_ID__` antes de setup.
  - El setup aborta si esos UUIDs ya están ligados a perfiles reales/no-demo.
- Alcance:
  - No cambios de policies RLS en 5C-E.
  - No cambios en `perfiles_update_propio`.
  - Stripe/checkout/webhook fuera de alcance.
- Rollback preparado con controles de seguridad para no tocar datos reales de JGS Fight Team.
