# Fase 7F — Interactive vertical demo simulator

## Objetivo
Habilitar demos públicas por vertical con interacción real de UI (admin/usuario) en modo 100% simulado.

## Qué cambia
- La demo online pasa de ser principalmente informativa a incluir acciones de prueba simuladas.
- Se añaden rutas `/demo/*/probar` para cada vertical.

## Límites de la simulación
- No hay Auth ni Supabase.
- No hay datos reales ni credenciales reales.
- Reservar/cancelar/check-in usan solo `useState` local en cliente.
- No se modifica ningún dato persistido ni configuración real.

## Rutas nuevas
- `/demo/gimnasio/probar`
- `/demo/clinica/probar`
- `/demo/academia/probar`
- `/demo/peluqueria/probar`
- `/demo/generico/probar`

## Checklist manual
- Cargar cada ruta sin login.
- Alternar entre “Vista admin” y “Vista usuario”.
- Simular reservar/cancelar y repetir ciclo.
- Verificar QR activo solo donde aplique por vertical.
- Pulsar “Reset demo” y validar estado inicial.
