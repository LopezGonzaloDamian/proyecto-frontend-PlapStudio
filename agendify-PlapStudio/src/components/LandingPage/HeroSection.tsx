import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconCheck, IconBell, IconStar } from './Icons'

function BookingCard() {
  const [selectedService, setSelectedService] = useState(0)
  const [selectedSlot, setSelectedSlot] = useState(1)

  const services = [
    { name: 'Corte de cabello', price: '$2.500', time: '30 min' },
    { name: 'Corte + Barba', price: '$3.800', time: '45 min' },
    { name: 'Afeitado clásico', price: '$1.800', time: '20 min' },
  ]
  const slots = ['10:00', '10:30', '11:00', '11:30', '12:00', '14:00', '14:30', '15:00']

  return (
    <div className="relative max-w-sm mx-auto">
      <div className="bg-white rounded-2xl shadow-2xl p-6 border border-borde-suave">
        {/* Business header */}
        <div className="flex items-center gap-3 mb-5 pb-5 border-b border-borde-suave">
          <div className="w-12 h-12 bg-primario-suave rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
            💈
          </div>
          <div>
            <p className="font-bold text-texto-principal text-sm">Barbería El Estilo</p>
            <div className="flex items-center gap-1 mt-0.5">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => <IconStar key={i} className="w-3 h-3" />)}
              </div>
              <span className="text-xs text-texto-secundario ml-1">4.9 · Palermo, CABA</span>
            </div>
          </div>
        </div>

        {/* Services */}
        <p className="text-xs font-semibold text-texto-suave uppercase tracking-wider mb-2">Servicios</p>
        <div className="space-y-1.5 mb-5">
          {services.map((s, i) => (
            <button
              key={i}
              onClick={() => setSelectedService(i)}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all text-left ${
                selectedService === i
                  ? 'bg-primario-suave border-2 border-primario'
                  : 'border border-borde hover:border-primario-suave-hover'
              }`}
            >
              <div>
                <p className={`text-sm font-medium ${selectedService === i ? 'text-primario-oscuro' : 'text-texto-principal'}`}>
                  {s.name}
                </p>
                <p className="text-xs text-texto-suave">{s.time}</p>
              </div>
              <p className={`text-sm font-bold ${selectedService === i ? 'text-primario' : 'text-texto-secundario'}`}>
                {s.price}
              </p>
            </button>
          ))}
        </div>

        {/* Time slots */}
        <p className="text-xs font-semibold text-texto-suave uppercase tracking-wider mb-2">Horarios — Hoy</p>
        <div className="grid grid-cols-4 gap-1.5 mb-5">
          {slots.map((t, i) => (
            <button
              key={i}
              onClick={() => setSelectedSlot(i)}
              className={`py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedSlot === i
                  ? 'bg-primario text-white shadow-sm'
                  : 'bg-fondo text-texto-secundario hover:bg-primario-suave hover:text-primario'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <button className="w-full bg-primario text-white font-semibold py-3 rounded-xl hover:bg-primario-hover transition-colors text-sm shadow-sm">
          Confirmar turno →
        </button>
      </div>

      {/* Floating badges */}
      <div className="absolute -top-3 -right-3 bg-white rounded-xl shadow-lg px-3 py-2 flex items-center gap-2 border border-borde-suave">
        <div className="w-7 h-7 bg-confirmacion/10 rounded-full flex items-center justify-center">
          <IconCheck className="w-4 h-4 text-confirmacion" />
        </div>
        <div>
          <p className="text-xs font-bold text-texto-principal">¡Turno confirmado!</p>
          <p className="text-xs text-texto-secundario">Recordatorio enviado</p>
        </div>
      </div>

      <div className="absolute -bottom-3 -left-3 bg-white rounded-xl shadow-lg px-3 py-2 flex items-center gap-2 border border-borde-suave">
        <div className="w-7 h-7 bg-primario-suave rounded-full flex items-center justify-center">
          <IconBell className="w-4 h-4 text-primario" />
        </div>
        <p className="text-xs font-semibold text-texto-principal">Recordatorio en 1h</p>
      </div>
    </div>
  )
}

export default function HeroSection() {
  const navigate = useNavigate()

  return (
    <section
      id="inicio"
      className="pt-16 min-h-screen bg-linear-to-br from-primario via-primario-hover to-primario-oscuro flex items-center overflow-hidden relative"
    >
      {/* Decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-48 -right-48 w-[500px] h-[500px] bg-acento rounded-full opacity-20 blur-3xl" />
        <div className="absolute bottom-0 -left-48 w-[400px] h-[400px] bg-violet-400 rounded-full opacity-15 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primario-oscuro rounded-full opacity-30 blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10 w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Copy */}
          <div>
            <span className="inline-flex items-center gap-2 bg-white/10 text-violet-100 text-sm font-medium px-4 py-1.5 rounded-full mb-6 border border-white/20 backdrop-blur-sm">
              ✨ La forma más simple de reservar turnos
            </span>
            <h1 className="text-5xl lg:text-6xl font-bold text-white leading-[1.1] mb-6 tracking-tight">
              Tu turno,<br />
              <span className="text-violet-200">a un clic</span> de<br />
              distancia
            </h1>
            <p className="text-lg text-violet-200 leading-relaxed mb-8 max-w-md">
              Reservá en barberías, salones de belleza, spas y más, al instante. Sin llamadas, sin filas. Rápido, simple y confiable.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-12">
              <button
                onClick={() => navigate('/registro')}
                className="bg-white text-primario font-semibold px-7 py-3.5 rounded-xl hover:bg-violet-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-sm"
              >
                Reservar un turno
              </button>
              <button
                onClick={() => navigate('/registro')}
                className="border-2 border-white/25 text-white font-semibold px-7 py-3.5 rounded-xl hover:bg-white/10 transition-all text-sm backdrop-blur-sm"
              >
                Registrá tu negocio →
              </button>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-6">
              {[
                { value: '+5.000', label: 'Negocios activos' },
                { value: '+200K', label: 'Turnos reservados' },
                { value: '4.9 ⭐', label: 'Calificación media' },
              ].map(({ value, label }, i) => (
                <div key={i} className="flex items-center gap-3">
                  {i > 0 && <div className="w-px h-8 bg-white/20" />}
                  <div>
                    <p className="text-xl font-bold text-white">{value}</p>
                    <p className="text-xs text-violet-300">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive booking card */}
          <div className="hidden lg:flex justify-center items-center">
            <BookingCard />
          </div>
        </div>
      </div>
    </section>
  )
}
