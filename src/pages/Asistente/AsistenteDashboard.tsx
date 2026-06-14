import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, NavLink, useNavigate, useParams } from 'react-router-dom'
import { IconCalendar } from '../../components/LandingPage/Icons'
import { BotonPrimario, BotonSecundario, Input, Label, Select, Textarea } from '../../components/common/ui'
import { useSesion } from '../../customHooks/useSesion'
import { useToast } from '../../customHooks/useToast'
import { Toast } from '../../components/common/toast'
import { extraerError } from '../../api/client'
import { agregarConfiguracion, eliminarConfiguracion, getAgendasDeProfesional, getSlots } from '../../api/agendas'
import {
  aceptarProfesionalAsistente,
  cancelarTurnoAsistente,
  desasignarAsistente,
  getProfesionalesDeAsistente,
  getTurnosDeAsistente,
  modificarTurnoAsistente,
  rechazarProfesionalAsistente,
  reservarTurnoAsistente,
} from '../../api/asistentes'
import { buscarClientePorEmail, getClientesDeProfesional } from '../../api/clientes'
import { getProfesional } from '../../api/profesionales'
import { actualizarUsuario } from '../../api/usuarios'
import { activarRol, login as validarLogin } from '../../api/auth'
import type {
  Agenda,
  AsistenteAsignacion,
  Cliente,
  DiaSemana,
  Profesional,
  ServicioProfesional,
  Slot,
  Turno,
} from '../../api/types'

type SeccionAsistente = 'agenda' | 'turnos' | 'clientes' | 'profesionales' | 'historial' | 'perfil'
type ConfiguracionAgenda = Agenda['configuraciones'][number]
type GrupoConfiguracionAgenda = {
  diaSemana: DiaSemana
  duracionSlotMinutos: number
  configuraciones: ConfiguracionAgenda[]
  horarios: Array<{ horario: string; configuracion: ConfiguracionAgenda }>
}
type EliminacionDisponibilidadPendiente =
  | { tipo: 'grupo'; grupo: GrupoConfiguracionAgenda }
  | { tipo: 'horario'; configuracion: ConfiguracionAgenda; horario: string }
const seccionesValidas: SeccionAsistente[] = ['agenda', 'turnos', 'profesionales', 'historial', 'perfil']

const navItems: Array<{ label: string; seccion: SeccionAsistente | 'dashboard' }> = [
  { label: 'Panel de Control', seccion: 'dashboard' },
  { label: 'Agenda', seccion: 'agenda' },
  { label: 'Turnos', seccion: 'turnos' },
  { label: 'Profesionales', seccion: 'profesionales' },
  { label: 'Historial', seccion: 'historial' },
  { label: 'Mi Perfil', seccion: 'perfil' },
]
const navMobilePrincipal = new Set<SeccionAsistente | 'dashboard'>(['dashboard', 'agenda', 'turnos'])
const pathDeSeccion = (item: { seccion: SeccionAsistente | 'dashboard' }) =>
  item.seccion === 'dashboard' ? '/asistente' : `/asistente/${item.seccion}`

const estadoClass: Record<Turno['estado'], string> = {
  CONFIRMADO: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  CANCELADO: 'bg-red-100 text-red-700 border-red-200',
}
const estadoLabel: Record<Turno['estado'], string> = {
  CONFIRMADO: 'Confirmado', CANCELADO: 'Cancelado',
}
const estadoAsignacionClass: Record<AsistenteAsignacion['estado'], string> = {
  PENDIENTE: 'bg-amber-50 text-amber-700 border-amber-200',
  ACEPTADA: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  RECHAZADA: 'bg-red-100 text-red-700 border-red-200',
}
const estadoAsignacionLabel: Record<AsistenteAsignacion['estado'], string> = {
  PENDIENTE: 'Pendiente',
  ACEPTADA: 'Aceptado',
  RECHAZADA: 'Rechazado',
}

const diasLabels: Record<DiaSemana, string> = {
  MONDAY: 'Lunes', TUESDAY: 'Martes', WEDNESDAY: 'Miercoles', THURSDAY: 'Jueves',
  FRIDAY: 'Viernes', SATURDAY: 'Sabado', SUNDAY: 'Domingo',
}
const diasOrden = Object.keys(diasLabels) as DiaSemana[]

const fechaIsoDe = (t: { iniciaEn: string }) => t.iniciaEn.slice(0, 10)
const horaDe     = (t: { iniciaEn: string }) => t.iniciaEn.slice(11, 16)
const abrirCalendario = (input: HTMLInputElement) => input.showPicker?.()
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
const formatPrecio = (precio: number) =>
  `$ ${new Intl.NumberFormat('es-PY', { maximumFractionDigits: 0 }).format(precio)}`
const serviciosDeProfesional = (perfil: Profesional): ServicioProfesional[] => {
  if (perfil.serviciosConPrecio.length > 0) {
    return perfil.serviciosConPrecio.map((servicio) => ({
      nombre: servicio.nombre,
      precio: servicio.precio,
    }))
  }

  return perfil.servicios.map((nombre) => ({
    nombre,
    precio: perfil.precio,
  }))
}
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
const fechaCortaDe = (t: { iniciaEn: string }) =>
  new Date(t.iniciaEn).toLocaleDateString('es-PY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).replace('.', '')

const fechaDiaSeleccionado = (fechaIso: string) => fechaIso.split('-').reverse().join('-')

export default function AsistenteDashboard() {
  const { seccion } = useParams()
  const navigate = useNavigate()
  const { usuario, sesion, iniciar, cambiarRolActivo, cerrar } = useSesion()
  const { toast, showToast } = useToast()

  const seccionActual = seccionesValidas.includes(seccion as SeccionAsistente)
    ? (seccion as SeccionAsistente)
    : 'dashboard'

  const [profesionales, setProfesionales] = useState<AsistenteAsignacion[]>([])
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [agendaPorProfesional, setAgendaPorProfesional] = useState<Record<number, Agenda | null>>({})
  const [perfilPorProfesional, setPerfilPorProfesional] = useState<Record<number, Profesional>>({})
  const [slotsTurnoNuevo, setSlotsTurnoNuevo] = useState<Slot[]>([])
  const [slotsTurnoEditar, setSlotsTurnoEditar] = useState<Slot[]>([])

  const [filtrosAgenda, setFiltrosAgenda] = useState({ profesionalId: '', clienteEmail: '', fechaDesde: '', fechaHasta: '' })
  const [disponibilidad, setDisponibilidad] = useState({
    diaSemana: 'MONDAY' as DiaSemana,
    inicio: '09:00',
    fin: '18:00',
    duracion: '30',
  })
  const [eliminacionDisponibilidad, setEliminacionDisponibilidad] = useState<EliminacionDisponibilidadPendiente | null>(null)
  const [turnoNuevo, setTurnoNuevo] = useState({
    profesionalId: '',
    tipoCliente: 'registrado' as 'registrado' | 'externo',
    clienteEmail: '',
    clienteExternoNombre: '',
    clienteExternoTelefono: '',
    clienteExternoDni: '',
    clienteExternoEmail: '',
    fecha: '',
    horario: '',
    duracion: '45',
    notas: '',
  })
  const [turnoEditarId, setTurnoEditarId] = useState('')
  const [turnoEditar, setTurnoEditar] = useState({ fecha: '', horario: '', duracion: '45', estado: 'CONFIRMADO' as Turno['estado'], notas: '' })
  const [turnoACancelar, setTurnoACancelar] = useState<Turno | null>(null)
  const [pidiendoPasswordCancelacion, setPidiendoPasswordCancelacion] = useState(false)
  const [passwordCancelacionTurno, setPasswordCancelacionTurno] = useState('')
  const [cancelandoTurno, setCancelandoTurno] = useState(false)
  const [invitacionProfesional, setInvitacionProfesional] = useState<{ asignacion: AsistenteAsignacion; accion: 'aceptar' | 'rechazar' } | null>(null)
  const [pidiendoPasswordInvitacion, setPidiendoPasswordInvitacion] = useState(false)
  const [passwordInvitacion, setPasswordInvitacion] = useState('')
  const [respondiendoInvitacion, setRespondiendoInvitacion] = useState(false)
  const [profesionalADesvincular, setProfesionalADesvincular] = useState<AsistenteAsignacion | null>(null)
  const [pidiendoPasswordDesvinculacion, setPidiendoPasswordDesvinculacion] = useState(false)
  const [passwordDesvinculacion, setPasswordDesvinculacion] = useState('')
  const [desvinculandoProfesional, setDesvinculandoProfesional] = useState(false)
  const [busquedaCliente, setBusquedaCliente] = useState('')
  const [filtrosHistorial, setFiltrosHistorial] = useState({ profesionalId: 'Todos', clienteEmail: '', fecha: '', estado: 'Todos' as 'Todos' | Turno['estado'] })
  const [vistaCalendario, setVistaCalendario] = useState<'dia' | 'semana' | 'mes'>('mes')
  const [fechaCalendario, setFechaCalendario] = useState(() => new Date().toISOString().slice(0, 10))
  const [perfilForm, setPerfilForm] = useState({ nombreCompleto: '', telefono: '', urlAvatar: '' })
  const [activandoPerfil, setActivandoPerfil] = useState(false)
  const [mostrandoCambioPerfil, setMostrandoCambioPerfil] = useState(false)

  const [menuUsuarioAbierto, setMenuUsuarioAbierto] = useState(false)
  const menuUsuarioRef = useRef<HTMLDivElement>(null)
  const cerrandoSesionRef = useRef(false)

  useEffect(() => {
    if (cerrandoSesionRef.current) return
    if (!usuario || !usuario.roles.includes('ASISTENTE')) {
      navigate('/login', { replace: true })
    }
  }, [usuario, navigate])

  useEffect(() => {
    if (!usuario) return
    setPerfilForm({
      nombreCompleto: usuario.nombreCompleto,
      telefono: usuario.telefono,
      urlAvatar: usuario.urlAvatar ?? '',
    })
  }, [usuario])

  const perfilTieneCambios = useMemo(() => {
    if (!usuario) return false
    return (
      perfilForm.nombreCompleto.trim() !== usuario.nombreCompleto ||
      perfilForm.telefono.trim() !== usuario.telefono ||
      perfilForm.urlAvatar.trim() !== (usuario.urlAvatar ?? '')
    )
  }, [perfilForm, usuario])

  const profesionalesAceptados = useMemo(
    () => profesionales.filter((p) => p.estado === 'ACEPTADA'),
    [profesionales],
  )

  useEffect(() => {
    if (!usuario) return
    void getProfesionalesDeAsistente(usuario.id).then(setProfesionales).catch((e) => showToast(extraerError(e), 'error'))
    void getTurnosDeAsistente(usuario.id).then(setTurnos).catch((e) => showToast(extraerError(e), 'error'))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario?.id])

  // Cuando hay profesionales, cargar clientes y agendas de los asignados
  useEffect(() => {
    if (profesionalesAceptados.length === 0) {
      setClientes([])
      setAgendaPorProfesional({})
      setPerfilPorProfesional({})
      setFiltrosAgenda((f) => ({ ...f, profesionalId: '' }))
      setTurnoNuevo((n) => ({ ...n, profesionalId: '' }))
      return
    }
    if (!filtrosAgenda.profesionalId) {
      setFiltrosAgenda((f) => ({ ...f, profesionalId: String(profesionalesAceptados[0].profesionalId) }))
    }
    if (!turnoNuevo.profesionalId) {
      setTurnoNuevo((n) => ({ ...n, profesionalId: String(profesionalesAceptados[0].profesionalId) }))
    }
    Promise.all(profesionalesAceptados.map((a) => getClientesDeProfesional(a.profesionalId)))
      .then((listas) => {
        const map = new Map<number, Cliente>()
        listas.flat().forEach((c) => map.set(c.id, c))
        setClientes(Array.from(map.values()))
      })
      .catch((e) => showToast(extraerError(e), 'error'))

    profesionalesAceptados.forEach((a) => {
      getAgendasDeProfesional(a.profesionalId)
        .then((ags) => setAgendaPorProfesional((m) => ({ ...m, [a.profesionalId]: ags[0] ?? null })))
        .catch(() => {})
      getProfesional(a.profesionalId)
        .then((perfil) => setPerfilPorProfesional((m) => ({ ...m, [a.profesionalId]: perfil })))
        .catch(() => {})
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profesionalesAceptados])

  const slotsReservablesTurnoNuevo = useMemo(
    () => slotsTurnoNuevo.filter(slotReservable),
    [slotsTurnoNuevo],
  )
  const perfilTurnoNuevo = turnoNuevo.profesionalId
    ? perfilPorProfesional[Number(turnoNuevo.profesionalId)] ?? null
    : null
  const serviciosTurnoNuevo = useMemo(
    () => (perfilTurnoNuevo ? serviciosDeProfesional(perfilTurnoNuevo) : []),
    [perfilTurnoNuevo],
  )
  const servicioTurnoNuevoSeleccionado =
    serviciosTurnoNuevo.find((servicio) => servicio.nombre === turnoNuevo.notas) ?? null
  const profesionalAgendaSeleccionadoId = Number(filtrosAgenda.profesionalId)
  const agendaSeleccionada = Number.isFinite(profesionalAgendaSeleccionadoId)
    ? agendaPorProfesional[profesionalAgendaSeleccionadoId] ?? null
    : null
  const configuracionesPorDia = useMemo(() => {
    const grupos = diasOrden.reduce((acc, dia) => {
      acc[dia] = []
      return acc
    }, {} as Record<DiaSemana, GrupoConfiguracionAgenda[]>)

    const porDiaYDuracion = new Map<string, GrupoConfiguracionAgenda>()

    agendaSeleccionada?.configuraciones.forEach((configuracion) => {
      const clave = `${configuracion.diaSemana}-${configuracion.duracionSlotMinutos}`
      const grupo = porDiaYDuracion.get(clave) ?? {
        diaSemana: configuracion.diaSemana,
        duracionSlotMinutos: configuracion.duracionSlotMinutos,
        configuraciones: [],
        horarios: [],
      }

      grupo.configuraciones.push(configuracion)
      horariosDeConfiguracion(configuracion).forEach((horario) => {
        if (!grupo.horarios.some((item) => item.horario === horario)) {
          grupo.horarios.push({ horario, configuracion })
        }
      })
      porDiaYDuracion.set(clave, grupo)
    })

    porDiaYDuracion.forEach((grupo) => {
      grupo.configuraciones.sort((a, b) => a.inicioSlot.localeCompare(b.inicioSlot))
      grupo.horarios.sort((a, b) => a.horario.localeCompare(b.horario))
      grupos[grupo.diaSemana].push(grupo)
    })

    diasOrden.forEach((dia) => {
      grupos[dia].sort((a, b) => a.duracionSlotMinutos - b.duracionSlotMinutos)
    })

    return grupos
  }, [agendaSeleccionada?.configuraciones])
  const turnoSeleccionadoEditar = useMemo(
    () => turnos.find((t) => t.id === turnoEditarId) ?? null,
    [turnos, turnoEditarId],
  )
  const horariosTurnoEditar = useMemo(() => {
    const horarios = slotsTurnoEditar.filter(slotReservable).map(horaDe)
    if (
      turnoSeleccionadoEditar &&
      turnoAccionable(turnoSeleccionadoEditar) &&
      fechaIsoDe(turnoSeleccionadoEditar) === turnoEditar.fecha
    ) {
      horarios.push(horaDe(turnoSeleccionadoEditar))
    }
    return Array.from(new Set(horarios)).sort((a, b) => a.localeCompare(b))
  }, [slotsTurnoEditar, turnoSeleccionadoEditar, turnoEditar.fecha])
  const datosClienteTurnoNuevoCompletos = turnoNuevo.tipoCliente === 'externo'
    ? turnoNuevo.clienteExternoNombre.trim().length > 0 &&
      turnoNuevo.clienteExternoTelefono.trim().length > 0 &&
      turnoNuevo.clienteExternoDni.trim().length > 0
    : turnoNuevo.clienteEmail.trim().length > 0
  const puedeAsignarTurno =
    turnoNuevo.profesionalId.length > 0 &&
    datosClienteTurnoNuevoCompletos &&
    turnoNuevo.notas.trim().length > 0 &&
    turnoNuevo.fecha.length > 0 &&
    turnoNuevo.horario.length > 0

  useEffect(() => {
    const profId = Number(turnoNuevo.profesionalId)
    const agenda = agendaPorProfesional[profId]
    if (!agenda || !turnoNuevo.fecha) {
      setSlotsTurnoNuevo([])
      setTurnoNuevo((actual) => actual.horario ? { ...actual, horario: '' } : actual)
      return
    }

    void getSlots(agenda.id, turnoNuevo.fecha)
      .then((slots) => {
        const disponibles = slots.filter(slotReservable)
        setSlotsTurnoNuevo(slots)
        setTurnoNuevo((actual) => {
          if (actual.horario && disponibles.some((slot) => horaDe(slot) === actual.horario)) return actual
          return { ...actual, horario: disponibles[0] ? horaDe(disponibles[0]) : '' }
        })
      })
      .catch((e) => {
        setSlotsTurnoNuevo([])
        setTurnoNuevo((actual) => ({ ...actual, horario: '' }))
        showToast(extraerError(e), 'error')
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turnoNuevo.profesionalId, turnoNuevo.fecha, agendaPorProfesional])

  useEffect(() => {
    const t = turnoSeleccionadoEditar
    if (!t) {
      setTurnoEditar({ fecha: '', horario: '', duracion: '45', estado: 'CONFIRMADO', notas: '' })
      setSlotsTurnoEditar([])
      return
    }
    setTurnoEditar({ fecha: fechaIsoDe(t), horario: horaDe(t), duracion: String(t.duracionMinutos), estado: t.estado, notas: t.notas })
  }, [turnoSeleccionadoEditar])

  useEffect(() => {
    const agenda = turnoSeleccionadoEditar ? agendaPorProfesional[turnoSeleccionadoEditar.profesionalId] : null
    if (!agenda || !turnoEditarId || !turnoEditar.fecha) {
      setSlotsTurnoEditar([])
      return
    }

    void getSlots(agenda.id, turnoEditar.fecha)
      .then((slots) => {
        const disponibles = slots.filter(slotReservable)
        const horaActual =
          turnoSeleccionadoEditar &&
          turnoAccionable(turnoSeleccionadoEditar) &&
          fechaIsoDe(turnoSeleccionadoEditar) === turnoEditar.fecha
            ? horaDe(turnoSeleccionadoEditar)
            : null
        const horasValidas = new Set([
          ...disponibles.map(horaDe),
          ...(horaActual ? [horaActual] : []),
        ])
        setSlotsTurnoEditar(slots)
        setTurnoEditar((actual) => {
          if (actual.horario && horasValidas.has(actual.horario)) return actual
          return { ...actual, horario: disponibles[0] ? horaDe(disponibles[0]) : (horaActual ?? '') }
        })
      })
      .catch((e) => {
        setSlotsTurnoEditar([])
        setTurnoEditar((actual) => ({ ...actual, horario: '' }))
        showToast(extraerError(e), 'error')
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turnoEditarId, turnoEditar.fecha, turnoSeleccionadoEditar, agendaPorProfesional])

  const turnoEditarCamposCompletos =
    turnoEditarId.length > 0 &&
    turnoEditar.fecha.length > 0 &&
    turnoEditar.horario.length > 0
  const turnoEditarTieneCambios = Boolean(turnoSeleccionadoEditar) && (
    fechaIsoDe(turnoSeleccionadoEditar!) !== turnoEditar.fecha ||
    horaDe(turnoSeleccionadoEditar!) !== turnoEditar.horario ||
    (turnoSeleccionadoEditar!.notas ?? '') !== turnoEditar.notas
  )
  const puedeModificarTurno = turnoEditarCamposCompletos && turnoEditarTieneCambios
  const mensajeModificarTurnoInhabilitado = !turnoEditarCamposCompletos
    ? 'Necesitas completar todos los campos'
    : !turnoEditarTieneCambios
      ? 'Necesitas hacer al menos una modificacion'
      : undefined

  useEffect(() => {
    const handleClickAfuera = (e: MouseEvent) => {
      if (menuUsuarioRef.current && !menuUsuarioRef.current.contains(e.target as Node)) {
        setMenuUsuarioAbierto(false)
      }
    }
    document.addEventListener('mousedown', handleClickAfuera)
    return () => document.removeEventListener('mousedown', handleClickAfuera)
  }, [])

  const turnosAgenda = useMemo(() =>
    turnos.filter((t) => {
      const okProf = !filtrosAgenda.profesionalId || t.profesionalId === Number(filtrosAgenda.profesionalId)
      const okEmail = filtrosAgenda.clienteEmail.trim().length === 0 || (t.clienteEmail ?? '').toLowerCase().includes(filtrosAgenda.clienteEmail.trim().toLowerCase())
      const okDesde = !filtrosAgenda.fechaDesde || fechaIsoDe(t) >= filtrosAgenda.fechaDesde
      const okHasta = !filtrosAgenda.fechaHasta || fechaIsoDe(t) <= filtrosAgenda.fechaHasta
      const okActual = new Date(t.iniciaEn).getTime() >= Date.now()
      return okActual && okProf && okEmail && okDesde && okHasta
    }),
    [turnos, filtrosAgenda],
  )

  const clientesFiltrados = useMemo(() => {
    const q = busquedaCliente.trim().toLowerCase()
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

    return Array.from(mapa.values()).filter((c) => {
      const email = (c.email ?? '').toLowerCase()
      return q.length === 0 || email.includes(q)
    })
  }, [clientes, turnos, busquedaCliente])

  const historialFiltrado = useMemo(() =>
    turnos.filter((t) => {
      const okProf  = filtrosHistorial.profesionalId === 'Todos' || t.profesionalId === Number(filtrosHistorial.profesionalId)
      const okEmail = filtrosHistorial.clienteEmail.trim().length === 0 || (t.clienteEmail ?? '').toLowerCase().includes(filtrosHistorial.clienteEmail.trim().toLowerCase())
      const okFecha = filtrosHistorial.fecha.length === 0 || fechaIsoDe(t) === filtrosHistorial.fecha
      const okEst   = filtrosHistorial.estado === 'Todos' || t.estado === filtrosHistorial.estado
      return okProf && okEmail && okFecha && okEst
    }),
    [turnos, filtrosHistorial],
  )

  const turnosProximos = useMemo(() =>
    turnos
      .filter((t) => t.estado !== 'CANCELADO' && new Date(t.iniciaEn).getTime() > Date.now())
      .sort(ordenarTurnosAsc)
      .slice(0, 5),
    [turnos],
  )

  const turnosPorFecha = useMemo(
    () => turnos.reduce<Record<string, Turno[]>>((acc, t) => {
      const f = fechaIsoDe(t)
      if (!acc[f]) acc[f] = []
      acc[f].push(t)
      return acc
    }, {}),
    [turnos],
  )

  const fechaSeleccionada = useMemo(() => new Date(`${fechaCalendario}T00:00:00`), [fechaCalendario])
  const diasSemana = useMemo(() => {
    const dia = new Date(fechaSeleccionada)
    const startOffset = (dia.getDay() + 6) % 7
    dia.setDate(dia.getDate() - startOffset)
    return Array.from({ length: 7 }, (_, i) => {
      const f = new Date(dia)
      f.setDate(dia.getDate() + i)
      return f
    })
  }, [fechaSeleccionada])
  const diasMes = useMemo(() => {
    const year = fechaSeleccionada.getFullYear()
    const month = fechaSeleccionada.getMonth()
    const first = new Date(year, month, 1)
    const startOffset = (first.getDay() + 6) % 7
    const start = new Date(first)
    start.setDate(first.getDate() - startOffset)
    return Array.from({ length: 35 }, (_, i) => {
      const f = new Date(start)
      f.setDate(start.getDate() + i)
      return f
    })
  }, [fechaSeleccionada])
  const turnosFechaSeleccionada = turnosPorFecha[fechaCalendario] ?? []

  const cerrarSesion = () => {
    cerrandoSesionRef.current = true
    cerrar()
    navigate('/login', { replace: true })
  }

  const inicialesAsistente = (usuario?.nombreCompleto ?? '')
    .split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()
  const inicialesDe = (nombre: string) =>
    nombre.split(' ').filter(Boolean).slice(0, 2).map((parte) => parte[0]).join('').toUpperCase()

  const refrescarTurnos = () => {
    if (usuario) void getTurnosDeAsistente(usuario.id).then(setTurnos)
  }

  const actualizarAgendaSeleccionada = (agendaActualizada: Agenda) => {
    setAgendaPorProfesional((actual) => ({
      ...actual,
      [agendaActualizada.profesionalId]: agendaActualizada,
    }))
  }

  const onAgregarDisponibilidad = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!agendaSeleccionada) {
      showToast('El profesional no tiene agenda activa', 'error')
      return
    }
    try {
      const actualizada = await agregarConfiguracion(agendaSeleccionada.id, {
        id: null,
        diaSemana: disponibilidad.diaSemana,
        inicioSlot: disponibilidad.inicio,
        finSlot: disponibilidad.fin,
        duracionSlotMinutos: parseInt(disponibilidad.duracion, 10),
      })
      actualizarAgendaSeleccionada(actualizada)
      showToast('Disponibilidad agregada', 'success')
    } catch (err) {
      showToast(extraerError(err), 'error')
    }
  }

  const onEliminarHorarioConfig = async (configuracion: ConfiguracionAgenda, horario: string) => {
    if (!agendaSeleccionada || !configuracion.id) return
    try {
      const inicioBloque = minutosDeHora(configuracion.inicioSlot)
      const finBloque = minutosDeHora(configuracion.finSlot)
      const inicioHorario = minutosDeHora(horario)
      const finHorario = inicioHorario + configuracion.duracionSlotMinutos

      const bloquesRestantes = [
        { inicioSlot: horaDeMinutos(inicioBloque), finSlot: horaDeMinutos(inicioHorario) },
        { inicioSlot: horaDeMinutos(finHorario), finSlot: horaDeMinutos(finBloque) },
      ].filter((bloque) => minutosDeHora(bloque.finSlot) - minutosDeHora(bloque.inicioSlot) >= configuracion.duracionSlotMinutos)

      let agendaActualizada = await eliminarConfiguracion(agendaSeleccionada.id, configuracion.id)
      for (const bloque of bloquesRestantes) {
        agendaActualizada = await agregarConfiguracion(agendaSeleccionada.id, {
          id: null,
          diaSemana: configuracion.diaSemana,
          inicioSlot: bloque.inicioSlot,
          finSlot: bloque.finSlot,
          duracionSlotMinutos: configuracion.duracionSlotMinutos,
        })
      }
      actualizarAgendaSeleccionada(agendaActualizada)
      showToast('Horario eliminado', 'success')
    } catch (err) {
      showToast(extraerError(err), 'error')
    }
  }

  const onEliminarGrupoConfig = async (grupo: GrupoConfiguracionAgenda) => {
    if (!agendaSeleccionada) return
    try {
      let agendaActualizada: Agenda | null = null
      for (const configuracion of grupo.configuraciones) {
        if (!configuracion.id) continue
        agendaActualizada = await eliminarConfiguracion(agendaSeleccionada.id, configuracion.id)
      }
      if (agendaActualizada) {
        actualizarAgendaSeleccionada(agendaActualizada)
      }
      showToast('Bloque eliminado', 'success')
    } catch (err) {
      showToast(extraerError(err), 'error')
    }
  }

  const onConfirmarEliminarDisponibilidad = async () => {
    if (!eliminacionDisponibilidad) return
    if (eliminacionDisponibilidad.tipo === 'grupo') {
      await onEliminarGrupoConfig(eliminacionDisponibilidad.grupo)
    } else {
      await onEliminarHorarioConfig(eliminacionDisponibilidad.configuracion, eliminacionDisponibilidad.horario)
    }
    setEliminacionDisponibilidad(null)
  }

  const onCrearTurno = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const profId = Number(turnoNuevo.profesionalId)
    const agenda = agendaPorProfesional[profId]
    if (!agenda) {
      showToast('El profesional no tiene agenda activa', 'error')
      return
    }
    const esClienteExterno = turnoNuevo.tipoCliente === 'externo'
    const clienteIncompleto = esClienteExterno
      ? !turnoNuevo.clienteExternoNombre.trim() || !turnoNuevo.clienteExternoTelefono.trim() || !turnoNuevo.clienteExternoDni.trim()
      : !turnoNuevo.clienteEmail.trim()
    if (clienteIncompleto || !turnoNuevo.notas.trim() || !turnoNuevo.fecha || !turnoNuevo.horario) {
      showToast('Completa los datos obligatorios', 'error')
      return
    }
    try {
      if (!usuario) return
      const clienteRegistrado = esClienteExterno
        ? null
        : await buscarClientePorEmail(turnoNuevo.clienteEmail.trim())
      await reservarTurnoAsistente(usuario.id, {
        agendaId: agenda.id,
        clienteId: clienteRegistrado?.id ?? null,
        clienteExternoNombre: esClienteExterno ? turnoNuevo.clienteExternoNombre : undefined,
        clienteExternoTelefono: esClienteExterno ? turnoNuevo.clienteExternoTelefono : undefined,
        clienteExternoDni: esClienteExterno ? turnoNuevo.clienteExternoDni : undefined,
        clienteExternoEmail: esClienteExterno ? turnoNuevo.clienteExternoEmail : undefined,
        iniciaEn: `${turnoNuevo.fecha}T${turnoNuevo.horario}:00`,
        duracionMinutos: parseInt(turnoNuevo.duracion, 10),
        notas: turnoNuevo.notas,
        precioServicio: servicioTurnoNuevoSeleccionado?.precio,
      })
      refrescarTurnos()
      setTurnoNuevo((n) => ({
        ...n,
        clienteEmail: '',
        clienteExternoNombre: '',
        clienteExternoTelefono: '',
        clienteExternoDni: '',
        clienteExternoEmail: '',
        notas: '',
      }))
      showToast('Turno creado', 'success')
    } catch (err) { showToast(extraerError(err), 'error') }
  }

  const onModificarTurno = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const t = turnos.find((x) => x.id === turnoEditarId)
    if (!t) return
    if (!turnoEditarCamposCompletos) {
      showToast('Completa turno, fecha y horario', 'error')
      return
    }
    if (!turnoEditarTieneCambios) {
      showToast('Necesitas hacer al menos una modificacion', 'error')
      return
    }
    try {
      if (!usuario) return
      await modificarTurnoAsistente(usuario.id, turnoEditarId, {
        iniciaEn: `${turnoEditar.fecha}T${turnoEditar.horario}:00`,
        duracionMinutos: t.duracionMinutos,
        notas: turnoEditar.notas,
        estado: t.estado,
      })
      refrescarTurnos()
      showToast('Turno actualizado', 'success')
    } catch (err) { showToast(extraerError(err), 'error') }
  }

  const onCancelarTurnoDirecto = async (id: string) => {
    try {
      if (!usuario) return
      await cancelarTurnoAsistente(usuario.id, id)
      setTurnoACancelar(null)
      setPidiendoPasswordCancelacion(false)
      setPasswordCancelacionTurno('')
      refrescarTurnos()
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
      await onCancelarTurnoDirecto(turnoACancelar.id)
    } catch (err) {
      showToast(mensajePasswordIncorrecta(err), 'error')
    } finally {
      setCancelandoTurno(false)
    }
  }

  const guardarPerfil = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault()
    if (!usuario || !sesion) return
    if (!perfilTieneCambios) return
    try {
      const actualizado = await actualizarUsuario(usuario.id, {
        nombreCompleto: perfilForm.nombreCompleto.trim(),
        telefono: perfilForm.telefono.trim(),
        urlAvatar: perfilForm.urlAvatar.trim(),
      })
      iniciar({ token: sesion.token, usuario: actualizado }, 'ASISTENTE')
      showToast('Perfil actualizado.', 'success')
      navigate('/asistente')
    } catch (err) {
      showToast(extraerError(err), 'error')
    }
  }

  const irAPerfilCliente = async () => {
    if (!usuario) return
    if (usuario.roles.includes('CLIENTE') && usuario.perfilClienteId != null) {
      setMostrandoCambioPerfil(false)
      cambiarRolActivo('CLIENTE')
      navigate('/cliente')
      return
    }

    setActivandoPerfil(true)
    try {
      const auth = await activarRol({ rol: 'CLIENTE' })
      iniciar(auth, 'CLIENTE')
      showToast('Perfil cliente activado.', 'success')
      setMostrandoCambioPerfil(false)
      navigate('/cliente')
    } catch (err) {
      showToast(extraerError(err), 'error')
    } finally {
      setActivandoPerfil(false)
    }
  }

  const responderInvitacionProfesional = async (asignacionId: string, accion: 'aceptar' | 'rechazar') => {
    if (!usuario) return
    try {
      setRespondiendoInvitacion(true)
      const actualizada = accion === 'aceptar'
        ? await aceptarProfesionalAsistente(usuario.id, asignacionId)
        : await rechazarProfesionalAsistente(usuario.id, asignacionId)
      setProfesionales((actuales) => actuales.map((a) => (a.id === actualizada.id ? actualizada : a)))
      if (accion === 'aceptar') {
        void getTurnosDeAsistente(usuario.id).then(setTurnos).catch(() => undefined)
      }
      setInvitacionProfesional(null)
      setPidiendoPasswordInvitacion(false)
      setPasswordInvitacion('')
      showToast(accion === 'aceptar' ? 'Profesional aceptado' : 'Invitacion rechazada', 'success')
    } catch (err) {
      showToast(extraerError(err), 'error')
    } finally {
      setRespondiendoInvitacion(false)
    }
  }

  const cerrarInvitacionProfesional = () => {
    if (respondiendoInvitacion) return
    setInvitacionProfesional(null)
    setPidiendoPasswordInvitacion(false)
    setPasswordInvitacion('')
  }

  const confirmarInvitacionConPassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!usuario || !invitacionProfesional || invitacionProfesional.accion !== 'aceptar') return
    if (!passwordInvitacion.trim()) {
      showToast('Ingresa tu contraseña', 'error')
      return
    }
    try {
      setRespondiendoInvitacion(true)
      await validarLogin({ email: usuario.email, password: passwordInvitacion.trim() })
      await responderInvitacionProfesional(invitacionProfesional.asignacion.id, 'aceptar')
    } catch (err) {
      showToast(mensajePasswordIncorrecta(err), 'error')
      setRespondiendoInvitacion(false)
    }
  }

  const cerrarDesvinculacionProfesional = () => {
    if (desvinculandoProfesional) return
    setProfesionalADesvincular(null)
    setPidiendoPasswordDesvinculacion(false)
    setPasswordDesvinculacion('')
  }

  const confirmarDesvinculacionProfesional = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!usuario || !profesionalADesvincular) return
    if (!passwordDesvinculacion.trim()) {
      showToast('Ingresa tu contraseña', 'error')
      return
    }
    try {
      setDesvinculandoProfesional(true)
      await validarLogin({ email: usuario.email, password: passwordDesvinculacion.trim() })
      await desasignarAsistente(profesionalADesvincular.id)
      setProfesionales((actuales) => actuales.filter((p) => p.id !== profesionalADesvincular.id))
      void getTurnosDeAsistente(usuario.id).then(setTurnos).catch(() => undefined)
      setProfesionalADesvincular(null)
      setPidiendoPasswordDesvinculacion(false)
      setPasswordDesvinculacion('')
      showToast('Te desvinculaste del profesional', 'success')
    } catch (err) {
      showToast(mensajePasswordIncorrecta(err), 'error')
    } finally {
      setDesvinculandoProfesional(false)
    }
  }

  if (!usuario) return null

  return (
    <div className="min-h-screen bg-fondo text-texto-principal">
      <header className="sticky top-0 z-40 border-b border-[#BBD7FF] bg-[#EAF2FF]/95 text-[#111827] shadow-sm backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 xl:px-10">
          <Link to="/asistente" className="flex min-w-0 items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primario text-white">
              <IconCalendar className="h-5 w-5" />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-xl font-black text-[#111827]">Agendify</span>
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-texto-secundario">Asistente</span>
            </span>
          </Link>
          <nav className="order-3 -mx-1 flex w-full justify-center gap-2 overflow-x-auto pb-1 text-sm font-semibold text-texto-secundario lg:order-none lg:mx-0 lg:w-auto lg:items-center lg:overflow-visible lg:pb-0">
            {navItems.map((item) => {
              const visibleEnMobile = navMobilePrincipal.has(item.seccion)
              return (
                <NavLink
                  key={item.seccion}
                  to={pathDeSeccion(item)}
                  end={item.seccion === 'dashboard'}
                  className={({ isActive }) =>
                    `${visibleEnMobile ? 'flex' : 'hidden lg:flex'} shrink-0 rounded-lg px-3 py-2 ${isActive ? 'bg-primario text-white' : 'hover:bg-white hover:text-primario'}`
                  }
                >
                  {item.label}
                </NavLink>
              )
            })}
          </nav>
          <div ref={menuUsuarioRef} className="relative">
            <button onClick={() => setMenuUsuarioAbierto((v) => !v)} className="flex items-center gap-3 rounded-full border border-[#BBD7FF] bg-[#F3F7FF] px-2 py-1.5 shadow-sm hover:bg-white">
              <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-primario text-sm font-black text-white">
                {usuario.urlAvatar ? (
                  <img src={usuario.urlAvatar} alt={usuario.nombreCompleto} className="h-full w-full object-cover" />
                ) : (
                  inicialesAsistente || 'A'
                )}
              </span>
              <svg className={`h-4 w-4 text-texto-secundario transition-transform ${menuUsuarioAbierto ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
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
          <section className="grid items-start gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <article className="order-2 rounded-lg border border-borde-suave bg-white p-6 shadow-sm xl:p-7">
              <div>
                <div>
                  <h2 className="text-2xl font-black text-texto-principal">Proximos turnos</h2>
                  <p className="text-sm text-texto-secundario">Agenda operativa con tus reservas futuras.</p>
                </div>
              </div>
              <div className="mt-5 grid gap-4">
                {turnosProximos.map((t) => (
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
                        <span className="text-[11px] font-bold uppercase text-texto-suave">Profesional</span>
                        <p className="mt-1 text-sm font-semibold text-texto-principal">{t.profesionalNombre}</p>
                      </div>
                      <div>
                        <span className="text-[11px] font-bold uppercase text-texto-suave">Cliente</span>
                        <p className="mt-1 text-sm font-semibold text-texto-principal">{t.clienteNombre}</p>
                      </div>
                      <div>
                        <span className="text-[11px] font-bold uppercase text-texto-suave">Motivo</span>
                        <p className="mt-1 text-sm font-semibold text-texto-principal">{t.notas || `${t.duracionMinutos} min`}</p>
                      </div>
                    </div>
                  </article>
                ))}
                {turnosProximos.length === 0 && <p className="text-sm text-texto-secundario">Sin proximos turnos.</p>}
              </div>
            </article>

            <article className="order-1 rounded-lg border border-borde-suave bg-white p-6 shadow-sm xl:p-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-black text-texto-principal">Calendario</h2>
                  <p className="text-sm text-texto-secundario">Vista de turnos asignados.</p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="inline-flex rounded-xl border border-borde bg-fondo p-1">
                    {(['dia', 'semana', 'mes'] as const).map((vista) => (
                      <button
                        key={vista}
                        type="button"
                        onClick={() => setVistaCalendario(vista)}
                        className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
                          vistaCalendario === vista ? 'bg-white text-primario shadow-sm' : 'text-texto-secundario hover:text-texto-principal'
                        }`}
                      >
                        {vista === 'dia' ? 'Dia' : vista === 'semana' ? 'Semana' : 'Mes'}
                      </button>
                    ))}
                  </div>
                  <Input type="date" value={fechaCalendario} onClick={(e) => abrirCalendario(e.currentTarget)} onChange={(e) => setFechaCalendario(e.target.value)} className="sm:w-[190px]" />
                </div>
              </div>

              {vistaCalendario === 'mes' && (
                <>
                  <div className="mt-5 grid grid-cols-7 gap-2 text-center text-xs font-bold uppercase text-texto-secundario">
                    {['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'].map((d) => <span key={d}>{d}</span>)}
                  </div>
                  <div className="mt-2 grid grid-cols-7 gap-2">
                    {diasMes.map((dia) => {
                      const fechaIso = dia.toISOString().slice(0, 10)
                      const turnosDia = turnosPorFecha[fechaIso] ?? []
                      const esMes = dia.getMonth() === fechaSeleccionada.getMonth()
                      const sel = fechaIso === fechaCalendario
                      return (
                        <button
                          key={fechaIso}
                          type="button"
                          onClick={() => setFechaCalendario(fechaIso)}
                          className={`min-h-[68px] rounded-lg border p-1.5 text-left sm:min-h-[86px] sm:p-2 ${
                            sel ? 'border-primario bg-primario-claro' : 'border-borde bg-fondo hover:border-primario-suave hover:bg-white'
                          } ${esMes ? 'opacity-100' : 'opacity-45'}`}
                        >
                          <span className="text-xs font-black text-texto-principal sm:text-sm">{dia.getDate()}</span>
                          <div className="mt-2 grid gap-1">
                            {turnosDia.slice(0, 2).map((t) => (
                              <span key={t.id} className="truncate rounded bg-white px-1 py-0.5 text-[10px] font-bold text-primario sm:px-1.5 sm:py-1 sm:text-[11px]">
                                {horaDe(t)} {t.profesionalNombre.split(' ')[0]}
                              </span>
                            ))}
                            {turnosDia.length > 2 && <span className="text-[11px] font-bold text-texto-secundario">+{turnosDia.length - 2} mas</span>}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </>
              )}

              {vistaCalendario === 'semana' && (
                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
                  {diasSemana.map((dia) => {
                    const fechaIso = dia.toISOString().slice(0, 10)
                    const turnosDia = turnosPorFecha[fechaIso] ?? []
                    return (
                      <button
                        key={fechaIso}
                        type="button"
                        onClick={() => setFechaCalendario(fechaIso)}
                        className={`rounded-2xl border p-4 text-left transition-colors ${
                          fechaIso === fechaCalendario ? 'border-primario bg-primario-claro' : 'border-borde bg-fondo hover:border-primario-suave hover:bg-white'
                        }`}
                      >
                        <p className="text-xs font-bold uppercase text-texto-secundario">{dia.toLocaleDateString('es-PY', { weekday: 'short' })}</p>
                        <p className="mt-1 text-2xl font-black text-texto-principal">{dia.getDate()}</p>
                        <div className="mt-4 space-y-2">
                          {turnosDia.length > 0 ? turnosDia.map((t) => (
                            <div key={t.id} className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-texto-principal">
                              {horaDe(t)} - {t.profesionalNombre.split(' ')[0]}
                            </div>
                          )) : <p className="text-xs text-texto-suave">Sin turnos</p>}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {vistaCalendario === 'dia' && (
                <div className="mt-5 rounded-2xl border border-borde bg-fondo p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-texto-secundario">Dia seleccionado</p>
                  <h3 className="mt-1 text-2xl font-black text-texto-principal">{fechaDiaSeleccionado(fechaCalendario)}</h3>
                  <div className="mt-5 space-y-3">
                    {turnosFechaSeleccionada.length > 0 ? turnosFechaSeleccionada.map((t) => (
                      <article key={t.id} className="rounded-2xl border border-borde bg-white p-5 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-xs font-bold uppercase text-texto-suave">Fecha y hora</p>
                            <p className="mt-1 font-black text-texto-principal">{fechaCortaDe(t)} - {horaDe(t)}</p>
                          </div>
                          <span className={`shrink-0 rounded-lg border px-3 py-1 text-sm font-bold ${estadoClass[t.estado]}`}>{estadoLabel[t.estado]}</span>
                        </div>
                        <div className="mt-5 grid gap-4 sm:grid-cols-3">
                          <div>
                            <p className="text-xs font-bold uppercase text-texto-suave">Profesional</p>
                            <p className="mt-1 font-bold text-texto-principal">{t.profesionalNombre}</p>
                          </div>
                          <div>
                            <p className="text-xs font-bold uppercase text-texto-suave">Cliente</p>
                            <p className="mt-1 font-bold text-texto-principal">{t.clienteNombre}</p>
                          </div>
                          <div>
                            <p className="text-xs font-bold uppercase text-texto-suave">Motivo</p>
                            <p className="mt-1 font-bold text-texto-principal">{t.notas || 'Sin notas'}</p>
                          </div>
                        </div>
                      </article>
                    )) : <p className="text-sm text-texto-secundario">Sin turnos para este dia.</p>}
                  </div>
                </div>
              )}

            </article>
          </section>
        )}

        {seccionActual === 'agenda' && (
          <>
            <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
              <article className="rounded-lg border border-borde-suave bg-white p-6 shadow-sm xl:p-7">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-black text-texto-principal">Configuraciones horarias</h2>
                    <p className="text-sm text-texto-secundario">Administra la disponibilidad del profesional seleccionado.</p>
                  </div>
                  <div className="w-full sm:max-w-[260px]">
                    <Label>Profesional</Label>
                    <Select value={filtrosAgenda.profesionalId} onChange={(e) => setFiltrosAgenda({ ...filtrosAgenda, profesionalId: e.target.value })}>
                      {profesionalesAceptados.map((p) => <option key={p.profesionalId} value={p.profesionalId}>{p.profesionalNombre}</option>)}
                    </Select>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {!agendaSeleccionada && (
                    <p className="rounded-lg border border-dashed border-borde bg-fondo px-4 py-6 text-center text-sm text-texto-secundario">
                      El profesional seleccionado no tiene agenda activa.
                    </p>
                  )}
                  {agendaSeleccionada && diasOrden.map((dia) => {
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
                          {configuracionesDia.map((grupo) => (
                            <div key={`${grupo.diaSemana}-${grupo.duracionSlotMinutos}`} className="rounded-lg border border-borde bg-white p-3">
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <p className="text-xs font-bold text-texto-secundario">
                                  Cada {grupo.duracionSlotMinutos} min
                                </p>
                                {grupo.configuraciones.some((configuracion) => configuracion.id) && (
                                  <button
                                    type="button"
                                    onClick={() => setEliminacionDisponibilidad({ tipo: 'grupo', grupo })}
                                    className="w-fit text-xs font-bold text-peligro hover:underline"
                                  >
                                    Eliminar bloque
                                  </button>
                                )}
                              </div>
                              <div className="mt-3 flex flex-wrap gap-2">
                                {grupo.horarios.map(({ horario, configuracion }) => (
                                  <button
                                    key={`${configuracion.id}-${horario}`}
                                    type="button"
                                    onClick={() => setEliminacionDisponibilidad({ tipo: 'horario', configuracion, horario })}
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

              <form onSubmit={onAgregarDisponibilidad} className="rounded-lg border border-borde-suave bg-white p-6 shadow-sm xl:p-7">
                <h2 className="text-2xl font-black text-texto-principal">Agregar disponibilidad</h2>
                <p className="text-sm text-texto-secundario">Suma nuevos bloques horarios al profesional seleccionado.</p>
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
                    <Input type="time" value={disponibilidad.inicio} onChange={(e) => setDisponibilidad({ ...disponibilidad, inicio: e.target.value })} />
                  </div>
                  <div>
                    <Label>Hora fin</Label>
                    <Input type="time" value={disponibilidad.fin} onChange={(e) => setDisponibilidad({ ...disponibilidad, fin: e.target.value })} />
                  </div>
                  <BotonPrimario type="submit" className="w-fit justify-self-end md:col-span-2" disabled={!agendaSeleccionada}>
                    Agregar
                  </BotonPrimario>
                </div>
              </form>
            </section>

            <section className="rounded-lg border border-borde-suave bg-white p-6 shadow-sm xl:p-7">
              <div className="flex flex-col gap-5">
                <div>
                  <h2 className="text-2xl font-black text-texto-principal">Agenda asignada</h2>
                  <p className="text-sm text-texto-secundario">Filtra por profesional y rango de fechas.</p>
                </div>
                <div className="grid gap-3 lg:grid-cols-4 xl:max-w-5xl">
                  <div>
                    <Label>Profesional</Label>
                    <Select value={filtrosAgenda.profesionalId} onChange={(e) => setFiltrosAgenda({ ...filtrosAgenda, profesionalId: e.target.value })}>
                      {profesionalesAceptados.map((p) => <option key={p.profesionalId} value={p.profesionalId}>{p.profesionalNombre}</option>)}
                    </Select>
                  </div>
                  <div>
                    <Label>Mail del cliente</Label>
                    <Input value={filtrosAgenda.clienteEmail} onChange={(e) => setFiltrosAgenda({ ...filtrosAgenda, clienteEmail: e.target.value })} placeholder="cliente@gmail.com" />
                  </div>
                  <div>
                    <Label>Desde</Label>
                    <div className="relative">
                      <Input type="date" value={filtrosAgenda.fechaDesde} onClick={(e) => abrirCalendario(e.currentTarget)} onChange={(e) => setFiltrosAgenda({ ...filtrosAgenda, fechaDesde: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <Label>Hasta</Label>
                    <div className="relative">
                      <Input type="date" value={filtrosAgenda.fechaHasta} onClick={(e) => abrirCalendario(e.currentTarget)} onChange={(e) => setFiltrosAgenda({ ...filtrosAgenda, fechaHasta: e.target.value })} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-4 xl:grid-cols-2">
                {turnosAgenda.map((t) => (
                  <article key={t.id} className="rounded-lg border border-borde bg-fondo p-5 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-black text-texto-principal">{t.clienteNombre}</h3>
                      </div>
                      <span className={`rounded-lg border px-3 py-1 text-sm font-bold ${estadoClass[t.estado]}`}>{estadoLabel[t.estado]}</span>
                    </div>
                    <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <div>
                        <p className="text-xs font-bold uppercase text-texto-secundario">Profesional</p>
                        <p className="mt-1 text-sm font-semibold text-texto-principal">{t.profesionalNombre}</p>
                      </div>
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
                {turnosAgenda.length === 0 && (
                  <p className="rounded-lg border border-dashed border-borde bg-fondo px-4 py-6 text-center text-sm text-texto-secundario xl:col-span-2">Sin turnos.</p>
                )}
              </div>
            </section>
          </>
        )}

        {seccionActual === 'turnos' && (
          <>
            <section className="grid gap-6 xl:grid-cols-2">
              <form onSubmit={onCrearTurno} className="rounded-lg border border-borde-suave bg-white p-6 shadow-sm xl:col-span-2 xl:p-7">
                <h2 className="text-2xl font-black text-texto-principal">Asignar turno</h2>
                <p className="text-sm text-texto-secundario">Registra un turno para un cliente registrado o no registrado.</p>
                <div className="mt-6 grid gap-4 rounded-lg border border-borde bg-fondo p-4 lg:grid-cols-4">
                  <div className="lg:max-w-[270px]">
                    <Label>Profesional</Label>
                    <Select value={turnoNuevo.profesionalId} onChange={(e) => setTurnoNuevo({ ...turnoNuevo, profesionalId: e.target.value, notas: '', horario: '' })}>
                      {profesionalesAceptados.map((p) => <option key={p.profesionalId} value={p.profesionalId}>{p.profesionalNombre}</option>)}
                    </Select>
                  </div>
                  <div className="lg:col-span-4">
                    <Label>Tipo de cliente</Label>
                    <div className="mt-2 inline-flex rounded-xl border border-borde bg-white p-1">
                      {(['registrado', 'externo'] as const).map((tipo) => (
                        <button
                          key={tipo}
                          type="button"
                          onClick={() => setTurnoNuevo({
                            ...turnoNuevo,
                            tipoCliente: tipo,
                            clienteEmail: '',
                            clienteExternoNombre: '',
                            clienteExternoTelefono: '',
                            clienteExternoDni: '',
                            clienteExternoEmail: '',
                          })}
                          className={`rounded-lg px-4 py-2 text-sm font-bold ${turnoNuevo.tipoCliente === tipo ? 'bg-primario text-white' : 'text-texto-secundario hover:bg-primario-claro hover:text-primario'}`}
                        >
                          {tipo === 'registrado' ? 'Cliente registrado' : 'Cliente no registrado'}
                        </button>
                      ))}
                    </div>
                  </div>
                  {turnoNuevo.tipoCliente === 'registrado' ? (
                    <div className="lg:max-w-[270px]">
                      <Label>Email del cliente</Label>
                      <Input
                        type="email"
                        value={turnoNuevo.clienteEmail}
                        onChange={(e) => setTurnoNuevo({ ...turnoNuevo, clienteEmail: e.target.value })}
                        placeholder="cliente@gmail.com"
                      />
                    </div>
                  ) : (
                    <>
                      <div className="lg:max-w-[270px]"><Label>Nombre completo</Label><Input value={turnoNuevo.clienteExternoNombre} onChange={(e) => setTurnoNuevo({ ...turnoNuevo, clienteExternoNombre: e.target.value })} /></div>
                      <div className="lg:row-start-4 lg:max-w-[270px]"><Label>Telefono</Label><Input value={turnoNuevo.clienteExternoTelefono} onChange={(e) => setTurnoNuevo({ ...turnoNuevo, clienteExternoTelefono: e.target.value })} /></div>
                      <div className="lg:row-start-4 lg:max-w-[270px]"><Label>DNI</Label><Input value={turnoNuevo.clienteExternoDni} onChange={(e) => setTurnoNuevo({ ...turnoNuevo, clienteExternoDni: e.target.value })} /></div>
                      <div className="lg:row-start-4 lg:max-w-[270px]"><Label>Email opcional</Label><Input value={turnoNuevo.clienteExternoEmail} onChange={(e) => setTurnoNuevo({ ...turnoNuevo, clienteExternoEmail: e.target.value })} /></div>
                    </>
                  )}
                  <div className={`lg:col-span-2 lg:max-w-[560px] ${turnoNuevo.tipoCliente === 'registrado' ? 'lg:row-start-4' : 'lg:row-start-5'}`}>
                    <Label>Servicio</Label>
                    <div className="rounded-xl border border-borde bg-white p-2">
                      <Select
                        value={turnoNuevo.notas}
                        onChange={(e) => setTurnoNuevo({ ...turnoNuevo, notas: e.target.value })}
                        disabled={serviciosTurnoNuevo.length === 0}
                        className="border-0 bg-transparent focus:ring-0"
                      >
                        <option value="">{serviciosTurnoNuevo.length === 0 ? 'Sin servicios cargados' : 'Selecciona un servicio'}</option>
                        {serviciosTurnoNuevo.map((servicio) => (
                          <option key={servicio.nombre} value={servicio.nombre}>{servicio.nombre}</option>
                        ))}
                      </Select>
                      <div className="mt-2 flex items-center justify-between rounded-lg bg-fondo px-3 py-2 text-sm">
                        <span className="font-semibold text-texto-secundario">Precio del servicio</span>
                        <span className={`font-black ${servicioTurnoNuevoSeleccionado ? 'text-primario' : 'text-texto-suave'}`}>
                          {servicioTurnoNuevoSeleccionado ? formatPrecio(servicioTurnoNuevoSeleccionado.precio) : 'Selecciona un servicio'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className={`lg:max-w-[270px] ${turnoNuevo.tipoCliente === 'registrado' ? 'lg:row-start-5' : 'lg:row-start-6'}`}>
                    <Label>Fecha</Label>
                    <div className="relative">
                      <Input type="date" value={turnoNuevo.fecha} onClick={(e) => abrirCalendario(e.currentTarget)} onChange={(e) => setTurnoNuevo({ ...turnoNuevo, fecha: e.target.value })} />
                    </div>
                  </div>
                  <div className={`lg:col-span-2 lg:max-w-[560px] ${turnoNuevo.tipoCliente === 'registrado' ? 'lg:row-start-5' : 'lg:row-start-6'}`}>
                    <Label>Horario</Label>
                    <div className="mt-2 flex min-h-[52px] flex-wrap gap-2">
                      {!turnoNuevo.fecha && (
                        <span className="px-2 py-2 text-sm text-texto-secundario">Selecciona una fecha</span>
                      )}
                      {turnoNuevo.fecha && slotsReservablesTurnoNuevo.length === 0 && (
                        <span className="px-2 py-2 text-sm text-texto-secundario">Sin horarios disponibles.</span>
                      )}
                      {slotsReservablesTurnoNuevo.map((slot) => {
                        const hora = horaDe(slot)
                        return (
                          <button
                            key={slot.iniciaEn}
                            type="button"
                            onClick={() => setTurnoNuevo({ ...turnoNuevo, horario: hora })}
                            className={`rounded-lg border px-3 py-2 text-sm font-bold ${
                              turnoNuevo.horario === hora
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
                  <div className={`flex justify-end lg:col-span-4 ${turnoNuevo.tipoCliente === 'registrado' ? 'lg:row-start-6' : 'lg:row-start-7'}`}>
                    <span className={!puedeAsignarTurno ? 'cursor-not-allowed' : ''} title={!puedeAsignarTurno ? 'Necesitas completar todos los campos' : undefined}>
                      <BotonPrimario
                        type="submit"
                        className={`min-w-[220px] ${!puedeAsignarTurno ? 'pointer-events-none' : ''}`}
                        disabled={!puedeAsignarTurno}
                      >
                        Asignar
                      </BotonPrimario>
                    </span>
                  </div>
                </div>
              </form>

              <div className="grid gap-6 xl:col-span-2">
                <form onSubmit={onModificarTurno} className="rounded-lg border border-borde-suave bg-white p-6 shadow-sm xl:p-7">
                  <h2 className="text-2xl font-black text-texto-principal">Modificar turno</h2>
                  <div className="mt-6 grid gap-4 rounded-lg border border-borde bg-fondo p-4 lg:grid-cols-4">
                    <div className="lg:max-w-[270px]">
                      <Label>Seleccionar turno</Label>
                      <Select value={turnoEditarId} onChange={(e) => setTurnoEditarId(e.target.value)}>
                        <option value="">Seleccionar...</option>
                        {turnos.filter(turnoAccionable).map((t) => (
                          <option key={t.id} value={t.id}>{fechaCortaDe(t)} - {horaDe(t)} | {t.profesionalNombre}</option>
                        ))}
                      </Select>
                    </div>
                    <div className="lg:max-w-[270px]"><Label>Fecha</Label><Input type="date" value={turnoEditar.fecha} onClick={(e) => abrirCalendario(e.currentTarget)} onChange={(e) => setTurnoEditar({ ...turnoEditar, fecha: e.target.value })} /></div>
                    <div className="lg:col-span-2">
                      <Label>Horario</Label>
                      <div className="mt-2 flex min-h-[52px] flex-wrap gap-2">
                        {!turnoEditar.fecha && (
                          <span className="px-2 py-2 text-sm text-texto-secundario">Selecciona una fecha</span>
                        )}
                        {turnoEditar.fecha && horariosTurnoEditar.length === 0 && (
                          <span className="px-2 py-2 text-sm text-texto-secundario">Sin horarios disponibles.</span>
                        )}
                        {horariosTurnoEditar.map((hora) => (
                          <button
                            key={hora}
                            type="button"
                            onClick={() => setTurnoEditar({ ...turnoEditar, horario: hora })}
                            className={`rounded-lg border px-3 py-2 text-sm font-bold ${
                              turnoEditar.horario === hora
                                ? 'border-primario bg-primario text-white'
                                : 'border-primario-suave bg-primario-claro text-primario'
                            }`}
                          >
                            {hora}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="lg:col-span-2 lg:max-w-[560px]"><Label>Notas</Label><Textarea rows={3} value={turnoEditar.notas} onChange={(e) => setTurnoEditar({ ...turnoEditar, notas: e.target.value })} /></div>
                    <div className="flex justify-end lg:col-span-4">
                      <span className={!puedeModificarTurno ? 'cursor-not-allowed' : ''} title={mensajeModificarTurnoInhabilitado}>
                        <BotonPrimario
                          type="submit"
                          className={`min-w-[220px] ${!puedeModificarTurno ? 'pointer-events-none' : ''}`}
                          disabled={!puedeModificarTurno}
                        >
                          Actualizar turno
                        </BotonPrimario>
                      </span>
                    </div>
                  </div>
                </form>

              </div>
            </section>
          </>
        )}

        {seccionActual === 'clientes' && (
          <section className="bg-transparent p-0 shadow-none sm:rounded-lg sm:border sm:border-borde-suave sm:bg-white sm:p-6 sm:shadow-sm xl:p-7">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <h2 className="text-2xl font-black text-texto-principal">Clientes</h2>
                <p className="text-sm text-texto-secundario">Personas con turnos en agendas asignadas.</p>
              </div>
              <div className="w-full xl:max-w-sm">
                <Label>Buscar por mail</Label>
                <Input value={busquedaCliente} onChange={(e) => setBusquedaCliente(e.target.value)} placeholder="Ej: cliente@gmail.com" />
              </div>
            </div>
            <div className="mt-6 grid gap-4 xl:grid-cols-2">
              {clientesFiltrados.map((c) => {
                const { proximoTurno, historial } = dividirTurnosCliente(c.turnos)
                return (
                  <article key={c.id} className="rounded-lg border border-borde bg-fondo p-5">
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
                            <div>
                              <p className="text-xs font-bold uppercase text-texto-secundario">Profesional</p>
                              <p className="mt-1 text-sm font-semibold text-texto-principal">{proximoTurno.profesionalNombre}</p>
                            </div>
                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                              <div>
                                <p className="text-xs font-bold uppercase text-texto-secundario">Fecha</p>
                                <p className="mt-1 text-sm text-texto-principal">{fechaIsoDe(proximoTurno)}</p>
                              </div>
                              <div>
                                <p className="text-xs font-bold uppercase text-texto-secundario">Horario</p>
                                <p className="mt-1 text-sm text-texto-principal">{horaDe(proximoTurno)}</p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p className="mt-2 rounded-lg border border-dashed border-borde bg-white px-3 py-3 text-sm text-texto-secundario">Sin proximos turnos.</p>
                        )}
                      </div>
                      <div>
                      <span className="text-xs font-bold uppercase text-texto-secundario">Ultimos turnos</span>
                      <div className="mt-2 grid gap-2">
                      {historial.slice(0, 2).map((t) => (
                        <div key={t.id} className="rounded-lg border border-borde-suave bg-white px-3 py-2">
                          <div>
                            <p className="text-xs font-bold uppercase text-texto-secundario">Profesional</p>
                            <p className="mt-1 text-sm font-semibold text-texto-principal">{t.profesionalNombre}</p>
                          </div>
                          <div className="text-sm text-texto-secundario">
                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                              <div>
                                <span className="block text-xs font-bold uppercase text-texto-secundario">Fecha</span>
                                <span className="mt-1 block text-sm text-texto-principal">{fechaIsoDe(t)}</span>
                              </div>
                              <div>
                                <span className="block text-xs font-bold uppercase text-texto-secundario">Horario</span>
                                <span className="mt-1 block text-sm text-texto-principal">{horaDe(t)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      </div>
                      {historial.length === 0 && (
                        <p className="mt-2 rounded-lg border border-dashed border-borde bg-white px-3 py-3 text-sm text-texto-secundario">Sin historial.</p>
                      )}
                      {historial.length > 2 && (
                        <button type="button" onClick={() => navigate('/asistente/historial')} className="mt-2 text-sm font-bold text-primario hover:underline">
                          Ver historial completo
                        </button>
                      )}
                      </div>
                    </div>
                  </article>
                )
              })}
              {clientesFiltrados.length === 0 && <p className="text-sm text-texto-secundario">Sin clientes.</p>}
            </div>
          </section>
        )}

        {seccionActual === 'profesionales' && (
          <section className="rounded-lg border border-borde-suave bg-white p-6 shadow-sm xl:p-7">
            <h2 className="text-2xl font-black text-texto-principal">Profesionales</h2>
            <p className="text-sm text-texto-secundario">Revisa las invitaciones y profesionales vinculados a tu cuenta.</p>

            <div className="mt-6 grid gap-4 xl:grid-cols-2">
              {profesionales.map((p) => (
                <article key={p.id} className="mx-auto w-full max-w-[320px] rounded-lg border border-borde bg-white p-4 shadow-sm sm:max-w-none">
                  <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primario/10 text-sm font-black text-primario">
                          {p.profesionalAvatarUrl ? (
                            <img src={p.profesionalAvatarUrl} alt={p.profesionalNombre} className="h-full w-full object-cover" />
                          ) : (
                            inicialesDe(p.profesionalNombre) || 'P'
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate text-lg font-black text-texto-principal">{p.profesionalNombre}</h3>
                          <p className="text-sm font-semibold text-texto-secundario">{p.profesionalEspecialidad}</p>
                        </div>
                      </div>
                      <span className={`shrink-0 rounded-lg border px-3 py-1 text-sm font-bold ${estadoAsignacionClass[p.estado]}`}>
                        {estadoAsignacionLabel[p.estado]}
                      </span>
                  </div>

                  {p.estado === 'PENDIENTE' && (
                    <div className="mt-5 flex flex-wrap justify-end gap-3">
                        <BotonSecundario type="button" className="h-11 w-28" onClick={() => setInvitacionProfesional({ asignacion: p, accion: 'rechazar' })}>
                          Rechazar
                        </BotonSecundario>
                        <BotonPrimario type="button" className="h-11 w-28" onClick={() => setInvitacionProfesional({ asignacion: p, accion: 'aceptar' })}>
                          Aceptar
                        </BotonPrimario>
                    </div>
                  )}

                  {p.estado === 'ACEPTADA' && (
                    <div className="mt-5 flex flex-wrap justify-end">
                        <button
                          type="button"
                          onClick={() => setProfesionalADesvincular(p)}
                          className="h-11 rounded-lg border border-red-200 px-5 text-sm font-bold text-peligro transition hover:bg-red-50"
                        >
                          Desvincularme
                        </button>
                    </div>
                  )}
                </article>
              ))}
              {profesionales.length === 0 && (
                <p className="rounded-lg border border-dashed border-borde bg-fondo px-4 py-6 text-center text-sm text-texto-secundario xl:col-span-2">
                  Todavia no tenes invitaciones de profesionales.
                </p>
              )}
            </div>
          </section>
        )}

        {seccionActual === 'perfil' && (
          <section className="rounded-lg border border-borde-suave bg-white p-6 shadow-sm xl:p-7">
            <h2 className="text-2xl font-black text-texto-principal">Mi perfil</h2>
            <p className="text-sm text-texto-secundario">Actualiza tus datos personales y foto de perfil.</p>

            <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(420px,1fr)]">
              <form onSubmit={guardarPerfil} className="rounded-lg border border-borde bg-fondo p-5">
                <h3 className="text-sm font-black text-texto-principal">Datos personales</h3>
                <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[18px] bg-primario text-2xl font-black text-white">
                    {perfilForm.urlAvatar ? (
                      <img src={perfilForm.urlAvatar} alt={perfilForm.nombreCompleto} className="h-full w-full object-cover" />
                    ) : (
                      inicialesAsistente || 'A'
                    )}
                  </div>
                  <div className="flex-1">
                    <Label>URL de foto</Label>
                    <Input value={perfilForm.urlAvatar} onChange={(e) => setPerfilForm({ ...perfilForm, urlAvatar: e.target.value })} placeholder="https://..." />
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div><Label>Nombre completo</Label><Input value={perfilForm.nombreCompleto} onChange={(e) => setPerfilForm({ ...perfilForm, nombreCompleto: e.target.value })} /></div>
                  <div><Label>Telefono</Label><Input value={perfilForm.telefono} onChange={(e) => setPerfilForm({ ...perfilForm, telefono: e.target.value })} /></div>
                </div>

                <div className="mt-5 flex justify-end">
                  <span className={`inline-flex ${!perfilTieneCambios ? 'cursor-not-allowed' : ''}`} title={!perfilTieneCambios ? 'Realiza al menos un cambio para guardar' : undefined}>
                    <BotonPrimario type="submit" disabled={!perfilTieneCambios} className={!perfilTieneCambios ? 'pointer-events-none' : ''}>Guardar cambios</BotonPrimario>
                  </span>
                </div>
              </form>

              <aside className="flex min-h-[240px] flex-col rounded-lg border border-borde bg-fondo p-6">
                <p className="text-sm font-black text-texto-principal">Perfil actual</p>
                <div className="mt-8">
                  <span className="inline-flex w-fit rounded-lg border border-emerald-200 bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-700">Asistente activo</span>
                  <p className="mt-8 max-w-[340px] text-sm leading-relaxed text-texto-secundario">
                    Estas usando tu cuenta como asistente.
                    <br />
                    Podes cambiar al perfil cliente cuando necesites reservar turnos.
                  </p>
                </div>
                <BotonPrimario type="button" onClick={() => setMostrandoCambioPerfil(true)} disabled={activandoPerfil} className="mt-8 w-full">
                  {usuario.roles.includes('CLIENTE') && usuario.perfilClienteId != null ? 'Cambiar a cliente' : 'Activar cliente'}
                </BotonPrimario>
              </aside>
            </div>
          </section>
        )}

        {seccionActual === 'historial' && (
          <section className="rounded-lg border border-borde-suave bg-white p-6 shadow-sm xl:p-7">
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-2xl font-black text-texto-principal">Historial de turnos</h2>
                <p className="text-sm text-texto-secundario">Turnos pasados y actuales en agendas asignadas.</p>
              </div>
              <div className="grid gap-3 lg:grid-cols-5 xl:max-w-6xl">
                <div>
                  <Label>Profesional</Label>
                  <Select value={filtrosHistorial.profesionalId} onChange={(e) => setFiltrosHistorial({ ...filtrosHistorial, profesionalId: e.target.value })}>
                    <option value="Todos">Todos</option>
                    {profesionalesAceptados.map((p) => <option key={p.profesionalId} value={p.profesionalId}>{p.profesionalNombre}</option>)}
                  </Select>
                </div>
                <div>
                  <Label>Mail del cliente</Label>
                  <Input value={filtrosHistorial.clienteEmail} onChange={(e) => setFiltrosHistorial({ ...filtrosHistorial, clienteEmail: e.target.value })} placeholder="cliente@gmail.com" />
                </div>
                <div><Label>Fecha</Label><Input type="date" value={filtrosHistorial.fecha} onClick={(e) => abrirCalendario(e.currentTarget)} onChange={(e) => setFiltrosHistorial({ ...filtrosHistorial, fecha: e.target.value })} /></div>
                <div>
                  <Label>Estado</Label>
                  <Select value={filtrosHistorial.estado} onChange={(e) => setFiltrosHistorial({ ...filtrosHistorial, estado: e.target.value as typeof filtrosHistorial.estado })}>
                    <option value="Todos">Todos</option>
                    <option value="CONFIRMADO">Confirmado</option>
                    <option value="CANCELADO">Cancelado</option>
                  </Select>
                </div>
                <BotonSecundario
                  type="button"
                  className="self-end whitespace-nowrap"
                  onClick={() => setFiltrosHistorial({ profesionalId: 'Todos', clienteEmail: '', fecha: '', estado: 'Todos' })}
                >
                  Limpiar filtros
                </BotonSecundario>
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:hidden">
              {historialFiltrado.map((t) => (
                <article key={t.id} className="rounded-lg border border-borde bg-fondo p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-black text-texto-principal">{t.clienteNombre}</h3>
                      <p className="mt-1 text-sm font-semibold text-texto-secundario">{t.profesionalNombre}</p>
                    </div>
                    <span className={`shrink-0 rounded-lg border px-2.5 py-1 text-xs font-bold ${estadoClass[t.estado]}`}>
                      {estadoLabel[t.estado]}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
                    <div>
                      <span className="text-[11px] font-bold uppercase text-texto-suave">Fecha</span>
                      <p className="mt-0.5 text-sm font-black text-texto-principal">{fechaDiaSeleccionado(fechaIsoDe(t))}</p>
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase text-texto-suave">Horario</span>
                      <p className="mt-0.5 text-sm font-black text-texto-principal">{horaDe(t)}</p>
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase text-texto-suave">Duracion</span>
                      <p className="mt-0.5 text-sm font-black text-texto-principal">{t.duracionMinutos} min</p>
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase text-texto-suave">Motivo</span>
                      <p className="mt-0.5 text-sm font-black text-texto-principal">{t.notas || 'Sin detalle'}</p>
                    </div>
                    <div className="col-span-2 min-w-0">
                      <span className="text-[11px] font-bold uppercase text-texto-suave">Mail cliente</span>
                      <p className="mt-0.5 break-all text-sm font-semibold text-texto-principal">{t.clienteEmail || 'Sin mail'}</p>
                    </div>
                  </div>
                </article>
              ))}
              {historialFiltrado.length === 0 && (
                <p className="rounded-lg border border-dashed border-borde bg-fondo px-3 py-6 text-center text-sm text-texto-secundario">
                  Sin turnos.
                </p>
              )}
            </div>

            <div className="mt-6 hidden overflow-x-auto md:block">
              <table className="w-full min-w-[1080px] border-separate border-spacing-y-2 text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase text-texto-secundario">
                    <th className="px-3 py-2">Profesional</th>
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
                      <td className="rounded-l-lg px-3 py-3 font-bold text-texto-principal">{t.profesionalNombre}</td>
                      <td className="px-3 py-3 text-texto-secundario">{t.clienteNombre}</td>
                      <td className="px-3 py-3 text-texto-secundario">{t.clienteEmail || 'Sin mail'}</td>
                      <td className="px-3 py-3 text-texto-secundario">{fechaDiaSeleccionado(fechaIsoDe(t))}</td>
                      <td className="px-3 py-3 text-texto-secundario">{horaDe(t)}</td>
                      <td className="px-3 py-3 text-texto-secundario">{t.duracionMinutos} min</td>
                      <td className="px-3 py-3"><span className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${estadoClass[t.estado]}`}>{estadoLabel[t.estado]}</span></td>
                      <td className="rounded-r-lg px-3 py-3 text-texto-secundario">{t.notas || 'Sin detalle'}</td>
                    </tr>
                  ))}
                  {historialFiltrado.length === 0 && (
                    <tr><td colSpan={8} className="px-3 py-6 text-center text-sm text-texto-secundario">Sin turnos.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

      </main>

      {mostrandoCambioPerfil && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl border border-borde bg-white p-6 shadow-xl">
            <h2 className="text-xl font-black text-texto-principal">
              {usuario.roles.includes('CLIENTE') && usuario.perfilClienteId != null ? 'Cambiar a cliente' : 'Activar cliente'}
            </h2>
            <p className="mt-4 text-sm leading-6 text-texto-secundario">
              {usuario.roles.includes('CLIENTE') && usuario.perfilClienteId != null
                ? '¿Estas seguro de cambiar al perfil cliente?'
                : '¿Estas seguro de activar el perfil cliente?'}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <BotonSecundario
                type="button"
                className="h-12 w-28"
                onClick={() => setMostrandoCambioPerfil(false)}
                disabled={activandoPerfil}
              >
                Cancelar
              </BotonSecundario>
              <BotonPrimario
                type="button"
                className="h-12 w-28"
                onClick={irAPerfilCliente}
                disabled={activandoPerfil}
              >
                Aceptar
              </BotonPrimario>
            </div>
          </div>
        </div>
      )}

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
                  <BotonSecundario type="button" className="h-12 w-36" onClick={cerrarCancelacionTurno}>
                    Conservar
                  </BotonSecundario>
                  <button
                    type="button"
                    onClick={() => setPidiendoPasswordCancelacion(true)}
                    className="h-12 w-36 rounded-lg border border-peligro bg-peligro text-sm font-bold text-white hover:bg-red-700"
                  >
                    Cancelar
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

      {invitacionProfesional && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl border border-borde bg-white p-6 shadow-xl">
            {invitacionProfesional.accion === 'aceptar' && pidiendoPasswordInvitacion ? (
              <form onSubmit={confirmarInvitacionConPassword}>
                <h2 className="text-xl font-black text-texto-principal">Confirmar contraseña</h2>
                <p className="mt-3 text-sm text-texto-secundario">
                  Para aceptar la invitación de <strong className="text-texto-principal">{invitacionProfesional.asignacion.profesionalNombre}</strong>, ingresa tu contraseña.
                </p>
                <div className="mt-5">
                  <Label>Contraseña</Label>
                  <Input
                    type="password"
                    value={passwordInvitacion}
                    onChange={(e) => setPasswordInvitacion(e.target.value)}
                    placeholder="Tu contraseña"
                    autoFocus
                  />
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <BotonSecundario type="button" className="h-12 w-28" onClick={cerrarInvitacionProfesional}>
                    Cancelar
                  </BotonSecundario>
                  <span
                    className={`${!passwordInvitacion.trim() || respondiendoInvitacion ? 'cursor-not-allowed' : ''}`}
                    title={!passwordInvitacion.trim() ? 'Ingresa tu contraseña' : undefined}
                  >
                    <BotonPrimario
                      type="submit"
                      className={`h-12 w-28 ${!passwordInvitacion.trim() || respondiendoInvitacion ? 'pointer-events-none' : ''}`}
                      disabled={!passwordInvitacion.trim() || respondiendoInvitacion}
                    >
                      Aceptar
                    </BotonPrimario>
                  </span>
                </div>
              </form>
            ) : (
              <>
                <h2 className="text-xl font-black text-texto-principal">
                  {invitacionProfesional.accion === 'aceptar' ? 'Aceptar invitación' : 'Rechazar invitación'}
                </h2>
                <div className="mt-4 space-y-2 text-sm text-texto-secundario">
                  <p>
                    {invitacionProfesional.accion === 'aceptar'
                      ? `¿Seguro que querés vincularte con ${invitacionProfesional.asignacion.profesionalNombre}?`
                      : `¿Seguro que querés rechazar la invitación de ${invitacionProfesional.asignacion.profesionalNombre}?`}
                  </p>
                  <p>
                    {invitacionProfesional.accion === 'aceptar'
                      ? 'Vas a poder gestionar sus turnos cuando confirmes tu contraseña.'
                      : 'No quedará vinculado a tu cuenta de asistente.'}
                  </p>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <BotonSecundario type="button" className="h-12 w-20" onClick={cerrarInvitacionProfesional}>
                    No
                  </BotonSecundario>
                  <BotonPrimario
                    type="button"
                    className="h-12 w-20"
                    onClick={() => {
                      if (invitacionProfesional.accion === 'aceptar') {
                        setPidiendoPasswordInvitacion(true)
                        return
                      }
                      void responderInvitacionProfesional(invitacionProfesional.asignacion.id, 'rechazar')
                    }}
                    disabled={respondiendoInvitacion}
                  >
                    Si
                  </BotonPrimario>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {profesionalADesvincular && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl border border-borde bg-white p-6 shadow-xl">
            {!pidiendoPasswordDesvinculacion ? (
              <>
                <h2 className="text-xl font-black text-texto-principal">Desvincular profesional</h2>
                <div className="mt-4 space-y-2 text-sm text-texto-secundario">
                  <p>¿Seguro que querés desvincularte de {profesionalADesvincular.profesionalNombre}?</p>
                  <p>Ya no vas a poder gestionar sus turnos desde tu cuenta de asistente.</p>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <BotonSecundario type="button" className="h-12 w-28" onClick={cerrarDesvinculacionProfesional}>
                    Cancelar
                  </BotonSecundario>
                  <button
                    type="button"
                    onClick={() => setPidiendoPasswordDesvinculacion(true)}
                    className="h-12 w-32 rounded-lg border border-peligro bg-peligro text-sm font-bold text-white hover:bg-red-700"
                  >
                    Desvincular
                  </button>
                </div>
              </>
            ) : (
              <form onSubmit={confirmarDesvinculacionProfesional}>
                <h2 className="text-xl font-black text-texto-principal">Confirmar contraseña</h2>
                <p className="mt-3 text-sm text-texto-secundario">
                  Para desvincularte de <strong className="text-texto-principal">{profesionalADesvincular.profesionalNombre}</strong>, ingresa tu contraseña.
                </p>
                <div className="mt-5">
                  <Label>Contraseña</Label>
                  <Input
                    type="password"
                    value={passwordDesvinculacion}
                    onChange={(e) => setPasswordDesvinculacion(e.target.value)}
                    placeholder="Tu contraseña"
                    autoFocus
                  />
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <BotonSecundario type="button" className="h-12 w-28" onClick={cerrarDesvinculacionProfesional}>
                    Cancelar
                  </BotonSecundario>
                  <span
                    className={`${!passwordDesvinculacion.trim() || desvinculandoProfesional ? 'cursor-not-allowed' : ''}`}
                    title={!passwordDesvinculacion.trim() ? 'Ingresa tu contraseña' : undefined}
                  >
                    <BotonPrimario
                      type="submit"
                      className={`h-12 w-28 ${!passwordDesvinculacion.trim() || desvinculandoProfesional ? 'pointer-events-none' : ''}`}
                      disabled={!passwordDesvinculacion.trim() || desvinculandoProfesional}
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
              {eliminacionDisponibilidad.tipo === 'grupo' ? (
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
              <BotonSecundario type="button" className="h-12 w-20" onClick={() => setEliminacionDisponibilidad(null)}>
                No
              </BotonSecundario>
              <button
                type="button"
                onClick={onConfirmarEliminarDisponibilidad}
                className="h-12 w-20 rounded-lg border border-peligro bg-peligro text-sm font-bold text-white hover:bg-red-700"
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

