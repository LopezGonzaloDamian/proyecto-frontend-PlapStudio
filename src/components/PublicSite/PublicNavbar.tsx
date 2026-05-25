import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

type MenuKey = 'producto' | 'soluciones' | null

const productoItems = [
  { label: 'Reservas de turnos', href: '/landing#reservas-turnos', description: 'Reserva online y confirmacion simple.', icon: 'RS' },
  { label: 'Gestion de agenda', href: '/landing#gestion-agenda', description: 'Horarios, disponibilidad y agenda activa.', icon: 'GA' },
  { label: 'Asociacion de asistente', href: '/landing#asociacion-asistente', description: 'Trabajo colaborativo con roles claros.', icon: 'AA' },
  { label: 'Notificaciones', href: '/landing#notificaciones', description: 'Recordatorios y avisos importantes.', icon: 'NT' },
  { label: 'Chatbot Agendify', href: '/landing#chatbot-agendify', description: 'Ayuda guiada dentro de la plataforma.', icon: 'CB' },
]

const soluciones = [
  { title: 'Cliente', href: '/landing#solucion-cliente', items: ['Reserva de turnos'] },
  { title: 'Profesional', href: '/landing#solucion-profesional', items: ['Creacion de agenda'] },
  { title: 'Asistente', href: '/landing#solucion-asistente', items: ['Gestion de turnos'] },
]

function Chevron({ open }: { open: boolean }) {
  return (
    <svg className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0l-4.25-4.51a.75.75 0 01.02-1.06z" clipRule="evenodd" />
    </svg>
  )
}

function ProductItem({
  onClick,
  title,
  description,
  icon,
}: {
  onClick: () => void
  title: string
  description: string
  icon: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-start gap-3 rounded-2xl border border-transparent px-3 py-3 transition-all hover:border-borde hover:bg-fondo"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primario-claro text-[11px] font-black tracking-[0.12em] text-primario">
        {icon}
      </span>
      <span>
        <span className="block text-sm font-black text-texto-principal transition-colors group-hover:text-primario">{title}</span>
        <span className="mt-1 block text-xs leading-5 text-texto-secundario">{description}</span>
      </span>
    </button>
  )
}

export default function PublicNavbar() {
  const [menuAbierto, setMenuAbierto] = useState<MenuKey>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    setMenuAbierto(null)
  }, [location.pathname, location.hash, location.search])

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setMenuAbierto(null)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [])

  const goToSection = (href: string) => {
    const [, hash = ''] = href.split('#')
    setMenuAbierto(null)

    if (!hash) {
      navigate('/landing')
      return
    }

    if (location.pathname === '/landing') {
      const section = document.getElementById(hash)
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' })
        window.history.replaceState(null, '', `/landing#${hash}`)
        return
      }
    }

    navigate(`/landing#${hash}`)
  }

  const dropdown = useMemo(() => {
    if (menuAbierto === 'producto') {
      return (
        <div className="absolute left-0 top-[calc(100%+0.9rem)] grid w-[680px] grid-cols-[1fr_0.78fr] overflow-hidden rounded-[30px] border border-borde bg-white shadow-[0_28px_70px_rgba(15,23,42,0.12)]">
          <div className="p-5">
            <p className="px-3 text-[11px] font-black uppercase tracking-[0.18em] text-texto-suave">Producto</p>
            <div className="mt-3 grid gap-1">
              {productoItems.slice(0, 3).map((item) => (
                <ProductItem
                  key={item.label}
                  onClick={() => goToSection(item.href)}
                  title={item.label}
                  description={item.description}
                  icon={item.icon}
                />
              ))}
            </div>
          </div>

          <div className="bg-fondo p-5">
            <p className="px-3 text-[11px] font-black uppercase tracking-[0.18em] text-texto-suave">Herramientas</p>
            <div className="mt-3 grid gap-1">
              {productoItems.slice(3).map((item) => (
                <ProductItem
                  key={item.label}
                  onClick={() => goToSection(item.href)}
                  title={item.label}
                  description={item.description}
                  icon={item.icon}
                />
              ))}
            </div>
          </div>
        </div>
      )
    }

    if (menuAbierto === 'soluciones') {
      return (
        <div className="absolute left-0 top-[calc(100%+0.9rem)] w-[420px] rounded-[28px] border border-borde bg-white p-5 shadow-[0_28px_70px_rgba(15,23,42,0.12)]">
          <p className="px-3 text-[11px] font-black uppercase tracking-[0.18em] text-texto-suave">Segun tu necesidad</p>
          <div className="mt-3 grid gap-2">
            {soluciones.map((solucion) => (
              <button
                key={solucion.title}
                type="button"
                onClick={() => goToSection(solucion.href)}
                className="rounded-2xl border border-transparent px-4 py-4 transition-all hover:border-borde hover:bg-fondo"
              >
                <p className="text-base font-black text-texto-principal">{solucion.title}</p>
                <div className="mt-2 grid gap-1">
                  {solucion.items.map((item) => (
                    <span key={item} className="text-sm text-texto-secundario">{item}</span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      )
    }

    return null
  }, [goToSection, menuAbierto])

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-borde bg-white/92 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1380px] items-center justify-between gap-3 px-4 py-3 sm:px-5 sm:py-4 lg:gap-6 lg:px-8" ref={containerRef}>
        <div className="flex min-w-0 items-center gap-8">
          <Link to="/landing" className="flex items-center gap-3">
            <img src="/favicon.svg" alt="Agendify" className="h-8 w-8 shrink-0" />
            <span className="text-[1.45rem] font-black tracking-[-0.03em] text-texto-principal sm:text-[1.85rem]">Agendify</span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuAbierto((actual) => actual === 'producto' ? null : 'producto')}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[15px] font-bold transition-colors ${
                  menuAbierto === 'producto' ? 'bg-fondo text-primario' : 'text-texto-principal hover:bg-fondo'
                }`}
              >
                Producto
                <Chevron open={menuAbierto === 'producto'} />
              </button>
              {menuAbierto === 'producto' ? dropdown : null}
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuAbierto((actual) => actual === 'soluciones' ? null : 'soluciones')}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[15px] font-bold transition-colors ${
                  menuAbierto === 'soluciones' ? 'bg-fondo text-primario' : 'text-texto-principal hover:bg-fondo'
                }`}
              >
                Soluciones
                <Chevron open={menuAbierto === 'soluciones'} />
              </button>
              {menuAbierto === 'soluciones' ? dropdown : null}
            </div>

            <Link to="/guia-de-uso" className="rounded-full px-4 py-2 text-[15px] font-bold text-texto-principal transition-colors hover:bg-fondo">
              Guia de uso
            </Link>
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link
            to="/soporte"
            aria-label="Soporte"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-borde text-texto-secundario transition-colors hover:border-primario hover:bg-fondo hover:text-primario"
          >
            <span className="text-lg font-black">?</span>
          </Link>
          <Link to="/login" className="inline-flex rounded-full bg-primario px-4 py-2.5 text-sm font-black text-white transition-colors hover:bg-primario-hover sm:px-5">
            Ingresar
          </Link>
        </div>
      </div>
      <nav className="mx-auto flex w-full max-w-[1380px] gap-2 overflow-x-auto px-4 pb-3 text-sm font-bold text-texto-secundario sm:px-5 lg:hidden">
        <button
          type="button"
          onClick={() => goToSection('/landing#reservas-turnos')}
          className="shrink-0 rounded-full px-3 py-2 transition-colors hover:bg-fondo hover:text-primario"
        >
          Producto
        </button>
        <button
          type="button"
          onClick={() => goToSection('/landing#solucion-cliente')}
          className="shrink-0 rounded-full px-3 py-2 transition-colors hover:bg-fondo hover:text-primario"
        >
          Soluciones
        </button>
        <Link to="/guia-de-uso" className="shrink-0 rounded-full px-3 py-2 transition-colors hover:bg-fondo hover:text-primario">
          Guia de uso
        </Link>
      </nav>
    </header>
  )
}
