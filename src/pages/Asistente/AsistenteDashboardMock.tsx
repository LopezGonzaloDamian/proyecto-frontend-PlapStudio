import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, NavLink, useNavigate, useParams } from 'react-router-dom'
import { IconCalendar } from '../../components/LandingPage/Icons'
import { BotonPrimario, BotonSecundario, Input, Label, Select, Textarea } from '../../components/common/ui'

type SeccionAsistente = 'agenda' | 'clientes' | 'historial' | 'notificaciones' | 'login' | 'registro'
type EstadoTurno = 'Disponible' | 'Reservado' | 'Confirmado' | 'Cancelado'

type ProfesionalAsignado = {
  id: number
  nombre: string
  rubro: string
  agenda: string
}

type ClienteAsistente = {
  id: number
  nombre: string
  email: string
  telefono: string
}

type TurnoAsistente = {
  id: number
  profesionalId: number
  clienteId: number | null
  fecha: string
  horario: string
  duracion: string
  estado: EstadoTurno
  notas: string
  motivoCancelacion?: string
}

type NotificacionAsistente = {
  id: number
  tipo: 'Cambio' | 'Cancelacion' | 'Confirmacion'
  titulo: string
  detalle: string
  fecha: string
  leida: boolean
}

const seccionesValidas: SeccionAsistente[] = ['agenda', 'clientes', 'historial', 'notificaciones', 'login', 'registro']

const navItems: Array<{ label: string; seccion: SeccionAsistente | 'dashboard' }> = [
  { label: 'Dashboard', seccion: 'dashboard' },
  { label: 'Agenda', seccion: 'agenda' },
  { label: 'Clientes', seccion: 'clientes' },
  { label: 'Historial', seccion: 'historial' },
]

const profesionalesAsignados: ProfesionalAsignado[] = [
  { id: 1, nombre: 'Dra. Martina Rios', rubro: 'Nutricion', agenda: 'Agenda consultorio central' },
  { id: 2, nombre: 'Leo Barrios', rubro: 'Barberia', agenda: 'Agenda barberia tarde' },
  { id: 3, nombre: 'Sofi Acosta', rubro: 'Manicurista', agenda: 'Agenda estudio unas' },
]

const clientesIniciales: ClienteAsistente[] = [
  { id: 1, nombre: 'Ana Garcia', email: 'ana.garcia@agendify.com', telefono: '+595 981 111 111' },
  { id: 2, nombre: 'Carlos Lopez', email: 'carlos.lopez@agendify.com', telefono: '+595 981 222 222' },
  { id: 3, nombre: 'Marta Benitez', email: 'marta.benitez@agendify.com', telefono: '+595 981 333 333' },
  { id: 4, nombre: 'Lucia Peralta', email: 'lucia.peralta@agendify.com', telefono: '+595 981 444 444' },
]

const turnosIniciales: TurnoAsistente[] = [
  { id: 1, profesionalId: 1, clienteId: 1, fecha: '2026-05-02', horario: '09:00', duracion: '45', estado: 'Confirmado', notas: 'Recordar plan anterior.' },
  { id: 2, profesionalId: 1, clienteId: null, fecha: '2026-05-02', horario: '10:00', duracion: '45', estado: 'Disponible', notas: '' },
  { id: 3, profesionalId: 2, clienteId: 2, fecha: '2026-05-02', horario: '11:30', duracion: '60', estado: 'Reservado', notas: 'Corte y barba.' },
  { id: 4, profesionalId: 3, clienteId: 3, fecha: '2026-05-03', horario: '15:00', duracion: '90', estado: 'Cancelado', notas: 'Reagendar.', motivoCancelacion: 'La clienta aviso que no llegaba a tiempo.' },
  { id: 5, profesionalId: 3, clienteId: 4, fecha: '2026-05-04', horario: '17:30', duracion: '60', estado: 'Confirmado', notas: 'Kapping con esmalte nude.' },
]

const notificacionesIniciales: NotificacionAsistente[] = [
  { id: 1, tipo: 'Cancelacion', titulo: 'Turno cancelado', detalle: 'Marta Benitez cancelo su turno del 03/05 a las 15:00.', fecha: 'Hoy 09:10', leida: false },
  { id: 2, tipo: 'Confirmacion', titulo: 'Nuevo turno reservado', detalle: 'Carlos Lopez reservo un turno con Leo Barrios.', fecha: 'Hoy 08:45', leida: false },
  { id: 3, tipo: 'Cambio', titulo: 'Cambio de agenda', detalle: 'Martina Rios agrego disponibilidad para el jueves.', fecha: 'Ayer 18:20', leida: true },
]

const estadoClass: Record<EstadoTurno, string> = {
  Disponible: 'bg-slate-100 text-slate-700 border-slate-200',
  Reservado: 'bg-amber-100 text-amber-800 border-amber-200',
  Confirmado: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Cancelado: 'bg-red-100 text-red-700 border-red-200',
}

export default function AsistenteDashboardMock() {
  const fechaMockHoy = '2026-05-02'
  const { seccion } = useParams()
  const navigate = useNavigate()
  const seccionActual = seccionesValidas.includes(seccion as SeccionAsistente)
    ? seccion as SeccionAsistente
    : 'dashboard'

  const [turnos, setTurnos] = useState<TurnoAsistente[]>(turnosIniciales)
  const [clientes] = useState<ClienteAsistente[]>(clientesIniciales)
  const [notificaciones, setNotificaciones] = useState<NotificacionAsistente[]>(notificacionesIniciales)
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [registroForm, setRegistroForm] = useState({ nombre: '', apellido: '', email: '', telefono: '', password: '' })
  const [filtrosAgenda, setFiltrosAgenda] = useState({ profesionalId: '1', fechaDesde: '2026-05-02', fechaHasta: '2026-05-05' })
  const [turnoNuevo, setTurnoNuevo] = useState({ profesionalId: '1', clienteId: '1', fecha: '2026-05-05', horario: '09:30', duracion: '45', notas: '' })
  const [turnoEditarId, setTurnoEditarId] = useState('1')
  const [turnoEditar, setTurnoEditar] = useState({ fecha: '2026-05-02', horario: '09:00', duracion: '45', estado: 'Confirmado' as EstadoTurno, notas: 'Recordar plan anterior.' })
  const [turnoCancelarId, setTurnoCancelarId] = useState('1')
  const [motivoCancelacion, setMotivoCancelacion] = useState('')
  const [turnoObservacionId, setTurnoObservacionId] = useState('1')
  const [observacionTurno, setObservacionTurno] = useState('Recordar plan anterior.')
  const [busquedaCliente, setBusquedaCliente] = useState('')
  const [filtrosHistorial, setFiltrosHistorial] = useState({ profesionalId: 'Todos', fecha: '', estado: 'Todos' })
  const [fechaCalendario, setFechaCalendario] = useState(fechaMockHoy)
  const [menuUsuarioAbierto, setMenuUsuarioAbierto] = useState(false)
  const menuUsuarioRef = useRef<HTMLDivElement>(null)
  const asistenteSesion = { nombre: 'Lucia Gomez' }
  const inicialesAsistente = asistenteSesion.nombre.split(' ').slice(0, 2).map((parte) => parte[0]).join('').toUpperCase()

  const getProfesional = (id: number) => profesionalesAsignados.find((profesional) => profesional.id === id)
  const getCliente = (id: number | null) => clientes.find((cliente) => cliente.id === id)
  const turnosAgenda = useMemo(
    () =>
      turnos.filter((turno) => {
        const coincideProfesional = turno.profesionalId === Number(filtrosAgenda.profesionalId)
        const coincideDesde = filtrosAgenda.fechaDesde.length === 0 || turno.fecha >= filtrosAgenda.fechaDesde
        const coincideHasta = filtrosAgenda.fechaHasta.length === 0 || turno.fecha <= filtrosAgenda.fechaHasta
        return coincideProfesional && coincideDesde && coincideHasta
      }),
    [turnos, filtrosAgenda],
  )

  const clientesFiltrados = useMemo(() => {
    const texto = busquedaCliente.trim().toLowerCase()
    return clientes.filter((cliente) => texto.length === 0 || cliente.nombre.toLowerCase().includes(texto))
  }, [clientes, busquedaCliente])

  const historialFiltrado = useMemo(
    () =>
      turnos.filter((turno) => {
        const coincideProfesional = filtrosHistorial.profesionalId === 'Todos' || turno.profesionalId === Number(filtrosHistorial.profesionalId)
        const coincideFecha = filtrosHistorial.fecha.length === 0 || turno.fecha === filtrosHistorial.fecha
        const coincideEstado = filtrosHistorial.estado === 'Todos' || turno.estado === filtrosHistorial.estado
        return coincideProfesional && coincideFecha && coincideEstado
      }),
    [turnos, filtrosHistorial],
  )

  const turnosDelDia = useMemo(
    () => turnos.filter((turno) => turno.fecha === fechaMockHoy && turno.estado !== 'Disponible' && turno.estado !== 'Cancelado'),
    [turnos],
  )

  const turnosPorFecha = useMemo(
    () =>
      turnos.reduce<Record<string, TurnoAsistente[]>>((acc, turno) => {
        if (!acc[turno.fecha]) acc[turno.fecha] = []
        acc[turno.fecha].push(turno)
        return acc
      }, {}),
    [turnos],
  )

  const fechaSeleccionada = useMemo(() => new Date(`${fechaCalendario}T00:00:00`), [fechaCalendario])

  const diasMes = useMemo(() => {
    const year = fechaSeleccionada.getFullYear()
    const month = fechaSeleccionada.getMonth()
    const first = new Date(year, month, 1)
    const startOffset = (first.getDay() + 6) % 7
    const start = new Date(first)
    start.setDate(first.getDate() - startOffset)
    return Array.from({ length: 35 }, (_, index) => {
      const fecha = new Date(start)
      fecha.setDate(start.getDate() + index)
      return fecha
    })
  }, [fechaSeleccionada])

  const turnosFechaSeleccionada = turnosPorFecha[fechaCalendario] ?? []

  useEffect(() => {
    const turno = turnos.find((item) => item.id === Number(turnoEditarId))
    if (!turno) return
    setTurnoEditar({ fecha: turno.fecha, horario: turno.horario, duracion: turno.duracion, estado: turno.estado, notas: turno.notas })
  }, [turnoEditarId, turnos])

  useEffect(() => {
    const turno = turnos.find((item) => item.id === Number(turnoObservacionId))
    if (!turno) return
    setObservacionTurno(turno.notas)
  }, [turnoObservacionId, turnos])

  useEffect(() => {
    const handleClickAfuera = (evento: MouseEvent) => {
      if (menuUsuarioRef.current && !menuUsuarioRef.current.contains(evento.target as Node)) {
        setMenuUsuarioAbierto(false)
      }
    }

    document.addEventListener('mousedown', handleClickAfuera)
    return () => document.removeEventListener('mousedown', handleClickAfuera)
  }, [])

  const pathDeSeccion = (item: { seccion: SeccionAsistente | 'dashboard' }) =>
    item.seccion === 'dashboard' ? '/asistente' : `/asistente/${item.seccion}`

  const ingresarAsistente = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault()
    navigate('/asistente')
  }

  const registrarAsistente = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault()
    navigate('/asistente')
  }

  const crearTurno = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault()
    const profesional = getProfesional(Number(turnoNuevo.profesionalId))
    const cliente = getCliente(Number(turnoNuevo.clienteId))
    setTurnos((actuales) => [
      { id: Date.now(), profesionalId: Number(turnoNuevo.profesionalId), clienteId: Number(turnoNuevo.clienteId), fecha: turnoNuevo.fecha, horario: turnoNuevo.horario, duracion: turnoNuevo.duracion, estado: 'Reservado', notas: turnoNuevo.notas },
      ...actuales,
    ])
    setNotificaciones((actuales) => [
      { id: Date.now() + 1, tipo: 'Confirmacion', titulo: 'Turno creado', detalle: `Se agendo un turno para ${cliente?.nombre ?? 'cliente'} con ${profesional?.nombre ?? 'profesional'}.`, fecha: 'Ahora', leida: false },
      ...actuales,
    ])
    setTurnoNuevo((actual) => ({ ...actual, notas: '' }))
  }

  const modificarTurno = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault()
    setTurnos((actuales) =>
      actuales.map((turno) =>
        turno.id === Number(turnoEditarId)
          ? { ...turno, fecha: turnoEditar.fecha, horario: turnoEditar.horario, duracion: turnoEditar.duracion, estado: turnoEditar.estado, notas: turnoEditar.notas }
          : turno,
      ),
    )
    setNotificaciones((actuales) => [
      { id: Date.now(), tipo: 'Cambio', titulo: 'Turno modificado', detalle: `Se actualizo el turno ${turnoEditarId}.`, fecha: 'Ahora', leida: false },
      ...actuales,
    ])
  }

  const cancelarTurno = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault()
    setTurnos((actuales) =>
      actuales.map((turno) =>
        turno.id === Number(turnoCancelarId) ? { ...turno, estado: 'Cancelado', motivoCancelacion } : turno,
      ),
    )
    setNotificaciones((actuales) => [
      { id: Date.now(), tipo: 'Cancelacion', titulo: 'Turno cancelado', detalle: motivoCancelacion || `Se cancelo el turno ${turnoCancelarId}.`, fecha: 'Ahora', leida: false },
      ...actuales,
    ])
    setMotivoCancelacion('')
  }

  const guardarObservacion = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault()
    setTurnos((actuales) =>
      actuales.map((turno) => turno.id === Number(turnoObservacionId) ? { ...turno, notas: observacionTurno } : turno),
    )
    setNotificaciones((actuales) => [
      { id: Date.now(), tipo: 'Cambio', titulo: 'Observacion registrada', detalle: `Se guardo una observacion en el turno ${turnoObservacionId}.`, fecha: 'Ahora', leida: false },
      ...actuales,
    ])
  }

  return (
    <div className="min-h-screen bg-fondo text-texto-principal">
      <header className="sticky top-0 z-40 border-b border-primario-suave bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-6 px-5 py-3 sm:px-8 xl:px-10">
          <Link to="/asistente" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primario text-white">
              <IconCalendar className="h-5 w-5" />
            </span>
            <span className="text-xl font-black text-texto-principal">Agendify Assist</span>
          </Link>

          <nav className="hidden items-center gap-3 text-sm font-semibold text-texto-secundario lg:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.seccion}
                to={pathDeSeccion(item)}
                end={item.seccion === 'dashboard'}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 transition-colors ${isActive ? 'bg-primario-claro text-primario' : 'hover:bg-primario-claro hover:text-primario'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div ref={menuUsuarioRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuUsuarioAbierto((abierto) => !abierto)}
                className="flex items-center gap-3 rounded-full border border-borde bg-white px-2 py-1.5 shadow-sm transition-colors hover:bg-primario-claro"
                aria-label="Abrir menu de usuario"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primario text-sm font-black text-white">
                  {inicialesAsistente}
                </span>
                <svg className={`h-4 w-4 text-texto-secundario transition-transform ${menuUsuarioAbierto ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0l-4.25-4.51a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                </svg>
              </button>

              {menuUsuarioAbierto && (
                <div className="absolute right-0 top-[calc(100%+0.6rem)] min-w-[190px] rounded-2xl border border-borde bg-white p-2 shadow-lg">
                  <div className="border-b border-borde-suave px-3 py-2">
                    <p className="text-sm font-bold text-texto-principal">{asistenteSesion.nombre}</p>
                    <p className="text-xs text-texto-secundario">Cuenta asistente</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/asistente/login')}
                    className="mt-2 flex w-full items-center rounded-xl px-3 py-2 text-left text-sm font-semibold text-texto-principal transition-colors hover:bg-primario-claro hover:text-primario"
                  >
                    Cerrar sesion
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-5 py-7 sm:px-8 xl:px-10">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:hidden">
          {navItems.map((item) => (
            <NavLink
              key={item.seccion}
              to={pathDeSeccion(item)}
              end={item.seccion === 'dashboard'}
              className={({ isActive }) =>
                `rounded-lg border px-3 py-2 text-center text-sm font-bold transition-colors ${isActive ? 'border-primario bg-primario text-white' : 'border-borde bg-white text-texto-secundario'}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        {seccionActual === 'login' && (
          <section className="mx-auto w-full max-w-lg rounded-lg border border-borde-suave bg-white p-7 shadow-sm">
            <h1 className="text-2xl font-black text-texto-principal">Login asistente</h1>
            <p className="mt-1 text-sm text-texto-secundario">Acceso mock al panel operativo del asistente.</p>
            <form onSubmit={ingresarAsistente} className="mt-6 grid gap-4">
              <div>
                <Label>Email</Label>
                <Input value={loginForm.email} onChange={(evento) => setLoginForm({ ...loginForm, email: evento.target.value })} placeholder="asistente@agendify.com" />
              </div>
              <div>
                <Label>Contrasena</Label>
                <Input type="password" value={loginForm.password} onChange={(evento) => setLoginForm({ ...loginForm, password: evento.target.value })} placeholder="********" />
              </div>
              <BotonPrimario type="submit">Ingresar</BotonPrimario>
            </form>
          </section>
        )}

        {seccionActual === 'registro' && (
          <section className="mx-auto w-full max-w-3xl rounded-lg border border-borde-suave bg-white p-7 shadow-sm">
            <h1 className="text-2xl font-black text-texto-principal">Registro asistente</h1>
            <p className="mt-1 text-sm text-texto-secundario">Cuenta mock para operar agendas asignadas por profesionales.</p>
            <form onSubmit={registrarAsistente} className="mt-6 grid gap-4 lg:grid-cols-2">
              <div>
                <Label>Nombre</Label>
                <Input value={registroForm.nombre} onChange={(evento) => setRegistroForm({ ...registroForm, nombre: evento.target.value })} />
              </div>
              <div>
                <Label>Apellido</Label>
                <Input value={registroForm.apellido} onChange={(evento) => setRegistroForm({ ...registroForm, apellido: evento.target.value })} />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={registroForm.email} onChange={(evento) => setRegistroForm({ ...registroForm, email: evento.target.value })} placeholder="asistente@agendify.com" />
              </div>
              <div>
                <Label>Telefono</Label>
                <Input value={registroForm.telefono} onChange={(evento) => setRegistroForm({ ...registroForm, telefono: evento.target.value })} />
              </div>
              <div className="lg:col-span-2">
                <Label>Contrasena</Label>
                <Input type="password" value={registroForm.password} onChange={(evento) => setRegistroForm({ ...registroForm, password: evento.target.value })} />
              </div>
              <BotonPrimario type="submit" className="lg:col-span-2">Crear cuenta</BotonPrimario>
            </form>
          </section>
        )}

        {seccionActual === 'dashboard' && (
          <>
            <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
              <article className="rounded-lg border border-borde-suave bg-white p-6 shadow-sm xl:p-7">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-black text-texto-principal">Turnos del dia</h2>
                    <p className="text-sm text-texto-secundario">Agenda operativa para hoy.</p>
                  </div>
                  <BotonSecundario type="button" onClick={() => navigate('/asistente/agenda')}>Ver agenda</BotonSecundario>
                </div>
                <div className="mt-5 grid gap-3">
                  {turnosDelDia.map((turno) => (
                    <article key={turno.id} className="rounded-lg border border-borde bg-fondo p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="font-black text-texto-principal">{turno.horario} - {getProfesional(turno.profesionalId)?.nombre}</h3>
                        <span className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${estadoClass[turno.estado]}`}>{turno.estado}</span>
                      </div>
                      <p className="mt-1 text-sm text-texto-secundario">{getCliente(turno.clienteId)?.nombre ?? 'Horario libre'}</p>
                      <p className="mt-2 text-sm font-semibold text-texto-principal">{turno.duracion} min</p>
                    </article>
                  ))}
                </div>
              </article>

              <article className="rounded-lg border border-borde-suave bg-white p-6 shadow-sm xl:p-7">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-black text-texto-principal">Calendario</h2>
                    <p className="text-sm text-texto-secundario">Vista mensual de turnos asignados.</p>
                  </div>
                  <Input type="date" value={fechaCalendario} onChange={(evento) => setFechaCalendario(evento.target.value)} className="max-w-[190px]" />
                </div>

                <div className="mt-5 grid grid-cols-7 gap-2 text-center text-xs font-bold uppercase text-texto-secundario">
                  {['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'].map((dia) => <span key={dia}>{dia}</span>)}
                </div>
                <div className="mt-2 grid grid-cols-7 gap-2">
                  {diasMes.map((dia) => {
                    const fechaIso = dia.toISOString().slice(0, 10)
                    const turnosDia = turnosPorFecha[fechaIso] ?? []
                    const esMesActual = dia.getMonth() === fechaSeleccionada.getMonth()
                    const esSeleccionado = fechaIso === fechaCalendario

                    return (
                      <button
                        key={fechaIso}
                        type="button"
                        onClick={() => setFechaCalendario(fechaIso)}
                        className={`min-h-[86px] rounded-lg border p-2 text-left transition-colors ${
                          esSeleccionado
                            ? 'border-primario bg-primario-claro'
                            : 'border-borde bg-fondo hover:border-primario-suave hover:bg-white'
                        } ${esMesActual ? 'opacity-100' : 'opacity-45'}`}
                      >
                        <span className="text-sm font-black text-texto-principal">{dia.getDate()}</span>
                        <div className="mt-2 grid gap-1">
                          {turnosDia.slice(0, 2).map((turno) => (
                            <span key={turno.id} className="truncate rounded bg-white px-1.5 py-1 text-[11px] font-bold text-primario">
                              {turno.horario} {getProfesional(turno.profesionalId)?.nombre.split(' ')[0]}
                            </span>
                          ))}
                          {turnosDia.length > 2 && <span className="text-[11px] font-bold text-texto-secundario">+{turnosDia.length - 2} mas</span>}
                        </div>
                      </button>
                    )
                  })}
                </div>

                <div className="mt-5 rounded-lg border border-borde bg-fondo p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="font-black text-texto-principal">Detalle del dia seleccionado</h3>
                    <span className="text-sm font-semibold text-texto-secundario">{fechaCalendario}</span>
                  </div>
                  <div className="mt-3 grid gap-2">
                    {turnosFechaSeleccionada.length === 0 && (
                      <p className="text-sm text-texto-secundario">No hay turnos para esta fecha.</p>
                    )}
                    {turnosFechaSeleccionada.map((turno) => (
                      <div key={turno.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white px-3 py-2">
                        <div>
                          <p className="text-sm font-bold text-texto-principal">{turno.horario} - {getProfesional(turno.profesionalId)?.nombre}</p>
                          <p className="text-xs text-texto-secundario">{getCliente(turno.clienteId)?.nombre ?? 'Sin reservar'}</p>
                        </div>
                        <span className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${estadoClass[turno.estado]}`}>{turno.estado}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            </section>
          </>
        )}

        {seccionActual === 'agenda' && (
          <>
            <section className="rounded-lg border border-borde-suave bg-white p-6 shadow-sm xl:p-7">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <h2 className="text-2xl font-black text-texto-principal">Agenda asignada</h2>
                  <p className="text-sm text-texto-secundario">Filtra por profesional y rango de fechas.</p>
                </div>
                <div className="grid gap-3 lg:grid-cols-3 xl:min-w-[760px]">
                  <div>
                    <Label>Profesional</Label>
                    <Select value={filtrosAgenda.profesionalId} onChange={(evento) => setFiltrosAgenda({ ...filtrosAgenda, profesionalId: evento.target.value })}>
                      {profesionalesAsignados.map((profesional) => <option key={profesional.id} value={profesional.id}>{profesional.nombre}</option>)}
                    </Select>
                  </div>
                  <div>
                    <Label>Desde</Label>
                    <Input type="date" value={filtrosAgenda.fechaDesde} onChange={(evento) => setFiltrosAgenda({ ...filtrosAgenda, fechaDesde: evento.target.value })} />
                  </div>
                  <div>
                    <Label>Hasta</Label>
                    <Input type="date" value={filtrosAgenda.fechaHasta} onChange={(evento) => setFiltrosAgenda({ ...filtrosAgenda, fechaHasta: evento.target.value })} />
                  </div>
                </div>
              </div>

              <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-[920px] border-separate border-spacing-y-2 text-left text-sm">
                  <thead>
                    <tr className="text-xs uppercase text-texto-secundario">
                      <th className="px-3 py-2">Profesional</th>
                      <th className="px-3 py-2">Cliente</th>
                      <th className="px-3 py-2">Fecha</th>
                      <th className="px-3 py-2">Horario</th>
                      <th className="px-3 py-2">Duracion</th>
                      <th className="px-3 py-2">Estado</th>
                      <th className="px-3 py-2">Observacion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {turnosAgenda.map((turno) => (
                      <tr key={turno.id} className="bg-fondo">
                        <td className="rounded-l-lg px-3 py-3 font-bold text-texto-principal">{getProfesional(turno.profesionalId)?.nombre}</td>
                        <td className="px-3 py-3 text-texto-secundario">{getCliente(turno.clienteId)?.nombre ?? 'Sin reservar'}</td>
                        <td className="px-3 py-3 text-texto-secundario">{turno.fecha}</td>
                        <td className="px-3 py-3 text-texto-secundario">{turno.horario}</td>
                        <td className="px-3 py-3 text-texto-secundario">{turno.duracion} min</td>
                        <td className="px-3 py-3"><span className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${estadoClass[turno.estado]}`}>{turno.estado}</span></td>
                        <td className="rounded-r-lg px-3 py-3 text-texto-secundario">{turno.notas || 'Sin notas'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              <form onSubmit={crearTurno} className="rounded-lg border border-borde-suave bg-white p-6 shadow-sm xl:p-7">
                <h2 className="text-2xl font-black text-texto-principal">Crear turno</h2>
                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  <div>
                    <Label>Profesional</Label>
                    <Select value={turnoNuevo.profesionalId} onChange={(evento) => setTurnoNuevo({ ...turnoNuevo, profesionalId: evento.target.value })}>
                      {profesionalesAsignados.map((profesional) => <option key={profesional.id} value={profesional.id}>{profesional.nombre}</option>)}
                    </Select>
                  </div>
                  <div>
                    <Label>Cliente</Label>
                    <Select value={turnoNuevo.clienteId} onChange={(evento) => setTurnoNuevo({ ...turnoNuevo, clienteId: evento.target.value })}>
                      {clientes.map((cliente) => <option key={cliente.id} value={cliente.id}>{cliente.nombre}</option>)}
                    </Select>
                  </div>
                  <div>
                    <Label>Fecha</Label>
                    <Input type="date" value={turnoNuevo.fecha} onChange={(evento) => setTurnoNuevo({ ...turnoNuevo, fecha: evento.target.value })} />
                  </div>
                  <div>
                    <Label>Horario</Label>
                    <Input type="time" value={turnoNuevo.horario} onChange={(evento) => setTurnoNuevo({ ...turnoNuevo, horario: evento.target.value })} />
                  </div>
                  <div>
                    <Label>Duracion</Label>
                    <Select value={turnoNuevo.duracion} onChange={(evento) => setTurnoNuevo({ ...turnoNuevo, duracion: evento.target.value })}>
                      <option value="30">30 minutos</option>
                      <option value="45">45 minutos</option>
                      <option value="60">60 minutos</option>
                      <option value="90">90 minutos</option>
                    </Select>
                  </div>
                  <div className="lg:col-span-2">
                    <Label>Notas u observaciones opcionales</Label>
                    <Textarea rows={4} value={turnoNuevo.notas} onChange={(evento) => setTurnoNuevo({ ...turnoNuevo, notas: evento.target.value })} />
                  </div>
                  <BotonPrimario type="submit" className="lg:col-span-2">Registrar turno</BotonPrimario>
                </div>
              </form>

              <div className="grid gap-6">
                <form onSubmit={modificarTurno} className="rounded-lg border border-borde-suave bg-white p-6 shadow-sm xl:p-7">
                  <h2 className="text-2xl font-black text-texto-principal">Modificar turno</h2>
                  <div className="mt-5 grid gap-4 lg:grid-cols-2">
                    <div className="lg:col-span-2">
                      <Label>Seleccionar turno</Label>
                      <Select value={turnoEditarId} onChange={(evento) => setTurnoEditarId(evento.target.value)}>
                        {turnos.filter((turno) => turno.estado !== 'Cancelado').map((turno) => (
                          <option key={turno.id} value={turno.id}>{getProfesional(turno.profesionalId)?.nombre} - {turno.fecha} {turno.horario}</option>
                        ))}
                      </Select>
                    </div>
                    <div>
                      <Label>Nueva fecha</Label>
                      <Input type="date" value={turnoEditar.fecha} onChange={(evento) => setTurnoEditar({ ...turnoEditar, fecha: evento.target.value })} />
                    </div>
                    <div>
                      <Label>Nuevo horario</Label>
                      <Input type="time" value={turnoEditar.horario} onChange={(evento) => setTurnoEditar({ ...turnoEditar, horario: evento.target.value })} />
                    </div>
                    <div>
                      <Label>Nueva duracion</Label>
                      <Select value={turnoEditar.duracion} onChange={(evento) => setTurnoEditar({ ...turnoEditar, duracion: evento.target.value })}>
                        <option value="30">30 minutos</option>
                        <option value="45">45 minutos</option>
                        <option value="60">60 minutos</option>
                        <option value="90">90 minutos</option>
                      </Select>
                    </div>
                    <div>
                      <Label>Estado</Label>
                      <Select value={turnoEditar.estado} onChange={(evento) => setTurnoEditar({ ...turnoEditar, estado: evento.target.value as EstadoTurno })}>
                        {['Disponible', 'Reservado', 'Confirmado', 'Cancelado'].map((estado) => <option key={estado}>{estado}</option>)}
                      </Select>
                    </div>
                    <div className="lg:col-span-2">
                      <Label>Notas opcionales</Label>
                      <Textarea rows={3} value={turnoEditar.notas} onChange={(evento) => setTurnoEditar({ ...turnoEditar, notas: evento.target.value })} />
                    </div>
                    <BotonPrimario type="submit" className="lg:col-span-2">Actualizar turno</BotonPrimario>
                  </div>
                </form>

                <div className="grid gap-6 lg:grid-cols-2">
                  <form onSubmit={cancelarTurno} className="rounded-lg border border-borde-suave bg-white p-6 shadow-sm">
                    <h2 className="text-xl font-black text-texto-principal">Cancelar turno</h2>
                    <div className="mt-5 grid gap-4">
                      <div>
                        <Label>Seleccionar turno</Label>
                        <Select value={turnoCancelarId} onChange={(evento) => setTurnoCancelarId(evento.target.value)}>
                          {turnos.filter((turno) => turno.estado !== 'Cancelado').map((turno) => (
                            <option key={turno.id} value={turno.id}>{getProfesional(turno.profesionalId)?.nombre} - {turno.fecha} {turno.horario}</option>
                          ))}
                        </Select>
                      </div>
                      <div>
                        <Label>Motivo de cancelacion opcional</Label>
                        <Textarea rows={3} value={motivoCancelacion} onChange={(evento) => setMotivoCancelacion(evento.target.value)} />
                      </div>
                      <BotonSecundario type="submit">Cancelar turno</BotonSecundario>
                    </div>
                  </form>

                  <form onSubmit={guardarObservacion} className="rounded-lg border border-borde-suave bg-white p-6 shadow-sm">
                    <h2 className="text-xl font-black text-texto-principal">Registrar observacion</h2>
                    <div className="mt-5 grid gap-4">
                      <div>
                        <Label>Seleccionar turno</Label>
                        <Select value={turnoObservacionId} onChange={(evento) => setTurnoObservacionId(evento.target.value)}>
                          {turnos.map((turno) => (
                            <option key={turno.id} value={turno.id}>{getProfesional(turno.profesionalId)?.nombre} - {turno.fecha} {turno.horario}</option>
                          ))}
                        </Select>
                      </div>
                      <div>
                        <Label>Observacion</Label>
                        <Textarea rows={3} value={observacionTurno} onChange={(evento) => setObservacionTurno(evento.target.value)} />
                      </div>
                      <BotonPrimario type="submit">Guardar observacion</BotonPrimario>
                    </div>
                  </form>
                </div>
              </div>
            </section>
          </>
        )}

        {seccionActual === 'clientes' && (
          <section className="rounded-lg border border-borde-suave bg-white p-6 shadow-sm xl:p-7">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <h2 className="text-2xl font-black text-texto-principal">Datos basicos del cliente</h2>
                <p className="text-sm text-texto-secundario">Informacion basica asociada a los turnos.</p>
              </div>
              <div className="w-full xl:max-w-sm">
                <Label>Buscar cliente</Label>
                <Input value={busquedaCliente} onChange={(evento) => setBusquedaCliente(evento.target.value)} placeholder="Ej: Ana Garcia" />
              </div>
            </div>

            <div className="mt-6 grid gap-4 xl:grid-cols-2">
              {clientesFiltrados.map((cliente) => {
                const turnosCliente = turnos.filter((turno) => turno.clienteId === cliente.id)
                return (
                  <article key={cliente.id} className="rounded-lg border border-borde bg-fondo p-5">
                    <h3 className="text-lg font-black text-texto-principal">{cliente.nombre}</h3>
                    <p className="mt-1 text-sm text-texto-secundario">{cliente.telefono}</p>
                    <p className="text-sm text-texto-secundario">{cliente.email}</p>
                    <div className="mt-4 grid gap-2">
                      {turnosCliente.map((turno) => (
                        <div key={turno.id} className="rounded-lg border border-borde-suave bg-white px-3 py-2">
                          <p className="text-sm font-semibold text-texto-principal">{getProfesional(turno.profesionalId)?.nombre}</p>
                          <p className="text-sm text-texto-secundario">{turno.fecha} - {turno.horario} - {turno.estado}</p>
                        </div>
                      ))}
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        )}

        {seccionActual === 'historial' && (
          <section className="rounded-lg border border-borde-suave bg-white p-6 shadow-sm xl:p-7">
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-2xl font-black text-texto-principal">Historial de turnos</h2>
                <p className="text-sm text-texto-secundario">Turnos anteriores y actuales dentro de agendas asignadas.</p>
              </div>
              <div className="grid gap-3 lg:grid-cols-3 xl:max-w-4xl">
                <div>
                  <Label>Profesional</Label>
                  <Select value={filtrosHistorial.profesionalId} onChange={(evento) => setFiltrosHistorial({ ...filtrosHistorial, profesionalId: evento.target.value })}>
                    <option value="Todos">Todos</option>
                    {profesionalesAsignados.map((profesional) => <option key={profesional.id} value={profesional.id}>{profesional.nombre}</option>)}
                  </Select>
                </div>
                <div>
                  <Label>Fecha</Label>
                  <Input type="date" value={filtrosHistorial.fecha} onChange={(evento) => setFiltrosHistorial({ ...filtrosHistorial, fecha: evento.target.value })} />
                </div>
                <div>
                  <Label>Estado</Label>
                  <Select value={filtrosHistorial.estado} onChange={(evento) => setFiltrosHistorial({ ...filtrosHistorial, estado: evento.target.value })}>
                    {['Todos', 'Disponible', 'Reservado', 'Confirmado', 'Cancelado'].map((estado) => <option key={estado}>{estado}</option>)}
                  </Select>
                </div>
              </div>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[940px] border-separate border-spacing-y-2 text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase text-texto-secundario">
                    <th className="px-3 py-2">Profesional</th>
                    <th className="px-3 py-2">Cliente</th>
                    <th className="px-3 py-2">Fecha</th>
                    <th className="px-3 py-2">Horario</th>
                    <th className="px-3 py-2">Duracion</th>
                    <th className="px-3 py-2">Estado</th>
                    <th className="px-3 py-2">Motivo / notas</th>
                  </tr>
                </thead>
                <tbody>
                  {historialFiltrado.map((turno) => (
                    <tr key={turno.id} className="bg-fondo">
                      <td className="rounded-l-lg px-3 py-3 font-bold text-texto-principal">{getProfesional(turno.profesionalId)?.nombre}</td>
                      <td className="px-3 py-3 text-texto-secundario">{getCliente(turno.clienteId)?.nombre ?? 'Sin cliente'}</td>
                      <td className="px-3 py-3 text-texto-secundario">{turno.fecha}</td>
                      <td className="px-3 py-3 text-texto-secundario">{turno.horario}</td>
                      <td className="px-3 py-3 text-texto-secundario">{turno.duracion} min</td>
                      <td className="px-3 py-3"><span className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${estadoClass[turno.estado]}`}>{turno.estado}</span></td>
                      <td className="rounded-r-lg px-3 py-3 text-texto-secundario">{turno.motivoCancelacion || turno.notas || 'Sin detalle'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {seccionActual === 'notificaciones' && (
          <section className="rounded-lg border border-borde-suave bg-white p-6 shadow-sm xl:p-7">
            <h2 className="text-2xl font-black text-texto-principal">Notificaciones</h2>
            <p className="text-sm text-texto-secundario">Cambios, confirmaciones y cancelaciones de turnos.</p>
            <div className="mt-5 grid gap-3">
              {notificaciones.map((notificacion) => (
                <article key={notificacion.id} className="rounded-lg border border-borde bg-fondo p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-black text-texto-principal">{notificacion.titulo}</h3>
                    <span className="rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-primario">{notificacion.tipo} - {notificacion.fecha}</span>
                  </div>
                  <p className="mt-2 text-sm text-texto-secundario">{notificacion.detalle}</p>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
