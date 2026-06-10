import { Link } from 'react-router-dom'
import { IconCalendar } from './Icons'

const FOOTER_LINKS = [
  {
    title: 'Producto',
    links: [
      { label: 'Reservas de turnos', to: '/landing#reservas-turnos', live: true },
      { label: 'Gestion de agenda', to: '/landing#gestion-agenda', live: true },
      { label: 'Asociacion de asistente', to: '/landing#asociacion-asistente', live: true },
    ],
  },
  {
    title: 'Herramientas',
    links: [
      { label: 'Notificaciones', to: '/landing#notificaciones', live: true },
      { label: 'Chatbot Agendify', to: '/landing#chatbot-agendify', live: true },
    ],
  },
  {
    title: 'Soporte',
    links: [
      { label: 'Centro de ayuda', to: '/soporte', live: true },
      { label: 'Contacto', to: '/soporte', live: true },
      { label: 'Privacidad', to: '#', live: false },
    ],
  },
]

function FooterLink({ label, to, live }: { label: string; to: string; live: boolean }) {
  if (!live) {
    return (
      <span className="text-sm text-white/55 transition-colors hover:text-white/80">
        {label}
      </span>
    )
  }

  return (
    <Link to={to} className="text-sm text-white/65 transition-colors hover:text-white">
      {label}
    </Link>
  )
}

export default function Footer() {
  return (
    <footer className="bg-[#172847] text-white">
      <div className="mx-auto max-w-[1380px] px-5 py-14 lg:px-8">
        <div className="grid gap-10 border-b border-white/10 pb-10 lg:grid-cols-[1.2fr_0.7fr_0.7fr_0.7fr]">
          <div className="max-w-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primario text-white">
                <IconCalendar className="h-5 w-5" />
              </div>
              <span className="font-card-title text-[1.55rem] font-black tracking-[-0.03em]">Agendify</span>
            </div>
            <p className="font-card-body text-[15px] leading-8 text-white/68">
              Gestiona reservas, agendas y asistencia operativa desde una experiencia clara para clientes, profesionales y asistentes.
            </p>
          </div>

          {FOOTER_LINKS.map(({ title, links }) => (
            <div key={title}>
              <p className="font-card-title mb-5 text-[1.02rem] font-black text-white">{title}</p>
              <ul className="grid gap-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <FooterLink label={link.label} to={link.to} live={link.live} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-card-body text-xs text-white/45">© 2026 Agendify. Todos los derechos reservados.</p>
          <div className="flex gap-4">
            {['Instagram', 'Twitter', 'LinkedIn'].map((social) => (
              <span key={social} className="font-card-body text-xs text-white/45 transition-colors hover:text-white/75">
                {social}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
