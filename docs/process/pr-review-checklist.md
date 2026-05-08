# Checklist de revisión de PR

## Seguridad

- [ ] No toca SQL salvo fase explícita.
- [ ] No toca RLS salvo fase explícita.
- [ ] No toca Auth salvo fase explícita.
- [ ] No toca Stripe salvo fase explícita.
- [ ] No introduce credenciales.
- [ ] No introduce usuarios demo reales.
- [ ] No cambia `gym_id` sin fase explícita.

## Frontera app real vs demo

- [ ] `/admin` no importa componentes demo.
- [ ] `/socio` no importa componentes demo.
- [ ] `/admin` no usa `VerticalSettingsProvider`.
- [ ] `/socio` no usa `VerticalSettingsProvider`.
- [ ] `/admin` y `/socio` no dependen de `settings.features`.
- [ ] `/admin` y `/socio` no ocultan pagos/QR/historial por vertical.
- [ ] `/demo` sigue funcionando si el PR toca demo.

## Validación mínima

- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] `node scripts/verify-real-gym-boundaries.mjs`
- [ ] `/admin` probado
- [ ] `/socio` probado
- [ ] flujo afectado probado
- [ ] si build falla por Google Fonts/Geist, documentado como ambiental

## Decisión de merge

- [ ] PR pequeño o mediano/grande pero con alcance claro.
- [ ] Rollback claro si toca datos.
- [ ] Sin mezcla de temas peligrosos.
