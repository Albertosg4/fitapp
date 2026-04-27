# 03 · Riesgos y Deuda Técnica

## Resumen

Este documento reclasifica riesgos tras completar 3B y 3C (hasta 3C-4).

## Riesgos mitigados / completados

- ✅ **R-01** — Escrituras admin directas en actividades/horarios/clases puntuales: **mitigado/completado** en fases 3C-1/2/3.
- ✅ **R-05** — Bug de reservas por doble clic: **completado** (3B-1).
- ✅ **R-06** — `loadSocios` sin filtro `gym_id`: **completado** (3B-2).
- ✅ **R-07** — `loadStats` sin filtro `gym_id`: **completado** (3B-2).

## Riesgos pendientes (se mantienen)

- ⏳ Auditoría RLS/policies global.
- ⏳ Stripe end-to-end completo.
- ⏳ Historial/asistencia si hay lecturas directas aún dependientes de RLS.
- ⏳ Revisión de check-in y zona horaria UTC (si aplica según entorno).
- ⏳ Limpieza legacy.
- ⏳ QR sin rotación periódica.

## Riesgo nuevo pendiente

- ⚠️ **Stripe webhook con posible lógica antigua de membresías**: debe revisarse en fase Stripe.
  - Contexto: en PR #7 no se tocó Stripe por alcance.

## Nota de deuda técnica activa

- Aunque se mitigaron las escrituras admin principales, queda pendiente una **auditoría global de escrituras directas restantes** en cliente/hook/componentes para cerrar superficie de riesgo.
