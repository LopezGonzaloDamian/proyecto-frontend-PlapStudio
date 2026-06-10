import { IconCalendar, IconBell, IconChart, IconPhone, IconUsers, IconCheck } from './Icons'

const FEATURES = [
  {
    Icon: IconCalendar,
    title: 'Agenda online 24/7',
    desc: 'Tus clientes pueden reservar en cualquier momento, sin que vos tengas que atender el teléfono.',
  },
  {
    Icon: IconBell,
    title: 'Recordatorios automáticos',
    desc: 'Reducí las ausencias enviando recordatorios por SMS y email sin hacer nada.',
  },
  {
    Icon: IconChart,
    title: 'Estadísticas en tiempo real',
    desc: 'Mirá cuántos turnos tenés, cuáles son tus servicios más populares y cuánto facturás.',
  },
  {
    Icon: IconPhone,
    title: 'Sin llamadas innecesarias',
    desc: 'Dejá de perder tiempo coordinando horarios por teléfono. Todo desde la app.',
  },
  {
    Icon: IconUsers,
    title: 'Gestión de clientes',
    desc: 'Historial completo de cada cliente, sus preferencias y cuántas veces volvieron.',
  },
  {
    Icon: IconCheck,
    title: 'Fácil de configurar',
    desc: 'Creá tu perfil en minutos, cargá tus servicios y empezá a recibir reservas hoy.',
  },
]

export default function FeaturesSection() {
  return (
    <section className="py-24 bg-fondo">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="text-primario text-sm font-semibold uppercase tracking-wider">Para profesionales</span>
          <h2 className="text-3xl lg:text-4xl font-bold text-texto-principal mt-2 tracking-tight">
            Todo lo que tu negocio necesita
          </h2>
          <p className="text-texto-secundario mt-3 max-w-xl mx-auto">
            Agendify le da a tu negocio las herramientas para crecer sin complicaciones.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ Icon, title, desc }) => (
            <div
              key={title}
              className="bg-white rounded-2xl p-6 border border-borde hover:border-primario-suave-hover hover:shadow-md transition-all group"
            >
              <div className="w-11 h-11 bg-primario-claro rounded-xl flex items-center justify-center mb-4 group-hover:bg-primario-suave transition-colors">
                <Icon className="w-5 h-5 text-primario" />
              </div>
              <h3 className="text-base font-bold text-texto-principal mb-2">{title}</h3>
              <p className="text-sm text-texto-secundario leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
