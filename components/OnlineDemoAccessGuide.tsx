'use client'

export default function OnlineDemoAccessGuide() {
  return (
    <section style={{ padding: '20px', display: 'grid', gap: '10px' }}>
      <h2 style={{ margin: 0, color: '#f8fafc' }}>Cómo probar la demo online</h2>
      <ol style={{ margin: 0, paddingLeft: '20px', color: '#cbd5e1' }}>
        <li>Elegir vertical para adaptar el lenguaje y la propuesta comercial.</li>
        <li>Entrar como admin demo cuando se habiliten credenciales.</li>
        <li>Entrar como usuario demo para validar la experiencia final.</li>
        <li>Probar reservas/citas según la vertical seleccionada.</li>
        <li>Revisar pagos y módulos disponibles en la demo.</li>
      </ol>
      <p style={{ margin: 0, color: '#fda4af' }}>
        Las cuentas demo reales se prepararán en una fase separada para no mezclar datos ni permisos.
      </p>
    </section>
  )
}
