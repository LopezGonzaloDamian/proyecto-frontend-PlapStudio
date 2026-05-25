import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CardAcceso, HeaderAcceso } from '../../components/AccesoUsuario/CardAcceso'
import { BotonPrimario, BotonSecundario, Input, Label, Textarea } from '../../components/common/ui'
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
  const [perfilProfesional, setPerfilProfesional] = useState({
    especialidad: '',
    biografia: '',
    localidad: '',
    direccion: '',
    precio: '',
  })
  const [enviando, setEnviando] = useState(false)
  const { iniciar } = useSesion()
  const { toast, showToast } = useToast()
  const navigate = useNavigate()

  const requiereEspecialidad = rol === 'PROFESIONAL'
  const precioProfesional = Number(perfilProfesional.precio)
  const profesionalCompleto =
    perfilProfesional.especialidad.trim().length > 0 &&
    perfilProfesional.biografia.trim().length > 0 &&
    perfilProfesional.localidad.trim().length > 0 &&
    perfilProfesional.direccion.trim().length > 0 &&
    Number.isFinite(precioProfesional) &&
    precioProfesional > 0
  const puedeEnviar = !enviando && (!requiereEspecialidad || profesionalCompleto)

  async function confirmar() {
    if (!puedeEnviar) return
    setEnviando(true)
    try {
      const auth = await seleccionarRol({
        rol,
        especialidad: requiereEspecialidad ? perfilProfesional.especialidad.trim() : undefined,
        biografia: requiereEspecialidad ? perfilProfesional.biografia.trim() : undefined,
        localidad: requiereEspecialidad ? perfilProfesional.localidad.trim() : undefined,
        direccion: requiereEspecialidad ? perfilProfesional.direccion.trim() : undefined,
        precio: requiereEspecialidad ? precioProfesional : undefined,
        servicios: requiereEspecialidad ? [perfilProfesional.especialidad.trim()] : undefined,
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
        <div className="mt-4 grid gap-4">
          <div>
            <Label>Rubro</Label>
            <Input
              value={perfilProfesional.especialidad}
              onChange={(event) => setPerfilProfesional({ ...perfilProfesional, especialidad: event.target.value })}
              placeholder="Ej: Kinesiologia"
            />
          </div>
          <div>
            <Label>Descripcion</Label>
            <Textarea
              rows={3}
              value={perfilProfesional.biografia}
              onChange={(event) => setPerfilProfesional({ ...perfilProfesional, biografia: event.target.value })}
              placeholder="Ej: Rehabilitacion fisica y sesiones de movilidad."
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Localidad</Label>
              <Input
                value={perfilProfesional.localidad}
                onChange={(event) => setPerfilProfesional({ ...perfilProfesional, localidad: event.target.value })}
                placeholder="Ej: San Martin"
              />
            </div>
            <div>
              <Label>Direccion</Label>
              <Input
                value={perfilProfesional.direccion}
                onChange={(event) => setPerfilProfesional({ ...perfilProfesional, direccion: event.target.value })}
                placeholder="Ej: Perdriel 2188"
              />
            </div>
          </div>
          <div>
            <Label>Valor del turno</Label>
            <Input
              type="number"
              min="1"
              step="1"
              value={perfilProfesional.precio}
              onChange={(event) => setPerfilProfesional({ ...perfilProfesional, precio: event.target.value })}
              placeholder="Ej: 70000"
            />
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <BotonPrimario type="button" className="w-full" disabled={!puedeEnviar} onClick={confirmar}>
          {enviando ? 'Guardando...' : 'Continuar'}
        </BotonPrimario>
        <BotonSecundario type="button" className="w-full" onClick={() => navigate('/login')}>
          Volver
        </BotonSecundario>
      </div>

      <div id="toast-container">
        <Toast toast={toast} />
      </div>
    </CardAcceso>
  )
}
