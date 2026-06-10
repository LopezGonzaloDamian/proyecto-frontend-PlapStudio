import { IconStar } from './Icons'

const TESTIMONIALS = [
  {
    quote: 'Desde que uso Agendify dejé de perder tiempo contestando mensajes de WhatsApp para coordinar turnos. Mis clientes reservan solos y yo me dedico a trabajar.',
    name: 'Martín G.',
    role: 'Dueño de Barbería',
    location: 'Buenos Aires',
    avatar: '👨‍🦲',
    rating: 5,
  },
  {
    quote: 'El sistema de recordatorios es una joya. Antes tenía un 20% de ausencias, ahora casi nadie falta. Me cambió el negocio por completo.',
    name: 'Laura P.',
    role: 'Dueña de Salón de Belleza',
    location: 'Córdoba',
    avatar: '💁‍♀️',
    rating: 5,
  },
  {
    quote: 'Super fácil de configurar. En una hora ya tenía mi perfil listo y empecé a recibir reservas ese mismo día. Recomendadísimo.',
    name: 'Sofía R.',
    role: 'Esteticista',
    location: 'Rosario',
    avatar: '🧖‍♀️',
    rating: 5,
  },
]

export default function TestimonialsSection() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="text-primario text-sm font-semibold uppercase tracking-wider">Lo que dicen nuestros usuarios</span>
          <h2 className="text-3xl lg:text-4xl font-bold text-texto-principal mt-2 tracking-tight">
            Miles de profesionales confían en Agendify
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map(({ quote, name, role, location, avatar, rating }) => (
            <div key={name} className="bg-fondo-violeta rounded-2xl p-6 border border-primario-suave">
              <div className="flex gap-0.5 mb-4 text-yellow-400">
                {[...Array(rating)].map((_, i) => <IconStar key={i} className="w-4 h-4" />)}
              </div>
              <p className="text-texto-secundario text-sm leading-relaxed mb-5 italic">
                "{quote}"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primario-suave rounded-full flex items-center justify-center text-xl">
                  {avatar}
                </div>
                <div>
                  <p className="text-sm font-bold text-texto-principal">{name}</p>
                  <p className="text-xs text-texto-suave">{role} · {location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
