-- Fase 5C-C (SQL PRINCIPAL)
-- Objetivo: cerrar UPDATE directo de perfiles desde cliente authenticated.
-- Contexto de auditoría: no hay .from('perfiles').update desde cliente/browser;
-- los updates actuales de perfiles pasan por APIs server-side con supabaseAdmin (service_role).
--
-- IMPORTANTE:
-- - Ejecutar manualmente en Supabase SQL Editor.
-- - No toca Auth users.
-- - No toca Stripe/checkout/webhooks.
-- - No toca reservas/pagos/sesiones/asistencia.

begin;

-- 1) Cerrar policy legacy amplia (si existe)
drop policy if exists perfiles_update_propio on public.perfiles;

-- 2) Defensa explícita: denegar UPDATE para authenticated en perfiles
--    (si una policy previa lo permitía por nombre alternativo).
--    En PostgreSQL RLS no existe policy "deny"; el cierre se logra dejando sin policy UPDATE aplicable.
--    Este bloque elimina variantes conocidas del repositorio/histórico.
drop policy if exists "usuarios pueden actualizar su perfil" on public.perfiles;
drop policy if exists "actualizar perfil propio" on public.perfiles;

comment on table public.perfiles is
  'Fase 5C-C: UPDATE directo de cliente cerrado; cambios de perfil por API protegida con service_role.';

commit;
