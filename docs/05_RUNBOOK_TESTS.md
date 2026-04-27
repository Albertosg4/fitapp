# 05 · Runbook de Tests Manuales

> Ejecutar este checklist completo antes de cualquier deploy a producción.
> Marcar cada ítem con ✅ (ok), ❌ (fallo) o ⚠️ (comportamiento inesperado a documentar).

---

## Pruebas de autenticación

| # | Acción | Resultado esperado | Estado |
|---|--------|--------------------|--------|
| A-01 | Login con admin@fitapp.com / Admin1234! | Redirige a /admin | |
| A-02 | Login con socio@fitapp.com / Socio1234! | Redirige a /socio | |
| A-03 | Login con credenciales incorrectas | Muestra error, no redirige | |
| A-04 | Acceder a /admin sin sesión | Redirige a / | |
| A-05 | Acceder a /socio sin sesión | Redirige a / | |
| A-06 | Cerrar sesión desde admin | Redirige a / | |
| A-07 | Cerrar sesión desde socio | Redirige a / | |
| A-08 | Recargar página con sesión activa | Mantiene sesión y vista correcta | |

---

## Pruebas de socio

### Calendario y clases
| # | Acción | Resultado esperado | Estado |
|---|--------|--------------------|--------|
| S-01 | Ver pestaña Clases | Muestra calendario semanal | |
| S-02 | Navegar semana siguiente/anterior | El calendario avanza/retrocede correctamente | |
| S-03 | Seleccionar un día | Muestra clases del día | |
| S-04 | Seleccionar día sin clases | Muestra "no hay clases" o lista vacía | |
| S-05 | Abrir modal de una clase | Muestra nombre, hora, profesor, ocupación y estado reserva | |
| S-06 | Ocupación correcta | El contador de plazas refleja reservas reales | |
| S-07 | Clase completa | Botón deshabilitado, texto "Clase completa" | |

### Reservas
| # | Acción | Resultado esperado | Estado |
|---|--------|--------------------|--------|
| S-08 | Reservar una clase disponible | Botón cambia a "Cancelar reserva", contador +1 | |
| S-09 | Cancelar una reserva | Botón vuelve a "Reservar plaza", contador -1 | |
| S-10 | Reservar con membresía caducada | Error 403, mensaje claro al usuario | |
| S-11 | Pulsar botón reserva dos veces rápido | Solo se ejecuta una acción (tras Fase 3B-1) | |
| S-12 | Reservar clase de otro gimnasio (si multi-tenant) | Error 403 | |

### Perfil y membresía
| # | Acción | Resultado esperado | Estado |
|---|--------|--------------------|--------|
| S-13 | Ver pestaña Perfil | Muestra nombre, tipo membresía, fecha vencimiento | |
| S-14 | Membresía activa con > 7 días | Sin banner de aviso | |
| S-15 | Membresía activa con ≤ 7 días | Banner amarillo con días restantes | |
| S-16 | Membresía caducada | Banner rojo, funciones de reserva bloqueadas | |

### QR
| # | Acción | Resultado esperado | Estado |
|---|--------|--------------------|--------|
| S-17 | Ver pestaña Mi QR | Muestra código QR | |
| S-18 | QR no está vacío | La imagen QR es visible y tiene contenido | |

### Historial
| # | Acción | Resultado esperado | Estado |
|---|--------|--------------------|--------|
| S-19 | Ver pestaña Historial | Muestra asistencias pasadas | |
| S-20 | Sin asistencias | Muestra "sin historial" o lista vacía | |

### Pagos socio
| # | Acción | Resultado esperado | Estado |
|---|--------|--------------------|--------|
| S-21 | Ver pestaña Pagos | Muestra historial de pagos del socio | |
| S-22 | Iniciar pago Stripe (modo test) | Redirige a Stripe Checkout | |
| S-23 | Completar pago en Stripe (modo test) | Redirige a /socio?pago=ok, banner verde | |
| S-24 | Cancelar pago en Stripe | Redirige a /socio?pago=cancel, banner rojo | |

---

## Pruebas de admin

### Actividades
| # | Acción | Resultado esperado | Estado |
|---|--------|--------------------|--------|
| AD-01 | Ver pestaña Actividades | Lista de actividades del gimnasio | |
| AD-02 | Crear actividad nueva | Aparece en lista | |
| AD-03 | Activar/desactivar actividad | Estado cambia | |

### Horarios
| # | Acción | Resultado esperado | Estado |
|---|--------|--------------------|--------|
| AD-04 | Ver pestaña Horarios | Lista de horarios recurrentes | |
| AD-05 | Crear horario recurrente | Aparece en lista y en vista socio | |
| AD-06 | Activar/desactivar horario | Horario aparece/desaparece en vista socio | |

### Clases puntuales
| # | Acción | Resultado esperado | Estado |
|---|--------|--------------------|--------|
| AD-07 | Ver pestaña Clases Puntuales | Lista de sesiones puntuales | |
| AD-08 | Crear clase puntual | Aparece en lista | |
| AD-09 | Cancelar clase puntual | Estado cambia a cancelada | |

### Socios
| # | Acción | Resultado esperado | Estado |
|---|--------|--------------------|--------|
| AD-10 | Ver pestaña Socios | Lista de socios del gimnasio | |
| AD-11 | Registrar nuevo socio | Aparece en lista, puede iniciar sesión | |
| AD-12 | Activar socio inactivo | Estado cambia a activo | |
| AD-13 | Desactivar socio activo | Estado cambia a inactivo | |
| AD-14 | Abrir historial de asistencia de un socio | Muestra asistencias | |
| AD-15 | Registrar pago manual (efectivo/transferencia) | Aparece en historial de pagos del socio | |
| AD-16 | Registrar cortesía | Importe = 0, membresía renovada | |
| AD-17 | Registrar pago pendiente | Estado = pendiente en historial | |
| AD-18 | Confirmar pago pendiente | Estado cambia a pagado, membresía renovada | |

### Pagos globales
| # | Acción | Resultado esperado | Estado |
|---|--------|--------------------|--------|
| AD-19 | Ver pestaña Pagos | Lista de todos los pagos del gimnasio | |
| AD-20 | Filtrar por nombre de socio | Solo muestra pagos de ese socio | |
| AD-21 | Filtrar por estado (pagado/pendiente) | Filtra correctamente | |
| AD-22 | Filtrar por mes | Filtra correctamente | |
| AD-23 | Confirmar pago pendiente desde tab Pagos | Estado cambia a pagado | |

---

## Pruebas de check-in

| # | Acción | Resultado esperado | Estado |
|---|--------|--------------------|--------|
| CI-01 | QR válido de socio con membresía activa | "Check-in registrado ✅" con nombre del socio | |
| CI-02 | QR válido con reserva hoy | Registra asistencia ligada a reserva | |
| CI-03 | QR válido sin reserva hoy | Registra acceso libre | |
| CI-04 | QR inválido (token no existe) | Error 404 "QR no reconocido" | |
| CI-05 | QR de socio con membresía caducada | Error 403, mensaje de membresía caducada | |
| CI-06 | QR válido, segundo escaneo mismo día (acceso libre) | "Acceso ya registrado hoy" sin duplicar en BD | |
| CI-07 | QR válido, segundo escaneo misma reserva | "Check-in ya registrado anteriormente" sin duplicar | |
| CI-08 | Token vacío en body | Error 400 "Token requerido" | |

---

## Pruebas de Supabase / datos

| # | Verificación | Método | Estado |
|---|-------------|--------|--------|
| DB-01 | Reserva aparece en tabla `reservas` tras reservar | Supabase dashboard | |
| DB-02 | Reserva se marca cancelada tras cancelar (no se elimina) | Supabase dashboard | |
| DB-03 | Asistencia se inserta tras check-in | Supabase dashboard | |
| DB-04 | Membresía se actualiza tras pago confirmado | Supabase dashboard | |
| DB-05 | `gym_id` en nuevos registros es el correcto | Supabase dashboard | |
| DB-06 | No hay duplicados en `reservas` para mismo socio + sesión | Query manual | |

---

## Pruebas de Vercel / producción

| # | Verificación | Método | Estado |
|---|-------------|--------|--------|
| V-01 | Build en Vercel sin errores | Vercel dashboard | |
| V-02 | Variables de entorno configuradas | Vercel → Settings → Environment | |
| V-03 | App accesible en URL de producción | Navegador | |
| V-04 | PWA instalable en Android | Chrome → Añadir a pantalla de inicio | |
| V-05 | PWA instalable en iOS | Safari → Añadir a pantalla de inicio | |
| V-06 | Webhook Stripe apunta a URL producción | Stripe dashboard → Webhooks | |
| V-07 | HTTPS activo | Barra del navegador | |

---

## Variables de entorno requeridas

| Variable | Dónde | Notas |
|----------|-------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel + .env.local | URL pública de Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel + .env.local | Clave anon pública |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel (solo server) | **Nunca en cliente** |
| `NEXT_PUBLIC_APP_URL` | Vercel + .env.local | URL de la app (para Stripe redirects) |
| `STRIPE_SECRET_KEY` | Vercel (solo server) | **Nunca en cliente** |
| `STRIPE_WEBHOOK_SECRET` | Vercel (solo server) | **Nunca en cliente** |
