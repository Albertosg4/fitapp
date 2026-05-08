# Siguiente PR seguro recomendado

## Siguiente fase recomendada

Fase 8B - Pulido visual seguro de app real gimnasio.

No implementar Fase 8B en este PR. Este documento solo deja preparada la siguiente fase recomendada.

## Objetivo

Hacer que `/admin` y `/socio` parezcan un producto mas vendible sin tocar backend.

El foco debe estar en claridad, confianza y facilidad de demo: que un gimnasio vea rapido que puede gestionar socios, clases, reservas, pagos y check-in sin encontrarse pantallas confusas o vacias.

## Alcance permitido

- Mejoras visuales en `/admin`.
- Mejoras visuales en `/socio`.
- Estados vacios para actividades, horarios, clases, socios, pagos, historial y reservas.
- Mensajes de interfaz mas claros.
- Mejor jerarquia visual en tarjetas, tabs y tablas.
- Mejor responsive movil/desktop.
- Ajustes de copy de gimnasio real.
- Reutilizar componentes UI existentes si encaja.

## Fuera de alcance

- No tocar backend.
- No tocar Supabase.
- No tocar SQL.
- No tocar RLS.
- No tocar Auth.
- No tocar Stripe.
- No tocar APIs.
- No cambiar rutas reales.
- No crear usuarios demo.
- No crear credenciales.
- No cambiar datos reales.
- No avanzar multi-sector real.
- No meter componentes demo en `/admin` o `/socio`.

## Archivos candidatos

- `app/admin/page.tsx`
- `app/socio/page.tsx`
- `features/admin/components/ActividadesTab.tsx`
- `features/admin/components/HorariosTab.tsx`
- `features/admin/components/ClasesPuntualesTab.tsx`
- `features/admin/components/SociosTab.tsx`
- `features/admin/components/PagosTab.tsx`
- `features/socio/components/SocioClasesTab.tsx`
- `features/socio/components/SocioHistorialTab.tsx`
- `features/socio/components/SocioPagosTab.tsx`
- `features/socio/components/SocioQRTab.tsx`
- `features/socio/components/SocioPerfilTab.tsx`
- `components/HistorialPagos.tsx`
- `components/HistorialAsistencia.tsx`
- `components/CalendarioMes.tsx`
- `components/ui/*`

## Testing

- `npm run lint`
- `npm run build`
- `node scripts/verify-real-gym-boundaries.mjs`
- Prueba manual de `/admin`.
- Prueba manual de `/socio`.
- Prueba manual de `/checkin` si se tocan componentes compartidos.

Si `npm run build` falla solo por Google Fonts o red externa, documentarlo como ambiental y no mezclarlo con cambios funcionales.

## Validacion manual

- [ ] Login admin funciona.
- [ ] Dashboard admin carga sin errores visibles.
- [ ] Tabs admin no rompen responsive.
- [ ] Estados vacios admin se entienden.
- [ ] Login socio funciona.
- [ ] Calendario y clases socio se entienden.
- [ ] Reserva/cancelacion siguen igual.
- [ ] Pagos se ven claros aunque Stripe quede fuera de alcance.
- [ ] QR sigue visible.
- [ ] Perfil y logout siguen funcionando.
- [ ] `/demo` no se mezcla con app real.

## Riesgos

- Riesgo de tocar demasiado y cambiar comportamiento sin querer.
- Riesgo de romper estilos inline existentes por refactor grande.
- Riesgo de introducir copy multi-sector en la app real.
- Riesgo de ocultar estados o botones necesarios.
- Riesgo de no probar movil.

La regla para Fase 8B debe ser simple: solo presentacion y claridad. Cualquier cambio de datos, permisos, pagos o API debe salir a otra fase.

## Estado actualizado

Fase 8B implementada/en curso.

Siguiente recomendado: Fase 8C — Hardening de errores y mensajes usuario.

- Fase 8C implementada/en curso: hardening de mensajes de error visibles en la app real (/admin y /socio) sin cambios de lógica.
- Siguiente recomendado: Fase 8D — Checklist funcional de venta y smoke test no destructivo.

## Estado Fase 8D

- Fase 8D implementada/en curso.
- Esta fase añade checklist funcional de venta y smoke test no destructivo.
- No tocar Stripe en esta fase 8D.
- Stripe se revisará aparte.

## Siguiente recomendado

- Fase 8E — Auditoría separada de pagos/Stripe.
