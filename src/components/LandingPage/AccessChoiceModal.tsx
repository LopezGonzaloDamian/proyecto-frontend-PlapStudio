import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconCalendar, IconChart, IconClose, IconUsers } from './Icons'

type AccessMode = 'login' | 'registro'

type AccessChoiceModalProps = {
  mode: AccessMode
  onClose: () => void
}

const ACTION_TEXT = {
  login: {
    title: 'Iniciar sesión',
    subtitle: 'Elegí cómo querés ingresar a Agendify.',
    cliente: 'Ingresar como cliente',
    profesional: 'Ingresar como profesional',
    asistente: 'Ingresar como asistente',
  },
  registro: {
    title: 'Crear cuenta',
    subtitle: 'Contanos que tipo de cuenta queres crear.',
    cliente: 'Registrarme como cliente',
    profesional: 'Registrarme como profesional',
    asistente: 'Registrarme como asistente',
  },
}

export default function AccessChoiceModal({ mode, onClose }: AccessChoiceModalProps) {
  const navigate = useNavigate()
  const copy = ACTION_TEXT[mode]

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const goToAccess = (role: 'cliente' | 'profesional' | 'asistente') => {
    onClose()
    navigate(mode === 'login' ? '/login' : `/${role}/registro`)
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="access-choice-title"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-borde-suave"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="access-choice-title" className="text-2xl font-bold text-texto-principal">
              {copy.title}
            </h2>
            <p className="mt-1 text-sm text-texto-secundario">{copy.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-texto-secundario hover:bg-fondo hover:text-texto-principal transition-colors"
            aria-label="Cerrar"
          >
            <IconClose className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 grid gap-3">
          <button
            type="button"
            onClick={() => goToAccess('cliente')}
            className="flex w-full items-center gap-4 rounded-xl border border-borde p-4 text-left transition-all hover:border-primario hover:bg-primario-claro"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primario-suave text-primario">
              <IconUsers className="h-6 w-6" />
            </span>
            <span>
              <span className="block text-sm font-bold text-texto-principal">{copy.cliente}</span>
              <span className="block text-xs text-texto-secundario">Reservar turnos y gestionar mis citas.</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => goToAccess('profesional')}
            className="flex w-full items-center gap-4 rounded-xl border border-borde p-4 text-left transition-all hover:border-primario hover:bg-primario-claro"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-confirmacion/10 text-confirmacion">
              <IconChart className="h-6 w-6" />
            </span>
            <span>
              <span className="block text-sm font-bold text-texto-principal">{copy.profesional}</span>
              <span className="block text-xs text-texto-secundario">Administrar agenda, servicios y negocio.</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => goToAccess('asistente')}
            className="flex w-full items-center gap-4 rounded-xl border border-borde p-4 text-left transition-all hover:border-primario hover:bg-primario-claro"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primario-claro text-primario">
              <IconCalendar className="h-6 w-6" />
            </span>
            <span>
              <span className="block text-sm font-bold text-texto-principal">{copy.asistente}</span>
              <span className="block text-xs text-texto-secundario">Gestionar turnos de agendas asignadas.</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
