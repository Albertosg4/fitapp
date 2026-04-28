# 02 · Supabase — Estado conocido

> Documento de estado operativo. No implica que RLS esté completamente saneado.

## Estado actual

- Producción operativa.
- Las escrituras admin principales ya migraron a API protegida (server-side).
- RLS **sigue pendiente** de auditoría fina y limpieza.

## Sobre RLS y policies (importante)

- ❗ **No afirmar que RLS está perfecto**: el estado actual requiere revisión formal.
- Existen policies antiguas/mixtas que deben auditarse antes de tocar.
- Hay que validar compatibilidad real con escenarios multi-gimnasio.

## Hitos previos ya aplicados

- **Fase 3A**: índices, constraints y RPC `toggle_reserva`.
- **Fase 3A1**: corrección de `toggle_reserva` usando `v_reserva_existe`.
- **Fase 3D-1**: auditoría live de RLS/policies (solo lectura) en Supabase project ref `bfhifmvndqyxhseqrivu`.

## Hallazgos críticos confirmados en 3D-1

- `public.perfiles`:
  - policy **"leer perfiles"** con `qual = true` (apertura global de lectura).
- `public.clases`:
  - policy **"admin puede gestionar clases"** con `qual = true` y `with_check = true`.
- Hallazgos adicionales relevantes:
  - duplicidad/legacy en `perfiles` (`"usuarios pueden leer su perfil"` duplicando `"perfiles_select_propio"`).
  - policy legacy amplia en `clases` (`"socios pueden leer clases"` con `qual = true`).
  - funciones sensibles `get_user_rol()` y `toggle_reserva(...)` con EXECUTE para `anon` (innecesario).

## Fase 3D-2A (preparación, sin aplicar)

En esta fase se preparan archivos SQL de:

1. limpieza crítica,
2. rollback,
3. verificación post-aplicación.

**Importante:** en 3D-2A **NO** se aplican cambios en Supabase live.

## No ejecutar cambios RLS sin fase específica

Cualquier cambio de policies RLS debe hacerse en fase dedicada, con:

1. Inventario de policies actuales.
2. Plan de rollback listo.
3. Pruebas funcionales y de aislamiento multi-gimnasio.
4. Aplicación controlada por lotes.

## Requisito operativo para aplicar 3D-2A

- Ejecutar en ventana controlada.
- Validar pruebas multi-gimnasio antes y después.
- Revisar el SQL de verificación y confirmar que no queden policies críticas/abiertas.

## Escrituras admin ya protegidas antes de RLS fina

Antes de completar la fase de RLS, ya se movieron a APIs protegidas las escrituras admin principales de:

- `actividades`
- `horarios_clase`
- `sesiones` puntuales
- toggles de socios/membresía

## Pendientes explícitos

- Auditar policies actuales una por una.
- Detectar policies abiertas tipo `USING true` o `TO public`.
- Preparar y validar rollback antes de modificar.
- Probar con datos multi-gimnasio reales.
