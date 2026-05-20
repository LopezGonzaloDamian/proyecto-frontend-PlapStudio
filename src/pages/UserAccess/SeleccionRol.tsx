import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CardAcceso, HeaderAcceso } from '../../components/AccesoUsuario/CardAcceso'
import { BotonPrimario, BotonSecundario, Input, Label } from '../../components/common/ui'
import { Toast } from '../../components/common/toast'
import { seleccionarRol } from '../../api/auth'
import { extraerError } from '../../api/client'
import { useSesion } from '../../customHooks/useSesion'
import { useToast } from '../../customHooks/useToast'
import type { Rol } from '../../api/types'

const opciones: Array<{ rol: Extract<Rol, 'CLIENTE' | 'PROFESIONAL' | 'ASISTENTE'>; titulo: string; descripcion: string }> = [
  { rol: 'CLIENTE', titulo: 'Cliente', descripcion: 'Buscar profesionales, reservar turnos y seguir tus notificaciones.' },
  { rol: 'PROFESIONAL', titulo: 'Profesional', descripcion: 'Crear agendas, administrar disponibilidad y gestionar turnos.' },
  { rol: 'ASISTENTE', titulo: 'Asistente', descripcion: 'Operar agendas asignadas y ayudar en la gestion diaria.' },
]

function destinoPorUsuarioRoles(roles: Rol[]) {
  if (roles.includes('PROFESIONAL')) return '/profesional'
  if (roles.includes('ASISTENTE')) return '/asistente'
  return '/cliente'
}

export default function SeleccionRol() {
  const [rol, setRol] = useState<Extract<Rol, 'CLIENTE' | 'PROFESIONAL' | 'ASISTENTE'>>('CLIENTE')
  const [especialidad, setEspecialidad] = useState('')
  const [enviando, setEnviando] = useState(false)
  const { iniciar } = useSesion()
  const { toast, showToast } = useToast()
  const navigate = useNavigate()

  const requiereEspecialidad = rol === 'PROFESIONAL'
  const puedeEnviar = !enviando && (!requiereEspecialidad || especialidad.trim().length > 0)

  async function confirmar() {
    if (!puedeEnviar) return
    setEnviando(true)
    try {
      const auth = await seleccionarRol({
        rol,
        especialidad: requiereEspecialidad ? especialidad.trim() : undefined,
      })
      iniciar(auth)
      showToast('Rol configurado correctamente.', 'success')
      setTimeout(() => navigate(destinoPorUsuarioRoles(auth.usuario.roles)), 300)
    } catch (error) {
      showToast(extraerError(error), 'error')
      setEnviando(false)
    }
  }

  return (
    <CardAcceso>
      <HeaderAcceso
        titulo="Elegir rol"
        subtitulo="Es la unica vez que vas a verlo. Elige como vas a usar Agendify para terminar de activar tu cuenta."
      />

      <div className="grid gap-3">
        {opciones.map((opcion) => {
          const activa = rol === opcion.rol
          return (
            <button
              key={opcion.rol}
              type="button"
              onClick={() => setRol(opcion.rol)}
              className={`rounded-2xl border px-4 py-4 text-left transition-colors ${
                activa
                  ? 'border-primario bg-primario-claro shadow-sm'
                  : 'border-borde bg-white hover:border-primario-suave hover:bg-fondo'
              }`}
            >
              <p className="text-base font-black text-texto-principal">{opcion.titulo}</p>
              <p className="mt-1 text-sm text-texto-secundario">{opcion.descripcion}</p>
            </button>
          )
        })}
      </div>

      {requiereEspecialidad && (
        <div className="mt-4">
          <Label>Especialidad</Label>
          <Input
            value={especialidad}
            onChange={(event) => setEspecialidad(event.target.value)}
            placeholder="Ej: Kinesiologia"
          />
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <BotonPrimario type="button" className="w-full" disabled={!puedeEnviar} onClick={confirmar}>
          {enviando ? 'Guardando...' : 'Continuar'}
        </BotonPrimario>
        <BotonSecundario type="button" className="w-full" onClick={() => navigate('/landing')}>
          Volver
        </BotonSecundario>
      </div>

      <div id="toast-container">
        <Toast toast={toast} />
      </div>
    </CardAcceso>
  )
}
