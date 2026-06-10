import { useNavigate } from 'react-router-dom'
import { IconCheck } from './Icons'

const PLANS = [
  {
    name: 'Gratuito',
    price: '$0',
    period: 'para siempre',
    desc: 'Ideal para comenzar',
    cta: 'Crear cuenta gratis',
    primary: false,
    features: [
      'Hasta 50 reservas/mes',
      'Perfil de negocio básico',
      'Confirmaciones por email',
      'Soporte por email',
    ],
  },
  {
    name: 'Pro',
    price: '$4.990',
    period: 'por mes',
    desc: 'Para negocios en crecimiento',
    cta: 'Empezar prueba gratis',
    primary: true,
    badge: 'Más popular',
    features: [
      'Reservas ilimitadas',
      'Recordatorios por SMS',
      'Estadísticas avanzadas',
      'Múltiples empleados',
      'Integración con Instagram',
      'Soporte prioritario',
    ],
  },
  {
    name: 'Empresa',
    price: 'A medida',
    period: '',
    desc: 'Para cadenas y franquicias',
    cta: 'Contactar ventas',
    primary: false,
    features: [
      'Todo lo del plan Pro',
      'Múltiples sucursales',
      'API personalizada',
      'Facturación integrada',
      'Onboarding dedicado',
      'SLA garantizado',
    ],
  },
]

export default function PricingSection() {
  const navigate = useNavigate()

  return (
    <section id="precios" className="py-24 bg-fondo-violeta">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="text-primario text-sm font-semibold uppercase tracking-wider">Precios</span>
          <h2 className="text-3xl lg:text-4xl font-bold text-texto-principal mt-2 tracking-tight">
            Un plan para cada negocio
          </h2>
          <p className="text-texto-secundario mt-3 max-w-xl mx-auto">
            Empezá gratis, escalá cuando lo necesites. Sin permanencia ni costos ocultos.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 items-start">
          {PLANS.map(({ name, price, period, desc, cta, primary, badge, features }) => (
            <div
              key={name}
              className={`relative rounded-2xl p-7 border transition-all ${
                primary
                  ? 'bg-primario border-primario shadow-xl shadow-primario/20 ring-2 ring-primario'
                  : 'bg-white border-borde hover:border-primario-suave-hover hover:shadow-md'
              }`}
            >
              {badge && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-acento text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                  {badge}
                </span>
              )}

              <div className="mb-5">
                <p className={`text-sm font-semibold mb-1 ${primary ? 'text-white/80' : 'text-primario'}`}>{name}</p>
                <p className={`text-3xl font-bold tracking-tight ${primary ? 'text-white' : 'text-texto-principal'}`}>
                  {price}
                  {period && (
                    <span className={`text-base font-normal ml-1 ${primary ? 'text-white/80' : 'text-texto-secundario'}`}>
                      /{period}
                    </span>
                  )}
                </p>
                <p className={`text-sm mt-1 ${primary ? 'text-white/80' : 'text-texto-secundario'}`}>{desc}</p>
              </div>

              <ul className="space-y-2.5 mb-7">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${primary ? 'bg-white/20' : 'bg-primario-suave'}`}>
                      <IconCheck className={`w-3 h-3 ${primary ? 'text-white' : 'text-primario'}`} />
                    </div>
                    <span className={`text-sm ${primary ? 'text-white/90' : 'text-texto-secundario'}`}>{f}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => navigate('/registro')}
                className={`w-full font-semibold py-3 rounded-xl text-sm transition-all ${
                  primary
                    ? 'bg-white text-primario hover:bg-primario-claro shadow-sm'
                    : 'bg-primario-claro text-primario border border-primario-suave-hover hover:bg-primario-suave'
                }`}
              >
                {cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
