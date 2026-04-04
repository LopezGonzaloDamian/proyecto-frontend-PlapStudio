import { useNavigate } from 'react-router-dom'

export default function CTABanner() {
  const navigate = useNavigate()

  return (
    <section className="py-20 bg-linear-to-r from-primario-oscuro via-primario to-acento relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
      </div>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center relative z-10">
        <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4 tracking-tight">
          ¿Listo para llenar tu agenda?
        </h2>
        <p className="text-violet-200 text-lg mb-8">
          Sumate a miles de profesionales que ya optimizaron su negocio con Agendify. Configuración en minutos, resultados desde el día 1.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate('/registro')}
            className="bg-white text-primario font-semibold px-8 py-3.5 rounded-xl hover:bg-violet-50 transition-all shadow-lg hover:-translate-y-0.5 text-sm"
          >
            Registrá tu negocio gratis
          </button>
          <button
            onClick={() => navigate('/login')}
            className="border-2 border-white/30 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/10 transition-all text-sm"
          >
            Iniciar sesión
          </button>
        </div>
      </div>
    </section>
  )
}
