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
import { getProfesional } from '../../api/profesionales'
import {
  cancelarTurno,
  getTurnosProfesional,
  reservarTurno,
} from '../../api/turnos'
import { buscarClientePorEmail, getClientesDeProfesional } from '../../api/clientes'
import { getNotificaciones, marcarTodasLeidas } from '../../api/notificaciones'
import { asignarAsistente, desasignarAsistente, getAsistentesDeProfesional } from '../../api/asistentes'
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

type SeccionProfesional = 'agenda' | 'clientes' | 'asistentes' | 'pagos' | 'notificaciones'
const seccionesValidas: SeccionProfesional[] = ['agenda', 'clientes', 'asistentes', 'pagos', 'notificaciones']

const navItems: Array<{ label: string; seccion: SeccionProfesional | 'dashboard' }> = [
  { label: 'Panel de Control', seccion: 'dashboard' },
  { label: 'Agenda', seccion: 'agenda' },
  { label: 'Clientes', seccion: 'clientes' },
  { label: 'Asistentes', seccion: 'asistentes' },
  { label: 'Pagos', seccion: 'pagos' },
]

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

const formatPrecio = (precio: number) =>
  `$ ${new Intl.NumberFormat('es-PY', { maximumFractionDigits: 0 }).format(precio)}`

const fechaIsoDe = (t: { iniciaEn: string }) => t.iniciaEn.slice(0, 10)
const horaDe     = (t: { iniciaEn: string }) => t.iniciaEn.slice(11, 16)
const fechaCortaDe = (t: { iniciaEn: string }) =>
  new Date(t.iniciaEn).toLocaleDateString('es-PY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).replace('.', '')

const slotReservable = (slot: Slot) =>
  slot.disponible && new Date(slot.iniciaEn).getTime() > Date.now()

export default function ProfesionalDashboard() {
  const { seccion } = useParams()
  const navigate = useNavigate()
  const { usuario, cerrar } = useSesion()
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

  const [filtros, setFiltros] = useState<{ fecha: string; estado: 'Todos' | Turno['estado'] }>({ fecha: '', estado: 'Todos' })
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

  const [nuevaAgenda, setNuevaAgenda] = useState({ nombre: 'Agenda principal', descripcion: 'Atencion presencial' })
  const [disponibilidad, setDisponibilidad] = useState({
    diaSemana: 'MONDAY' as DiaSemana, inicio: '09:00', fin: '18:00', duracion: '30',
  })
  const [asistenteEmail, setAsistenteEmail] = useState('')

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

  const refrescarDatosOperativos = () => {
    if (!profesionalId) return
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

  const turnosFiltrados = useMemo(() =>
    turnos.filter((t) => {
      const okFecha  = filtros.fecha.length === 0 || fechaIsoDe(t) === filtros.fecha
      const okEstado = filtros.estado === 'Todos' || t.estado === filtros.estado
      return okFecha && okEstado
    }),
    [turnos, filtros],
  )

  const turnosDeHoy = useMemo(() => {
    const hoy = new Date().toISOString().slice(0, 10)
    return turnos.filter((t) => fechaIsoDe(t) === hoy && t.estado !== 'CANCELADO')
  }, [turnos])

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
        comisionAgendify: t.pago!.origen === 'ONLINE' ? Math.round(t.pago!.monto * 0.05) : 0,
        netoProfesional: t.pago!.origen === 'ONLINE' ? t.pago!.monto - Math.round(t.pago!.monto * 0.05) : t.pago!.monto,
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

    return Array.from(mapa.values())
  }, [clientes, turnos])

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
      refrescarDatosOperativos()
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
    try {
      const asignacion = await asignarAsistente(profesionalId, asistenteEmail.trim())
      setAsistentes((act) => [...act, asignacion])
      setAsistenteEmail('')
      showToast('Asistente asignado', 'success')
    } catch (err) { showToast(extraerError(err), 'error') }
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

  const inicialesProf = (perfil?.nombreCompleto ?? usuario?.nombreCompleto ?? '')
    .split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()

  if (!usuario || profesionalId == null) return null

  return (
    <div className="min-h-screen bg-fondo text-texto-principal">
      <header className="sticky top-0 z-40 border-b border-[#0F5EC7] bg-primario text-white shadow-sm">
        <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-6 px-5 py-3 sm:px-8 xl:px-10">
          <Link to="/profesional" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 text-white ring-1 ring-white/25">
              <IconCalendar className="h-5 w-5" />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-xl font-black text-white">Agendify</span>
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-white/80">Profesional</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-3 text-sm font-semibold text-white/80 lg:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.seccion}
                to={pathDeSeccion(item)}
                end={item.seccion === 'dashboard'}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 ${isActive ? 'bg-white text-primario' : 'hover:bg-white/15 hover:text-white'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
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

      <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-5 py-7 sm:px-8 xl:px-10">
        {seccionActual === 'dashboard' && (
          <section className="rounded-lg border border-borde-suave bg-white p-6 shadow-sm xl:p-7">
            <h2 className="text-2xl font-black text-texto-principal">Turnos del dia</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
                <p className="text-sm text-texto-secundario">No hay turnos para hoy.</p>
              )}
            </div>
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
                  <div className="rounded-lg bg-white p-5">
                    <h2 className="text-2xl font-black text-texto-principal">Mi agenda</h2>
                    <p className="mt-3 text-base font-semibold text-texto-principal">{agendaPrincipal.nombre}</p>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-texto-secundario">{agendaPrincipal.descripcion}</p>
                  </div>

                  <div className="mt-7 flex items-center justify-between gap-3">
                    <h3 className="text-lg font-black text-texto-principal">Configuraciones horarias</h3>
                  </div>
                  <div className="mt-4 space-y-3">
                    {agendaPrincipal.configuraciones.length === 0 && (
                      <p className="text-sm text-texto-secundario">Aun no agregaste disponibilidades.</p>
                    )}
                    {agendaPrincipal.configuraciones.map((c) => (
                      <div key={c.id} className="flex items-center justify-between gap-3 rounded-lg border border-borde bg-fondo px-4 py-3">
                        <div className="text-sm text-texto-principal">
                          <span className="font-bold">{diasLabels[c.diaSemana]}</span><span className="mx-2 text-texto-suave">-</span>{c.inicioSlot.slice(0,5)} a {c.finSlot.slice(0,5)}<span className="mx-2 text-texto-suave">-</span>cada {c.duracionSlotMinutos} min
                        </div>
                        {c.id && (
                          <button onClick={() => onEliminarConfig(c.id!)} className="text-xs font-bold text-peligro hover:underline">Eliminar</button>
                        )}
                      </div>
                    ))}
                  </div>
                </article>
              )}

              <form onSubmit={onAgregarDisponibilidad} className="rounded-lg border border-borde-suave bg-white p-6 shadow-sm xl:p-7">
                <h2 className="text-2xl font-black text-texto-principal">Agregar disponibilidad</h2>
                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  <div>
                    <Label>Dia</Label>
                    <Select value={disponibilidad.diaSemana} onChange={(e) => setDisponibilidad({ ...disponibilidad, diaSemana: e.target.value as DiaSemana })}>
                      {(Object.keys(diasLabels) as DiaSemana[]).map((d) => <option key={d} value={d}>{diasLabels[d]}</option>)}
                    </Select>
                  </div>
                  <div>
                    <Label>Duracion</Label>
                    <Select value={disponibilidad.duracion} onChange={(e) => setDisponibilidad({ ...disponibilidad, duracion: e.target.value })}>
                      <option value="30">30 minutos</option>
                      <option value="45">45 minutos</option>
                      <option value="60">60 minutos</option>
                    </Select>
                  </div>
                  <div><Label>Hora inicio</Label><Input type="time" value={disponibilidad.inicio} onChange={(e) => setDisponibilidad({ ...disponibilidad, inicio: e.target.value })} /></div>
                  <div><Label>Hora fin</Label><Input type="time" value={disponibilidad.fin} onChange={(e) => setDisponibilidad({ ...disponibilidad, fin: e.target.value })} /></div>
                  <BotonPrimario type="submit" className="md:col-span-2" disabled={!agendaPrincipal}>
                    Agregar disponibilidad
                  </BotonPrimario>
                </div>
              </form>
            </section>

            <section className="order-3 rounded-lg border border-borde-suave bg-white p-6 shadow-sm xl:p-7">
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

            <section className="order-2 rounded-lg border border-borde-suave bg-white p-6 shadow-sm xl:p-7">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <h2 className="text-2xl font-black text-texto-principal">Turnos</h2>
                  <p className="text-sm text-texto-secundario">Consulta, filtra y cancela los turnos registrados.</p>
                </div>
                <div className="grid gap-3 lg:grid-cols-3 xl:min-w-[620px]">
                  <div>
                    <Label>Fecha</Label>
                    <div className="relative">
                      <Input type="date" value={filtros.fecha} onChange={(e) => setFiltros({ ...filtros, fecha: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <Label>Estado</Label>
                    <Select value={filtros.estado} onChange={(e) => setFiltros({ ...filtros, estado: e.target.value as typeof filtros.estado })}>
                      <option value="Todos">Todos</option>
                      <option value="CONFIRMADO">Confirmado</option>
                      <option value="CANCELADO">Cancelado</option>
                    </Select>
                  </div>
                  <BotonSecundario type="button" className="self-end" onClick={() => setFiltros({ fecha: '', estado: 'Todos' })}>Limpiar filtros</BotonSecundario>
                </div>
              </div>

              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[820px] border-separate border-spacing-y-2 text-left text-sm">
                  <thead>
                    <tr className="text-xs uppercase text-texto-secundario">
                      <th className="px-3 py-2">Cliente</th>
                      <th className="px-3 py-2">Notas</th>
                      <th className="px-3 py-2">Fecha</th>
                      <th className="px-3 py-2">Estado</th>
                      <th className="px-3 py-2">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {turnosFiltrados.map((t) => (
                      <tr key={t.id} className="bg-fondo">
                        <td className="rounded-l-lg px-3 py-3 font-bold text-texto-principal">{t.clienteNombre}</td>
                        <td className="px-3 py-3 text-texto-secundario">{t.notas || '-'}</td>
                        <td className="px-3 py-3 text-texto-secundario">{fechaIsoDe(t)} - {horaDe(t)}</td>
                        <td className="px-3 py-3"><span className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${estadoClass[t.estado]}`}>{estadoLabel[t.estado]}</span></td>
                        <td className="rounded-r-lg px-3 py-3">
                          <div className="flex flex-wrap gap-2">
                            {t.estado !== 'CANCELADO' && <button onClick={() => onCancelarTurno(t.id)} className="rounded-lg border border-peligro-suave bg-white px-3 py-2 text-xs font-bold text-peligro hover:bg-peligro-suave">Cancelar</button>}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {turnosFiltrados.length === 0 && (
                      <tr><td colSpan={5} className="px-3 py-6 text-center text-sm text-texto-secundario">Sin turnos.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {seccionActual === 'clientes' && (
          <section className="rounded-lg border border-borde-suave bg-white p-6 shadow-sm xl:p-7">
            <h2 className="text-2xl font-black text-texto-principal">Clientes</h2>
            <p className="text-sm text-texto-secundario">Personas que reservaron turnos contigo.</p>
            <div className="mt-5 grid gap-4 xl:grid-cols-2">
              {clientesConTurnos.map((c) => {
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
                    <div className="mt-5 border-t border-borde-suave pt-4">
                      <span className="text-xs font-bold uppercase text-texto-secundario">Historial de turnos</span>
                      <ul className="mt-2 grid gap-2 text-sm text-texto-secundario">
                        {c.turnos.map((t) => (
                          <li key={t.id} className="rounded-lg border border-borde-suave bg-white px-3 py-2">
                            <p className="font-semibold text-texto-principal">{fechaIsoDe(t)} - {horaDe(t)}</p>
                            <p>{estadoLabel[t.estado]}</p>
                          </li>
                        ))}
                      </ul>
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
                {asistentes.map((a) => (
                  <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-borde bg-fondo p-4">
                    <div>
                      <h3 className="font-black text-texto-principal">{a.asistenteNombre}</h3>
                      <p className="text-sm text-texto-secundario">Asignado a {a.profesionalNombre}</p>
                    </div>
                    <BotonSecundario type="button" onClick={() => onDesasignarAsistente(a.id)}>
                      Quitar acceso
                    </BotonSecundario>
                  </div>
                ))}
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
                <BotonPrimario type="submit" disabled={!asistenteEmail.trim()}>
                  Asignar asistente
                </BotonPrimario>
              </div>
            </form>
          </section>
        )}

        {seccionActual === 'pagos' && (
          <section className="rounded-lg border border-borde-suave bg-white p-6 shadow-sm xl:p-7">
            <h2 className="text-2xl font-black text-texto-principal">Pagos</h2>
            <p className="mt-1 text-sm text-texto-secundario">Agendify retiene una comision del 5% solo sobre pagos online. Los cobros externos quedan sin descuento.</p>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[880px] border-separate border-spacing-y-2 text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase text-texto-secundario">
                    <th className="px-3 py-2">Cliente</th>
                    <th className="px-3 py-2">Turno</th>
                    <th className="px-3 py-2">Fecha</th>
                    <th className="px-3 py-2">Tipo</th>
                    <th className="px-3 py-2">Monto pagado</th>
                    <th className="px-3 py-2">Comision Agendify</th>
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
                      <td className="px-3 py-3 font-semibold text-texto-secundario">{formatPrecio(p.comisionAgendify)}</td>
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
          <section className="rounded-lg border border-borde-suave bg-white p-6 shadow-sm xl:p-7">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-texto-principal">Notificaciones</h2>
                <p className="mt-1 text-sm text-texto-secundario">Turnos, cambios y pagos.</p>
              </div>
              {notificaciones.some((n) => !n.leida) && (
                <BotonSecundario onClick={() => marcarTodasLeidas(usuario.id).then(() => getNotificaciones(usuario.id).then(setNotificaciones))}>
                  Marcar todas como leidas
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

      <div id="toast-container">
        <Toast toast={toast} />
      </div>
    </div>
  )
}


