import { IconCalendar } from './Icons'

const FOOTER_LINKS = [
  {
    title: 'Producto',
    links: ['Cómo funciona', 'Para negocios', 'Precios', 'Integraciones'],
  },
  {
    title: 'Empresa',
    links: ['Acerca de', 'Blog', 'Prensa', 'Carreras'],
  },
  {
    title: 'Soporte',
    links: ['Centro de ayuda', 'Contacto', 'Estado del servicio', 'Privacidad'],
  },
]

export default function Footer() {
  return (
    <footer className="bg-texto-principal text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primario rounded-lg flex items-center justify-center">
                <IconCalendar className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight">Agendify</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              La plataforma de reservas online para profesionales del bienestar y cuidado personal en Argentina.
            </p>
          </div>

          {/* Link columns */}
          {FOOTER_LINKS.map(({ title, links }) => (
            <div key={title}>
              <p className="text-sm font-semibold text-gray-300 mb-4">{title}</p>
              <ul className="space-y-2.5">
                {links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-500">© 2025 Agendify. Todos los derechos reservados.</p>
          <div className="flex gap-4">
            {['Instagram', 'Twitter', 'LinkedIn'].map((s) => (
              <a key={s} href="#" className="text-xs text-gray-500 hover:text-white transition-colors">
                {s}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
