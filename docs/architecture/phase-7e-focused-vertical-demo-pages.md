# Fase 7E — Focused vertical demo pages

## Objetivo

Crear páginas públicas de demo enfocadas por vertical para compartir enlaces específicos con cada cliente potencial.

## Necesidad comercial

- Una peluquería debe recibir `/demo/peluqueria`.
- Una clínica debe recibir `/demo/clinica`.
- Un gimnasio debe recibir `/demo/gimnasio`.

Así se evita que un cliente vea primero sectores no relevantes para su caso.

## Relación con `/demo`

`/demo` se mantiene como demo general multi-negocio para discovery global.

## Confirmaciones de alcance

- Sin Supabase.
- Sin Auth.
- Sin SQL.
- Sin credenciales.
- Sin datos reales.
- Sin cambios de permisos.

## Checklist manual

- `/demo` sigue funcionando como demo multi-vertical.
- `/demo/gimnasio` carga enfoque gym directamente.
- `/demo/clinica` carga enfoque clinic directamente.
- `/demo/academia` carga enfoque academy directamente.
- `/demo/peluqueria` carga enfoque beauty directamente.
- `/demo/generico` carga enfoque generic directamente.
- Ninguna página publica credenciales reales.

## Nota de sincronización del provider

- `VerticalSettingsProvider` sincroniza `initialVertical` durante navegación client-side entre rutas enfocadas (`/demo/*`).
- Con `persistPreview=false`, el provider no usa `localStorage` y mantiene la vertical fija por ruta.
