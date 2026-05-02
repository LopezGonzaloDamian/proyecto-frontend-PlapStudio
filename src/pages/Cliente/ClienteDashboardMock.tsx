import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, NavLink, useNavigate, useParams } from 'react-router-dom'
import { IconBell, IconCalendar, IconCheck, IconStar } from '../../components/LandingPage/Icons'
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
  matriculaNacional: string
  matriculaProvincial: string
  cobertura: string
  telefono: string
  email: string
  direccion: string
  terminosRelacionados: string[]
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
    matriculaNacional: 'M. N. 130.357',
    matriculaProvincial: 'M. P. 451.624',
    cobertura: 'PARTICULAR',
    telefono: '1139494813',
    email: 'martina.rios@agendify.com',
    direccion: 'Asuncion, Paraguay',
    terminosRelacionados: ['Nutricion deportiva', 'Habitos', 'Plan alimentario'],
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
    matriculaNacional: 'M. N. 130.357',
    matriculaProvincial: 'M. P. 451.624',
    cobertura: 'PARTICULAR',
    telefono: '1139494813',
    email: 'diego.benitez@agendify.com',
    direccion: 'San Lorenzo, Paraguay',
    terminosRelacionados: ['Kinesiologia', 'Traumatologia', 'Movilidad'],
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
    matriculaNacional: 'M. N. 221.840',
    matriculaProvincial: 'M. P. 512.204',
    cobertura: 'PARTICULAR',
    telefono: '1123344556',
    email: 'camila.duarte@agendify.com',
    direccion: 'Fernando de la Mora, Paraguay',
    terminosRelacionados: ['Odontologia general', 'Limpieza', 'Restauracion'],
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
    matriculaNacional: 'M. N. 175.912',
    matriculaProvincial: 'M. P. 490.132',
    cobertura: 'PARTICULAR',
    telefono: '1198765432',
    email: 'valeria.sosa@agendify.com',
    direccion: 'Asuncion, Paraguay',
    terminosRelacionados: ['Ansiedad', 'Bienestar', 'Seguimiento online'],
  },
  {
    id: 5,
    nombre: 'Leo Barrios',
    especialidad: 'Barberia',
    ubicacion: 'Lambaré',
    precio: 60000,
    bio: 'Cortes clasicos y modernos, perfilado de barba y atencion con turnos para evitar esperas.',
    servicios: ['Corte clasico', 'Corte y barba', 'Perfilado de barba'],
    horarios: ['09:00', '11:30', '15:30', '19:00'],
    matriculaNacional: '',
    matriculaProvincial: '',
    cobertura: '',
    telefono: '0981123456',
    email: 'leo.barrios@agendify.com',
    direccion: 'Lambaré, Paraguay',
    terminosRelacionados: ['Fade', 'Barba', 'Corte clasico'],
  },
  {
    id: 6,
    nombre: 'Paula Gimenez',
    especialidad: 'Peluqueria',
    ubicacion: 'Villa Morra',
    precio: 110000,
    bio: 'Turnos para color, brushing, cortes y tratamientos capilares con atencion personalizada.',
    servicios: ['Corte y brushing', 'Coloracion', 'Tratamiento capilar'],
    horarios: ['08:30', '10:30', '14:00', '17:00'],
    matriculaNacional: '',
    matriculaProvincial: '',
    cobertura: '',
    telefono: '0981456789',
    email: 'paula.gimenez@agendify.com',
    direccion: 'Villa Morra, Asuncion',
    terminosRelacionados: ['Color', 'Brushing', 'Tratamiento'],
  },
  {
    id: 7,
    nombre: 'Sofi Acosta',
    especialidad: 'Manicurista',
    ubicacion: 'Fernando de la Mora',
    precio: 75000,
    bio: 'Agenda de manicura y nail art con turnos programados para esmaltado, kapping y disenos.',
    servicios: ['Esmaltado semipermanente', 'Kapping', 'Nail art'],
    horarios: ['09:30', '12:30', '16:00', '18:30'],
    matriculaNacional: '',
    matriculaProvincial: '',
    cobertura: '',
    telefono: '0981765432',
    email: 'sofi.acosta@agendify.com',
    direccion: 'Fernando de la Mora, Paraguay',
    terminosRelacionados: ['Unas', 'Kapping', 'Semipermanente'],
  },
  {
    id: 8,
    nombre: 'Majo Ferreira',
    especialidad: 'Maquillaje profesional',
    ubicacion: 'San Lorenzo',
    precio: 130000,
    bio: 'Reservas para maquillaje social, novias y producciones con bloques de tiempo definidos.',
    servicios: ['Maquillaje social', 'Maquillaje para eventos', 'Prueba de novia'],
    horarios: ['10:00', '13:00', '15:30', '18:00'],
    matriculaNacional: '',
    matriculaProvincial: '',
    cobertura: '',
    telefono: '0981987654',
    email: 'majo.ferreira@agendify.com',
    direccion: 'San Lorenzo, Paraguay',
    terminosRelacionados: ['Eventos', 'Novias', 'Social'],
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
  {
    id: 104,
    profesional: 'Leo Barrios',
    servicio: 'Corte y barba',
    fecha: '2026-04-18',
    horario: '19:00',
    estado: 'Pendiente',
    pago: 'No requerido',
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

const secciones = ['buscar', 'profesional', 'reservar', 'turnos', 'notificaciones'] as const
type SeccionCliente = typeof secciones[number]
type ItemNavCliente = { label: string; seccion: SeccionCliente | 'dashboard' }

const navItems: ItemNavCliente[] = [
  { label: 'Dashboard', seccion: 'dashboard' },
  { label: 'Buscar', seccion: 'buscar' },
]

const formatPrecio = (precio: number) =>
  new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', maximumFractionDigits: 0 }).format(precio)

const estadoClass: Record<TurnoEstado, string> = {
  Pendiente: 'bg-amber-100 text-amber-800 border-amber-200',
  Confirmado: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Cancelado: 'bg-red-100 text-red-700 border-red-200',
  Realizado: 'bg-violet-100 text-violet-800 border-violet-200',
}

function AvatarProfesional({ nombre }: { nombre: string }) {
  const iniciales = nombre
    .split(' ')
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase()

  return (
    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[18px] bg-[#9a5966] text-2xl font-black text-white shadow-sm">
      {iniciales}
    </div>
  )
}

export default function ClienteDashboardMock() {
  const fechaMockHoy = '2026-04-18'
  const { id, seccion, idProfesional } = useParams()
  const navigate = useNavigate()
  const [busqueda, setBusqueda] = useState('')
  const [rubroServicio, setRubroServicio] = useState('')
  const [ubicacion, setUbicacion] = useState('')
  const [fechaDeseada, setFechaDeseada] = useState('2026-04-22')
  const [profesionalActivo, setProfesionalActivo] = useState(profesionales[0])
  const [favoritos, setFavoritos] = useState<number[]>([1, 4])
  const [turnos, setTurnos] = useState<Turno[]>(turnosIniciales)
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>(notificacionesIniciales)
  const [servicio, setServicio] = useState(profesionales[0].servicios[0])
  const [horario, setHorario] = useState(profesionales[0].horarios[0])
  const [observaciones, setObservaciones] = useState('')
  const [medioPago, setMedioPago] = useState('Tarjeta de credito')
  const [pagarAlReservar, setPagarAlReservar] = useState(false)
  const [vistaCalendario, setVistaCalendario] = useState<'dia' | 'semana' | 'mes'>('mes')
  const [fechaCalendario, setFechaCalendario] = useState(fechaMockHoy)
  const [menuUsuarioAbierto, setMenuUsuarioAbierto] = useState(false)
  const menuUsuarioRef = useRef<HTMLDivElement>(null)
  const turnosDetalleRef = useRef<HTMLElement>(null)

  const seccionActual = secciones.includes(seccion as SeccionCliente)
    ? seccion as SeccionCliente
    : 'dashboard'
  const basePath = id ? `/home/${id}` : '/cliente'
  const pathDeSeccion = (item: ItemNavCliente) =>
    item.seccion === 'dashboard' ? basePath : `${basePath}/${item.seccion}`
  const pathNotificaciones = `${basePath}/notificaciones`
  const cantidadNotificaciones = notificaciones.length > 9 ? '9+' : String(notificaciones.length)
  const profesionalDelDetalle =
    profesionales.find((profesional) => profesional.id === Number(idProfesional)) ?? profesionalActivo

  const resultados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    const rubro = rubroServicio.trim().toLowerCase()
    return profesionales.filter((profesional) => {
      const coincideTexto =
        texto.length === 0 ||
        profesional.nombre.toLowerCase().includes(texto) ||
        profesional.especialidad.toLowerCase().includes(texto) ||
        profesional.servicios.some((item) => item.toLowerCase().includes(texto))
      const coincideRubro =
        rubro.length === 0 ||
        profesional.especialidad.toLowerCase().includes(rubro) ||
        profesional.servicios.some((item) => item.toLowerCase().includes(rubro))
      const coincideUbicacion =
        ubicacion.trim().length === 0 || profesional.ubicacion.toLowerCase().includes(ubicacion.trim().toLowerCase())

      return coincideTexto && coincideRubro && coincideUbicacion
    })
  }, [busqueda, rubroServicio, ubicacion])

  const turnosHoy = useMemo(
    () => turnos.filter((turno) => turno.fecha === fechaMockHoy && turno.estado !== 'Cancelado'),
    [turnos],
  )

  const turnosPorFecha = useMemo(
    () =>
      turnos.reduce<Record<string, Turno[]>>((acc, turno) => {
        if (!acc[turno.fecha]) acc[turno.fecha] = []
        acc[turno.fecha].push(turno)
        return acc
      }, {}),
    [turnos],
  )

  const fechaSeleccionada = useMemo(() => new Date(`${fechaCalendario}T00:00:00`), [fechaCalendario])

  const diasSemana = useMemo(() => {
    const inicio = new Date(fechaSeleccionada)
    const day = (inicio.getDay() + 6) % 7
    inicio.setDate(inicio.getDate() - day)
    return Array.from({ length: 7 }, (_, index) => {
      const fecha = new Date(inicio)
      fecha.setDate(inicio.getDate() + index)
      return fecha
    })
  }, [fechaSeleccionada])

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

  const scrollADetalleTurnos = () => {
    turnosDetalleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

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

  useEffect(() => {
    const handleClickAfuera = (evento: MouseEvent) => {
      if (menuUsuarioRef.current && !menuUsuarioRef.current.contains(evento.target as Node)) {
        setMenuUsuarioAbierto(false)
      }
    }

    document.addEventListener('mousedown', handleClickAfuera)
    return () => document.removeEventListener('mousedown', handleClickAfuera)
  }, [])

  const seleccionarProfesional = (profesional: Profesional) => {
    setProfesionalActivo(profesional)
    setServicio(profesional.servicios[0])
    setHorario(profesional.horarios[0])
  }

  const verPerfilProfesional = (profesional: Profesional) => {
    seleccionarProfesional(profesional)
    navigate(`${basePath}/profesional/${profesional.id}`)
  }

  const irAReservarProfesional = (profesional: Profesional) => {
    seleccionarProfesional(profesional)
    navigate(`${basePath}/reservar/${profesional.id}`)
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

  return (
    <div className="min-h-screen bg-fondo text-texto-principal">
      <header className="sticky top-0 z-40 border-b border-primario-suave bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-6 px-6 py-3 xl:px-10">
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
          <div className="flex items-center gap-3">
            <NavLink
              to={pathNotificaciones}
              className={({ isActive }) =>
                `relative flex h-11 w-11 items-center justify-center rounded-lg border transition-colors ${
                  isActive
                    ? 'border-primario bg-primario-claro text-primario'
                    : 'border-borde bg-white text-texto-secundario hover:bg-primario-claro hover:text-primario'
                }`
              }
              aria-label="Ver notificaciones"
            >
              <IconBell className="h-5 w-5" />
              {notificaciones.length > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-peligro px-1 text-[10px] font-black leading-none text-white">
                  {cantidadNotificaciones}
                </span>
              )}
            </NavLink>
            <div className="relative" ref={menuUsuarioRef}>
              <button
                type="button"
                onClick={() => setMenuUsuarioAbierto((abierto) => !abierto)}
                className="flex items-center gap-2 rounded-full border border-borde bg-white pl-2 pr-3 py-1.5 text-sm font-semibold text-texto-principal shadow-sm hover:bg-primario-claro"
                aria-label="Abrir menu de usuario"
                aria-expanded={menuUsuarioAbierto}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primario text-sm font-black text-white">
                  NG
                </span>
                <svg
                  className={`h-4 w-4 text-texto-secundario transition-transform ${menuUsuarioAbierto ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {menuUsuarioAbierto && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-borde bg-white py-1 shadow-lg">
                  <Link
                    to="/cliente/login"
                    onClick={() => setMenuUsuarioAbierto(false)}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-peligro transition-colors hover:bg-peligro-suave"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Cerrar sesion
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-6 py-8 xl:px-10">
        <div className="grid grid-cols-[1fr_1fr_auto] gap-2 md:hidden">
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
          <NavLink
            to={pathNotificaciones}
            className={({ isActive }) =>
              `relative flex h-11 items-center justify-center rounded-lg border transition-colors ${
                isActive
                  ? 'border-primario bg-primario text-white'
                  : 'border-borde bg-white text-texto-secundario'
              }`
            }
            aria-label="Ver notificaciones"
          >
            <IconBell className="h-5 w-5" />
            {notificaciones.length > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-peligro px-1 text-[10px] font-black leading-none text-white">
                {cantidadNotificaciones}
              </span>
            )}
          </NavLink>
        </div>

        {seccionActual === 'dashboard' && (
        <>
          <section>
            <article className="rounded-[28px] border border-[#dfe3ff] bg-white p-6 shadow-sm xl:p-7">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <span className="text-sm font-bold uppercase tracking-[0.12em] text-primario">Hoy</span>
                  <h2 className="mt-2 text-3xl font-black text-texto-principal">Turnos del dia</h2>
                  <p className="mt-1 text-sm text-texto-secundario">Vista rapida de lo que tenes programado para hoy.</p>
                </div>
                <button
                  type="button"
                  onClick={scrollADetalleTurnos}
                  className="rounded-xl border border-borde bg-white px-4 py-2.5 text-sm font-bold text-texto-principal hover:bg-primario-claro"
                >
                  Ver detalle
                </button>
              </div>
              <div className="mt-5 grid gap-3">
                {turnosHoy.length > 0 ? turnosHoy.map((turno) => (
                  <div key={turno.id} className="rounded-2xl border border-borde bg-fondo px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="font-black text-texto-principal">{turno.horario} - {turno.profesional}</h3>
                        <p className="mt-1 text-sm text-texto-secundario">{turno.servicio}</p>
                      </div>
                      <span className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${estadoClass[turno.estado]}`}>{turno.estado}</span>
                    </div>
                  </div>
                )) : (
                  <div className="rounded-2xl border border-dashed border-borde bg-fondo px-4 py-8 text-sm text-texto-secundario">
                    No tenes turnos para hoy.
                  </div>
                )}
              </div>
            </article>
          </section>

          <section className="rounded-[28px] border border-[#dfe3ff] bg-white p-6 shadow-sm xl:p-7">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-3xl font-black text-texto-principal">Mi agenda</h2>
                <p className="mt-1 text-sm text-texto-secundario">Calendario personal con vista por dia, semana o mes.</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="inline-flex rounded-xl border border-borde bg-fondo p-1">
                  {(['dia', 'semana', 'mes'] as const).map((vista) => (
                    <button
                      key={vista}
                      type="button"
                      onClick={() => setVistaCalendario(vista)}
                      className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
                        vistaCalendario === vista
                          ? 'bg-white text-primario shadow-sm'
                          : 'text-texto-secundario hover:text-texto-principal'
                      }`}
                    >
                      {vista === 'dia' ? 'Dia' : vista === 'semana' ? 'Semana' : 'Mes'}
                    </button>
                  ))}
                </div>
                <Input
                  type="date"
                  value={fechaCalendario}
                  onChange={(evento) => setFechaCalendario(evento.target.value)}
                  className="sm:w-[180px]"
                />
              </div>
            </div>

            {vistaCalendario === 'mes' && (
              <div className="mt-6">
                <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold uppercase tracking-[0.12em] text-texto-secundario">
                  {['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'].map((dia) => (
                    <div key={dia} className="py-2">{dia}</div>
                  ))}
                </div>
                <div className="mt-2 grid grid-cols-7 gap-2">
                  {diasMes.map((dia) => {
                    const fecha = dia.toISOString().slice(0, 10)
                    const esMesActual = dia.getMonth() === fechaSeleccionada.getMonth()
                    const turnosDelDia = turnosPorFecha[fecha] ?? []
                    const estaSeleccionado = fecha === fechaCalendario
                    return (
                      <button
                        key={fecha}
                        type="button"
                        onClick={() => setFechaCalendario(fecha)}
                        className={`min-h-[118px] rounded-2xl border p-3 text-left transition-colors ${
                          estaSeleccionado
                            ? 'border-primario bg-primario-claro'
                            : 'border-borde bg-white hover:border-primario-suave'
                        } ${!esMesActual ? 'opacity-45' : ''}`}
                      >
                        <span className="text-sm font-bold text-texto-principal">{dia.getDate()}</span>
                        <div className="mt-3 space-y-2">
                          {turnosDelDia.slice(0, 2).map((turno) => (
                            <div key={turno.id} className="rounded-lg bg-white/90 px-2 py-1 text-xs font-semibold text-texto-principal">
                              {turno.horario} {turno.profesional.split(' ')[0]}
                            </div>
                          ))}
                          {turnosDelDia.length > 2 && (
                            <div className="text-xs font-bold text-primario">+{turnosDelDia.length - 2} mas</div>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {vistaCalendario === 'semana' && (
              <div className="mt-6 grid gap-3 xl:grid-cols-7">
                {diasSemana.map((dia) => {
                  const fecha = dia.toISOString().slice(0, 10)
                  const turnosDelDia = turnosPorFecha[fecha] ?? []
                  return (
                    <button
                      key={fecha}
                      type="button"
                      onClick={() => setFechaCalendario(fecha)}
                      className={`rounded-2xl border p-4 text-left transition-colors ${
                        fecha === fechaCalendario
                          ? 'border-primario bg-primario-claro'
                          : 'border-borde bg-white hover:border-primario-suave'
                      }`}
                    >
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-texto-secundario">
                        {dia.toLocaleDateString('es-PY', { weekday: 'short' })}
                      </p>
                      <p className="mt-1 text-2xl font-black text-texto-principal">{dia.getDate()}</p>
                      <div className="mt-4 space-y-2">
                        {turnosDelDia.length > 0 ? turnosDelDia.map((turno) => (
                          <div key={turno.id} className="rounded-xl bg-fondo px-3 py-2 text-xs font-semibold text-texto-principal">
                            {turno.horario} - {turno.servicio}
                          </div>
                        )) : (
                          <p className="text-xs text-texto-suave">Sin turnos</p>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {vistaCalendario === 'dia' && (
              <div className="mt-6 rounded-2xl border border-borde bg-fondo p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-texto-secundario">Dia seleccionado</p>
                    <h3 className="mt-1 text-2xl font-black text-texto-principal">{fechaCalendario}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={scrollADetalleTurnos}
                    className="rounded-xl border border-borde bg-white px-4 py-2.5 text-sm font-bold text-texto-principal hover:bg-primario-claro"
                  >
                    Ir al detalle
                  </button>
                </div>
                <div className="mt-5 space-y-3">
                  {turnosFechaSeleccionada.length > 0 ? turnosFechaSeleccionada.map((turno) => (
                    <div key={turno.id} className="rounded-2xl border border-borde bg-white px-4 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h4 className="font-black text-texto-principal">{turno.horario} - {turno.profesional}</h4>
                          <p className="mt-1 text-sm text-texto-secundario">{turno.servicio}</p>
                        </div>
                        <span className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${estadoClass[turno.estado]}`}>{turno.estado}</span>
                      </div>
                    </div>
                  )) : (
                    <div className="rounded-2xl border border-dashed border-borde bg-white px-4 py-8 text-sm text-texto-secundario">
                      No hay turnos cargados para este dia.
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>

          <section className="rounded-lg border border-borde-suave bg-white p-6 shadow-sm xl:p-7">
            <div className="flex flex-col gap-1">
              <h2 className="text-2xl font-black text-texto-principal">Favoritos</h2>
              <p className="text-sm text-texto-secundario">Profesionales guardados para reservar mas rapido.</p>
            </div>
            <div className="mt-5 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
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

        </>
        )}

        {seccionActual === 'buscar' && (
        <section>
          <div className="rounded-lg border border-borde-suave bg-white p-6 shadow-sm xl:p-7">
            <div className="mb-5 flex flex-col gap-1">
              <h2 className="text-2xl font-black text-texto-principal">Buscar profesional o servicio</h2>
              <p className="text-sm text-texto-secundario">Filtra por nombre, palabra clave, rubro, ubicacion y fecha deseada.</p>
            </div>

            <div className="grid gap-4 xl:grid-cols-4">
              <div>
                <Label>Nombre</Label>
                <Input value={busqueda} onChange={(evento) => setBusqueda(evento.target.value)} placeholder="Ej: Martina Rios" />
              </div>
              <div>
                <Label>Servicio</Label>
                <Input value={rubroServicio} onChange={(evento) => setRubroServicio(evento.target.value)} placeholder="Ej: barberia, peluqueria, manicura" />
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

            <div className="mt-6 grid gap-4">
              {resultados.map((profesional) => (
                <article key={profesional.id} className="rounded-[22px] border border-[#d7dbff] bg-white p-5 shadow-sm transition-colors hover:border-primario xl:p-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div className="flex gap-4">
                        <AvatarProfesional nombre={profesional.nombre} />
                        <div className="min-w-0">
                          <h3 className="text-[1.45rem] leading-tight font-semibold text-texto-principal xl:text-[1.65rem]">{profesional.nombre}</h3>
                          <p className="mt-1.5 text-base text-texto-principal">{profesional.especialidad}</p>
                        </div>
                      </div>

                      <div className="flex items-start justify-between gap-3 xl:max-w-[320px]">
                        <div className="flex items-start gap-2 text-right text-sm xl:text-base text-texto-principal">
                          <svg className="mt-0.5 h-4.5 w-4.5 shrink-0 text-texto-principal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 21s-6-4.35-6-10a6 6 0 1112 0c0 5.65-6 10-6 10z" />
                            <circle cx="12" cy="11" r="2.5" strokeWidth="1.8" />
                          </svg>
                          <span className="line-clamp-2">{profesional.ubicacion}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleFavorito(profesional.id)}
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors ${
                            favoritos.includes(profesional.id)
                              ? 'border-amber-300 bg-amber-100 text-amber-600'
                              : 'border-borde bg-white text-texto-suave hover:text-amber-500'
                          }`}
                          aria-label="Agregar profesional a favoritos"
                        >
                          <IconStar className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    <div className="border-t border-[#dfe3ff] pt-3.5">
                      <div className="flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => verPerfilProfesional(profesional)}
                          className="text-left text-[0.95rem] xl:text-base font-bold text-[#6b72a8] transition-colors hover:text-primario"
                        >
                          Ver perfil
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
        )}

        {seccionActual === 'profesional' && (
        <section className="rounded-[24px] border border-borde-suave bg-white p-6 shadow-sm xl:p-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <AvatarProfesional nombre={profesionalDelDetalle.nombre} />
              <div>
                <span className="text-xs font-bold uppercase tracking-[0.12em] text-primario">Perfil profesional</span>
                <h2 className="mt-1 text-3xl font-black text-texto-principal">{profesionalDelDetalle.nombre}</h2>
                <p className="mt-1 text-base text-texto-secundario">{profesionalDelDetalle.especialidad}</p>
                <p className="text-sm text-texto-secundario">{profesionalDelDetalle.ubicacion}</p>
              </div>
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

          <section className="mt-8">
            <h3 className="text-xl font-black text-texto-principal">Descripcion</h3>
            <p className="mt-3 max-w-5xl text-sm leading-7 text-texto-secundario">{profesionalDelDetalle.bio}</p>
          </section>

          <section className="mt-8 rounded-[18px] border border-borde bg-[#fcfdff] p-5">
            <h3 className="text-lg font-black text-texto-principal">Detalles del profesional</h3>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-texto-suave">Rubro</span>
                <p className="mt-2 text-sm font-semibold text-texto-principal">{profesionalDelDetalle.especialidad}</p>
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-texto-suave">Ubicacion</span>
                <p className="mt-2 text-sm font-semibold text-texto-principal">{profesionalDelDetalle.ubicacion}</p>
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-texto-suave">Telefono</span>
                <p className="mt-2 text-sm font-semibold text-texto-principal">{profesionalDelDetalle.telefono}</p>
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-texto-suave">Mail</span>
                <p className="mt-2 text-sm font-semibold text-texto-principal break-all">{profesionalDelDetalle.email}</p>
              </div>
              <div className="sm:col-span-2 xl:col-span-4">
                <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-texto-suave">Direccion</span>
                <p className="mt-2 text-sm font-semibold text-texto-principal">{profesionalDelDetalle.direccion}</p>
              </div>
              <div className="sm:col-span-2 xl:col-span-4">
                <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-texto-suave">Agenda disponible</span>
                <div className="mt-3 flex flex-wrap gap-2">
                  {profesionalDelDetalle.horarios.map((item) => (
                    <span key={item} className="rounded-lg border border-primario-suave bg-white px-3 py-2 text-sm font-bold text-primario">
                      {fechaDeseada} - {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <div className="mt-8 flex justify-end">
            <button
              type="button"
              onClick={() => irAReservarProfesional(profesionalDelDetalle)}
              className="inline-flex items-center justify-center gap-3 rounded-xl bg-[#31927f] px-6 py-3 text-base font-black text-white transition-colors hover:bg-[#28786a]"
            >
              <IconCalendar className="h-5 w-5" />
              Reservar turno
            </button>
          </div>
        </section>
        )}

        {seccionActual === 'reservar' && (
        <section className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
          <aside className="rounded-[28px] border border-[#dfe3ff] bg-white p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <AvatarProfesional nombre={profesionalDelDetalle.nombre} />
              <div>
                <h2 className="text-3xl font-black text-texto-principal">{profesionalDelDetalle.nombre}</h2>
                <p className="mt-2 text-base text-texto-principal">{profesionalDelDetalle.especialidad}</p>
                <p className="mt-2 text-sm text-texto-secundario">{profesionalDelDetalle.ubicacion}</p>
              </div>
            </div>
            <div className="mt-6 rounded-2xl bg-fondo p-4">
              <span className="text-xs font-bold uppercase text-texto-secundario">Agenda disponible</span>
              <div className="mt-3 flex flex-wrap gap-2">
                {profesionalDelDetalle.horarios.map((item) => (
                  <span key={item} className="rounded-lg border border-primario-suave bg-primario-claro px-3 py-2 text-sm font-bold text-primario">
                    {fechaDeseada} - {item}
                  </span>
                ))}
              </div>
            </div>
          </aside>

          <form onSubmit={reservarTurno} className="rounded-[28px] border border-borde-suave bg-white p-6 shadow-sm xl:p-8">
            <h2 className="text-3xl font-black text-texto-principal">Reservar turno</h2>
            <p className="mt-2 text-sm text-texto-secundario">Completa los datos para registrar tu turno en la demo.</p>
            <div className="mt-6 grid gap-4 xl:grid-cols-2">
              <div>
                <Label>Profesional</Label>
                <Select value={profesionalDelDetalle.id} onChange={(evento) => irAReservarProfesional(profesionales.find((item) => item.id === Number(evento.target.value)) ?? profesionales[0])}>
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
              <div className="xl:col-span-2">
                <Label>Observaciones opcionales</Label>
                <Textarea rows={4} value={observaciones} onChange={(evento) => setObservaciones(evento.target.value)} placeholder="Ej: Prefiero recibir recordatorio por WhatsApp." />
              </div>
              <div className="xl:col-span-2 rounded-2xl border border-primario-suave bg-primario-claro p-4">
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
            <div className="mt-6 flex flex-wrap gap-3">
              <BotonPrimario type="submit" className="w-full sm:w-auto">
                <IconCheck className="h-5 w-5" />
                {pagarAlReservar ? 'Reservar y pagar' : 'Registrar turno'}
              </BotonPrimario>
              <BotonSecundario type="button" onClick={() => verPerfilProfesional(profesionalDelDetalle)}>
                Volver al perfil
              </BotonSecundario>
            </div>
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
