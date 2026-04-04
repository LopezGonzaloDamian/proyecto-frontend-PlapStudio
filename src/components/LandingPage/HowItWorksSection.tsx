const STEPS = [
  {
    icon: '🔍',
    step: '01',
    title: 'Buscá el servicio',
    desc: 'Encontrá barberías, salones y spas cerca tuyo. Filtrá por servicio, precio o calificación.',
  },
  {
    icon: '📅',
    step: '02',
    title: 'Elegí fecha y hora',
    desc: 'Mirá la disponibilidad en tiempo real y reservá el horario que mejor te quede.',
  },
  {
    icon: '✅',
    step: '03',
    title: 'Confirmá tu turno',
    desc: 'Recibís una confirmación al instante y un recordatorio antes de tu cita.',
  },
]

export default function HowItWorksSection() {
  return (
    <section id="como-funciona" className="py-24 bg-fondo-violeta">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="text-primario text-sm font-semibold uppercase tracking-wider">Proceso simple</span>
          <h2 className="text-3xl lg:text-4xl font-bold text-texto-principal mt-2 tracking-tight">
            Reservar nunca fue tan fácil
          </h2>
          <p className="text-texto-secundario mt-3 max-w-xl mx-auto">
            En menos de un minuto tenés tu turno confirmado. Sin llamadas, sin formularios eternos.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connector line on desktop */}
          <div className="hidden md:block absolute top-12 left-[calc(33%+16px)] right-[calc(33%+16px)] h-0.5 bg-linear-to-r from-primario-suave via-primario to-primario-suave opacity-40" />

          {STEPS.map(({ icon, step, title, desc }) => (
            <div key={step} className="relative bg-white rounded-2xl p-7 border border-borde shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-primario-claro rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                  {icon}
                </div>
                <span className="text-3xl font-bold text-primario-suave-hover">{step}</span>
              </div>
              <h3 className="text-lg font-bold text-texto-principal mb-2">{title}</h3>
              <p className="text-texto-secundario text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
