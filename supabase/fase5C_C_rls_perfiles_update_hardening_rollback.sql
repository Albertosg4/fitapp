-- Fase 5C-C (ROLLBACK)
-- SOLO ejecutar si falla Fase 5C-C.
-- Restaura policy legacy amplia de UPDATE propio.
-- No borra datos. No toca Auth. No toca Stripe.

begin;

drop policy if exists perfiles_update_propio on public.perfiles;

create policy perfiles_update_propio
on public.perfiles
for update
to authenticated
using ((auth.uid() = id))
with check ((auth.uid() = id));

create policy "admin_update_perfiles_su_gym"
on public.perfiles
for update
to authenticated
using (
  gym_id = auth_gym_id()
  and exists (
    select 1 from perfiles p
    where p.id = auth.uid() and p.rol = 'admin'
  )
);

commit;
