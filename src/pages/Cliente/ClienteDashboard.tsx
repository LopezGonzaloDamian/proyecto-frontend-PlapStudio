import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, NavLink, useNavigate, useParams } from 'react-router-dom'
import { IconBell, IconCalendar, IconCheck, IconStar } from '../../components/LandingPage/Icons'
import { BotonPrimario, BotonSecundario, Input, Label, Select, Textarea } from '../../components/common/ui'
import { useSesion } from '../../customHooks/useSesion'
import { extraerError } from '../../api/client'
import { useToast } from '../../customHooks/useToast'
import { Toast } from '../../components/common/toast'
import {
  buscarProfesionales,
  getProfesional,
} from '../../api/profesionales'
import { getSlots } from '../../api/agendas'
import {
  cancelarTurno,
  getTurnosCliente,
  reservarTurno,
} from '../../api/turnos'
import { getFavoritos, toggleFavorito as toggleFavoritoApi } from '../../api/favoritos'
import { getNotificaciones, marcarTodasLeidas } from '../../api/notificaciones'
import type {
  Favorito,
  Notificacion,
  Profesional,
  ProfesionalSummary,
  Slot,
  Turno,
} from '../../api/types'

const secciones = ['buscar', 'profesional', 'reservar', 'notificaciones'] as const
type SeccionCliente = typeof secciones[number]
type ItemNavCliente = { label: string; seccion: SeccionCliente | 'dashboard' }

const navItems: ItemNavCliente[] = [
  { label: 'Dashboard', seccion: 'dashboard' },
  { label: 'Buscar', seccion: 'buscar' },
]

const formatPrecio = (precio: number) =>
  new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', maximumFractionDigits: 0 }).format(precio)

const estadoClass: Record<Turno['estado'], string> = {
  PENDIENTE: 'bg-amber-100 text-amber-800 border-amber-200',
  CONFIRMADO: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  CANCELADO: 'bg-red-100 text-red-700 border-red-200',
  COMPLETADO: 'bg-violet-100 text-violet-800 border-violet-200',
}

const estadoLabel: Record<Turno['estado'], string> = {
  PENDIENTE: 'Pendiente',
  CONFIRMADO: 'Confirmado',
  CANCELADO: 'Cancelado',
  COMPLETADO: 'Realizado',
}

function fechaIsoDe(t: { iniciaEn: string }): string {
  return t.iniciaEn.slice(0, 10)
}

function horaDe(t: { iniciaEn: string }): string {
  return t.iniciaEn.slice(11, 16)
}

function AvatarProfesional({ nombre }: { nombre: string }) {
  const iniciales = nombre.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()
  return (
    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[18px] bg-[#9a5966] text-2xl font-black text-white shadow-sm">
      {iniciales}
    </div>
  )
}

export default function ClienteDashboard() {
  const navigate = useNavigate()
  const { seccion, idProfesional } = useParams()
  const { usuario, cerrar } = useSesion()
  const { toast, showToast } = useToast()

  const [busqueda, setBusqueda] = useState('')
  const [rubroServicio, setRubroServicio] = useState('')
  const [ubicacion, setUbicacion] = useState('')
  const [fechaDeseada, setFechaDeseada] = useState(() => new Date().toISOString().slice(0, 10))

  const [resultados, setResultados] = useState<ProfesionalSummary[]>([])
  const [profesionalDetalle, setProfesionalDetalle] = useState<Profesional | null>(null)
  const [slots, setSlots] = useState<Slot[]>([])
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [favoritos, setFavoritos] = useState<Favorito[]>([])
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])

  const [horarioSeleccionado, setHorarioSeleccionado] = useState('')
  const [servicio, setServicio] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [pagarAlReservar, setPagarAlReservar] = useState(false)
  const [medioPago, setMedioPago] = useState('Tarjeta de credito')
  const [enviandoReserva, setEnviandoReserva] = useState(false)

  const [vistaCalendario, setVistaCalendario] = useState<'dia' | 'semana' | 'mes'>('mes')
  const [fechaCalendario, setFechaCalendario] = useState(() => new Date().toISOString().slice(0, 10))
  const [menuUsuarioAbierto, setMenuUsuarioAbierto] = useState(false)
  const menuUsuarioRef = useRef<HTMLDivElement>(null)
  const turnosDetalleRef = useRef<HTMLElement>(null)
  const cerrandoSesionRef = useRef(false)

  const seccionActual = secciones.includes(seccion as SeccionCliente)
    ? (seccion as SeccionCliente)
    : 'dashboard'
  const basePath = '/cliente'
  const pathDeSeccion = (item: ItemNavCliente) =>
    item.seccion === 'dashboard' ? basePath : `${basePath}/${item.seccion}`
  const pathNotificaciones = `${basePath}/notificaciones`
  const cantidadNotificaciones = notificaciones.length > 9 ? '9+' : String(notificaciones.length)

  useEffect(() => {
    if (cerrandoSesionRef.current) return
    if (!usuario || usuario.perfilClienteId == null) {
      navigate('/cliente/login', { replace: true })
    }
  }, [usuario, navigate])

  // Carga inicial de catálogo de profesionales, turnos, favoritos, notifs
  useEffect(() => {
    if (!usuario?.perfilClienteId) return
    void buscarProfesionales().then(setResultados).catch((e) => showToast(extraerError(e), 'error'))
    void getTurnosCliente(usuario.perfilClienteId).then(setTurnos).catch((e) => showToast(extraerError(e), 'error'))
    void getFavoritos(usuario.perfilClienteId).then(setFavoritos).catch((e) => showToast(extraerError(e), 'error'))
    void getNotificaciones(usuario.id).then(setNotificaciones).catch((e) => showToast(extraerError(e), 'error'))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario?.perfilClienteId])

  // Filtros disparan búsqueda
  useEffect(() => {
    if (seccionActual !== 'buscar' && seccionActual !== 'dashboard') return
    const t = setTimeout(() => {
      buscarProfesionales({ query: busqueda, especialidad: rubroServicio, ubicacion })
        .then(setResultados)
        .catch((e) => showToast(extraerError(e), 'error'))
    }, 250)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busqueda, rubroServicio, ubicacion, seccionActual])

  // Carga de profesional detallado
  useEffect(() => {
    if (!idProfesional) return
    if (seccionActual !== 'profesional' && seccionActual !== 'reservar') return
    void getProfesional(Number(idProfesional))
      .then((p) => {
        setProfesionalDetalle(p)
        if (p.servicios.length > 0) setServicio(p.servicios[0])
      })
      .catch((e) => showToast(extraerError(e), 'error'))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idProfesional, seccionActual])

  // Carga de slots cuando hay profesional + fecha
  useEffect(() => {
    if (seccionActual !== 'reservar' && seccionActual !== 'profesional') return
    const agenda = profesionalDetalle?.agendas.find((a) => a.activa)
    if (!agenda) { setSlots([]); return }
    void getSlots(agenda.id, fechaDeseada)
      .then((slots) => {
        setSlots(slots)
        const primero = slots.find((s) => s.disponible)
        if (primero) setHorarioSeleccionado(primero.iniciaEn)
        else         setHorarioSeleccionado('')
      })
      .catch((e) => showToast(extraerError(e), 'error'))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profesionalDetalle?.id, fechaDeseada, seccionActual])

  useEffect(() => {
    const handleClickAfuera = (evento: MouseEvent) => {
      if (menuUsuarioRef.current && !menuUsuarioRef.current.contains(evento.target as Node)) {
        setMenuUsuarioAbierto(false)
      }
    }
    document.addEventListener('mousedown', handleClickAfuera)
    return () => document.removeEventListener('mousedown', handleClickAfuera)
  }, [])

  const turnosHoy = useMemo(() => {
    const hoy = new Date().toISOString().slice(0, 10)
    return turnos.filter((t) => fechaIsoDe(t) === hoy && t.estado !== 'CANCELADO')
  }, [turnos])

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
    const inicio = new Date(fechaSeleccionada)
    const day = (inicio.getDay() + 6) % 7
    inicio.setDate(inicio.getDate() - day)
    return Array.from({ length: 7 }, (_, i) => {
      const f = new Date(inicio)
      f.setDate(inicio.getDate() + i)
      return f
    })
  }, [fechaSeleccionada])
  const diasMes = useMemo(() => {
    const year  = fechaSeleccionada.getFullYear()
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

  const verPerfilProfesional = (p: { id: number }) => navigate(`${basePath}/profesional/${p.id}`)
  const irAReservarProfesional = (p: { id: number }) => navigate(`${basePath}/reservar/${p.id}`)

  const esFavorito = (id: number) => favoritos.some((f) => f.profesional.id === id)

  const toggleFavorito = async (id: number) => {
    if (!usuario?.perfilClienteId) return
    try {
      await toggleFavoritoApi(usuario.perfilClienteId, id)
      const lista = await getFavoritos(usuario.perfilClienteId)
      setFavoritos(lista)
    } catch (e) {
      showToast(extraerError(e), 'error')
    }
  }

  const reservar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!usuario?.perfilClienteId || !profesionalDetalle) return
    const agenda = profesionalDetalle.agendas.find((a) => a.activa)
    if (!agenda || !horarioSeleccionado) {
      showToast('Selecciona un horario disponible', 'error')
      return
    }
    setEnviandoReserva(true)
    try {
      const slot = slots.find((s) => s.iniciaEn === horarioSeleccionado)
      const turno = await reservarTurno({
        agendaId:        agenda.id,
        clienteId:       usuario.perfilClienteId,
        iniciaEn:        horarioSeleccionado,
        duracionMinutos: slot?.duracionMinutos ?? 45,
        notas:           [servicio, observaciones].filter(Boolean).join(' - '),
        pagarAlReservar,
        medioPago:       pagarAlReservar ? medioPago : undefined,
      })
      setTurnos((actuales) => [turno, ...actuales])
      setObservaciones('')
      setPagarAlReservar(false)
      showToast(pagarAlReservar ? 'Turno reservado y pagado' : 'Turno reservado', 'success')
      // Refrescar slots y notificaciones
      void getSlots(agenda.id, fechaDeseada).then(setSlots)
      void getNotificaciones(usuario.id).then(setNotificaciones)
      navigate(basePath)
    } catch (err) {
      showToast(extraerError(err), 'error')
    } finally {
      setEnviandoReserva(false)
    }
  }

  const cancelar = async (id: string) => {
    if (!confirm('¿Cancelar este turno?')) return
    try {
      const t = await cancelarTurno(id)
      setTurnos((actuales) => actuales.map((x) => (x.id === id ? t : x)))
      showToast('Turno cancelado', 'success')
    } catch (e) {
      showToast(extraerError(e), 'error')
    }
  }

  const cerrarSesion = () => {
    cerrandoSesionRef.current = true
    cerrar()
    navigate('/landing', { replace: true })
  }

  const inicialesUsuario = (usuario?.nombreCompleto ?? '')
    .split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()

  if (!usuario) return null

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
                    isActive ? 'bg-primario-claro text-primario' : 'hover:bg-primario-claro hover:text-primario'
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
                  isActive ? 'border-primario bg-primario-claro text-primario' : 'border-borde bg-white text-texto-secundario hover:bg-primario-claro hover:text-primario'
                }`
              }
              aria-label="Ver notificaciones"
            >
              <IconBell className="h-5 w-5" />
              {notificaciones.filter((n) => !n.leida).length > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-peligro px-1 text-[10px] font-black leading-none text-white">
                  {cantidadNotificaciones}
                </span>
              )}
            </NavLink>
            <div className="relative" ref={menuUsuarioRef}>
              <button
                type="button"
                onClick={() => setMenuUsuarioAbierto((v) => !v)}
                className="flex items-center gap-2 rounded-full border border-borde bg-white pl-2 pr-3 py-1.5 text-sm font-semibold text-texto-principal shadow-sm hover:bg-primario-claro"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primario text-sm font-black text-white">
                  {inicialesUsuario || 'U'}
                </span>
                <svg className={`h-4 w-4 text-texto-secundario transition-transform ${menuUsuarioAbierto ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {menuUsuarioAbierto && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-borde bg-white py-1 shadow-lg">
                  <div className="px-4 py-2 border-b border-borde-suave">
                    <p className="text-sm font-bold text-texto-principal">{usuario.nombreCompleto}</p>
                    <p className="text-xs text-texto-secundario">{usuario.email}</p>
                  </div>
                  <button
                    onClick={cerrarSesion}
                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-peligro transition-colors hover:bg-peligro-suave"
                  >
                    Cerrar sesion
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 px-6 py-8 xl:px-10">
        {seccionActual === 'dashboard' && (
          <>
            <section>
              <article className="rounded-[28px] border border-[#dfe3ff] bg-white p-6 shadow-sm xl:p-7">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <span className="text-sm font-bold uppercase tracking-[0.12em] text-primario">Hoy</span>
                    <h2 className="mt-2 text-3xl font-black text-texto-principal">Turnos del dia</h2>
                  </div>
                </div>
                <div className="mt-5 grid gap-3">
                  {turnosHoy.length > 0 ? turnosHoy.map((t) => (
                    <div key={t.id} className="rounded-2xl border border-borde bg-fondo px-4 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h3 className="font-black text-texto-principal">{horaDe(t)} - {t.profesionalNombre}</h3>
                          <p className="mt-1 text-sm text-texto-secundario">{t.notas || t.agendaNombre}</p>
                        </div>
                        <span className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${estadoClass[t.estado]}`}>{estadoLabel[t.estado]}</span>
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
                          vistaCalendario === vista ? 'bg-white text-primario shadow-sm' : 'text-texto-secundario hover:text-texto-principal'
                        }`}
                      >
                        {vista === 'dia' ? 'Dia' : vista === 'semana' ? 'Semana' : 'Mes'}
                      </button>
                    ))}
                  </div>
                  <Input type="date" value={fechaCalendario} onChange={(e) => setFechaCalendario(e.target.value)} className="sm:w-[180px]" />
                </div>
              </div>

              {vistaCalendario === 'mes' && (
                <div className="mt-6">
                  <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold uppercase tracking-[0.12em] text-texto-secundario">
                    {['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'].map((d) => <div key={d} className="py-2">{d}</div>)}
                  </div>
                  <div className="mt-2 grid grid-cols-7 gap-2">
                    {diasMes.map((dia) => {
                      const fecha = dia.toISOString().slice(0, 10)
                      const esMesActual = dia.getMonth() === fechaSeleccionada.getMonth()
                      const turnosDelDia = turnosPorFecha[fecha] ?? []
                      const seleccionado = fecha === fechaCalendario
                      return (
                        <button
                          key={fecha}
                          onClick={() => setFechaCalendario(fecha)}
                          className={`min-h-[118px] rounded-2xl border p-3 text-left transition-colors ${
                            seleccionado ? 'border-primario bg-primario-claro' : 'border-borde bg-white hover:border-primario-suave'
                          } ${!esMesActual ? 'opacity-45' : ''}`}
                        >
                          <span className="text-sm font-bold text-texto-principal">{dia.getDate()}</span>
                          <div className="mt-3 space-y-2">
                            {turnosDelDia.slice(0, 2).map((t) => (
                              <div key={t.id} className="rounded-lg bg-white/90 px-2 py-1 text-xs font-semibold text-texto-principal">
                                {horaDe(t)} {t.profesionalNombre.split(' ')[0]}
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
                        onClick={() => setFechaCalendario(fecha)}
                        className={`rounded-2xl border p-4 text-left transition-colors ${
                          fecha === fechaCalendario ? 'border-primario bg-primario-claro' : 'border-borde bg-white hover:border-primario-suave'
                        }`}
                      >
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-texto-secundario">
                          {dia.toLocaleDateString('es-PY', { weekday: 'short' })}
                        </p>
                        <p className="mt-1 text-2xl font-black text-texto-principal">{dia.getDate()}</p>
                        <div className="mt-4 space-y-2">
                          {turnosDelDia.length > 0 ? turnosDelDia.map((t) => (
                            <div key={t.id} className="rounded-xl bg-fondo px-3 py-2 text-xs font-semibold text-texto-principal">
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
                <div className="mt-6 rounded-2xl border border-borde bg-fondo p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-texto-secundario">Dia seleccionado</p>
                      <h3 className="mt-1 text-2xl font-black text-texto-principal">{fechaCalendario}</h3>
                    </div>
                  </div>
                  <div className="mt-5 space-y-3">
                    {turnosFechaSeleccionada.length > 0 ? turnosFechaSeleccionada.map((t) => (
                      <div key={t.id} className="rounded-2xl border border-borde bg-white px-4 py-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <h4 className="font-black text-texto-principal">{horaDe(t)} - {t.profesionalNombre}</h4>
                            <p className="mt-1 text-sm text-texto-secundario">{t.notas || t.agendaNombre}</p>
                          </div>
                          <span className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${estadoClass[t.estado]}`}>{estadoLabel[t.estado]}</span>
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

            <section ref={turnosDetalleRef} className="rounded-lg border border-borde-suave bg-white p-6 shadow-sm xl:p-7">
              <h2 className="text-2xl font-black text-texto-principal">Mis turnos</h2>
              <p className="text-sm text-texto-secundario">Historial completo y proximos turnos.</p>
              <div className="mt-5 grid gap-3">
                {turnos.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-borde px-4 py-8 text-sm text-texto-secundario">
                    Aun no tenes turnos.
                  </div>
                )}
                {turnos.map((t) => (
                  <div key={t.id} className="rounded-2xl border border-borde bg-fondo px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="font-black text-texto-principal">{fechaIsoDe(t)} {horaDe(t)} - {t.profesionalNombre}</h3>
                        <p className="mt-1 text-sm text-texto-secundario">{t.notas || t.agendaNombre}</p>
                        {t.pago && <p className="mt-1 text-xs font-bold text-primario">Pago: {t.pago.estado} {formatPrecio(t.pago.monto)}</p>}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${estadoClass[t.estado]}`}>{estadoLabel[t.estado]}</span>
                        {t.estado !== 'CANCELADO' && t.estado !== 'COMPLETADO' && (
                          <button onClick={() => cancelar(t.id)} className="text-xs font-bold text-peligro hover:underline">Cancelar</button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-borde-suave bg-white p-6 shadow-sm xl:p-7">
              <h2 className="text-2xl font-black text-texto-principal">Favoritos</h2>
              <p className="text-sm text-texto-secundario">Profesionales guardados.</p>
              <div className="mt-5 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {favoritos.map((f) => (
                  <article key={f.id} className="rounded-lg border border-borde bg-fondo p-4">
                    <div className="flex items-start justify-between gap-3">
                      <button onClick={() => verPerfilProfesional(f.profesional)} className="text-left">
                        <h3 className="font-black text-texto-principal">{f.profesional.nombreCompleto}</h3>
                        <p className="text-sm text-texto-secundario">{f.profesional.especialidad} - {f.profesional.ubicacion}</p>
                        <p className="mt-1 text-sm font-semibold text-primario">{formatPrecio(f.profesional.precio)} por servicio base</p>
                      </button>
                      <button
                        onClick={() => toggleFavorito(f.profesional.id)}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-amber-300 bg-amber-100 text-amber-600"
                      >
                        <IconStar className="h-5 w-5" />
                      </button>
                    </div>
                    <BotonSecundario className="mt-4 w-full" onClick={() => verPerfilProfesional(f.profesional)}>
                      Ver perfil
                    </BotonSecundario>
                  </article>
                ))}
                {favoritos.length === 0 && (
                  <p className="text-sm text-texto-secundario">Aun no agregaste favoritos.</p>
                )}
              </div>
            </section>
          </>
        )}

        {seccionActual === 'buscar' && (
          <section>
            <div className="rounded-lg border border-borde-suave bg-white p-6 shadow-sm xl:p-7">
              <div className="mb-5">
                <h2 className="text-2xl font-black text-texto-principal">Buscar profesional o servicio</h2>
                <p className="text-sm text-texto-secundario">Filtra por nombre, palabra clave, rubro y ubicacion.</p>
              </div>
              <div className="grid gap-4 xl:grid-cols-4">
                <div><Label>Nombre</Label><Input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Ej: Martina Rios" /></div>
                <div><Label>Servicio</Label><Input value={rubroServicio} onChange={(e) => setRubroServicio(e.target.value)} placeholder="Ej: barberia, peluqueria" /></div>
                <div><Label>Ubicacion</Label><Input value={ubicacion} onChange={(e) => setUbicacion(e.target.value)} placeholder="Ej: Asuncion" /></div>
                <div><Label>Fecha deseada</Label><Input type="date" value={fechaDeseada} onChange={(e) => setFechaDeseada(e.target.value)} /></div>
              </div>
              <div className="mt-6 grid gap-4">
                {resultados.map((p) => (
                  <article key={p.id} className="rounded-[22px] border border-[#d7dbff] bg-white p-5 shadow-sm transition-colors hover:border-primario xl:p-6">
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div className="flex gap-4">
                          <AvatarProfesional nombre={p.nombreCompleto} />
                          <div className="min-w-0">
                            <h3 className="text-[1.45rem] leading-tight font-semibold text-texto-principal">{p.nombreCompleto}</h3>
                            <p className="mt-1.5 text-base text-texto-principal">{p.especialidad}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-3 xl:max-w-[320px]">
                          <button
                            onClick={() => toggleFavorito(p.id)}
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors ${
                              esFavorito(p.id) ? 'border-amber-300 bg-amber-100 text-amber-600' : 'border-borde bg-white text-texto-suave hover:text-amber-500'
                            }`}
                          >
                            <IconStar className="h-5 w-5" />
                          </button>
                          <div className="flex max-w-[260px] items-center gap-2 text-right text-sm text-texto-principal">
                            <svg className="h-4 w-4 shrink-0 text-texto-principal" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s7-4.35 7-11a7 7 0 1 0-14 0c0 6.65 7 11 7 11Z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10.5h.01" />
                            </svg>
                            <span className="truncate">{p.ubicacion}</span>
                          </div>
                        </div>
                      </div>
                      <div className="border-t border-[#dfe3ff] pt-3.5 flex justify-between">
                        <button onClick={() => verPerfilProfesional(p)} className="text-sm font-bold text-[#6b72a8] hover:text-primario">Ver perfil</button>
                        <button onClick={() => irAReservarProfesional(p)} className="text-sm font-bold text-primario hover:underline">Reservar</button>
                      </div>
                    </div>
                  </article>
                ))}
                {resultados.length === 0 && (
                  <p className="text-sm text-texto-secundario">No encontramos profesionales.</p>
                )}
              </div>
            </div>
          </section>
        )}

        {seccionActual === 'profesional' && profesionalDetalle && (
          <section className="rounded-[24px] border border-borde-suave bg-white p-6 shadow-sm xl:p-8">
            <button
              type="button"
              onClick={() => navigate(`${basePath}/buscar`)}
              className="mb-6 inline-flex items-center rounded-lg border border-borde bg-white px-4 py-2 text-sm font-bold text-texto-principal hover:bg-primario-claro hover:text-primario"
            >
              Volver
            </button>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <AvatarProfesional nombre={profesionalDetalle.nombreCompleto} />
                <div>
                  <span className="text-xs font-bold uppercase tracking-[0.12em] text-primario">Perfil profesional</span>
                  <h2 className="mt-1 text-3xl font-black text-texto-principal">{profesionalDetalle.nombreCompleto}</h2>
                  <p className="mt-1 text-base text-texto-secundario">{profesionalDetalle.especialidad}</p>
                  <p className="text-sm text-texto-secundario">{profesionalDetalle.ubicacion}</p>
                </div>
              </div>
              <button
                onClick={() => toggleFavorito(profesionalDetalle.id)}
                className={`flex h-11 w-11 items-center justify-center rounded-lg ${esFavorito(profesionalDetalle.id) ? 'bg-amber-100 text-amber-600' : 'bg-primario-claro text-primario hover:bg-primario-suave'}`}
              >
                <IconStar className="h-5 w-5" />
              </button>
            </div>

            <section className="mt-8">
              <h3 className="text-xl font-black text-texto-principal">Descripcion</h3>
              <p className="mt-3 max-w-5xl text-sm leading-7 text-texto-secundario">{profesionalDetalle.biografia}</p>
            </section>

            <section className="mt-8 rounded-[18px] border border-borde bg-[#fcfdff] p-5">
              <h3 className="text-lg font-black text-texto-principal">Detalles</h3>
              <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                <div><span className="text-[11px] font-bold uppercase text-texto-suave">Rubro</span><p className="mt-2 text-sm font-semibold">{profesionalDetalle.especialidad}</p></div>
                <div><span className="text-[11px] font-bold uppercase text-texto-suave">Ubicacion</span><p className="mt-2 text-sm font-semibold">{profesionalDetalle.ubicacion}</p></div>
                <div><span className="text-[11px] font-bold uppercase text-texto-suave">Telefono</span><p className="mt-2 text-sm font-semibold">{profesionalDetalle.telefono}</p></div>
                <div><span className="text-[11px] font-bold uppercase text-texto-suave">Mail</span><p className="mt-2 text-sm font-semibold break-all">{profesionalDetalle.email}</p></div>
                <div className="sm:col-span-2 xl:col-span-4"><span className="text-[11px] font-bold uppercase text-texto-suave">Direccion</span><p className="mt-2 text-sm font-semibold">{profesionalDetalle.direccion}</p></div>
                <div className="sm:col-span-2 xl:col-span-4">
                  <span className="text-[11px] font-bold uppercase text-texto-suave">Slots disponibles para {fechaDeseada}</span>
                  <div className="mt-3 flex items-center gap-2 mb-3">
                    <Input type="date" value={fechaDeseada} onChange={(e) => setFechaDeseada(e.target.value)} className="max-w-[180px]" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {slots.filter((s) => s.disponible).map((s) => (
                      <span key={s.iniciaEn} className="rounded-lg border border-primario-suave bg-white px-3 py-2 text-sm font-bold text-primario">
                        {s.iniciaEn.slice(11, 16)}
                      </span>
                    ))}
                    {slots.filter((s) => s.disponible).length === 0 && (
                      <span className="text-sm text-texto-secundario">Sin disponibilidad para esta fecha.</span>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => irAReservarProfesional(profesionalDetalle)}
                className="inline-flex items-center justify-center gap-3 rounded-xl bg-[#31927f] px-6 py-3 text-base font-black text-white hover:bg-[#28786a]"
              >
                <IconCalendar className="h-5 w-5" />
                Reservar turno
              </button>
            </div>
          </section>
        )}

        {seccionActual === 'reservar' && profesionalDetalle && (
          <section className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
            <aside className="rounded-[28px] border border-[#dfe3ff] bg-white p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <AvatarProfesional nombre={profesionalDetalle.nombreCompleto} />
                <div>
                  <h2 className="text-3xl font-black text-texto-principal">{profesionalDetalle.nombreCompleto}</h2>
                  <p className="mt-2 text-base text-texto-principal">{profesionalDetalle.especialidad}</p>
                  <p className="mt-2 text-sm text-texto-secundario">{profesionalDetalle.ubicacion}</p>
                  <p className="mt-2 text-sm font-bold text-primario">{formatPrecio(profesionalDetalle.precio)}</p>
                </div>
              </div>
              <div className="mt-6 rounded-2xl bg-fondo p-4">
                <span className="text-xs font-bold uppercase text-texto-secundario">Slots disponibles {fechaDeseada}</span>
                <div className="mt-3 flex flex-wrap gap-2">
                  {slots.filter((s) => s.disponible).map((s) => (
                    <button
                      key={s.iniciaEn}
                      type="button"
                      onClick={() => setHorarioSeleccionado(s.iniciaEn)}
                      className={`rounded-lg border px-3 py-2 text-sm font-bold ${
                        horarioSeleccionado === s.iniciaEn
                          ? 'border-primario bg-primario text-white'
                          : 'border-primario-suave bg-primario-claro text-primario'
                      }`}
                    >
                      {s.iniciaEn.slice(11, 16)}
                    </button>
                  ))}
                  {slots.filter((s) => s.disponible).length === 0 && (
                    <span className="text-sm text-texto-secundario">Sin disponibilidad.</span>
                  )}
                </div>
              </div>
            </aside>

            <form onSubmit={reservar} className="rounded-[28px] border border-borde-suave bg-white p-6 shadow-sm xl:p-8">
              <h2 className="text-3xl font-black text-texto-principal">Reservar turno</h2>
              <p className="mt-2 text-sm text-texto-secundario">Completa los datos para registrar tu turno.</p>
              <div className="mt-6 grid gap-4 xl:grid-cols-2">
                <div>
                  <Label>Servicio</Label>
                  <Select value={servicio} onChange={(e) => setServicio(e.target.value)}>
                    {profesionalDetalle.servicios.map((s) => <option key={s}>{s}</option>)}
                  </Select>
                </div>
                <div>
                  <Label>Fecha</Label>
                  <Input type="date" value={fechaDeseada} onChange={(e) => setFechaDeseada(e.target.value)} />
                </div>
                <div className="xl:col-span-2">
                  <Label>Horario</Label>
                  <Select value={horarioSeleccionado} onChange={(e) => setHorarioSeleccionado(e.target.value)}>
                    <option value="" disabled>Selecciona un horario</option>
                    {slots.filter((s) => s.disponible).map((s) => (
                      <option key={s.iniciaEn} value={s.iniciaEn}>{s.iniciaEn.slice(11, 16)} ({s.duracionMinutos} min)</option>
                    ))}
                  </Select>
                </div>
                <div className="xl:col-span-2">
                  <Label>Observaciones opcionales</Label>
                  <Textarea rows={4} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Ej: Prefiero recordatorio por WhatsApp." />
                </div>
                <div className="xl:col-span-2 rounded-2xl border border-primario-suave bg-primario-claro p-4">
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={pagarAlReservar}
                      onChange={(e) => setPagarAlReservar(e.target.checked)}
                      className="mt-1 h-4 w-4 accent-primario"
                    />
                    <span>
                      <span className="block font-bold text-texto-principal">Pagar al reservar</span>
                      <span className="block text-sm text-texto-secundario">Pago online mockeado para dejar el turno como pagado.</span>
                    </span>
                  </label>
                  {pagarAlReservar && (
                    <div className="mt-4">
                      <Label>Medio de pago</Label>
                      <Select value={medioPago} onChange={(e) => setMedioPago(e.target.value)}>
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
                <BotonPrimario type="submit" className="w-full sm:w-auto" disabled={enviandoReserva || !horarioSeleccionado}>
                  <IconCheck className="h-5 w-5" />
                  {enviandoReserva ? 'Enviando...' : pagarAlReservar ? 'Reservar y pagar' : 'Registrar turno'}
                </BotonPrimario>
                <BotonSecundario type="button" onClick={() => verPerfilProfesional(profesionalDetalle)}>
                  Volver al perfil
                </BotonSecundario>
              </div>
            </form>
          </section>
        )}

        {seccionActual === 'notificaciones' && (
          <section className="rounded-lg border border-borde-suave bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-texto-principal">Notificaciones</h2>
                <p className="mt-1 text-sm text-texto-secundario">Recordatorios, confirmaciones, pagos y documentos.</p>
              </div>
              {notificaciones.some((n) => !n.leida) && (
                <BotonSecundario onClick={() => usuario && marcarTodasLeidas(usuario.id).then(() => getNotificaciones(usuario.id).then(setNotificaciones))}>
                  Marcar todas como leidas
                </BotonSecundario>
              )}
            </div>
            <div className="mt-5 flex flex-col gap-3">
              {notificaciones.length === 0 && <p className="text-sm text-texto-secundario">No tenes notificaciones.</p>}
              {notificaciones.map((n) => (
                <div key={n.id} className={`rounded-lg border p-4 ${n.leida ? 'border-borde bg-fondo' : 'border-primario-suave bg-primario-claro'}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-black text-texto-principal">{n.titulo}</h3>
                    <span className="rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-primario">{new Date(n.enviadaEn).toLocaleString('es-PY')}</span>
                  </div>
                  <p className="mt-2 text-sm text-texto-secundario">{n.cuerpo}</p>
                </div>
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
