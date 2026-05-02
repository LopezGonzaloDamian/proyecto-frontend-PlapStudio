import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, NavLink, useNavigate, useParams } from 'react-router-dom'
import { IconCalendar } from '../../components/LandingPage/Icons'
import { BotonPrimario, BotonSecundario, Input, Label, Select, Textarea } from '../../components/common/ui'

type SeccionProfesional = 'agenda' | 'clientes' | 'pagos' | 'notificaciones' | 'login' | 'registro'
type EstadoTurno = 'Pendiente' | 'Confirmado' | 'Cancelado' | 'Realizado'

type TurnoProfesional = {
  id: number
  cliente: string
  servicio: string
  fecha: string
  horario: string
  estado: EstadoTurno
  pago: 'Pendiente' | 'Pagado'
}

type ClienteProfesional = {
  id: number
  nombre: string
  email: string
  telefono: string
  historial: string[]
}

type PagoProfesional = {
  id: number
  cliente: string
  turno: string
  monto: number
  fecha: string
  facturado: boolean
}

type NotificacionProfesional = {
  id: number
  titulo: string
  detalle: string
  tipo: 'Turno' | 'Pago' | 'Documento'
  fecha: string
}

const seccionesValidas: SeccionProfesional[] = ['agenda', 'clientes', 'pagos', 'notificaciones', 'login', 'registro']

const navItems: Array<{ label: string; seccion: SeccionProfesional | 'dashboard' }> = [
  { label: 'Dashboard', seccion: 'dashboard' },
  { label: 'Agenda', seccion: 'agenda' },
  { label: 'Clientes', seccion: 'clientes' },
  { label: 'Pagos', seccion: 'pagos' },
]

const turnosIniciales: TurnoProfesional[] = [
  { id: 1, cliente: 'Ana Garcia', servicio: 'Evaluacion inicial', fecha: '2026-04-18', horario: '09:00', estado: 'Confirmado', pago: 'Pagado' },
  { id: 2, cliente: 'Carlos Lopez', servicio: 'Sesion de seguimiento', fecha: '2026-04-18', horario: '10:30', estado: 'Pendiente', pago: 'Pendiente' },
  { id: 3, cliente: 'Marta Benitez', servicio: 'Control mensual', fecha: '2026-04-19', horario: '15:00', estado: 'Confirmado', pago: 'Pagado' },
]

const clientesIniciales: ClienteProfesional[] = [
  {
    id: 1,
    nombre: 'Ana Garcia',
    email: 'ana@agendify.com',
    telefono: '+595 981 111 111',
    historial: ['Evaluacion inicial - 18/04/2026', 'Consulta previa - 20/03/2026'],
  },
  {
    id: 2,
    nombre: 'Carlos Lopez',
    email: 'carlos@agendify.com',
    telefono: '+595 981 222 222',
    historial: ['Sesion de seguimiento - 18/04/2026'],
  },
  {
    id: 3,
    nombre: 'Marta Benitez',
    email: 'marta@agendify.com',
    telefono: '+595 981 333 333',
    historial: ['Control mensual - 19/04/2026', 'Plan de trabajo - 02/04/2026'],
  },
]

const pagosIniciales: PagoProfesional[] = [
  { id: 1, cliente: 'Ana Garcia', turno: 'Evaluacion inicial', monto: 90000, fecha: '2026-04-18', facturado: false },
  { id: 2, cliente: 'Marta Benitez', turno: 'Control mensual', monto: 75000, fecha: '2026-04-19', facturado: true },
]

const notificacionesIniciales: NotificacionProfesional[] = [
  { id: 1, titulo: 'Nuevo turno reservado', detalle: 'Carlos Lopez reservo una sesion para hoy a las 10:30.', tipo: 'Turno', fecha: 'Hoy' },
  { id: 2, titulo: 'Pago recibido', detalle: 'Ana Garcia realizo un pago online mockeado.', tipo: 'Pago', fecha: 'Hoy' },
  { id: 3, titulo: 'Documento cargado', detalle: 'Se asocio un documento al historial de Marta Benitez.', tipo: 'Documento', fecha: 'Ayer' },
]

const estadoClass: Record<EstadoTurno, string> = {
  Pendiente: 'bg-amber-100 text-amber-800 border-amber-200',
  Confirmado: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Cancelado: 'bg-red-100 text-red-700 border-red-200',
  Realizado: 'bg-violet-100 text-violet-800 border-violet-200',
}

const formatPrecio = (precio: number) =>
  new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', maximumFractionDigits: 0 }).format(precio)

export default function ProfesionalDashboardMock() {
  const { seccion } = useParams()
  const navigate = useNavigate()
  const seccionActual = seccionesValidas.includes(seccion as SeccionProfesional)
    ? seccion as SeccionProfesional
    : 'dashboard'

  const [turnos, setTurnos] = useState<TurnoProfesional[]>(turnosIniciales)
  const [clientes] = useState<ClienteProfesional[]>(clientesIniciales)
  const [pagos, setPagos] = useState<PagoProfesional[]>(pagosIniciales)
  const [notificaciones, setNotificaciones] = useState<NotificacionProfesional[]>(notificacionesIniciales)
  const [agenda, setAgenda] = useState({ nombre: 'Agenda principal', descripcion: 'Atencion presencial y online' })
  const [disponibilidad, setDisponibilidad] = useState({
    dia: 'Lunes',
    inicio: '09:00',
    fin: '18:00',
    duracion: '30',
  })
  const [filtros, setFiltros] = useState({ fecha: '', estado: 'Todos' })
  const [nuevoTurno, setNuevoTurno] = useState({
    cliente: clientesIniciales[0].nombre,
    servicio: 'Consulta',
    fecha: '2026-04-20',
    horario: '09:00',
  })
  const [clienteDocumento, setClienteDocumento] = useState(clientesIniciales[0].nombre)
  const [tipoDocumento, setTipoDocumento] = useState('Informe')
  const [archivoDocumento, setArchivoDocumento] = useState('')
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [registroForm, setRegistroForm] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    password: '',
    especialidad: '',
  })
  const [menuUsuarioAbierto, setMenuUsuarioAbierto] = useState(false)
  const menuUsuarioRef = useRef<HTMLDivElement>(null)
  const profesionalSesion = { nombre: 'Martina Rios' }
  const inicialesProfesional = profesionalSesion.nombre
    .split(' ')
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase()

  const turnosFiltrados = useMemo(
    () =>
      turnos.filter((turno) => {
        const coincideFecha = filtros.fecha.length === 0 || turno.fecha === filtros.fecha
        const coincideEstado = filtros.estado === 'Todos' || turno.estado === filtros.estado
        return coincideFecha && coincideEstado
      }),
    [turnos, filtros],
  )

  const turnosDeHoy = turnos.filter((turno) => turno.fecha === '2026-04-18' && turno.estado !== 'Cancelado')

  const pathDeSeccion = (item: { seccion: SeccionProfesional | 'dashboard' }) =>
    item.seccion === 'dashboard' ? '/profesional' : `/profesional/${item.seccion}`

  const ingresarProfesional = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault()
    navigate('/profesional')
  }

  const registrarProfesional = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault()
    navigate('/profesional')
  }

  const crearAgenda = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault()
    setNotificaciones((actuales) => [
      { id: Date.now(), titulo: 'Agenda creada', detalle: `Se guardo la agenda ${agenda.nombre}.`, tipo: 'Turno', fecha: 'Ahora' },
      ...actuales,
    ])
  }

  const guardarDisponibilidad = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault()
    setNotificaciones((actuales) => [
      {
        id: Date.now(),
        titulo: 'Disponibilidad actualizada',
        detalle: `${disponibilidad.dia} de ${disponibilidad.inicio} a ${disponibilidad.fin}, turnos cada ${disponibilidad.duracion} minutos.`,
        tipo: 'Turno',
        fecha: 'Ahora',
      },
      ...actuales,
    ])
  }

  const crearTurno = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault()
    setTurnos((actuales) => [
      {
        id: Date.now(),
        cliente: nuevoTurno.cliente,
        servicio: nuevoTurno.servicio,
        fecha: nuevoTurno.fecha,
        horario: nuevoTurno.horario,
        estado: 'Pendiente',
        pago: 'Pendiente',
      },
      ...actuales,
    ])
  }

  const cambiarEstadoTurno = (id: number, estado: EstadoTurno) => {
    setTurnos((actuales) => actuales.map((turno) => turno.id === id ? { ...turno, estado } : turno))
  }

  const subirDocumento = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault()
    setNotificaciones((actuales) => [
      {
        id: Date.now(),
        titulo: 'Documento asociado',
        detalle: `${tipoDocumento} de ${clienteDocumento} quedo cargado como ${archivoDocumento || 'archivo mock'}.`,
        tipo: 'Documento',
        fecha: 'Ahora',
      },
      ...actuales,
    ])
    setArchivoDocumento('')
  }

  const emitirFactura = (id: number) => {
    const pago = pagos.find((item) => item.id === id)
    setPagos((actuales) => actuales.map((item) => item.id === id ? { ...item, facturado: true } : item))
    if (pago) {
      setNotificaciones((actuales) => [
        {
          id: Date.now(),
          titulo: 'Factura generada',
          detalle: `Comprobante mock emitido para ${pago.cliente}.`,
          tipo: 'Pago',
          fecha: 'Ahora',
        },
        ...actuales,
      ])
    }
  }

  useEffect(() => {
    const handleClickAfuera = (evento: MouseEvent) => {
      if (menuUsuarioRef.current && !menuUsuarioRef.current.contains(evento.target as Node)) {
        setMenuUsuarioAbierto(false)
      }
    }

    document.addEventListener('mousedown', handleClickAfuera)
    return () => document.removeEventListener('mousedown', handleClickAfuera)
  }, [])

  return (
    <div className="min-h-screen bg-fondo text-texto-principal">
      <header className="sticky top-0 z-40 border-b border-primario-suave bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-6 px-5 py-3 sm:px-8 xl:px-10">
          <Link to="/profesional" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primario text-white">
              <IconCalendar className="h-5 w-5" />
            </span>
            <span className="text-xl font-black text-texto-principal">Agendify Pro</span>
          </Link>
          <nav className="hidden items-center gap-3 text-sm font-semibold text-texto-secundario lg:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.seccion}
                to={pathDeSeccion(item)}
                end={item.seccion === 'dashboard'}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 transition-colors ${
                    isActive ? 'bg-primario-claro text-primario' : 'hover:bg-primario-claro hover:text-primario'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div ref={menuUsuarioRef} className="relative flex items-center justify-end">
            <button
              type="button"
              onClick={() => setMenuUsuarioAbierto((abierto) => !abierto)}
              className="flex items-center gap-3 rounded-full border border-borde bg-white px-2 py-1.5 shadow-sm transition-colors hover:bg-primario-claro"
              aria-label="Abrir menu de usuario"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primario text-sm font-black text-white">
                {inicialesProfesional}
              </span>
              <svg className={`h-4 w-4 text-texto-secundario transition-transform ${menuUsuarioAbierto ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0l-4.25-4.51a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              </svg>
            </button>

            {menuUsuarioAbierto && (
              <div className="absolute right-0 top-[calc(100%+0.6rem)] min-w-[190px] rounded-2xl border border-borde bg-white p-2 shadow-lg">
                <div className="border-b border-borde-suave px-3 py-2">
                  <p className="text-sm font-bold text-texto-principal">{profesionalSesion.nombre}</p>
                  <p className="text-xs text-texto-secundario">Cuenta profesional</p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/profesional/login')}
                  className="mt-2 flex w-full items-center rounded-xl px-3 py-2 text-left text-sm font-semibold text-texto-principal transition-colors hover:bg-primario-claro hover:text-primario"
                >
                  Cerrar sesion
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-5 py-7 sm:px-8 xl:px-10">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 md:hidden">
          {navItems.map((item) => (
            <NavLink
              key={item.seccion}
              to={pathDeSeccion(item)}
              end={item.seccion === 'dashboard'}
              className={({ isActive }) =>
                `rounded-lg border px-3 py-2 text-center text-sm font-bold transition-colors ${
                  isActive ? 'border-primario bg-primario text-white' : 'border-borde bg-white text-texto-secundario'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        {seccionActual === 'login' && (
          <section className="mx-auto w-full max-w-lg rounded-lg border border-borde-suave bg-white p-7 shadow-sm">
            <h1 className="text-2xl font-black text-texto-principal">Login profesional</h1>
            <p className="mt-1 text-sm text-texto-secundario">Acceso mock al dashboard profesional.</p>
            <form onSubmit={ingresarProfesional} className="mt-5 grid gap-4">
              <div>
                <Label>Email</Label>
                <Input value={loginForm.email} onChange={(evento) => setLoginForm({ ...loginForm, email: evento.target.value })} placeholder="profesional@agendify.com" />
              </div>
              <div>
                <Label>Contrasena</Label>
                <Input type="password" value={loginForm.password} onChange={(evento) => setLoginForm({ ...loginForm, password: evento.target.value })} placeholder="********" />
              </div>
              <BotonPrimario type="submit">Ingresar</BotonPrimario>
              <Link to="/profesional/registro" className="text-center text-sm font-bold text-primario hover:underline">Crear cuenta profesional</Link>
            </form>
          </section>
        )}

        {seccionActual === 'registro' && (
          <section className="mx-auto w-full max-w-3xl rounded-lg border border-borde-suave bg-white p-7 shadow-sm">
            <h1 className="text-2xl font-black text-texto-principal">Registro profesional</h1>
            <p className="mt-1 text-sm text-texto-secundario">Crea una cuenta mock para gestionar agenda y turnos.</p>
            <form onSubmit={registrarProfesional} className="mt-6 grid gap-4 lg:grid-cols-2">
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
                <Input value={registroForm.email} onChange={(evento) => setRegistroForm({ ...registroForm, email: evento.target.value })} />
              </div>
              <div>
                <Label>Telefono</Label>
                <Input value={registroForm.telefono} onChange={(evento) => setRegistroForm({ ...registroForm, telefono: evento.target.value })} />
              </div>
              <div>
                <Label>Contrasena</Label>
                <Input type="password" value={registroForm.password} onChange={(evento) => setRegistroForm({ ...registroForm, password: evento.target.value })} />
              </div>
              <div>
                <Label>Especialidad</Label>
                <Input value={registroForm.especialidad} onChange={(evento) => setRegistroForm({ ...registroForm, especialidad: evento.target.value })} placeholder="Ej: Kinesiologia" />
              </div>
              <BotonPrimario type="submit" className="md:col-span-2">Crear cuenta</BotonPrimario>
            </form>
          </section>
        )}

        {seccionActual === 'dashboard' && (
          <>
            <section className="rounded-lg border border-borde-suave bg-white p-6 shadow-sm xl:p-7">
              <h2 className="text-2xl font-black text-texto-principal">Turnos del dia</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {turnosDeHoy.map((turno) => (
                  <article key={turno.id} className="rounded-lg border border-borde bg-fondo p-4">
                    <h3 className="font-black text-texto-principal">{turno.horario} - {turno.cliente}</h3>
                    <p className="text-sm text-texto-secundario">{turno.servicio}</p>
                    <span className={`mt-3 inline-flex rounded-lg border px-2.5 py-1 text-xs font-bold ${estadoClass[turno.estado]}`}>{turno.estado}</span>
                  </article>
                ))}
              </div>
            </section>
          </>
        )}

        {seccionActual === 'agenda' && (
          <>
            <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
              <form onSubmit={crearAgenda} className="rounded-lg border border-borde-suave bg-white p-6 shadow-sm xl:p-7">
                <h2 className="text-2xl font-black text-texto-principal">Crear agenda</h2>
                <div className="mt-5 grid gap-4">
                  <div>
                    <Label>Nombre de la agenda</Label>
                    <Input value={agenda.nombre} onChange={(evento) => setAgenda({ ...agenda, nombre: evento.target.value })} />
                  </div>
                  <div>
                    <Label>Descripcion</Label>
                    <Textarea rows={4} value={agenda.descripcion} onChange={(evento) => setAgenda({ ...agenda, descripcion: evento.target.value })} />
                  </div>
                  <BotonPrimario type="submit">Crear agenda</BotonPrimario>
                </div>
              </form>

              <form onSubmit={guardarDisponibilidad} className="rounded-lg border border-borde-suave bg-white p-6 shadow-sm xl:p-7">
                <h2 className="text-2xl font-black text-texto-principal">Disponibilidad horaria</h2>
                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  <div>
                    <Label>Dia de la semana</Label>
                    <Select value={disponibilidad.dia} onChange={(evento) => setDisponibilidad({ ...disponibilidad, dia: evento.target.value })}>
                      {['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'].map((dia) => <option key={dia}>{dia}</option>)}
                    </Select>
                  </div>
                  <div>
                    <Label>Duracion de turnos</Label>
                    <Select value={disponibilidad.duracion} onChange={(evento) => setDisponibilidad({ ...disponibilidad, duracion: evento.target.value })}>
                      <option value="30">30 minutos</option>
                      <option value="45">45 minutos</option>
                      <option value="60">60 minutos</option>
                    </Select>
                  </div>
                  <div>
                    <Label>Hora inicio</Label>
                    <Input type="time" value={disponibilidad.inicio} onChange={(evento) => setDisponibilidad({ ...disponibilidad, inicio: evento.target.value })} />
                  </div>
                  <div>
                    <Label>Hora fin</Label>
                    <Input type="time" value={disponibilidad.fin} onChange={(evento) => setDisponibilidad({ ...disponibilidad, fin: evento.target.value })} />
                  </div>
                  <BotonPrimario type="submit" className="md:col-span-2">Guardar disponibilidad</BotonPrimario>
                </div>
              </form>
            </section>

            <section className="rounded-lg border border-borde-suave bg-white p-6 shadow-sm xl:p-7">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <h2 className="text-2xl font-black text-texto-principal">Ver agenda y gestionar turnos</h2>
                  <p className="text-sm text-texto-secundario">CRUD mock: crear, modificar estado y cancelar turnos.</p>
                </div>
                <div className="grid gap-3 lg:grid-cols-3 xl:min-w-[620px]">
                  <div>
                    <Label>Fecha</Label>
                    <Input type="date" value={filtros.fecha} onChange={(evento) => setFiltros({ ...filtros, fecha: evento.target.value })} />
                  </div>
                  <div>
                    <Label>Estado</Label>
                    <Select value={filtros.estado} onChange={(evento) => setFiltros({ ...filtros, estado: evento.target.value })}>
                      {['Todos', 'Pendiente', 'Confirmado', 'Cancelado', 'Realizado'].map((estado) => <option key={estado}>{estado}</option>)}
                    </Select>
                  </div>
                  <BotonSecundario type="button" className="self-end" onClick={() => setFiltros({ fecha: '', estado: 'Todos' })}>Limpiar filtros</BotonSecundario>
                </div>
              </div>

              <form onSubmit={crearTurno} className="mt-6 grid gap-3 rounded-lg border border-borde bg-fondo p-4 lg:grid-cols-[1.1fr_1.1fr_0.9fr_0.8fr_auto]">
                <div>
                  <Label>Cliente</Label>
                  <Select value={nuevoTurno.cliente} onChange={(evento) => setNuevoTurno({ ...nuevoTurno, cliente: evento.target.value })}>
                    {clientes.map((cliente) => <option key={cliente.id}>{cliente.nombre}</option>)}
                  </Select>
                </div>
                <div>
                  <Label>Servicio</Label>
                  <Input value={nuevoTurno.servicio} onChange={(evento) => setNuevoTurno({ ...nuevoTurno, servicio: evento.target.value })} />
                </div>
                <div>
                  <Label>Fecha</Label>
                  <Input type="date" value={nuevoTurno.fecha} onChange={(evento) => setNuevoTurno({ ...nuevoTurno, fecha: evento.target.value })} />
                </div>
                <div>
                  <Label>Horario</Label>
                  <Input type="time" value={nuevoTurno.horario} onChange={(evento) => setNuevoTurno({ ...nuevoTurno, horario: evento.target.value })} />
                </div>
                <BotonPrimario type="submit" className="self-end">Crear turno</BotonPrimario>
              </form>

              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[820px] border-separate border-spacing-y-2 text-left text-sm">
                  <thead>
                    <tr className="text-xs uppercase tracking-normal text-texto-secundario">
                      <th className="px-3 py-2">Cliente</th>
                      <th className="px-3 py-2">Servicio</th>
                      <th className="px-3 py-2">Fecha</th>
                      <th className="px-3 py-2">Estado</th>
                      <th className="px-3 py-2">Pago</th>
                      <th className="px-3 py-2">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {turnosFiltrados.map((turno) => (
                      <tr key={turno.id} className="bg-fondo">
                        <td className="rounded-l-lg px-3 py-3 font-bold text-texto-principal">{turno.cliente}</td>
                        <td className="px-3 py-3 text-texto-secundario">{turno.servicio}</td>
                        <td className="px-3 py-3 text-texto-secundario">{turno.fecha} - {turno.horario}</td>
                        <td className="px-3 py-3"><span className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${estadoClass[turno.estado]}`}>{turno.estado}</span></td>
                        <td className="px-3 py-3 font-semibold text-texto-principal">{turno.pago}</td>
                        <td className="rounded-r-lg px-3 py-3">
                          <div className="flex flex-wrap gap-2">
                            <button type="button" onClick={() => cambiarEstadoTurno(turno.id, 'Confirmado')} className="rounded-lg border border-primario-suave bg-white px-3 py-2 text-xs font-bold text-primario hover:bg-primario-claro">Confirmar</button>
                            <button type="button" onClick={() => cambiarEstadoTurno(turno.id, 'Realizado')} className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50">Realizado</button>
                            <button type="button" onClick={() => cambiarEstadoTurno(turno.id, 'Cancelado')} className="rounded-lg border border-peligro-suave bg-white px-3 py-2 text-xs font-bold text-peligro hover:bg-peligro-suave">Cancelar</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {seccionActual === 'clientes' && (
          <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <article className="rounded-lg border border-borde-suave bg-white p-6 shadow-sm xl:p-7">
              <h2 className="text-2xl font-black text-texto-principal">Gestionar clientes</h2>
              <div className="mt-5 grid gap-4 xl:grid-cols-2">
                {clientes.map((cliente) => (
                  <div key={cliente.id} className="rounded-lg border border-borde bg-fondo p-4">
                    <h3 className="font-black text-texto-principal">{cliente.nombre}</h3>
                    <p className="text-sm text-texto-secundario">{cliente.email} - {cliente.telefono}</p>
                    <div className="mt-3">
                      <span className="text-xs font-bold uppercase text-texto-secundario">Historial</span>
                      <ul className="mt-1 list-inside list-disc text-sm text-texto-secundario">
                        {cliente.historial.map((item) => <li key={item}>{item}</li>)}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <form onSubmit={subirDocumento} className="rounded-lg border border-borde-suave bg-white p-6 shadow-sm xl:p-7">
              <h2 className="text-2xl font-black text-texto-principal">Subir documento</h2>
              <div className="mt-5 grid gap-4">
                <div>
                  <Label>Cliente</Label>
                  <Select value={clienteDocumento} onChange={(evento) => setClienteDocumento(evento.target.value)}>
                    {clientes.map((cliente) => <option key={cliente.id}>{cliente.nombre}</option>)}
                  </Select>
                </div>
                <div>
                  <Label>Tipo de documento</Label>
                  <Select value={tipoDocumento} onChange={(evento) => setTipoDocumento(evento.target.value)}>
                    <option>Informe</option>
                    <option>Receta</option>
                    <option>Estudio</option>
                    <option>Comprobante</option>
                  </Select>
                </div>
                <div>
                  <Label>Archivo</Label>
                  <Input value={archivoDocumento} onChange={(evento) => setArchivoDocumento(evento.target.value)} placeholder="documento.pdf" />
                </div>
                <BotonPrimario type="submit">Asociar documento</BotonPrimario>
              </div>
            </form>
          </section>
        )}

        {seccionActual === 'pagos' && (
          <section className="rounded-lg border border-borde-suave bg-white p-6 shadow-sm xl:p-7">
            <h2 className="text-2xl font-black text-texto-principal">Pagos y facturacion</h2>
            <p className="mt-1 text-sm text-texto-secundario">Consulta turnos pagos y emite comprobantes mock.</p>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[720px] border-separate border-spacing-y-2 text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-normal text-texto-secundario">
                    <th className="px-3 py-2">Cliente</th>
                    <th className="px-3 py-2">Turno</th>
                    <th className="px-3 py-2">Fecha</th>
                    <th className="px-3 py-2">Monto</th>
                    <th className="px-3 py-2">Factura</th>
                    <th className="px-3 py-2">Accion</th>
                  </tr>
                </thead>
                <tbody>
                  {pagos.map((pago) => (
                    <tr key={pago.id} className="bg-fondo">
                      <td className="rounded-l-lg px-3 py-3 font-bold text-texto-principal">{pago.cliente}</td>
                      <td className="px-3 py-3 text-texto-secundario">{pago.turno}</td>
                      <td className="px-3 py-3 text-texto-secundario">{pago.fecha}</td>
                      <td className="px-3 py-3 font-bold text-primario">{formatPrecio(pago.monto)}</td>
                      <td className="px-3 py-3">{pago.facturado ? 'Emitida' : 'Pendiente'}</td>
                      <td className="rounded-r-lg px-3 py-3">
                        <BotonSecundario disabled={pago.facturado} onClick={() => emitirFactura(pago.id)}>Generar comprobante</BotonSecundario>
                      </td>
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
            <p className="mt-1 text-sm text-texto-secundario">Turnos, cambios de agenda, documentos y pagos recibidos.</p>
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
