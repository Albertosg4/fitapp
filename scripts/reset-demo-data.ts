import { createClient } from '@supabase/supabase-js'

const REQUIRED_CONFIRM = 'RESET_FITAPP_DEMO'
const DEMO_PASSWORD = process.env.TEST_PASSWORD || 'FitappTest123!'

function env(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Falta variable de entorno requerida: ${name}`)
  return value
}

async function main() {
  if (process.env.CONFIRM_RESET_DEMO_DATA !== REQUIRED_CONFIRM) {
    throw new Error(`Abortado por seguridad. Debes definir CONFIRM_RESET_DEMO_DATA=${REQUIRED_CONFIRM}`)
  }

  const supabase = createClient(env('NEXT_PUBLIC_SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'))

  const { data: adminsRaw, error: adminsErr } = await supabase
    .from('perfiles')
    .select('id, rol, gym_id')
    .eq('rol', 'admin')
  if (adminsErr) throw adminsErr

  const protectedIds = new Set((adminsRaw || []).map((a) => a.id))
  let protectedAdminEmail: string | null = null

  if (process.env.ADMIN_EMAIL) {
    protectedAdminEmail = process.env.ADMIN_EMAIL.trim().toLowerCase()
    const { data: found } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
    const byEmail = (found?.users || []).find((u) => u.email?.toLowerCase() === protectedAdminEmail)
    if (byEmail?.id) protectedIds.add(byEmail.id)
  }

  const { data: gyms, error: gymsErr } = await supabase.from('gimnasios').select('id').limit(1)
  if (gymsErr) throw gymsErr
  const gymId = process.env.TEST_GYM_ID || gyms?.[0]?.id
  if (!gymId) throw new Error('No se encontró gym_id. Define TEST_GYM_ID o crea un gimnasio.')

  const { data: perfiles, error: perfilesErr } = await supabase.from('perfiles').select('id, rol').eq('gym_id', gymId)
  if (perfilesErr) throw perfilesErr
  const nonAdminIds = (perfiles || []).map((p) => p.id).filter((id) => !protectedIds.has(id))

  // Limpieza
  const del = async (table: string, column = 'gym_id') => {
    const q = supabase.from(table as never).delete().eq(column, gymId)
    const { error } = await q
    if (error) throw error
  }

  await del('asistencia')
  await del('reservas')
  if (nonAdminIds.length > 0) {
    const { error: pagosErr } = await supabase.from('pagos').delete().eq('gym_id', gymId).in('user_id', nonAdminIds)
    if (pagosErr) throw pagosErr
  }
  await del('sesiones')
  await del('horarios_clase')
  await del('actividades')

  if (nonAdminIds.length > 0) {
    const { error: perfilesDeleteErr } = await supabase.from('perfiles').delete().in('id', nonAdminIds)
    if (perfilesDeleteErr) throw perfilesDeleteErr
  }

  // Limpiar usuarios demo previos en auth
  const { data: usersData } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
  const authUsers = usersData?.users || []
  const demoAuthUsers = authUsers.filter((u) => u.email?.endsWith('@fitapp.test') && !protectedIds.has(u.id))
  for (const user of demoAuthUsers) {
    const { error } = await supabase.auth.admin.deleteUser(user.id)
    if (error) throw error
  }

  // Crear actividades
  const actividadesSeed = ['Boxeo', 'Muay Thai', 'Kickboxing', 'Grappling', 'MMA', 'Cross Training', 'Fuerza', 'Movilidad']
  const { data: actividades, error: actividadesErr } = await supabase
    .from('actividades')
    .insert(actividadesSeed.map((nombre) => ({ gym_id: gymId, nombre, activa: true })))
    .select('id, nombre')
  if (actividadesErr) throw actividadesErr
  const actByName = new Map((actividades || []).map((a) => [a.nombre, a.id]))

  const horariosPlan = [
    [1, 'Boxeo', '07:00', 60, 12, 'Coach Diego'], [1, 'Grappling', '18:00', 75, 10, 'Coach Nico'], [1, 'Cross Training', '19:30', 45, 15, 'Coach Laura'],
    [2, 'Muay Thai', '07:00', 60, 12, 'Coach Ana'], [2, 'MMA', '18:30', 90, 10, 'Coach Javi'],
    [3, 'Boxeo', '07:00', 60, 12, 'Coach Diego'], [3, 'Fuerza', '19:00', 60, 20, 'Coach Marta'],
    [4, 'Kickboxing', '18:00', 75, 12, 'Coach Ana'], [4, 'Grappling', '19:30', 75, 10, 'Coach Nico'],
    [5, 'MMA', '07:00', 60, 10, 'Coach Javi'], [5, 'Cross Training', '18:30', 45, 15, 'Coach Laura'],
    [6, 'Movilidad', '10:00', 60, 20, 'Coach Marta'], [6, 'Boxeo', '11:15', 60, 12, 'Coach Diego'],
  ] as const

  const { data: horarios, error: horariosErr } = await supabase.from('horarios_clase').insert(
    horariosPlan.map(([dia_semana, act, hora_inicio, duracion_min, aforo_max, profesor]) => ({
      gym_id: gymId, actividad_id: actByName.get(act), dia_semana, hora_inicio, duracion_min, aforo_max, profesor, activo: true,
    }))
  ).select('id, dia_semana, hora_inicio, duracion_min, aforo_max, profesor, actividad_id')
  if (horariosErr) throw horariosErr

  // Crear socios demo
  const nombres = ['Carlos','Lucía','Mateo','Valeria','Sergio','Paula','Iván','Ariadna','Hugo','Elena','Raúl','Julia','Adrián','Nora','David','Irene','Álvaro','Marta','Pablo','Clara','Bruno','Sara','Óscar','Noa','Dani','Andrea','Rubén','Leire','Marco','Sofía']
  const apellidos = ['García','López','Martín','Sánchez','Pérez','Gómez','Ruiz','Díaz','Hernández','Navarro']

  const demoUsers: { id: string; email: string }[] = []
  for (let i = 1; i <= 30; i++) {
    const email = `socio.demo${String(i).padStart(2, '0')}@fitapp.test`
    const { data, error } = await supabase.auth.admin.createUser({ email, password: DEMO_PASSWORD, email_confirm: true })
    if (error || !data.user) throw error || new Error(`No se pudo crear ${email}`)
    demoUsers.push({ id: data.user.id, email })
  }

  const today = new Date('2026-04-30T12:00:00Z')
  const plusDays = (d: number) => new Date(today.getTime() + d * 86400000).toISOString()

  const perfilesInsert = demoUsers.map((u, idx) => {
    const base = {
      id: u.id, gym_id: gymId, nombre: `${nombres[idx % nombres.length]} ${apellidos[idx % apellidos.length]}`,
      telefono: `+34 600${String(100000 + idx).slice(-6)}`, rol: 'socio', qr_token: `demo-qr-${idx + 1}`,
      membresia_activa: true, tipo_membresia: 'mensual', membresia_vence: plusDays(30),
    }
    if (idx < 8) return { ...base, tipo_membresia: 'mensual', membresia_vence: idx < 4 ? '2026-05-20T00:00:00.000Z' : '2026-06-15T00:00:00.000Z' }
    if (idx < 13) return { ...base, tipo_membresia: 'mensual', membresia_vence: plusDays(1 + (idx - 8)) }
    if (idx < 18) return { ...base, tipo_membresia: 'mensual', membresia_activa: false, membresia_vence: '2026-04-20T00:00:00.000Z' }
    if (idx < 22) return { ...base, tipo_membresia: 'trimestral', membresia_vence: '2026-07-30T00:00:00.000Z' }
    if (idx < 25) return { ...base, tipo_membresia: 'semestral', membresia_vence: '2026-10-30T00:00:00.000Z' }
    if (idx < 28) return { ...base, tipo_membresia: 'anual', membresia_vence: '2027-04-30T00:00:00.000Z' }
    return { ...base, tipo_membresia: null, membresia_activa: false, membresia_vence: null }
  })

  const { error: perfilesInsErr } = await supabase.from('perfiles').insert(perfilesInsert)
  if (perfilesInsErr) throw perfilesInsErr

  // sesiones mayo
  const start = new Date('2026-05-01T00:00:00Z')
  const end = new Date('2026-05-31T00:00:00Z')
  const sesionesPayload: Array<Record<string, unknown>> = []
  for (let dt = new Date(start); dt <= end; dt = new Date(dt.getTime() + 86400000)) {
    const jsDay = dt.getUTCDay()
    const diaSemana = jsDay === 0 ? 7 : jsDay
    const dayHorarios = (horarios || []).filter((h) => h.dia_semana === diaSemana)
    for (const h of dayHorarios) {
      const fecha = dt.toISOString().slice(0, 10)
      const cancelada = Math.random() < 0.06
      sesionesPayload.push({ gym_id: gymId, horario_id: h.id, actividad_id: h.actividad_id, fecha, hora_inicio: h.hora_inicio, duracion_min: h.duracion_min, aforo_max: h.aforo_max, profesor: h.profesor, cancelada, es_puntual: false, notas: cancelada ? 'Demo: sesión cancelada por el gimnasio' : null })
    }
  }
  const { data: sesiones, error: sesionesErr } = await supabase.from('sesiones').insert(sesionesPayload).select('id, fecha, cancelada')
  if (sesionesErr) throw sesionesErr

  const pastSes = (sesiones || []).filter((s) => s.fecha < '2026-05-20' && !s.cancelada)
  const futureSes = (sesiones || []).filter((s) => s.fecha >= '2026-05-20' && !s.cancelada)
  const cancelledSes = (sesiones || []).filter((s) => s.cancelada)

  const reservas: Record<string, unknown>[] = []
  const asistencias: Record<string, unknown>[] = []
  demoUsers.forEach((u, idx) => {
    const future = futureSes[idx % futureSes.length]
    const past = pastSes[idx % pastSes.length]
    if (future) reservas.push({ user_id: u.id, sesion_id: future.id, estado: 'confirmada' })
    if (past) reservas.push({ user_id: u.id, sesion_id: past.id, estado: idx % 5 === 0 ? 'cancelada' : 'confirmada' })
  })

  if (cancelledSes[0]) {
    for (let i = 0; i < 8; i++) reservas.push({ user_id: demoUsers[i].id, sesion_id: cancelledSes[0].id, estado: 'confirmada' })
  }

  const { data: reservasRows, error: reservasErr } = await supabase.from('reservas').insert(reservas).select('id, user_id, sesion_id, estado')
  if (reservasErr) throw reservasErr

  for (const r of reservasRows || []) {
    const ses = (sesiones || []).find((s) => s.id === r.sesion_id)
    if (!ses) continue
    if (r.estado === 'confirmada' && ses.fecha < '2026-05-20' && !ses.cancelada && Math.random() < 0.6) {
      asistencias.push({ user_id: r.user_id, reserva_id: r.id, check_in_at: `${ses.fecha}T${String(8 + Math.floor(Math.random()*12)).padStart(2,'0')}:05:00.000Z`, metodo: Math.random() < 0.5 ? 'qr' : 'manual' })
    }
  }
  for (let i = 0; i < 10; i++) {
    const ses = pastSes[(i * 3) % pastSes.length]
    asistencias.push({ user_id: demoUsers[(i + 10) % demoUsers.length].id, reserva_id: null, check_in_at: `${ses.fecha}T19:10:00.000Z`, metodo: i % 2 ? 'qr' : 'manual' })
  }

  const { error: asistErr } = await supabase.from('asistencia').insert(asistencias)
  if (asistErr) throw asistErr

  const metodos = ['stripe', 'efectivo', 'transferencia', 'cortesia'] as const
  const estados = ['pagado', 'pendiente'] as const
  const pagos = demoUsers.slice(0, 24).map((u, idx) => ({
    user_id: u.id, gym_id: gymId, importe: [70, 180, 320, 600][idx % 4], tipo_membresia: perfilesInsert[idx].tipo_membresia || 'mensual', meses: [1, 3, 6, 12][idx % 4], metodo: metodos[idx % metodos.length], estado: metodos[idx % metodos.length] === 'cortesia' ? 'pagado' : estados[idx % estados.length], notas: 'Demo seed pago', fecha_pago: `2026-05-${String(1 + (idx % 20)).padStart(2, '0')}T10:00:00.000Z`,
  }))
  const { error: pagosErr2 } = await supabase.from('pagos').insert(pagos)
  if (pagosErr2) throw pagosErr2

  const conReserva = asistencias.filter((a) => a.reserva_id).length
  console.log('=== DEMO RESET + SEED COMPLETADO ===')
  console.log(`gym_id usado: ${gymId}`)
  console.log(`admin protegido (ids): ${Array.from(protectedIds).join(', ')}`)
  if (protectedAdminEmail) console.log(`admin protegido por email: ${protectedAdminEmail}`)
  console.log(`socios demo creados: ${demoUsers.length}`)
  console.log(`actividades creadas: ${actividades?.length || 0}`)
  console.log(`horarios creados: ${horarios?.length || 0}`)
  console.log(`sesiones creadas: ${sesiones?.length || 0}`)
  console.log(`sesiones canceladas: ${cancelledSes.length}`)
  console.log(`reservas creadas: ${reservasRows?.length || 0}`)
  console.log(`reservas confirmadas: ${(reservasRows || []).filter((r) => r.estado === 'confirmada').length}`)
  console.log(`reservas canceladas: ${(reservasRows || []).filter((r) => r.estado === 'cancelada').length}`)
  console.log(`asistencias creadas: ${asistencias.length}`)
  console.log(`asistencias con reserva_id: ${conReserva}`)
  console.log(`asistencias sin reserva_id: ${asistencias.length - conReserva}`)
  console.log(`pagos creados: ${pagos.length}`)
  console.log('\nUsuarios demo:')
  for (const u of demoUsers) console.log(`${u.email} / ${DEMO_PASSWORD}`)
}

main().catch((err) => {
  console.error('[reset-demo-data] ERROR:', err.message || err)
  process.exit(1)
})
