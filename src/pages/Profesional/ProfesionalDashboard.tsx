import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, NavLink, useNavigate, useParams } from 'react-router-dom'
import { IconCalendar } from '../../components/LandingPage/Icons'
import { BotonPrimario, BotonSecundario, Input, Label, Select, Textarea } from '../../components/common/ui'
import { useSesion } from '../../customHooks/useSesion'
import { useToast } from '../../customHooks/useToast'
import { Toast } from '../../components/common/toast'
import { extraerError } from '../../api/client'
import {
  agregarConfiguracion,
  crearAgenda,
  eliminarConfiguracion,
  getAgendasDeProfesional,
  getSlots,
} from '../../api/agendas'
import { actualizarProfesional, getProfesional } from '../../api/profesionales'
import { actualizarUsuario } from '../../api/usuarios'
import {
  cancelarTurno,
  getTurnosProfesional,
  modificarTurno,
  reservarTurno,
} from '../../api/turnos'
import { buscarClientePorEmail, getClientesDeProfesional } from '../../api/clientes'
import { getNotificaciones, marcarTodasLeidas } from '../../api/notificaciones'
import { asignarAsistente, desasignarAsistente, getAsistentesDeProfesional } from '../../api/asistentes'
import { login as validarLogin } from '../../api/auth'
import type {
  Agenda,
  AsistenteAsignacion,
  Cliente,
  DiaSemana,
  Notificacion,
  Profesional,
  Slot,
  Turno,
} from '../../api/types'

type SeccionProfesional = 'agenda' | 'turnos' | 'clientes' | 'asistentes' | 'pagos' | 'historial' | 'perfil' | 'notificaciones'
type ConfiguracionAgenda = Agenda['configuraciones'][number]
type EliminacionDisponibilidadPendiente =
  | { tipo: 'bloque'; configuracion: ConfiguracionAgenda }
  | { tipo: 'horario'; configuracion: ConfiguracionAgenda; horario: string }

const seccionesValidas: SeccionProfesional[] = ['agenda', 'turnos', 'asistentes', 'pagos', 'historial', 'perfil', 'notificaciones']

const navItems: Array<{ label: string; seccion: SeccionProfesional | 'dashboard' }> = [
  { label: 'Panel de Control', seccion: 'dashboard' },
  { label: 'Agenda', seccion: 'agenda' },
  { label: 'Turnos', seccion: 'turnos' },
  { label: 'Asistentes', seccion: 'asistentes' },
  { label: 'Pagos', seccion: 'pagos' },
  { label: 'Historial', seccion: 'historial' },
  { label: 'Perfil', seccion: 'perfil' },
]
const navMobilePrincipal = new Set<SeccionProfesional | 'dashboard'>(['dashboard', 'agenda', 'turnos'])

const estadoClass: Record<Turno['estado'], string> = {
  CONFIRMADO: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  CANCELADO: 'bg-red-100 text-red-700 border-red-200',
}

const estadoLabel: Record<Turno['estado'], string> = {
  CONFIRMADO: 'Confirmado', CANCELADO: 'Cancelado',
}

const diasLabels: Record<DiaSemana, string> = {
  MONDAY: 'Lunes', TUESDAY: 'Martes', WEDNESDAY: 'Miercoles', THURSDAY: 'Jueves',
  FRIDAY: 'Viernes', SATURDAY: 'Sabado', SUNDAY: 'Domingo',
}
const diasOrden = Object.keys(diasLabels) as DiaSemana[]

const formatPrecio = (precio: number) =>
  `$ ${new Intl.NumberFormat('es-PY', { maximumFractionDigits: 0 }).format(precio)}`

const fechaIsoDe = (t: { iniciaEn: string }) => t.iniciaEn.slice(0, 10)
const horaDe     = (t: { iniciaEn: string }) => t.iniciaEn.slice(11, 16)
const abrirCalendario = (input: globalThis.HTMLInputElement) => input.showPicker?.()
const minutosDeHora = (hora: string) => {
  const [horas, minutos] = hora.slice(0, 5).split(':').map(Number)
  return horas * 60 + minutos
}
const horaDeMinutos = (total: number) =>
  `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
const horariosDeConfiguracion = (configuracion: Agenda['configuraciones'][number]) => {
  const inicio = minutosDeHora(configuracion.inicioSlot)
  const fin = minutosDeHora(configuracion.finSlot)
  const horarios: string[] = []
  for (let minuto = inicio; minuto < fin; minuto += configuracion.duracionSlotMinutos) {
    horarios.push(horaDeMinutos(minuto))
  }
  return horarios
}
const fechaCortaDe = (t: { iniciaEn: string }) =>
  new Date(t.iniciaEn).toLocaleDateString('es-PY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).replace('.', '')

const slotReservable = (slot: Slot) =>
  slot.disponible && new Date(slot.iniciaEn).getTime() > Date.now()
const turnoAccionable = (turno: Turno) =>
  turno.estado !== 'CANCELADO' && new Date(turno.iniciaEn).getTime() > Date.now()
const mensajePasswordIncorrecta = (err: unknown) =>
  extraerError(err).toLowerCase().includes('credenciales') ? 'Contraseña incorrecta' : extraerError(err)

const ordenarTurnosAsc = (a: Turno, b: Turno) =>
  new Date(a.iniciaEn).getTime() - new Date(b.iniciaEn).getTime()

function dividirTurnosCliente(turnos: Turno[]) {
  const ahora = Date.now()
  const futuros = turnos
    .filter((t) => t.estado !== 'CANCELADO' && new Date(t.iniciaEn).getTime() > ahora)
    .sort(ordenarTurnosAsc)
  const proximoTurno = futuros[0] ?? null
  const historial = turnos
    .filter((t) => t.id !== proximoTurno?.id)
    .sort((a, b) => ordenarTurnosAsc(b, a))

  return { proximoTurno, historial }
}

function FiltroEstado({
  value,
  onChange,
}: {
  value: 'Todos' | Turno['estado']
  onChange: (value: 'Todos' | Turno['estado']) => void
}) {
  const opciones: Array<{ label: string; value: 'Todos' | Turno['estado'] }> = [
    { label: 'Todos', value: 'Todos' },
    { label: 'Confirmado', value: 'CONFIRMADO' },
    { label: 'Cancelado', value: 'CANCELADO' },
  ]

  return (
    <div className="flex min-h-[50px] w-full overflow-hidden rounded-lg border border-borde bg-white p-1.5 lg:min-w-[360px]">
      {opciones.map((opcion) => (
        <button
          key={opcion.value}
          type="button"
          onClick={() => onChange(opcion.value)}
          className={`flex-1 rounded-md px-3 py-2.5 text-sm font-bold transition-colors sm:px-4 ${
            value === opcion.value
              ? 'bg-primario text-white shadow-sm'
              : 'text-texto-secundario hover:bg-fondo'
          }`}
        >
          {opcion.label}
        </button>
      ))}
    </div>
  )
}

export default function ProfesionalDashboard() {
  const { seccion } = useParams()
  const navigate = useNavigate()
  const { usuario, sesion, iniciar, cerrar } = useSesion()
  const { toast, showToast } = useToast()

  const seccionActual = seccionesValidas.includes(seccion as SeccionProfesional)
    ? (seccion as SeccionProfesional)
    : 'dashboard'

  const [perfil, setPerfil] = useState<Profesional | null>(null)
  const [agendas, setAgendas] = useState<Agenda[]>([])
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [slotsNuevoTurno, setSlotsNuevoTurno] = useState<Slot[]>([])
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])
  const [asistentes, setAsistentes] = useState<AsistenteAsignacion[]>([])

  const [filtros, setFiltros] = useState<{ clienteEmail: string; fecha: string; estado: 'Todos' | Turno['estado'] }>({ clienteEmail: '', fecha: '', estado: 'Todos' })
  const [filtrosHistorial, setFiltrosHistorial] = useState({ clienteEmail: '', fecha: '', estado: 'Todos' as 'Todos' | Turno['estado'] })
  const [nuevoTurno, setNuevoTurno] = useState({
    tipoCliente: 'registrado' as 'registrado' | 'externo',
    clienteEmail: '',
    clienteExternoNombre: '',
    clienteExternoTelefono: '',
    clienteExternoDni: '',
    clienteExternoEmail: '',
    servicio: '',
    fecha: '',
    horario: '',
  })
  const [turnoEditarId, setTurnoEditarId] = useState('')
  const [turnoEditar, setTurnoEditar] = useState({ fecha: '', horario: '', notas: '' })
  const [turnoACancelar, setTurnoACancelar] = useState<Turno | null>(null)
  const [pidiendoPasswordCancelacion, setPidiendoPasswordCancelacion] = useState(false)
  const [passwordCancelacionTurno, setPasswordCancelacionTurno] = useState('')
  const [cancelandoTurno, setCancelandoTurno] = useState(false)
  const [eliminacionDisponibilidad, setEliminacionDisponibilidad] = useState<EliminacionDisponibilidadPendiente | null>(null)
  const [asistenteAConfirmar, setAsistenteAConfirmar] = useState<string | null>(null)
  const [pidiendoPasswordAsistente, setPidiendoPasswordAsistente] = useState(false)
  const [passwordAsignacionAsistente, setPasswordAsignacionAsistente] = useState('')
  const [asignandoAsistente, setAsignandoAsistente] = useState(false)
  const [asistenteADesasignar, setAsistenteADesasignar] = useState<AsistenteAsignacion | null>(null)
  const [pidiendoPasswordDesasignacion, setPidiendoPasswordDesasignacion] = useState(false)
  const [passwordDesasignacionAsistente, setPasswordDesasignacionAsistente] = useState('')
  const [desasignandoAsistente, setDesasignandoAsistente] = useState(false)

  const [nuevaAgenda, setNuevaAgenda] = useState({ nombre: 'Agenda principal', descripcion: 'Atencion presencial' })
  const [disponibilidad, setDisponibilidad] = useState({
    diaSemana: 'MONDAY' as DiaSemana, inicio: '09:00', fin: '18:00', duracion: '30',
  })
  const [asistenteEmail, setAsistenteEmail] = useState('')
  const [busquedaCliente, setBusquedaCliente] = useState('')
  const [fechaCalendario, setFechaCalendario] = useState(() => new Date().toISOString().slice(0, 10))
  const [perfilForm, setPerfilForm] = useState({
    nombreCompleto: '',
    telefono: '',
    urlAvatar: '',
    especialidad: '',
    biografia: '',
    localidad: '',
    direccion: '',
    precio: '',
  })

  const [menuUsuarioAbierto, setMenuUsuarioAbierto] = useState(false)
  const menuUsuarioRef = useRef<HTMLDivElement>(null)
  const cerrandoSesionRef = useRef(false)

  const profesionalId = usuario?.perfilProfesionalId ?? null

  useEffect(() => {
    if (cerrandoSesionRef.current) return
    if (!usuario || !usuario.roles.includes('PROFESIONAL') || profesionalId == null) {
      navigate('/login', { replace: true })
    }
  }, [usuario, profesionalId, navigate])

  useEffect(() => {
    if (!profesionalId) return
    void getProfesional(profesionalId).then(setPerfil).catch((e) => showToast(extraerError(e), 'error'))
    void getAgendasDeProfesional(profesionalId).then(setAgendas).catch((e) => showToast(extraerError(e), 'error'))
    void getTurnosProfesional(profesionalId).then(setTurnos).catch((e) => showToast(extraerError(e), 'error'))
    void getClientesDeProfesional(profesionalId).then(setClientes).catch((e) => showToast(extraerError(e), 'error'))
    void getAsistentesDeProfesional(profesionalId).then(setAsistentes).catch((e) => showToast(extraerError(e), 'error'))
    if (usuario) void getNotificaciones(usuario.id).then(setNotificaciones).catch((e) => showToast(extraerError(e), 'error'))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profesionalId, usuario?.id])

  useEffect(() => {
    if (!usuario || !perfil) return
    setPerfilForm({
      nombreCompleto: usuario.nombreCompleto,
      telefono: usuario.telefono,
      urlAvatar: perfil.urlAvatar,
      especialidad: perfil.especialidad,
      biografia: perfil.biografia,
      localidad: perfil.localidad,
      direccion: perfil.direccion,
      precio: String(perfil.precio || ''),
    })
  }, [usuario, perfil])

  const perfilTieneCambios = useMemo(() => {
    if (!usuario || !perfil) return false
    return (
      perfilForm.nombreCompleto.trim() !== usuario.nombreCompleto ||
      perfilForm.telefono.trim() !== usuario.telefono ||
      perfilForm.urlAvatar.trim() !== perfil.urlAvatar ||
      perfilForm.especialidad.trim() !== perfil.especialidad ||
      perfilForm.biografia.trim() !== perfil.biografia ||
      perfilForm.localidad.trim() !== perfil.localidad ||
      perfilForm.direccion.trim() !== perfil.direccion ||
      Number(perfilForm.precio) !== Number(perfil.precio)
    )
  }, [perfilForm, usuario, perfil])

  const refrescarDatosOperativos = () => {
    if (!profesionalId) return
    void getProfesional(profesionalId).then(setPerfil).catch(() => undefined)
    void getTurnosProfesional(profesionalId).then(setTurnos).catch(() => undefined)
    void getClientesDeProfesional(profesionalId).then(setClientes).catch(() => undefined)
    if (usuario) void getNotificaciones(usuario.id).then(setNotificaciones).catch(() => undefined)
  }

  useEffect(() => {
    if (!profesionalId || !usuario) return

    const intervalo = window.setInterval(refrescarDatosOperativos, 1500)
    return () => window.clearInterval(intervalo)
  }, [profesionalId, usuario])

  const agendaPrincipal = agendas[0] ?? null

  const configuracionesPorDia = useMemo(() => {
    const grupos = diasOrden.reduce((acc, dia) => {
      acc[dia] = []
      return acc
    }, {} as Record<DiaSemana, Agenda['configuraciones']>)

    agendaPrincipal?.configuraciones.forEach((configuracion) => {
      grupos[configuracion.diaSemana].push(configuracion)
    })

    diasOrden.forEach((dia) => {
      grupos[dia].sort((a, b) => a.inicioSlot.localeCompare(b.inicioSlot))
    })

    return grupos
  }, [agendaPrincipal?.configuraciones])

  const slotsReservablesNuevoTurno = useMemo(
    () => slotsNuevoTurno.filter(slotReservable),
    [slotsNuevoTurno],
  )

  useEffect(() => {
    if (!agendaPrincipal || !nuevoTurno.fecha) {
      setSlotsNuevoTurno([])
      setNuevoTurno((actual) => actual.horario ? { ...actual, horario: '' } : actual)
      return
    }

    void getSlots(agendaPrincipal.id, nuevoTurno.fecha)
      .then((slots) => {
        const disponibles = slots.filter(slotReservable)
        setSlotsNuevoTurno(slots)
        setNuevoTurno((actual) => {
          if (actual.horario && disponibles.some((slot) => horaDe(slot) === actual.horario)) return actual
          return { ...actual, horario: disponibles[0] ? horaDe(disponibles[0]) : '' }
        })
      })
      .catch((e) => {
        setSlotsNuevoTurno([])
        setNuevoTurno((actual) => ({ ...actual, horario: '' }))
        showToast(extraerError(e), 'error')
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agendaPrincipal?.id, nuevoTurno.fecha])

  useEffect(() => {
    const turno = turnos.find((t) => t.id === turnoEditarId)
    if (!turno) return
    setTurnoEditar({
      fecha: fechaIsoDe(turno),
      horario: horaDe(turno),
      notas: turno.notas,
    })
  }, [turnoEditarId, turnos])

  const turnosFiltrados = useMemo(() =>
    turnos.filter((t) => {
      const okEmail = filtros.clienteEmail.trim().length === 0 || (t.clienteEmail ?? '').toLowerCase().includes(filtros.clienteEmail.trim().toLowerCase())
      const okFecha  = filtros.fecha.length === 0 || fechaIsoDe(t) === filtros.fecha
      const okEstado = filtros.estado === 'Todos' || t.estado === filtros.estado
      const okActual = new Date(t.iniciaEn).getTime() >= Date.now()
      return okActual && okEmail && okFecha && okEstado
    }),
    [turnos, filtros],
  )

  const historialFiltrado = useMemo(() =>
    turnos.filter((t) => {
      const okEmail = filtrosHistorial.clienteEmail.trim().length === 0 || (t.clienteEmail ?? '').toLowerCase().includes(filtrosHistorial.clienteEmail.trim().toLowerCase())
      const okFecha = filtrosHistorial.fecha.length === 0 || fechaIsoDe(t) === filtrosHistorial.fecha
      const okEstado = filtrosHistorial.estado === 'Todos' || t.estado === filtrosHistorial.estado
      return okEmail && okFecha && okEstado
    }),
    [turnos, filtrosHistorial],
  )

  const turnosDeHoy = useMemo(() => {
    const hoy = new Date().toISOString().slice(0, 10)
    return turnos.filter((t) => fechaIsoDe(t) === hoy && t.estado !== 'CANCELADO')
  }, [turnos])

  const turnosPorFecha = useMemo(
    () => turnos.reduce<Record<string, Turno[]>>((acc, t) => {
      const fecha = fechaIsoDe(t)
      if (!acc[fecha]) acc[fecha] = []
      acc[fecha].push(t)
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

    return Array.from({ length: 35 }, (_, i) => {
      const fecha = new Date(start)
      fecha.setDate(start.getDate() + i)
      return fecha
    })
  }, [fechaSeleccionada])

  const pagosTabla = useMemo(() =>
    turnos
      .filter((t) => t.pago)
      .map((t) => ({
        id: t.pago!.id,
        clienteNombre: t.clienteNombre,
        agendaNombre: t.agendaNombre,
        fecha: fechaIsoDe(t),
        monto: t.pago!.monto,
        origen: t.pago!.origen,
        porcentajeComision: t.pago!.porcentajeComision,
        comisionAgendify: t.pago!.montoComision,
        netoProfesional: t.pago!.monto - t.pago!.montoComision,
        estado: t.pago!.estado,
        notas: t.notas,
      })),
    [turnos],
  )

  const clientesConTurnos = useMemo(() => {
    const mapa = new Map<string, {
      id: string
      nombreCompleto: string
      email: string | null
      telefono: string | null
      dni: string | null
      externo: boolean
      turnos: Turno[]
    }>()

    clientes.forEach((c) => {
      const turnosCliente = turnos.filter((t) => t.clienteId === c.id)
      if (turnosCliente.length === 0) return
      mapa.set(`registrado-${c.id}`, {
        id: `registrado-${c.id}`,
        nombreCompleto: c.nombreCompleto,
        email: c.email,
        telefono: c.telefono,
        dni: null,
        externo: false,
        turnos: turnosCliente,
      })
    })

    turnos
      .filter((t) => t.clienteId == null)
      .forEach((t) => {
        const clave = `externo-${(t.clienteDni || t.clienteEmail || t.clienteTelefono || t.clienteNombre).toLowerCase()}`
        const existente = mapa.get(clave)
        if (existente) {
          existente.turnos.push(t)
          return
        }
        mapa.set(clave, {
          id: clave,
          nombreCompleto: t.clienteNombre,
          email: t.clienteEmail,
          telefono: t.clienteTelefono,
          dni: t.clienteDni,
          externo: true,
          turnos: [t],
        })
      })

    const query = busquedaCliente.trim().toLowerCase()
    return Array.from(mapa.values()).filter((cliente) => {
      const email = (cliente.email ?? '').toLowerCase()
      return query.length === 0 || email.includes(query)
    })
  }, [clientes, turnos, busquedaCliente])

  const pathDeSeccion = (item: { seccion: SeccionProfesional | 'dashboard' }) =>
    item.seccion === 'dashboard' ? '/profesional' : `/profesional/${item.seccion}`

  const cerrarSesion = () => {
    cerrandoSesionRef.current = true
    cerrar()
    navigate('/login', { replace: true })
  }

  useEffect(() => {
    const handleClickAfuera = (e: MouseEvent) => {
      if (menuUsuarioRef.current && !menuUsuarioRef.current.contains(e.target as Node)) {
        setMenuUsuarioAbierto(false)
      }
    }
    document.addEventListener('mousedown', handleClickAfuera)
    return () => document.removeEventListener('mousedown', handleClickAfuera)
  }, [])

  // Acciones
  const onCrearAgenda = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!profesionalId) return
    try {
      const a = await crearAgenda({
        profesionalId,
        nombre: nuevaAgenda.nombre,
        descripcion: nuevaAgenda.descripcion,
      })
      setAgendas((act) => [...act, a])
      showToast('Agenda creada', 'success')
    } catch (err) { showToast(extraerError(err), 'error') }
  }

  const onAgregarDisponibilidad = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!agendaPrincipal) {
      showToast('Crea primero una agenda', 'error')
      return
    }
    try {
      const upd = await agregarConfiguracion(agendaPrincipal.id, {
        id: null,
        diaSemana: disponibilidad.diaSemana,
        inicioSlot: disponibilidad.inicio,
        finSlot: disponibilidad.fin,
        duracionSlotMinutos: parseInt(disponibilidad.duracion, 10),
      })
      setAgendas((act) => act.map((a) => (a.id === upd.id ? upd : a)))
      showToast('Disponibilidad agregada', 'success')
    } catch (err) { showToast(extraerError(err), 'error') }
  }

  const onEliminarConfig = async (configId: string) => {
    if (!agendaPrincipal) return
    try {
      const upd = await eliminarConfiguracion(agendaPrincipal.id, configId)
      setAgendas((act) => act.map((a) => (a.id === upd.id ? upd : a)))
    } catch (err) { showToast(extraerError(err), 'error') }
  }

  const onEliminarHorarioConfig = async (configuracion: ConfiguracionAgenda, horario: string) => {
    if (!agendaPrincipal || !configuracion.id) return
    try {
      const inicioBloque = minutosDeHora(configuracion.inicioSlot)
      const finBloque = minutosDeHora(configuracion.finSlot)
      const inicioHorario = minutosDeHora(horario)
      const finHorario = inicioHorario + configuracion.duracionSlotMinutos

      const bloquesRestantes = [
        { inicioSlot: horaDeMinutos(inicioBloque), finSlot: horaDeMinutos(inicioHorario) },
        { inicioSlot: horaDeMinutos(finHorario), finSlot: horaDeMinutos(finBloque) },
      ].filter((bloque) => minutosDeHora(bloque.finSlot) - minutosDeHora(bloque.inicioSlot) >= configuracion.duracionSlotMinutos)

      let agendaActualizada = await eliminarConfiguracion(agendaPrincipal.id, configuracion.id)
      for (const bloque of bloquesRestantes) {
        agendaActualizada = await agregarConfiguracion(agendaPrincipal.id, {
          id: null,
          diaSemana: configuracion.diaSemana,
          inicioSlot: bloque.inicioSlot,
          finSlot: bloque.finSlot,
          duracionSlotMinutos: configuracion.duracionSlotMinutos,
        })
      }
      setAgendas((act) => act.map((a) => (a.id === agendaActualizada.id ? agendaActualizada : a)))
      showToast('Horario eliminado', 'success')
    } catch (err) { showToast(extraerError(err), 'error') }
  }

  const onConfirmarEliminarDisponibilidad = async () => {
    if (!eliminacionDisponibilidad) return
    if (eliminacionDisponibilidad.tipo === 'bloque') {
      const id = eliminacionDisponibilidad.configuracion.id
      if (id) await onEliminarConfig(id)
    } else {
      await onEliminarHorarioConfig(eliminacionDisponibilidad.configuracion, eliminacionDisponibilidad.horario)
    }
    setEliminacionDisponibilidad(null)
  }

  const onCrearTurno = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!agendaPrincipal) {
      showToast('No hay agenda activa', 'error')
      return
    }
    const esClienteExterno = nuevoTurno.tipoCliente === 'externo'
    const clienteIncompleto = esClienteExterno
      ? !nuevoTurno.clienteExternoNombre.trim() || !nuevoTurno.clienteExternoTelefono.trim()
      : !nuevoTurno.clienteEmail.trim()
    if (clienteIncompleto || !nuevoTurno.fecha || !nuevoTurno.horario) {
      showToast('Completa cliente, fecha y horario', 'error')
      return
    }
    try {
      const clienteRegistrado = esClienteExterno
        ? null
        : await buscarClientePorEmail(nuevoTurno.clienteEmail.trim())
      const turno = await reservarTurno({
        agendaId: agendaPrincipal.id,
        clienteId: clienteRegistrado?.id ?? null,
        clienteExternoNombre: esClienteExterno ? nuevoTurno.clienteExternoNombre : undefined,
        clienteExternoTelefono: esClienteExterno ? nuevoTurno.clienteExternoTelefono : undefined,
        clienteExternoDni: esClienteExterno ? nuevoTurno.clienteExternoDni : undefined,
        clienteExternoEmail: esClienteExterno ? nuevoTurno.clienteExternoEmail : undefined,
        iniciaEn: `${nuevoTurno.fecha}T${nuevoTurno.horario}:00`,
        duracionMinutos: 45,
        notas: nuevoTurno.servicio,
      })
      setTurnos((act) => [turno, ...act])
      refrescarDatosOperativos()
      showToast('Turno creado', 'success')
      setNuevoTurno({
        tipoCliente: nuevoTurno.tipoCliente,
        clienteEmail: '',
        clienteExternoNombre: '',
        clienteExternoTelefono: '',
        clienteExternoDni: '',
        clienteExternoEmail: '',
        servicio: '',
        fecha: '',
        horario: '',
      })
    } catch (err) { showToast(extraerError(err), 'error') }
  }

  const onCancelarTurno = async (id: string) => {
    try {
      const t = await cancelarTurno(id)
      setTurnos((act) => act.map((x) => (x.id === id ? t : x)))
      setTurnoACancelar(null)
      setPidiendoPasswordCancelacion(false)
      setPasswordCancelacionTurno('')
      refrescarDatosOperativos()
      showToast('Turno cancelado', 'success')
    } catch (err) { showToast(extraerError(err), 'error') }
  }

  const cerrarCancelacionTurno = () => {
    if (cancelandoTurno) return
    setTurnoACancelar(null)
    setPidiendoPasswordCancelacion(false)
    setPasswordCancelacionTurno('')
  }

  const confirmarCancelacionTurno = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!usuario || !turnoACancelar) return
    if (!passwordCancelacionTurno.trim()) {
      showToast('Ingresa tu contraseña', 'error')
      return
    }
    try {
      setCancelandoTurno(true)
      await validarLogin({ email: usuario.email, password: passwordCancelacionTurno.trim() })
      await onCancelarTurno(turnoACancelar.id)
    } catch (err) {
      showToast(mensajePasswordIncorrecta(err), 'error')
    } finally {
      setCancelandoTurno(false)
    }
  }

  const onModificarTurno = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const turno = turnos.find((t) => t.id === turnoEditarId)
    if (!turno) return
    try {
      const actualizado = await modificarTurno(turnoEditarId, {
        iniciaEn: `${turnoEditar.fecha}T${turnoEditar.horario}:00`,
        duracionMinutos: turno.duracionMinutos,
        notas: turnoEditar.notas,
        estado: turno.estado,
      })
      setTurnos((act) => act.map((t) => (t.id === actualizado.id ? actualizado : t)))
      refrescarDatosOperativos()
      showToast('Turno actualizado', 'success')
    } catch (err) { showToast(extraerError(err), 'error') }
  }

  const refrescarAsistentes = () => {
    if (!profesionalId) return
    void getAsistentesDeProfesional(profesionalId).then(setAsistentes).catch((e) => showToast(extraerError(e), 'error'))
  }

  const onAsignarAsistente = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!profesionalId || !asistenteEmail.trim()) {
      showToast('Ingresa el email del asistente', 'error')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(asistenteEmail.trim())) {
      showToast('Ingresa un email valido', 'error')
      return
    }
    setAsistenteAConfirmar(asistenteEmail.trim())
    setPidiendoPasswordAsistente(false)
    setPasswordAsignacionAsistente('')
  }

  const cerrarConfirmacionAsistente = () => {
    if (asignandoAsistente) return
    setAsistenteAConfirmar(null)
    setPidiendoPasswordAsistente(false)
    setPasswordAsignacionAsistente('')
  }

  const confirmarAsignacionAsistente = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!profesionalId || !usuario || !asistenteAConfirmar) return
    if (!passwordAsignacionAsistente.trim()) {
      showToast('Ingresa tu contraseña', 'error')
      return
    }
    try {
      setAsignandoAsistente(true)
      await validarLogin({ email: usuario.email, password: passwordAsignacionAsistente.trim() })
      const asignacion = await asignarAsistente(profesionalId, asistenteAConfirmar)
      setAsistentes((act) => [...act, asignacion])
      setAsistenteEmail('')
      setAsistenteAConfirmar(null)
      setPidiendoPasswordAsistente(false)
      setPasswordAsignacionAsistente('')
      showToast('Asistente asignado', 'success')
    } catch (err) {
      showToast(mensajePasswordIncorrecta(err), 'error')
    } finally {
      setAsignandoAsistente(false)
    }
  }

  const onDesasignarAsistente = async (id: string) => {
    try {
      await desasignarAsistente(id)
      setAsistentes((act) => act.filter((a) => a.id !== id))
      showToast('Asistente desasignado', 'success')
    } catch (err) {
      showToast(extraerError(err), 'error')
      refrescarAsistentes()
    }
  }

  const cerrarConfirmacionDesasignar = () => {
    if (desasignandoAsistente) return
    setAsistenteADesasignar(null)
    setPidiendoPasswordDesasignacion(false)
    setPasswordDesasignacionAsistente('')
  }

  const confirmarDesasignacionAsistente = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!usuario || !asistenteADesasignar) return
    if (!passwordDesasignacionAsistente.trim()) {
      showToast('Ingresa tu contraseña', 'error')
      return
    }
    try {
      setDesasignandoAsistente(true)
      await validarLogin({ email: usuario.email, password: passwordDesasignacionAsistente.trim() })
      await onDesasignarAsistente(asistenteADesasignar.id)
      setAsistenteADesasignar(null)
      setPidiendoPasswordDesasignacion(false)
      setPasswordDesasignacionAsistente('')
    } catch (err) {
      showToast(mensajePasswordIncorrecta(err), 'error')
    } finally {
      setDesasignandoAsistente(false)
    }
  }

  const guardarPerfil = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault()
    if (!usuario || !sesion || !perfil || !profesionalId) return
    if (!perfilTieneCambios) return
    try {
      const usuarioActualizado = await actualizarUsuario(usuario.id, {
        nombreCompleto: perfilForm.nombreCompleto.trim(),
        telefono: perfilForm.telefono.trim(),
        urlAvatar: usuario.urlAvatar ?? '',
      })
      const profesionalActualizado = await actualizarProfesional(profesionalId, {
        especialidad: perfilForm.especialidad.trim(),
        biografia: perfilForm.biografia.trim(),
        urlAvatar: perfilForm.urlAvatar.trim(),
        localidad: perfilForm.localidad.trim(),
        direccion: perfilForm.direccion.trim(),
        precio: Number(perfilForm.precio) || 0,
        cobertura: perfil.cobertura,
        matriculaNacional: perfil.matriculaNacional,
        matriculaProvincial: perfil.matriculaProvincial,
        servicios: perfil.servicios,
      })
      iniciar({ token: sesion.token, usuario: usuarioActualizado })
      setPerfil(profesionalActualizado)
      showToast('Perfil actualizado.', 'success')
      navigate('/profesional')
    } catch (err) {
      showToast(extraerError(err), 'error')
    }
  }

  const inicialesProf = (perfil?.nombreCompleto ?? usuario?.nombreCompleto ?? '')
    .split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()

  if (!usuario || profesionalId == null) return null

  return (
    <div className="min-h-screen bg-fondo text-texto-principal">
      <header className="sticky top-0 z-40 border-b border-[#0F5EC7] bg-primario text-white shadow-sm">
        <div className="mx-auto flex w-full max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 xl:px-10">
          <Link to="/profesional" className="flex min-w-0 items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 text-white ring-1 ring-white/25">
              <IconCalendar className="h-5 w-5" />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-xl font-black text-white">Agendify</span>
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-white/80">Profesional</span>
            </span>
          </Link>
          <nav className="order-3 -mx-1 flex w-full gap-2 overflow-x-auto pb-1 text-sm font-semibold text-white/80 lg:order-none lg:mx-0 lg:w-auto lg:items-center lg:overflow-visible lg:pb-0">
            {navItems.map((item) => {
              const visibleEnMobile = navMobilePrincipal.has(item.seccion)
              return (
                <NavLink
                  key={item.seccion}
                  to={pathDeSeccion(item)}
                  end={item.seccion === 'dashboard'}
                  className={({ isActive }) =>
                    `${visibleEnMobile ? 'flex' : 'hidden lg:flex'} shrink-0 rounded-lg px-3 py-2 ${isActive ? 'bg-white text-primario' : 'hover:bg-white/15 hover:text-white'}`
                  }
                >
                  {item.label}
                </NavLink>
              )
            })}
          </nav>
          <div ref={menuUsuarioRef} className="relative flex items-center justify-end">
            <button onClick={() => setMenuUsuarioAbierto((v) => !v)} className="flex items-center gap-3 rounded-full border border-white/25 bg-white/10 px-2 py-1.5 shadow-sm hover:bg-white/20">
              <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white text-sm font-black text-primario">
                {perfil?.urlAvatar ? (
                  <img src={perfil.urlAvatar} alt={perfil.nombreCompleto} className="block h-full w-full object-cover object-center" />
                ) : (
                  inicialesProf || 'P'
                )}
              </span>
              <svg className={`h-4 w-4 text-white/80 transition-transform ${menuUsuarioAbierto ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0l-4.25-4.51a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              </svg>
            </button>
            {menuUsuarioAbierto && (
              <div className="absolute right-0 top-[calc(100%+0.6rem)] min-w-[220px] rounded-2xl border border-borde bg-white p-2 shadow-lg">
                <div className="mb-2 border-b border-borde pb-2 lg:hidden">
                  {navItems.filter((item) => !navMobilePrincipal.has(item.seccion)).map((item) => (
                    <NavLink
                      key={item.seccion}
                      to={pathDeSeccion(item)}
                      onClick={() => setMenuUsuarioAbierto(false)}
                      className={({ isActive }) =>
                        `flex w-full items-center rounded-xl px-3 py-2 text-sm font-semibold ${isActive ? 'bg-primario-claro text-primario' : 'text-texto-principal hover:bg-fondo'}`
                      }
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </div>
                <button onClick={cerrarSesion} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-semibold text-peligro hover:bg-peligro-suave">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6A2.25 2.25 0 005.25 5.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                  </svg>
                  Cerrar sesion
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 py-6 sm:px-6 sm:py-7 xl:px-10">
        {seccionActual === 'dashboard' && (
          <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <article className="order-2 rounded-lg border border-borde-suave bg-white p-6 shadow-sm xl:p-7">
              <div>
                <div>
                  <h2 className="text-2xl font-black text-texto-principal">Turnos del dia</h2>
                  <p className="text-sm text-texto-secundario">Agenda operativa para hoy.</p>
                </div>
              </div>
              <div className="mt-5 grid gap-4">
                {turnosDeHoy.map((t) => (
                  <article key={t.id} className="rounded-2xl border border-borde bg-fondo p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="text-[11px] font-bold uppercase text-texto-suave">Fecha y hora</span>
                        <p className="mt-1 text-sm font-semibold text-texto-principal">{fechaCortaDe(t)} - {horaDe(t)}</p>
                      </div>
                      <span className={`inline-flex rounded-lg border px-3 py-1 text-sm font-bold ${estadoClass[t.estado]}`}>{estadoLabel[t.estado]}</span>
                    </div>
                    <div className="mt-5 grid gap-5">
                      <div>
                        <span className="text-[11px] font-bold uppercase text-texto-suave">Cliente</span>
                        <p className="mt-1 text-sm font-semibold text-texto-principal">{t.clienteNombre}</p>
                      </div>
                      <div>
                        <span className="text-[11px] font-bold uppercase text-texto-suave">Motivo</span>
                        <p className="mt-1 text-sm font-semibold text-texto-principal">{t.notas || 'Sin notas'}</p>
                      </div>
                    </div>
                  </article>
                ))}
                {turnosDeHoy.length === 0 && (
                  <p className="text-sm text-texto-secundario">Sin turnos para hoy.</p>
                )}
              </div>
            </article>

            <article className="order-1 rounded-lg border border-borde-suave bg-white p-6 shadow-sm xl:p-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-black text-texto-principal">Calendario</h2>
                  <p className="text-sm text-texto-secundario">Vista mensual de turnos asignados.</p>
                </div>
                <Input type="date" value={fechaCalendario} onClick={(e) => abrirCalendario(e.currentTarget)} onChange={(e) => setFechaCalendario(e.target.value)} className="max-w-[190px]" />
              </div>

              <div className="mt-5 grid grid-cols-7 gap-2 text-center text-xs font-bold uppercase text-texto-secundario">
                {['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'].map((dia) => <span key={dia}>{dia}</span>)}
              </div>
              <div className="mt-2 grid grid-cols-7 gap-2">
                {diasMes.map((dia) => {
                  const fechaIso = dia.toISOString().slice(0, 10)
                  const turnosDia = turnosPorFecha[fechaIso] ?? []
                  const esMes = dia.getMonth() === fechaSeleccionada.getMonth()
                  const seleccionado = fechaIso === fechaCalendario
                  return (
                    <button
                      key={fechaIso}
                      type="button"
                      onClick={() => setFechaCalendario(fechaIso)}
                      className={`min-h-[68px] rounded-lg border p-1.5 text-left sm:min-h-[86px] sm:p-2 ${
                        seleccionado ? 'border-primario bg-primario-claro' : 'border-borde bg-fondo hover:border-primario-suave hover:bg-white'
                      } ${esMes ? 'opacity-100' : 'opacity-45'}`}
                    >
                      <span className="text-xs font-black text-texto-principal sm:text-sm">{dia.getDate()}</span>
                      <div className="mt-2 grid gap-1">
                        {turnosDia.slice(0, 2).map((t) => (
                          <span key={t.id} className="truncate rounded bg-white px-1 py-0.5 text-[10px] font-bold text-primario sm:px-1.5 sm:py-1 sm:text-[11px]">
                            {horaDe(t)} {t.clienteNombre.split(' ')[0]}
                          </span>
                        ))}
                        {turnosDia.length > 2 && <span className="text-[11px] font-bold text-texto-secundario">+{turnosDia.length - 2} mas</span>}
                      </div>
                    </button>
                  )
                })}
              </div>
            </article>
          </section>
        )}

        {seccionActual === 'agenda' && (
          <>
            <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
              {!agendaPrincipal ? (
                <form onSubmit={onCrearAgenda} className="rounded-lg border border-borde-suave bg-white p-6 shadow-sm xl:p-7">
                  <h2 className="text-2xl font-black text-texto-principal">Crear agenda</h2>
                  <div className="mt-5 grid gap-4">
                    <div><Label>Nombre</Label><Input value={nuevaAgenda.nombre} onChange={(e) => setNuevaAgenda({ ...nuevaAgenda, nombre: e.target.value })} /></div>
                    <div><Label>Descripcion</Label><Textarea rows={4} value={nuevaAgenda.descripcion} onChange={(e) => setNuevaAgenda({ ...nuevaAgenda, descripcion: e.target.value })} /></div>
                    <BotonPrimario type="submit">Crear agenda</BotonPrimario>
                  </div>
                </form>
              ) : (
                <article className="rounded-lg border border-borde-suave bg-white p-6 shadow-sm xl:p-7">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-2xl font-black text-texto-principal">Configuraciones horarias</h3>
                  </div>
                  <div className="mt-4 space-y-3">
                    {diasOrden.map((dia) => {
                      const configuracionesDia = configuracionesPorDia[dia]
                      return (
                        <details key={dia} className="group rounded-lg border border-borde bg-fondo">
                          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
                            <span className="text-sm font-black text-texto-principal">{diasLabels[dia]}</span>
                            <span className="text-xs font-bold text-primario group-open:hidden">Ver horarios</span>
                            <span className="hidden text-xs font-bold text-primario group-open:inline">Ocultar</span>
                          </summary>
                          <div className="space-y-3 border-t border-borde px-4 py-3">
                            {configuracionesDia.length === 0 && (
                              <p className="rounded-lg border border-dashed border-borde bg-white px-3 py-2 text-sm text-texto-secundario">
                                Sin horarios cargados.
                              </p>
                            )}
                            {configuracionesDia.map((c) => (
                              <div key={c.id ?? `${c.diaSemana}-${c.inicioSlot}-${c.finSlot}`} className="rounded-lg border border-borde bg-white p-3">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                  <p className="text-xs font-bold text-texto-secundario">
                                    Cada {c.duracionSlotMinutos} min
                                  </p>
                                  {c.id && (
                                    <button
                                      type="button"
                                      onClick={() => setEliminacionDisponibilidad({ tipo: 'bloque', configuracion: c })}
                                      className="w-fit text-xs font-bold text-peligro hover:underline"
                                    >
                                      Eliminar bloque
                                    </button>
                                  )}
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {horariosDeConfiguracion(c).map((horario) => (
                                    <button
                                      key={`${c.id}-${horario}`}
                                      type="button"
                                      onClick={() => setEliminacionDisponibilidad({ tipo: 'horario', configuracion: c, horario })}
                                      className="rounded-lg border border-primario-suave bg-primario-claro px-3 py-1.5 text-sm font-bold text-primario transition-colors hover:border-red-200 hover:bg-red-50 hover:text-peligro"
                                      title={`Eliminar horario ${horario}`}
                                    >
                                      {horario}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </details>
                      )
                    })}
                  </div>
                </article>
              )}

              <form onSubmit={onAgregarDisponibilidad} className="rounded-lg border border-borde-suave bg-white p-6 shadow-sm xl:p-7">
                <h2 className="text-2xl font-black text-texto-principal">Agregar disponibilidad</h2>
                <div className="mt-5 grid gap-5 lg:grid-cols-2">
                  <div className="lg:col-span-2">
                    <Label>Dia</Label>
                    <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {diasOrden.map((dia) => (
                        <button
                          key={dia}
                          type="button"
                          onClick={() => setDisponibilidad({ ...disponibilidad, diaSemana: dia })}
                          className={`rounded-lg border px-3 py-2.5 text-sm font-bold transition-colors ${
                            disponibilidad.diaSemana === dia
                              ? 'border-primario bg-primario text-white shadow-sm'
                              : 'border-borde bg-white text-texto-secundario hover:bg-primario-claro hover:text-primario'
                          }`}
                        >
                          {diasLabels[dia]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="lg:col-span-2">
                    <Label>Duracion</Label>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {['30', '45', '60'].map((duracion) => (
                        <button
                          key={duracion}
                          type="button"
                          onClick={() => setDisponibilidad({ ...disponibilidad, duracion })}
                          className={`rounded-lg border px-3 py-2.5 text-sm font-bold transition-colors ${
                            disponibilidad.duracion === duracion
                              ? 'border-primario bg-primario text-white shadow-sm'
                              : 'border-borde bg-white text-texto-secundario hover:bg-primario-claro hover:text-primario'
                          }`}
                        >
                          {duracion} min
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>Hora inicio</Label>
                    <Input
                      type="time"
                      value={disponibilidad.inicio}
                      onChange={(e) => setDisponibilidad({ ...disponibilidad, inicio: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Hora fin</Label>
                    <Input
                      type="time"
                      value={disponibilidad.fin}
                      onChange={(e) => setDisponibilidad({ ...disponibilidad, fin: e.target.value })}
                    />
                  </div>
                  <BotonPrimario type="submit" className="w-fit justify-self-end md:col-span-2" disabled={!agendaPrincipal}>
                    Agregar
                  </BotonPrimario>
                </div>
              </form>
            </section>
          </>
        )}

        {seccionActual === 'turnos' && (
          <>
            <section className="order-2 rounded-lg border border-borde-suave bg-white p-6 shadow-sm xl:p-7">
              <div>
                <h2 className="text-2xl font-black text-texto-principal">Asignar turno</h2>
                <p className="text-sm text-texto-secundario">Registra un turno para un cliente registrado o no registrado.</p>
              </div>

              <form onSubmit={onCrearTurno} className="mt-6 grid gap-4 rounded-lg border border-borde bg-fondo p-4 lg:grid-cols-4">
                <div className="lg:col-span-4">
                  <Label>Tipo de cliente</Label>
                  <div className="mt-2 inline-flex rounded-xl border border-borde bg-white p-1">
                    {(['registrado', 'externo'] as const).map((tipo) => (
                      <button
                        key={tipo}
                        type="button"
                        onClick={() => setNuevoTurno({ ...nuevoTurno, tipoCliente: tipo, clienteEmail: '', clienteExternoNombre: '', clienteExternoTelefono: '', clienteExternoDni: '', clienteExternoEmail: '' })}
                        className={`rounded-lg px-4 py-2 text-sm font-bold ${nuevoTurno.tipoCliente === tipo ? 'bg-primario text-white' : 'text-texto-secundario hover:bg-primario-claro hover:text-primario'}`}
                      >
                        {tipo === 'registrado' ? 'Cliente registrado' : 'Cliente no registrado'}
                      </button>
                    ))}
                  </div>
                </div>
                {nuevoTurno.tipoCliente === 'registrado' ? (
                  <div>
                    <Label>Email del cliente</Label>
                    <Input
                      type="email"
                      value={nuevoTurno.clienteEmail}
                      onChange={(e) => setNuevoTurno({ ...nuevoTurno, clienteEmail: e.target.value })}
                      placeholder="cliente@gmail.com"
                    />
                  </div>
                ) : (
                  <>
                    <div className="lg:row-start-2"><Label>Nombre completo</Label><Input value={nuevoTurno.clienteExternoNombre} onChange={(e) => setNuevoTurno({ ...nuevoTurno, clienteExternoNombre: e.target.value })} /></div>
                    <div className="lg:row-start-3"><Label>Telefono</Label><Input value={nuevoTurno.clienteExternoTelefono} onChange={(e) => setNuevoTurno({ ...nuevoTurno, clienteExternoTelefono: e.target.value })} /></div>
                    <div className="lg:row-start-3"><Label>DNI</Label><Input value={nuevoTurno.clienteExternoDni} onChange={(e) => setNuevoTurno({ ...nuevoTurno, clienteExternoDni: e.target.value })} /></div>
                    <div className="lg:row-start-3"><Label>Email opcional</Label><Input value={nuevoTurno.clienteExternoEmail} onChange={(e) => setNuevoTurno({ ...nuevoTurno, clienteExternoEmail: e.target.value })} /></div>
                  </>
                )}
                <div className={`lg:col-span-2 ${nuevoTurno.tipoCliente === 'registrado' ? 'lg:row-start-3' : 'lg:row-start-4'}`}><Label>Servicio (notas)</Label><Input value={nuevoTurno.servicio} onChange={(e) => setNuevoTurno({ ...nuevoTurno, servicio: e.target.value })} /></div>
                <div className={nuevoTurno.tipoCliente === 'registrado' ? 'lg:row-start-4' : 'lg:row-start-5'}>
                  <Label>Fecha</Label>
                  <div className="relative">
                    <Input type="date" value={nuevoTurno.fecha} onChange={(e) => setNuevoTurno({ ...nuevoTurno, fecha: e.target.value })} />
                  </div>
                </div>
                <div className={`lg:col-span-2 ${nuevoTurno.tipoCliente === 'registrado' ? 'lg:row-start-4' : 'lg:row-start-5'}`}>
                  <Label>Horario</Label>
                  <div className="mt-2 flex min-h-[52px] flex-wrap gap-2">
                    {!nuevoTurno.fecha && (
                      <span className="px-2 py-2 text-sm text-texto-secundario">Selecciona una fecha</span>
                    )}
                    {nuevoTurno.fecha && slotsReservablesNuevoTurno.length === 0 && (
                      <span className="px-2 py-2 text-sm text-texto-secundario">Sin horarios disponibles.</span>
                    )}
                    {slotsReservablesNuevoTurno.map((slot) => {
                      const hora = horaDe(slot)
                      return (
                        <button
                          key={slot.iniciaEn}
                          type="button"
                          onClick={() => setNuevoTurno({ ...nuevoTurno, horario: hora })}
                          className={`rounded-lg border px-3 py-2 text-sm font-bold ${
                            nuevoTurno.horario === hora
                              ? 'border-primario bg-primario text-white'
                              : 'border-primario-suave bg-primario-claro text-primario'
                          }`}
                        >
                          {hora}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div className={`flex justify-end lg:col-span-4 ${nuevoTurno.tipoCliente === 'registrado' ? 'lg:row-start-5' : 'lg:row-start-6'}`}>
                  <BotonPrimario type="submit" className="min-w-[220px]">Asignar</BotonPrimario>
                </div>
              </form>
            </section>

            <section className="order-3 rounded-lg border border-borde-suave bg-white p-6 shadow-sm xl:p-7">
              <h2 className="text-2xl font-black text-texto-principal">Modificar turno</h2>
              <form onSubmit={onModificarTurno} className="mt-6 grid gap-4 rounded-lg border border-borde bg-fondo p-4 lg:grid-cols-4">
                <div className="lg:max-w-[270px]">
                  <Label>Seleccionar turno</Label>
                  <Select value={turnoEditarId} onChange={(e) => setTurnoEditarId(e.target.value)}>
                    <option value="">Seleccionar...</option>
                    {turnos.filter(turnoAccionable).map((t) => (
                      <option key={t.id} value={t.id}>{fechaCortaDe(t)} - {horaDe(t)} | {t.clienteNombre}</option>
                    ))}
                  </Select>
                </div>
                <div className="lg:max-w-[270px]">
                  <Label>Fecha</Label>
                  <Input type="date" value={turnoEditar.fecha} onChange={(e) => setTurnoEditar({ ...turnoEditar, fecha: e.target.value })} />
                </div>
                <div className="lg:max-w-[270px]">
                  <Label>Horario</Label>
                  <Input type="time" value={turnoEditar.horario} onChange={(e) => setTurnoEditar({ ...turnoEditar, horario: e.target.value })} />
                </div>
                <div className="lg:col-span-2 lg:max-w-[560px]">
                  <Label>Notas</Label>
                  <Textarea rows={3} value={turnoEditar.notas} onChange={(e) => setTurnoEditar({ ...turnoEditar, notas: e.target.value })} />
                </div>
                <div className="flex justify-end lg:col-span-4">
                  <BotonPrimario type="submit" className="min-w-[220px]" disabled={!turnoEditarId}>Actualizar turno</BotonPrimario>
                </div>
              </form>
            </section>

            <section className="order-1 rounded-lg border border-borde-suave bg-white p-6 shadow-sm xl:p-7">
              <div>
                <div>
                  <h2 className="text-2xl font-black text-texto-principal">Turnos</h2>
                  <p className="text-sm text-texto-secundario">Consulta, filtra y cancela los turnos registrados.</p>
                </div>
                <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(220px,1fr)_minmax(220px,1fr)_minmax(380px,1.25fr)_minmax(180px,220px)] xl:max-w-7xl">
                  <div>
                    <Label>Mail del cliente</Label>
                    <Input value={filtros.clienteEmail} onChange={(e) => setFiltros({ ...filtros, clienteEmail: e.target.value })} placeholder="cliente@gmail.com" />
                  </div>
                  <div>
                    <Label>Fecha</Label>
                    <div className="relative">
                      <Input type="date" value={filtros.fecha} onChange={(e) => setFiltros({ ...filtros, fecha: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <Label>Estado</Label>
                    <FiltroEstado value={filtros.estado} onChange={(estado) => setFiltros({ ...filtros, estado })} />
                  </div>
                  <BotonSecundario type="button" className="self-end whitespace-nowrap" onClick={() => setFiltros({ clienteEmail: '', fecha: '', estado: 'Todos' })}>Limpiar filtros</BotonSecundario>
                </div>
              </div>

              <div className="mt-5 grid gap-4 xl:grid-cols-2">
                {turnosFiltrados.map((t) => (
                  <article key={t.id} className="rounded-lg border border-borde bg-fondo p-5 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-black text-texto-principal">{t.clienteNombre}</h3>
                      </div>
                      <span className={`rounded-lg border px-3 py-1 text-sm font-bold ${estadoClass[t.estado]}`}>{estadoLabel[t.estado]}</span>
                    </div>
                    <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <div>
                        <p className="text-xs font-bold uppercase text-texto-secundario">Fecha</p>
                        <p className="mt-1 text-sm font-semibold text-texto-principal">{fechaIsoDe(t)}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase text-texto-secundario">Horario</p>
                        <p className="mt-1 text-sm font-semibold text-texto-principal">{horaDe(t)}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase text-texto-secundario">Tipo de cliente</p>
                        <span className={`mt-1 inline-flex rounded-lg px-2.5 py-1 text-xs font-bold ${t.clienteId ? 'bg-emerald-50 text-emerald-700' : 'bg-primario-claro text-primario'}`}>
                          {t.clienteId ? 'Registrado' : 'No registrado'}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase text-texto-secundario">Motivo</p>
                        <p className="mt-1 text-sm text-texto-principal">{t.notas || 'Sin notas'}</p>
                      </div>
                      <div className="sm:col-span-2">
                        <p className="text-xs font-bold uppercase text-texto-secundario">Mail cliente</p>
                        <p className="mt-1 text-sm text-texto-principal">{t.clienteEmail || 'Sin mail'}</p>
                      </div>
                    </div>
                    {turnoAccionable(t) && (
                      <div className="mt-5 flex justify-end">
                        <button
                          type="button"
                          onClick={() => setTurnoACancelar(t)}
                          className="rounded-lg border border-peligro-suave bg-white px-4 py-2 text-sm font-bold text-peligro hover:bg-peligro-suave"
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                  </article>
                ))}
                {turnosFiltrados.length === 0 && (
                  <p className="rounded-lg border border-dashed border-borde bg-fondo px-4 py-6 text-center text-sm text-texto-secundario xl:col-span-2">Sin turnos.</p>
                )}
              </div>
            </section>
          </>
        )}

        {seccionActual === 'clientes' && (
          <section className="rounded-lg border border-borde-suave bg-white p-6 shadow-sm xl:p-7">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <h2 className="text-2xl font-black text-texto-principal">Clientes</h2>
                <p className="text-sm text-texto-secundario">Personas que reservaron turnos contigo.</p>
              </div>
              <div className="w-full xl:max-w-sm">
                <Label>Buscar por mail</Label>
                <Input value={busquedaCliente} onChange={(e) => setBusquedaCliente(e.target.value)} placeholder="Ej: cliente@gmail.com" />
              </div>
            </div>
            <div className="mt-5 grid gap-4 xl:grid-cols-2">
              {clientesConTurnos.map((c) => {
                const { proximoTurno, historial } = dividirTurnosCliente(c.turnos)
                return (
                  <div key={c.id} className="rounded-lg border border-borde bg-fondo p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <h3 className="text-lg font-black text-texto-principal">{c.nombreCompleto}</h3>
                      {c.externo && (
                        <span className="rounded-lg bg-primario-claro px-2 py-1 text-xs font-bold text-primario">No registrado</span>
                      )}
                      {!c.externo && (
                        <span className="rounded-lg bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">Registrado</span>
                      )}
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {c.externo && (
                        <div>
                          <p className="text-xs font-bold uppercase text-texto-secundario">DNI</p>
                          <p className="mt-1 text-sm text-texto-principal">{c.dni || 'Sin DNI'}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-bold uppercase text-texto-secundario">Email</p>
                        <p className="mt-1 text-sm text-texto-principal">{c.email || 'Sin email'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase text-texto-secundario">Telefono</p>
                        <p className="mt-1 text-sm text-texto-principal">{c.telefono || 'Sin telefono'}</p>
                      </div>
                    </div>
                    <div className="mt-5 grid gap-4 border-t border-borde-suave pt-4">
                      <div>
                        <span className="text-xs font-bold uppercase text-texto-secundario">Proximo turno</span>
                        {proximoTurno ? (
                          <div className="mt-2 rounded-lg border border-borde-suave bg-white px-3 py-2">
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div>
                                <p className="text-xs font-bold uppercase text-texto-secundario">Fecha</p>
                                <p className="mt-1 text-sm font-semibold text-texto-principal">{fechaIsoDe(proximoTurno)}</p>
                              </div>
                              <div>
                                <p className="text-xs font-bold uppercase text-texto-secundario">Horario</p>
                                <p className="mt-1 text-sm font-semibold text-texto-principal">{horaDe(proximoTurno)}</p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p className="mt-2 rounded-lg border border-dashed border-borde bg-white px-3 py-3 text-sm text-texto-secundario">Sin proximos turnos.</p>
                        )}
                      </div>
                      <div>
                        <span className="text-xs font-bold uppercase text-texto-secundario">Ultimos turnos</span>
                        <ul className="mt-2 grid gap-2 text-sm text-texto-secundario">
                          {historial.slice(0, 2).map((t) => (
                            <li key={t.id} className="rounded-lg border border-borde-suave bg-white px-3 py-2">
                              <div className="grid gap-3 sm:grid-cols-2">
                                <div>
                                  <p className="text-xs font-bold uppercase text-texto-secundario">Fecha</p>
                                  <p className="mt-1 font-semibold text-texto-principal">{fechaIsoDe(t)}</p>
                                </div>
                                <div>
                                  <p className="text-xs font-bold uppercase text-texto-secundario">Horario</p>
                                  <p className="mt-1 font-semibold text-texto-principal">{horaDe(t)}</p>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                        {historial.length === 0 && (
                          <p className="mt-2 rounded-lg border border-dashed border-borde bg-white px-3 py-3 text-sm text-texto-secundario">Sin historial.</p>
                        )}
                        {historial.length > 2 && (
                        <button type="button" onClick={() => navigate('/profesional/historial')} className="mt-2 text-sm font-bold text-primario hover:underline">
                            Ver historial completo
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
              {clientesConTurnos.length === 0 && <p className="text-sm text-texto-secundario">Aun no tenes clientes con turnos.</p>}
            </div>
          </section>
        )}

        {seccionActual === 'asistentes' && (
          <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <article className="rounded-lg border border-borde-suave bg-white p-6 shadow-sm xl:p-7">
              <h2 className="text-2xl font-black text-texto-principal">Asistentes asignados</h2>
              <p className="mt-1 text-sm text-texto-secundario">Usuarios que pueden operar tu agenda y tus turnos.</p>

              <div className="mt-6 grid gap-3">
                {asistentes.map((a) => {
                  const iniciales = a.asistenteNombre
                    .split(' ')
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((parte) => parte[0]?.toUpperCase())
                    .join('')

                  return (
                    <div key={a.id} className="flex flex-col gap-4 rounded-lg border border-borde bg-fondo p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primario/10 text-base font-black text-primario">
                          {iniciales || 'AS'}
                        </span>
                        <div className="min-w-0">
                          <h3 className="truncate font-black text-texto-principal">{a.asistenteNombre}</h3>
                          <p className="truncate text-sm text-texto-secundario">{a.asistenteEmail}</p>
                        </div>
                      </div>
                      <BotonSecundario type="button" className="w-full sm:w-auto" onClick={() => setAsistenteADesasignar(a)}>
                        Quitar acceso
                      </BotonSecundario>
                    </div>
                  )
                })}
                {asistentes.length === 0 && (
                  <p className="rounded-lg border border-borde bg-fondo p-4 text-sm text-texto-secundario">
                    Todavia no tenes asistentes asignados.
                  </p>
                )}
              </div>
            </article>

            <form onSubmit={onAsignarAsistente} className="rounded-lg border border-borde-suave bg-white p-6 shadow-sm xl:p-7">
              <h2 className="text-2xl font-black text-texto-principal">Asignar asistente</h2>
              <p className="mt-1 text-sm text-texto-secundario">Elegis un usuario con rol asistente y queda vinculado a tu perfil profesional.</p>
              <div className="mt-6 grid gap-4">
                <div>
                  <Label>Asistente</Label>
                  <Input
                    type="email"
                    value={asistenteEmail}
                    onChange={(e) => setAsistenteEmail(e.target.value)}
                    placeholder="asistente@gmail.com"
                  />
                </div>
                <span className={`w-fit justify-self-end ${!asistenteEmail.trim() ? 'cursor-not-allowed' : ''}`}>
                  <BotonPrimario
                    type="submit"
                    className={`w-fit ${!asistenteEmail.trim() ? 'pointer-events-none' : ''}`}
                    disabled={!asistenteEmail.trim()}
                  >
                    Asignar
                  </BotonPrimario>
                </span>
              </div>
            </form>
          </section>
        )}

        {seccionActual === 'historial' && (
          <section className="rounded-lg border border-borde-suave bg-white p-6 shadow-sm xl:p-7">
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-2xl font-black text-texto-principal">Historial de turnos</h2>
                <p className="text-sm text-texto-secundario">Turnos pasados y actuales de tu agenda.</p>
              </div>
              <div className="grid gap-3 lg:grid-cols-3 xl:max-w-4xl">
                <div>
                  <Label>Mail del cliente</Label>
                  <Input value={filtrosHistorial.clienteEmail} onChange={(e) => setFiltrosHistorial({ ...filtrosHistorial, clienteEmail: e.target.value })} placeholder="cliente@gmail.com" />
                </div>
                <div>
                  <Label>Fecha</Label>
                  <Input type="date" value={filtrosHistorial.fecha} onChange={(e) => setFiltrosHistorial({ ...filtrosHistorial, fecha: e.target.value })} />
                </div>
                <div>
                  <Label>Estado</Label>
                  <FiltroEstado value={filtrosHistorial.estado} onChange={(estado) => setFiltrosHistorial({ ...filtrosHistorial, estado })} />
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:hidden">
              {historialFiltrado.map((t) => (
                <article key={t.id} className="rounded-lg border border-borde bg-fondo p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-black text-texto-principal">{t.clienteNombre}</h3>
                    </div>
                    <span className={`shrink-0 rounded-lg border px-2.5 py-1 text-xs font-bold ${estadoClass[t.estado]}`}>{estadoLabel[t.estado]}</span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-[11px] font-bold uppercase text-texto-suave">Fecha</span>
                      <p className="mt-1 font-black text-texto-principal">{fechaIsoDe(t)}</p>
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase text-texto-suave">Horario</span>
                      <p className="mt-1 font-black text-texto-principal">{horaDe(t)}</p>
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase text-texto-suave">Duracion</span>
                      <p className="mt-1 font-black text-texto-principal">{t.duracionMinutos} min</p>
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase text-texto-suave">Motivo</span>
                      <p className="mt-1 font-black text-texto-principal">{t.notas || 'Sin detalle'}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[11px] font-bold uppercase text-texto-suave">Mail cliente</span>
                      <p className="mt-1 break-all font-black text-texto-principal">{t.clienteEmail || 'Sin mail'}</p>
                    </div>
                  </div>
                </article>
              ))}
              {historialFiltrado.length === 0 && (
                <p className="rounded-lg border border-dashed border-borde bg-fondo px-4 py-6 text-center text-sm text-texto-secundario">Sin turnos.</p>
              )}
            </div>
            <div className="mt-6 hidden overflow-x-auto md:block">
              <table className="w-full min-w-[980px] border-separate border-spacing-y-2 text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase text-texto-secundario">
                    <th className="px-3 py-2">Cliente</th>
                    <th className="px-3 py-2">Mail cliente</th>
                    <th className="px-3 py-2">Fecha</th>
                    <th className="px-3 py-2">Horario</th>
                    <th className="px-3 py-2">Duracion</th>
                    <th className="px-3 py-2">Estado</th>
                    <th className="px-3 py-2">Notas</th>
                  </tr>
                </thead>
                <tbody>
                  {historialFiltrado.map((t) => (
                    <tr key={t.id} className="bg-fondo">
                      <td className="rounded-l-lg px-3 py-3 font-bold text-texto-principal">{t.clienteNombre}</td>
                      <td className="px-3 py-3 text-texto-secundario">{t.clienteEmail || 'Sin mail'}</td>
                      <td className="px-3 py-3 text-texto-secundario">{fechaIsoDe(t)}</td>
                      <td className="px-3 py-3 text-texto-secundario">{horaDe(t)}</td>
                      <td className="px-3 py-3 text-texto-secundario">{t.duracionMinutos} min</td>
                      <td className="px-3 py-3"><span className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${estadoClass[t.estado]}`}>{estadoLabel[t.estado]}</span></td>
                      <td className="rounded-r-lg px-3 py-3 text-texto-secundario">{t.notas || 'Sin detalle'}</td>
                    </tr>
                  ))}
                  {historialFiltrado.length === 0 && (
                    <tr><td colSpan={7} className="px-3 py-6 text-center text-sm text-texto-secundario">Sin turnos.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {seccionActual === 'perfil' && perfil && (
          <section className="rounded-lg border border-borde-suave bg-white p-6 shadow-sm xl:p-7">
            <h2 className="text-2xl font-black text-texto-principal">Mi perfil</h2>
            <p className="text-sm text-texto-secundario">Actualiza tus datos personales y profesionales.</p>

            <form onSubmit={guardarPerfil} className="mt-6 space-y-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[20px] bg-primario text-3xl font-black text-white">
                  {perfilForm.urlAvatar ? (
                    <img src={perfilForm.urlAvatar} alt={perfilForm.nombreCompleto} className="h-full w-full object-cover" />
                  ) : (
                    inicialesProf || 'P'
                  )}
                </div>
                <div className="flex-1">
                  <Label>URL de foto profesional</Label>
                  <Input value={perfilForm.urlAvatar} onChange={(e) => setPerfilForm({ ...perfilForm, urlAvatar: e.target.value })} placeholder="https://..." />
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div><Label>Nombre completo</Label><Input value={perfilForm.nombreCompleto} onChange={(e) => setPerfilForm({ ...perfilForm, nombreCompleto: e.target.value })} /></div>
                <div><Label>Teléfono</Label><Input value={perfilForm.telefono} onChange={(e) => setPerfilForm({ ...perfilForm, telefono: e.target.value })} /></div>
                <div><Label>Rubro</Label><Input value={perfilForm.especialidad} onChange={(e) => setPerfilForm({ ...perfilForm, especialidad: e.target.value })} /></div>
                <div><Label>Valor del turno</Label><Input type="number" min="0" step="1" value={perfilForm.precio} onChange={(e) => setPerfilForm({ ...perfilForm, precio: e.target.value })} /></div>
                <div><Label>Localidad</Label><Input value={perfilForm.localidad} onChange={(e) => setPerfilForm({ ...perfilForm, localidad: e.target.value })} placeholder="Ej: Villa Maipu" /></div>
                <div><Label>Dirección</Label><Input value={perfilForm.direccion} onChange={(e) => setPerfilForm({ ...perfilForm, direccion: e.target.value })} /></div>
              </div>

              <div>
                <Label>Descripción</Label>
                <Textarea rows={4} value={perfilForm.biografia} onChange={(e) => setPerfilForm({ ...perfilForm, biografia: e.target.value })} />
              </div>

              <span className={`inline-flex ${!perfilTieneCambios ? 'cursor-not-allowed' : ''}`}>
                <BotonPrimario type="submit" disabled={!perfilTieneCambios} className={!perfilTieneCambios ? 'pointer-events-none' : ''}>Guardar cambios</BotonPrimario>
              </span>
            </form>
          </section>
        )}

        {seccionActual === 'pagos' && (
          <section className="rounded-lg border border-borde-suave bg-white p-6 shadow-sm xl:p-7">
            <h2 className="text-2xl font-black text-texto-principal">Pagos</h2>
            <p className="mt-1 text-sm text-texto-secundario">Agendify retiene 5% sobre pagos online y suma las comisiones pendientes de turnos asignados manualmente.</p>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <article className="rounded-lg border border-borde bg-fondo p-4">
                <p className="text-xs font-bold uppercase text-texto-secundario">Comision pendiente</p>
                <p className="mt-2 text-3xl font-black text-texto-principal">{perfil?.comisionPendientePorcentaje ?? 0}%</p>
                <p className="mt-1 text-sm text-texto-secundario">Se suma al proximo pago online.</p>
              </article>
              <article className="rounded-lg border border-borde bg-fondo p-4">
                <p className="text-xs font-bold uppercase text-texto-secundario">Comision base</p>
                <p className="mt-2 text-3xl font-black text-texto-principal">5%</p>
                <p className="mt-1 text-sm text-texto-secundario">Se aplica a cada pago online.</p>
              </article>
              <article className="rounded-lg border border-borde bg-fondo p-4">
                <p className="text-xs font-bold uppercase text-texto-secundario">Proximo cobro online</p>
                <p className="mt-2 text-3xl font-black text-texto-principal">{5 + (perfil?.comisionPendientePorcentaje ?? 0)}%</p>
                <p className="mt-1 text-sm text-texto-secundario">Base mas acumulado pendiente.</p>
              </article>
            </div>
            <div className="mt-5 grid gap-3 md:hidden">
              {pagosTabla.map((p) => (
                <article key={p.id} className="rounded-lg border border-borde bg-fondo p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-black text-texto-principal">{p.clienteNombre}</h3>
                      <p className="mt-1 text-sm text-texto-secundario">{p.notas || p.agendaNombre}</p>
                    </div>
                    <span className="rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-primario">
                      {p.origen === 'ONLINE' ? 'Online' : 'Externo'}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-3 text-sm">
                    <div>
                      <span className="text-[11px] font-bold uppercase text-texto-suave">Fecha</span>
                      <p className="mt-1 font-bold text-texto-principal">{p.fecha}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[11px] font-bold uppercase text-texto-suave">Pagado</span>
                        <p className="mt-1 font-black text-primario">{formatPrecio(p.monto)}</p>
                      </div>
                      <div>
                        <span className="text-[11px] font-bold uppercase text-texto-suave">Neto</span>
                        <p className="mt-1 font-black text-texto-principal">{formatPrecio(p.netoProfesional)}</p>
                      </div>
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase text-texto-suave">Comision Agendify</span>
                      <p className="mt-1 font-bold text-texto-principal">
                        {formatPrecio(p.comisionAgendify)}
                        {p.porcentajeComision > 0 && <span className="ml-2 text-xs text-texto-secundario">({p.porcentajeComision}%)</span>}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
              {pagosTabla.length === 0 && (
                <p className="rounded-lg border border-dashed border-borde bg-fondo px-4 py-6 text-center text-sm text-texto-secundario">Sin pagos registrados.</p>
              )}
            </div>
            <div className="mt-5 hidden overflow-x-auto md:block">
              <table className="w-full min-w-[880px] border-separate border-spacing-y-2 text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase text-texto-secundario">
                    <th className="px-3 py-2">Cliente</th>
                    <th className="px-3 py-2">Turno</th>
                    <th className="px-3 py-2">Fecha</th>
                    <th className="px-3 py-2">Tipo</th>
                    <th className="px-3 py-2">Monto pagado</th>
                    <th className="px-3 py-2">Comisión Agendify</th>
                    <th className="px-3 py-2">Neto profesional</th>
                  </tr>
                </thead>
                <tbody>
                  {pagosTabla.map((p) => (
                    <tr key={p.id} className="bg-fondo">
                      <td className="rounded-l-lg px-3 py-3 font-bold text-texto-principal">{p.clienteNombre}</td>
                      <td className="px-3 py-3 text-texto-secundario">{p.notas || p.agendaNombre}</td>
                      <td className="px-3 py-3 text-texto-secundario">{p.fecha}</td>
                      <td className="px-3 py-3 text-texto-secundario">{p.origen === 'ONLINE' ? 'Pago online' : 'Cobro externo'}</td>
                      <td className="px-3 py-3 font-bold text-primario">{formatPrecio(p.monto)}</td>
                      <td className="px-3 py-3 font-semibold text-texto-secundario">
                        <span>{formatPrecio(p.comisionAgendify)}</span>
                        {p.porcentajeComision > 0 && (
                          <span className="block text-xs font-bold text-texto-secundario">{p.porcentajeComision}%</span>
                        )}
                      </td>
                      <td className="rounded-r-lg px-3 py-3 font-black text-texto-principal">{formatPrecio(p.netoProfesional)}</td>
                    </tr>
                  ))}
                  {pagosTabla.length === 0 && (
                    <tr><td colSpan={7} className="px-3 py-6 text-center text-sm text-texto-secundario">Sin pagos registrados.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {seccionActual === 'notificaciones' && (
          <section className="rounded-lg border border-borde-suave bg-white p-4 shadow-sm sm:p-6 xl:p-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-2xl font-black text-texto-principal">Notificaciones</h2>
                <p className="mt-1 text-sm text-texto-secundario">Turnos, cambios y pagos.</p>
              </div>
              {notificaciones.some((n) => !n.leida) && (
                <BotonSecundario
                  className="w-fit px-3 py-2 text-xs sm:px-4 sm:text-sm"
                  onClick={() => marcarTodasLeidas(usuario.id).then(() => getNotificaciones(usuario.id).then(setNotificaciones))}
                >
                  Marcar todas como leídas
                </BotonSecundario>
              )}
            </div>
            <div className="mt-5 grid gap-3">
              {notificaciones.length === 0 && <p className="text-sm text-texto-secundario">Sin notificaciones.</p>}
              {notificaciones.map((n) => (
                <article key={n.id} className={`rounded-lg border p-4 ${n.leida ? 'border-borde bg-fondo' : 'border-primario-suave bg-primario-claro'}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-black text-texto-principal">{n.titulo}</h3>
                    <span className="rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-primario">{new Date(n.enviadaEn).toLocaleString('es-PY')}</span>
                  </div>
                  <p className="mt-2 text-sm text-texto-secundario">{n.cuerpo}</p>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>

      {turnoACancelar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl border border-borde bg-white p-6 shadow-xl">
            {!pidiendoPasswordCancelacion ? (
              <>
                <h2 className="text-xl font-black text-texto-principal">Cancelar turno</h2>
                <div className="mt-4 space-y-2 text-sm text-texto-secundario">
                  <p>¿Querés cancelar este turno?</p>
                  <p>El turno quedará marcado como cancelado.</p>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <BotonSecundario type="button" className="h-12 w-20" onClick={cerrarCancelacionTurno}>
                    No
                  </BotonSecundario>
                  <button
                    type="button"
                    onClick={() => setPidiendoPasswordCancelacion(true)}
                    className="h-12 w-20 rounded-lg border border-peligro bg-peligro text-sm font-bold text-white hover:bg-red-700"
                  >
                    Si
                  </button>
                </div>
              </>
            ) : (
              <form onSubmit={confirmarCancelacionTurno}>
                <h2 className="text-xl font-black text-texto-principal">Confirmar contraseña</h2>
                <p className="mt-3 text-sm text-texto-secundario">
                  Para cancelar este turno, ingresa tu contraseña.
                </p>
                <div className="mt-5">
                  <Label>Contraseña</Label>
                  <Input
                    type="password"
                    value={passwordCancelacionTurno}
                    onChange={(e) => setPasswordCancelacionTurno(e.target.value)}
                    placeholder="Tu contraseña"
                    autoFocus
                  />
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <BotonSecundario type="button" className="h-12 w-28" onClick={cerrarCancelacionTurno}>
                    Cancelar
                  </BotonSecundario>
                  <span className={`${!passwordCancelacionTurno.trim() || cancelandoTurno ? 'cursor-not-allowed' : ''}`}>
                    <BotonPrimario
                      type="submit"
                      className={`h-12 w-28 ${!passwordCancelacionTurno.trim() || cancelandoTurno ? 'pointer-events-none' : ''}`}
                      disabled={!passwordCancelacionTurno.trim() || cancelandoTurno}
                    >
                      Aceptar
                    </BotonPrimario>
                  </span>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {asistenteAConfirmar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl border border-borde bg-white p-6 shadow-xl">
            {!pidiendoPasswordAsistente ? (
              <>
                <h2 className="text-xl font-black text-texto-principal">Asignar asistente</h2>
                <div className="mt-4 space-y-2 text-sm text-texto-secundario">
                  <p>¿Estás seguro que deseas asignar a este usuario como tu asistente?</p>
                  <p className="break-all rounded-lg border border-borde bg-fondo px-3 py-2 font-bold text-texto-principal">
                    {asistenteAConfirmar}
                  </p>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <BotonSecundario type="button" className="h-12 w-20" onClick={cerrarConfirmacionAsistente}>
                    No
                  </BotonSecundario>
                  <BotonPrimario type="button" className="h-12 w-20" onClick={() => setPidiendoPasswordAsistente(true)}>
                    Si
                  </BotonPrimario>
                </div>
              </>
            ) : (
              <form onSubmit={confirmarAsignacionAsistente}>
                <h2 className="text-xl font-black text-texto-principal">Confirmar contraseña</h2>
                <p className="mt-3 text-sm text-texto-secundario">
                  Para asignar a <span className="font-bold text-texto-principal">{asistenteAConfirmar}</span>, ingresa tu contraseña.
                </p>
                <div className="mt-5">
                  <Label>Contraseña</Label>
                  <Input
                    type="password"
                    value={passwordAsignacionAsistente}
                    onChange={(e) => setPasswordAsignacionAsistente(e.target.value)}
                    placeholder="Tu contraseña"
                    autoFocus
                  />
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <BotonSecundario type="button" className="h-12 w-28" onClick={cerrarConfirmacionAsistente}>
                    Cancelar
                  </BotonSecundario>
                  <span className={`${!passwordAsignacionAsistente.trim() || asignandoAsistente ? 'cursor-not-allowed' : ''}`}>
                    <BotonPrimario
                      type="submit"
                      className={`h-12 w-28 ${!passwordAsignacionAsistente.trim() || asignandoAsistente ? 'pointer-events-none' : ''}`}
                      disabled={!passwordAsignacionAsistente.trim() || asignandoAsistente}
                    >
                      Aceptar
                    </BotonPrimario>
                  </span>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {asistenteADesasignar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl border border-borde bg-white p-6 shadow-xl">
            {!pidiendoPasswordDesasignacion ? (
              <>
                <h2 className="text-xl font-black text-texto-principal">Quitar acceso</h2>
                <div className="mt-4 space-y-2 text-sm text-texto-secundario">
                  <p>¿Estás seguro que deseas quitarle el acceso a este asistente?</p>
                  <div className="rounded-lg border border-borde bg-fondo px-3 py-2">
                    <p className="font-bold text-texto-principal">{asistenteADesasignar.asistenteNombre}</p>
                    <p className="break-all text-texto-secundario">{asistenteADesasignar.asistenteEmail}</p>
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <BotonSecundario type="button" className="h-12 w-20" onClick={cerrarConfirmacionDesasignar}>
                    No
                  </BotonSecundario>
                  <BotonPrimario type="button" className="h-12 w-20" onClick={() => setPidiendoPasswordDesasignacion(true)}>
                    Si
                  </BotonPrimario>
                </div>
              </>
            ) : (
              <form onSubmit={confirmarDesasignacionAsistente}>
                <h2 className="text-xl font-black text-texto-principal">Confirmar contraseña</h2>
                <p className="mt-3 text-sm text-texto-secundario">
                  Para quitarle el acceso a <span className="font-bold text-texto-principal">{asistenteADesasignar.asistenteEmail}</span>, ingresa tu contraseña.
                </p>
                <div className="mt-5">
                  <Label>Contraseña</Label>
                  <Input
                    type="password"
                    value={passwordDesasignacionAsistente}
                    onChange={(e) => setPasswordDesasignacionAsistente(e.target.value)}
                    placeholder="Tu contraseña"
                    autoFocus
                  />
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <BotonSecundario type="button" className="h-12 w-28" onClick={cerrarConfirmacionDesasignar}>
                    Cancelar
                  </BotonSecundario>
                  <span className={`${!passwordDesasignacionAsistente.trim() || desasignandoAsistente ? 'cursor-not-allowed' : ''}`}>
                    <BotonPrimario
                      type="submit"
                      className={`h-12 w-28 ${!passwordDesasignacionAsistente.trim() || desasignandoAsistente ? 'pointer-events-none' : ''}`}
                      disabled={!passwordDesasignacionAsistente.trim() || desasignandoAsistente}
                    >
                      Aceptar
                    </BotonPrimario>
                  </span>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {eliminacionDisponibilidad && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl border border-borde bg-white p-6 shadow-xl">
            <h2 className="text-xl font-black text-texto-principal">Eliminar disponibilidad</h2>
            <div className="mt-4 space-y-2 text-sm text-texto-secundario">
              {eliminacionDisponibilidad.tipo === 'bloque' ? (
                <>
                  <p>¿Querés eliminar este bloque de horarios?</p>
                  <p>Se eliminarán todos los horarios de ese bloque.</p>
                </>
              ) : (
                <>
                  <p>¿Querés eliminar el horario {eliminacionDisponibilidad.horario}?</p>
                  <p>El resto de los horarios se mantendrá disponible.</p>
                </>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <BotonSecundario type="button" onClick={() => setEliminacionDisponibilidad(null)}>
                No
              </BotonSecundario>
              <button
                type="button"
                onClick={onConfirmarEliminarDisponibilidad}
                className="rounded-lg border border-peligro bg-peligro px-5 py-2.5 text-sm font-bold text-white hover:bg-red-700"
              >
                Si
              </button>
            </div>
          </div>
        </div>
      )}

      <div id="toast-container">
        <Toast toast={toast} />
      </div>
    </div>
  )
}


