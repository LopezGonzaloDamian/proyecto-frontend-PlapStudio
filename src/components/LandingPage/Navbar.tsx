import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconCalendar, IconMenu, IconClose } from './Icons'

const NAV_LINKS = [
  { label: 'Cómo funciona', href: '#como-funciona' },
  { label: 'Para negocios', href: '#negocios' },
  { label: 'Precios', href: '#precios' },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-primario-suave shadow-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <a href="#inicio" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-primario rounded-lg flex items-center justify-center group-hover:bg-primario-hover transition-colors">
              <IconCalendar className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-texto-principal tracking-tight">
              Agendify
            </span>
          </a>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(({ label, href }) => (
              <a
                key={href}
                href={href}
                className="text-sm font-medium text-texto-secundario hover:text-primario transition-colors"
              >
                {label}
              </a>
            ))}
          </div>

          {/* Desktop auth CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => navigate('/cliente/login')}
              className="text-sm font-medium text-texto-secundario hover:text-primario transition-colors px-3 py-2 rounded-lg hover:bg-primario-claro cursor-pointer"
            >
              Iniciar sesión
            </button>
            <button
              onClick={() => navigate('/cliente/registro')}
              className="text-sm font-semibold bg-primario text-white rounded-lg px-4 py-2 hover:bg-primario-hover transition-colors shadow-sm cursor-pointer"
            >
              Comenzar gratis
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-texto-secundario hover:bg-primario-claro transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Abrir menú"
          >
            {menuOpen ? <IconClose /> : <IconMenu />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-borde px-4 py-4 space-y-3">
          {NAV_LINKS.map(({ label, href }) => (
            <a
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className="block text-sm font-medium text-texto-secundario hover:text-primario py-2"
            >
              {label}
            </a>
          ))}
          <div className="pt-3 border-t border-borde flex flex-col gap-2">
            <button
              onClick={() => { setMenuOpen(false); navigate('/cliente/login') }}
              className="w-full text-sm font-medium text-primario border border-primario rounded-lg py-2.5 hover:bg-primario-claro transition-colors"
            >
              Iniciar sesión
            </button>
            <button
              onClick={() => { setMenuOpen(false); navigate('/cliente/registro') }}
              className="w-full text-sm font-semibold bg-primario text-white rounded-lg py-2.5 hover:bg-primario-hover transition-colors"
            >
              Comenzar gratis
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}
