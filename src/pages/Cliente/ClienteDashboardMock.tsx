import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, NavLink, useNavigate, useParams } from 'react-router-dom'
import { IconBell, IconCalendar, IconCheck, IconPhone, IconStar } from '../../components/LandingPage/Icons'
import { BotonPrimario, BotonSecundario, Input, Label, Select, Textarea } from '../../components/common/ui'

type Profesional = {
  id: number
  nombre: string
  especialidad: string
  ubicacion: string
  precio: number
  bio: string
  servicios: string[]
  horarios: string[]
}

type TurnoEstado = 'Pendiente' | 'Confirmado' | 'Cancelado' | 'Realizado'

type Turno = {
  id: number
  profesional: string
  servicio: string
  fecha: string
  horario: string
  estado: TurnoEstado
  pago: 'Pendiente' | 'Pagado' | 'No requerido'
  observaciones?: string
  motivoCancelacion?: string
}

type Notificacion = {
  id: number
  titulo: string
  detalle: string
  tipo: 'Turno' | 'Pago' | 'Documento' | 'Recordatorio'
  fecha: string
}

const profesionales: Profesional[] = [
  {
    id: 1,
    nombre: 'Dra. Martina Rios',
    especialidad: 'Nutricion',
    ubicacion: 'Asuncion',
    precio: 85000,
    bio: 'Atencion nutricional integral para planes de alimentacion, control metabolico y seguimiento de habitos.',
    servicios: ['Consulta inicial', 'Control mensual', 'Plan alimentario'],
    horarios: ['09:00', '10:30', '15:00', '17:30'],
  },
  {
    id: 2,
    nombre: 'Lic. Diego Benitez',
    especialidad: 'Kinesiologia',
    ubicacion: 'San Lorenzo',
    precio: 70000,
    bio: 'Rehabilitacion fisica, tratamiento de lesiones deportivas y sesiones de movilidad funcional.',
    servicios: ['Evaluacion', 'Sesion de rehabilitacion', 'Masoterapia'],
    horarios: ['08:30', '11:00', '14:30', '18:00'],
  },
  {
    id: 3,
    nombre: 'Dra. Camila Duarte',
    especialidad: 'Odontologia',
    ubicacion: 'Fernando de la Mora',
    precio: 120000,
    bio: 'Consultorio odontologico con agenda para controles, limpieza, restauraciones y urgencias simples.',
    servicios: ['Control odontologico', 'Limpieza dental', 'Restauracion'],
    horarios: ['09:30', '12:00', '16:00', '19:00'],
  },
  {
    id: 4,
    nombre: 'Lic. Valeria Sosa',
    especialidad: 'Psicologia',
    ubicacion: 'Asuncion',
    precio: 95000,
    bio: 'Acompanamiento psicologico para adultos, ansiedad, organizacion personal y bienestar emocional.',
    servicios: ['Primera entrevista', 'Sesion individual', 'Seguimiento online'],
    horarios: ['10:00', '13:30', '16:30', '20:00'],
  },
]

const turnosIniciales: Turno[] = [
  {
    id: 101,
    profesional: 'Dra. Martina Rios',
    servicio: 'Control mensual',
    fecha: '2026-04-22',
    horario: '10:30',
    estado: 'Confirmado',
    pago: 'Pendiente',
    observaciones: 'Llevar estudios recientes.',
  },
  {
    id: 102,
    profesional: 'Lic. Diego Benitez',
    servicio: 'Sesion de rehabilitacion',
    fecha: '2026-04-18',
    horario: '14:30',
    estado: 'Pendiente',
    pago: 'Pendiente',
  },
  {
    id: 103,
    profesional: 'Dra. Camila Duarte',
    servicio: 'Limpieza dental',
    fecha: '2026-04-10',
    horario: '09:30',
    estado: 'Realizado',
    pago: 'Pagado',
  },
]

const notificacionesIniciales: Notificacion[] = [
  {
    id: 1,
    titulo: 'Recordatorio de turno',
    detalle: 'Tenes un turno confirmado con Dra. Martina Rios el 22/04 a las 10:30.',
    tipo: 'Recordatorio',
    fecha: 'Hoy',
  },
  {
    id: 2,
    titulo: 'Pago pendiente',
    detalle: 'El turno de nutricion tiene un pago online mockeado disponible.',
    tipo: 'Pago',
    fecha: 'Ayer',
  },
  {
    id: 3,
    titulo: 'Documento disponible',
    detalle: 'Tu comprobante de limpieza dental quedo disponible en la plataforma.',
    tipo: 'Documento',
    fecha: '10/04',
  },
]

const estados: Array<'Todos' | TurnoEstado> = ['Todos', 'Pendiente', 'Confirmado', 'Cancelado', 'Realizado']
const secciones = ['buscar', 'profesional', 'turnos', 'notificaciones'] as const
type SeccionCliente = typeof secciones[number]
type ItemNavCliente = { label: string; seccion: SeccionCliente | 'dashboard' }

const navItems: ItemNavCliente[] = [
  { label: 'Dashboard', seccion: 'dashboard' },
  { label: 'Buscar', seccion: 'buscar' },
  { label: 'Notificaciones', seccion: 'notificaciones' },
]

const formatPrecio = (precio: number) =>
  new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', maximumFractionDigits: 0 }).format(precio)

const estadoClass: Record<TurnoEstado, string> = {
  Pendiente: 'bg-amber-100 text-amber-800 border-amber-200',
  Confirmado: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Cancelado: 'bg-red-100 text-red-700 border-red-200',
  Realizado: 'bg-violet-100 text-violet-800 border-violet-200',
}

function MiniStat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-borde-suave bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-normal text-texto-secundario">{label}</span>
        <span className="text-primario">{icon}</span>
      </div>
      <strong className="mt-2 block text-2xl font-black text-texto-principal">{value}</strong>
    </div>
  )
}

export default function ClienteDashboardMock() {
  const { id, seccion, idProfesional } = useParams()
  const navigate = useNavigate()
  const [busqueda, setBusqueda] = useState('')
  const [especialidad, setEspecialidad] = useState('Todas')
  const [ubicacion, setUbicacion] = useState('')
  const [fechaDeseada, setFechaDeseada] = useState('2026-04-22')
  const [profesionalActivo, setProfesionalActivo] = useState(profesionales[0])
  const [favoritos, setFavoritos] = useState<number[]>([1, 4])
  const [turnos, setTurnos] = useState<Turno[]>(turnosIniciales)
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>(notificacionesIniciales)
  const [servicio, setServicio] = useState(profesionales[0].servicios[0])
  const [horario, setHorario] = useState(profesionales[0].horarios[0])
  const [observaciones, setObservaciones] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<'Todos' | TurnoEstado>('Todos')
  const [filtroFecha, setFiltroFecha] = useState('')
  const [turnoACancelar, setTurnoACancelar] = useState<number | null>(null)
  const [motivoCancelacion, setMotivoCancelacion] = useState('')
  const [medioPago, setMedioPago] = useState('Tarjeta de credito')
  const [pagarAlReservar, setPagarAlReservar] = useState(false)

  const seccionActual = secciones.includes(seccion as SeccionCliente)
    ? seccion as SeccionCliente
    : 'dashboard'
  const basePath = id ? `/home/${id}` : '/cliente'
  const pathDeSeccion = (item: ItemNavCliente) =>
    item.seccion === 'dashboard' ? basePath : `${basePath}/${item.seccion}`
  const profesionalDelDetalle =
    profesionales.find((profesional) => profesional.id === Number(idProfesional)) ?? profesionalActivo

  const especialidades = ['Todas', ...Array.from(new Set(profesionales.map((profesional) => profesional.especialidad)))]

  const resultados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    return profesionales.filter((profesional) => {
      const coincideTexto =
        texto.length === 0 ||
        profesional.nombre.toLowerCase().includes(texto) ||
        profesional.especialidad.toLowerCase().includes(texto)
      const coincideEspecialidad = especialidad === 'Todas' || profesional.especialidad === especialidad
      const coincideUbicacion =
        ubicacion.trim().length === 0 || profesional.ubicacion.toLowerCase().includes(ubicacion.trim().toLowerCase())

      return coincideTexto && coincideEspecialidad && coincideUbicacion
    })
  }, [busqueda, especialidad, ubicacion])

  const turnosFiltrados = useMemo(
    () =>
      turnos.filter((turno) => {
        const coincideEstado = filtroEstado === 'Todos' || turno.estado === filtroEstado
        const coincideFecha = filtroFecha.length === 0 || turno.fecha === filtroFecha
        return coincideEstado && coincideFecha
      }),
    [turnos, filtroEstado, filtroFecha],
  )

  useEffect(() => {
    if (seccionActual !== 'profesional') return

    setServicio((servicioActual) =>
      profesionalDelDetalle.servicios.includes(servicioActual)
        ? servicioActual
        : profesionalDelDetalle.servicios[0],
    )
    setHorario((horarioActual) =>
      profesionalDelDetalle.horarios.includes(horarioActual)
        ? horarioActual
        : profesionalDelDetalle.horarios[0],
    )
  }, [seccionActual, profesionalDelDetalle])

  const seleccionarProfesional = (profesional: Profesional) => {
    setProfesionalActivo(profesional)
    setServicio(profesional.servicios[0])
    setHorario(profesional.horarios[0])
  }

  const verPerfilProfesional = (profesional: Profesional) => {
    seleccionarProfesional(profesional)
    navigate(`${basePath}/profesional/${profesional.id}`)
  }

  const toggleFavorito = (id: number) => {
    setFavoritos((actuales) => (actuales.includes(id) ? actuales.filter((favoritoId) => favoritoId !== id) : [...actuales, id]))
  }

  const reservarTurno = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault()
    const profesionalParaReserva = seccionActual === 'profesional' ? profesionalDelDetalle : profesionalActivo
    const nuevoTurno: Turno = {
      id: Date.now(),
      profesional: profesionalParaReserva.nombre,
      servicio,
      fecha: fechaDeseada,
      horario,
      estado: 'Pendiente',
      pago: pagarAlReservar ? 'Pagado' : 'Pendiente',
      observaciones: observaciones.trim() || undefined,
    }

    setTurnos((actuales) => [nuevoTurno, ...actuales])
    setNotificaciones((actuales) => [
      {
        id: Date.now() + 1,
        titulo: pagarAlReservar ? 'Turno reservado y pagado' : 'Turno reservado',
        detalle: pagarAlReservar
          ? `Se registro tu turno con ${profesionalParaReserva.nombre} y el pago mock por ${medioPago}.`
          : `Se registro tu turno con ${profesionalParaReserva.nombre} para el ${fechaDeseada} a las ${horario}.`,
        tipo: pagarAlReservar ? 'Pago' : 'Turno',
        fecha: 'Ahora',
      },
      ...actuales,
    ])
    setObservaciones('')
    setPagarAlReservar(false)
  }

  const confirmarCancelacion = () => {
    if (!turnoACancelar) return

    const turno = turnos.find((item) => item.id === turnoACancelar)
    setTurnos((actuales) =>
      actuales.map((item) =>
        item.id === turnoACancelar
          ? { ...item, estado: 'Cancelado', pago: 'No requerido', motivoCancelacion: motivoCancelacion.trim() || undefined }
          : item,
      ),
    )
    if (turno) {
      setNotificaciones((actuales) => [
        {
          id: Date.now(),
          titulo: 'Turno cancelado',
          detalle: `Se libero el horario ${turno.horario} con ${turno.profesional}.`,
          tipo: 'Turno',
          fecha: 'Ahora',
        },
        ...actuales,
      ])
    }
    setTurnoACancelar(null)
    setMotivoCancelacion('')
  }

  const pagarTurno = (id: number) => {
    const turno = turnos.find((item) => item.id === id)
    setTurnos((actuales) => actuales.map((item) => (item.id === id ? { ...item, pago: 'Pagado' } : item)))
    if (turno) {
      setNotificaciones((actuales) => [
        {
          id: Date.now(),
          titulo: 'Pago registrado',
          detalle: `Pago mockeado confirmado por ${medioPago} para ${turno.servicio}.`,
          tipo: 'Pago',
          fecha: 'Ahora',
        },
        ...actuales,
      ])
    }
  }

  const bloqueTurnos = (
    <>
      <section className="rounded-lg border border-borde-suave bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-black text-texto-principal">Mis turnos</h2>
            <p className="text-sm text-texto-secundario">Consulta turnos reservados, pendientes, cancelados o realizados.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label>Fecha</Label>
              <Input type="date" value={filtroFecha} onChange={(evento) => setFiltroFecha(evento.target.value)} />
            </div>
            <div>
              <Label>Estado</Label>
              <Select value={filtroEstado} onChange={(evento) => setFiltroEstado(evento.target.value as 'Todos' | TurnoEstado)}>
                {estados.map((estado) => <option key={estado}>{estado}</option>)}
              </Select>
            </div>
            <BotonSecundario type="button" className="self-end" onClick={() => { setFiltroFecha(''); setFiltroEstado('Todos') }}>
              Limpiar filtros
            </BotonSecundario>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[760px] border-separate border-spacing-y-2 text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-normal text-texto-secundario">
                <th className="px-3 py-2">Profesional</th>
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
                  <td className="rounded-l-lg px-3 py-3 font-bold text-texto-principal">{turno.profesional}</td>
                  <td className="px-3 py-3 text-texto-secundario">{turno.servicio}</td>
                  <td className="px-3 py-3 text-texto-secundario">{turno.fecha} - {turno.horario}</td>
                  <td className="px-3 py-3">
                    <span className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${estadoClass[turno.estado]}`}>{turno.estado}</span>
                  </td>
                  <td className="px-3 py-3 font-semibold text-texto-principal">{turno.pago}</td>
                  <td className="rounded-r-lg px-3 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={turno.estado === 'Cancelado' || turno.estado === 'Realizado'}
                        onClick={() => setTurnoACancelar(turno.id)}
                        className="rounded-lg border border-peligro-suave bg-white px-3 py-2 text-xs font-bold text-peligro hover:bg-peligro-suave disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        disabled={turno.pago === 'Pagado' || turno.estado === 'Cancelado'}
                        onClick={() => pagarTurno(turno.id)}
                        className="rounded-lg border border-primario-suave bg-white px-3 py-2 text-xs font-bold text-primario hover:bg-primario-claro disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Pagar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {turnoACancelar && (
        <section className="rounded-lg border border-peligro-suave bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black text-texto-principal">Cancelar turno</h2>
          <p className="mt-1 text-sm text-texto-secundario">El motivo es opcional. Al confirmar se actualiza la agenda mockeada.</p>
          <div className="mt-4">
            <Label>Motivo de cancelacion</Label>
            <Textarea rows={3} value={motivoCancelacion} onChange={(evento) => setMotivoCancelacion(evento.target.value)} placeholder="Ej: No voy a poder asistir." />
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" onClick={confirmarCancelacion} className="rounded-lg bg-peligro px-4 py-3 text-sm font-bold text-white hover:bg-peligro-hover">
              Confirmar cancelacion
            </button>
            <BotonSecundario type="button" onClick={() => setTurnoACancelar(null)}>Volver</BotonSecundario>
          </div>
        </section>
      )}

    </>
  )

  return (
    <div className="min-h-screen bg-fondo text-texto-principal">
      <header className="sticky top-0 z-40 border-b border-primario-suave bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link to={basePath} className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primario text-white">
              <IconCalendar className="h-5 w-5" />
            </span>
            <span className="text-xl font-black text-texto-principal">Agendify</span>
          </Link>
          <nav className="hidden items-center gap-2 text-sm font-semibold text-texto-secundario md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.seccion}
                to={pathDeSeccion(item)}
                end={item.seccion === 'dashboard'}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 transition-colors ${
                    isActive
                      ? 'bg-primario-claro text-primario'
                      : 'hover:bg-primario-claro hover:text-primario'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <Link to="/cliente/login" className="rounded-lg border border-borde px-3 py-2 text-sm font-bold text-texto-principal hover:bg-primario-claro">
            Salir
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 md:hidden">
          {navItems.map((item) => (
            <NavLink
              key={item.seccion}
              to={pathDeSeccion(item)}
              end={item.seccion === 'dashboard'}
              className={({ isActive }) =>
                `rounded-lg border px-3 py-2 text-center text-sm font-bold transition-colors ${
                  isActive
                    ? 'border-primario bg-primario text-white'
                    : 'border-borde bg-white text-texto-secundario'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        {seccionActual === 'dashboard' && (
        <>
          <section className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
            <div className="rounded-lg bg-primario px-6 py-7 text-white shadow-sm">
              <span className="text-sm font-semibold text-primario-suave">Dashboard de cliente</span>
              <h1 className="mt-2 max-w-2xl text-3xl font-black leading-tight text-white sm:text-4xl">
                Reserva, paga y controla tus turnos desde un solo lugar.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-primario-suave">
                Mock funcional de los casos de uso del cliente: login, registro, busqueda, favoritos, reservas,
                cancelaciones, pagos y notificaciones automaticas.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <MiniStat label="Turnos activos" value={String(turnos.filter((turno) => turno.estado !== 'Cancelado').length)} icon={<IconCalendar />} />
              <MiniStat label="Favoritos" value={String(favoritos.length)} icon={<IconStar />} />
              <MiniStat label="Notificaciones" value={String(notificaciones.length)} icon={<IconBell />} />
            </div>
          </section>

          <section className="rounded-lg border border-borde-suave bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-1">
              <h2 className="text-2xl font-black text-texto-principal">Favoritos</h2>
              <p className="text-sm text-texto-secundario">Profesionales guardados para reservar mas rapido.</p>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {profesionales.filter((profesional) => favoritos.includes(profesional.id)).map((profesional) => (
                <article key={profesional.id} className="rounded-lg border border-borde bg-fondo p-4">
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => verPerfilProfesional(profesional)}
                      className="text-left"
                    >
                      <h3 className="font-black text-texto-principal">{profesional.nombre}</h3>
                      <p className="text-sm text-texto-secundario">{profesional.especialidad} - {profesional.ubicacion}</p>
                      <p className="mt-1 text-sm font-semibold text-primario">{formatPrecio(profesional.precio)} por servicio base</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleFavorito(profesional.id)}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-amber-300 bg-amber-100 text-amber-600"
                      aria-label="Quitar de favoritos"
                    >
                      <IconStar className="h-5 w-5" />
                    </button>
                  </div>
                  <BotonSecundario className="mt-4 w-full" onClick={() => verPerfilProfesional(profesional)}>
                    Ver perfil
                  </BotonSecundario>
                </article>
              ))}
            </div>
          </section>

          {bloqueTurnos}
        </>
        )}

        {seccionActual === 'buscar' && (
        <section>
          <div className="rounded-lg border border-borde-suave bg-white p-5 shadow-sm">
            <div className="mb-5 flex flex-col gap-1">
              <h2 className="text-2xl font-black text-texto-principal">Buscar profesional</h2>
              <p className="text-sm text-texto-secundario">Filtra por nombre, palabra clave, especialidad, ubicacion y fecha deseada.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Nombre o palabra clave</Label>
                <Input value={busqueda} onChange={(evento) => setBusqueda(evento.target.value)} placeholder="Ej: nutricion, Martina" />
              </div>
              <div>
                <Label>Especialidad</Label>
                <Select value={especialidad} onChange={(evento) => setEspecialidad(evento.target.value)}>
                  {especialidades.map((item) => <option key={item}>{item}</option>)}
                </Select>
              </div>
              <div>
                <Label>Ubicacion</Label>
                <Input value={ubicacion} onChange={(evento) => setUbicacion(evento.target.value)} placeholder="Ej: Asuncion" />
              </div>
              <div>
                <Label>Fecha deseada</Label>
                <Input type="date" value={fechaDeseada} onChange={(evento) => setFechaDeseada(evento.target.value)} />
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              {resultados.map((profesional) => (
                <article key={profesional.id} className="rounded-lg border border-borde p-4 transition-colors hover:border-primario">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <button type="button" onClick={() => verPerfilProfesional(profesional)} className="text-left">
                      <h3 className="text-lg font-black text-texto-principal">{profesional.nombre}</h3>
                      <p className="text-sm text-texto-secundario">{profesional.especialidad} - {profesional.ubicacion}</p>
                      <p className="mt-1 text-sm font-semibold text-primario">{formatPrecio(profesional.precio)} por servicio base</p>
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleFavorito(profesional.id)}
                        className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-colors ${
                          favoritos.includes(profesional.id)
                            ? 'border-amber-300 bg-amber-100 text-amber-600'
                            : 'border-borde bg-white text-texto-suave hover:text-amber-500'
                        }`}
                        aria-label="Agregar profesional a favoritos"
                      >
                        <IconStar className="h-5 w-5" />
                      </button>
                      <BotonSecundario onClick={() => verPerfilProfesional(profesional)}>Ver perfil</BotonSecundario>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
        )}

        {seccionActual === 'profesional' && (
        <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="rounded-lg border border-borde-suave bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-sm font-bold text-primario">Perfil profesional</span>
                <h2 className="mt-1 text-2xl font-black text-texto-principal">{profesionalDelDetalle.nombre}</h2>
                <p className="text-sm text-texto-secundario">{profesionalDelDetalle.especialidad} - {profesionalDelDetalle.ubicacion}</p>
              </div>
              <button
                type="button"
                onClick={() => toggleFavorito(profesionalDelDetalle.id)}
                className="flex h-11 w-11 items-center justify-center rounded-lg bg-primario-claro text-primario hover:bg-primario-suave"
                aria-label="Guardar favorito"
              >
                <IconStar className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-texto-secundario">{profesionalDelDetalle.bio}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-fondo p-3">
                <span className="text-xs font-bold text-texto-secundario">Desde</span>
                <strong className="block text-lg text-texto-principal">{formatPrecio(profesionalDelDetalle.precio)}</strong>
              </div>
              <div className="rounded-lg bg-fondo p-3">
                <span className="text-xs font-bold text-texto-secundario">Contacto</span>
                <strong className="flex items-center gap-1 text-lg text-texto-principal"><IconPhone className="h-4 w-4" /> Mock</strong>
              </div>
            </div>
            <div className="mt-5">
              <h3 className="font-black text-texto-principal">Agenda disponible</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {profesionalDelDetalle.horarios.map((item) => (
                  <span key={item} className="rounded-lg border border-primario-suave bg-primario-claro px-3 py-2 text-sm font-bold text-primario">
                    {fechaDeseada} - {item}
                  </span>
                ))}
              </div>
            </div>
          </article>

          <form onSubmit={reservarTurno} className="rounded-lg border border-borde-suave bg-white p-5 shadow-sm">
            <h2 className="text-2xl font-black text-texto-principal">Reservar turno</h2>
            <p className="mt-1 text-sm text-texto-secundario">El turno queda registrado en memoria para esta demo.</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <Label>Profesional</Label>
                <Select value={profesionalDelDetalle.id} onChange={(evento) => verPerfilProfesional(profesionales.find((item) => item.id === Number(evento.target.value)) ?? profesionales[0])}>
                  {profesionales.map((profesional) => <option key={profesional.id} value={profesional.id}>{profesional.nombre}</option>)}
                </Select>
              </div>
              <div>
                <Label>Agenda o servicio</Label>
                <Select value={servicio} onChange={(evento) => setServicio(evento.target.value)}>
                  {profesionalDelDetalle.servicios.map((item) => <option key={item}>{item}</option>)}
                </Select>
              </div>
              <div>
                <Label>Fecha</Label>
                <Input type="date" value={fechaDeseada} onChange={(evento) => setFechaDeseada(evento.target.value)} />
              </div>
              <div>
                <Label>Horario</Label>
                <Select value={horario} onChange={(evento) => setHorario(evento.target.value)}>
                  {profesionalDelDetalle.horarios.map((item) => <option key={item}>{item}</option>)}
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label>Observaciones opcionales</Label>
                <Textarea rows={4} value={observaciones} onChange={(evento) => setObservaciones(evento.target.value)} placeholder="Ej: Prefiero recibir recordatorio por WhatsApp." />
              </div>
              <div className="md:col-span-2 rounded-lg border border-primario-suave bg-primario-claro p-4">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={pagarAlReservar}
                    onChange={(evento) => setPagarAlReservar(evento.target.checked)}
                    className="mt-1 h-4 w-4 accent-primario"
                  />
                  <span>
                    <span className="block font-bold text-texto-principal">Pagar al reservar</span>
                    <span className="block text-sm text-texto-secundario">Pago online mockeado para dejar el turno registrado como pagado.</span>
                  </span>
                </label>
                {pagarAlReservar && (
                  <div className="mt-4">
                    <Label>Medio de pago</Label>
                    <Select value={medioPago} onChange={(evento) => setMedioPago(evento.target.value)}>
                      <option>Tarjeta de credito</option>
                      <option>Tarjeta de debito</option>
                      <option>Billetera digital</option>
                      <option>Transferencia mock</option>
                    </Select>
                  </div>
                )}
              </div>
            </div>
            <BotonPrimario type="submit" className="mt-5 w-full sm:w-auto">
              <IconCheck className="h-5 w-5" />
              {pagarAlReservar ? 'Reservar y pagar' : 'Registrar turno'}
            </BotonPrimario>
          </form>
        </section>
        )}

        {seccionActual === 'notificaciones' && (
          <section className="rounded-lg border border-borde-suave bg-white p-5 shadow-sm">
            <h2 className="text-2xl font-black text-texto-principal">Notificaciones</h2>
            <p className="mt-1 text-sm text-texto-secundario">Recordatorios, confirmaciones, pagos y documentos del cliente.</p>
            <div className="mt-5 flex flex-col gap-3">
              {notificaciones.map((notificacion) => (
                <div key={notificacion.id} className="rounded-lg border border-borde bg-fondo p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-black text-texto-principal">{notificacion.titulo}</h3>
                    <span className="rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-primario">{notificacion.tipo} - {notificacion.fecha}</span>
                  </div>
                  <p className="mt-2 text-sm text-texto-secundario">{notificacion.detalle}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
