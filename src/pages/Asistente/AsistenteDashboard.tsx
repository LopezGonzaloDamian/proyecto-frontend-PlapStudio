import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, NavLink, useNavigate, useParams } from 'react-router-dom'
import { IconCalendar } from '../../components/LandingPage/Icons'
import { BotonPrimario, BotonSecundario, Input, Label, Select, Textarea } from '../../components/common/ui'
import { useSesion } from '../../customHooks/useSesion'
import { useToast } from '../../customHooks/useToast'
import { Toast } from '../../components/common/toast'
import { extraerError } from '../../api/client'
import { getAgendasDeProfesional, getSlots } from '../../api/agendas'
import {
  cancelarTurnoAsistente,
  getProfesionalesDeAsistente,
  getTurnosDeAsistente,
  modificarTurnoAsistente,
  reservarTurnoAsistente,
} from '../../api/asistentes'
import { buscarClientePorEmail, getClientesDeProfesional } from '../../api/clientes'
import type {
  Agenda,
  AsistenteAsignacion,
  Cliente,
  Slot,
  Turno,
} from '../../api/types'

type SeccionAsistente = 'agenda' | 'clientes' | 'historial'
const seccionesValidas: SeccionAsistente[] = ['agenda', 'clientes', 'historial']

const navItems: Array<{ label: string; seccion: SeccionAsistente | 'dashboard' }> = [
  { label: 'Panel de Control', seccion: 'dashboard' },
  { label: 'Agenda', seccion: 'agenda' },
  { label: 'Clientes', seccion: 'clientes' },
  { label: 'Historial', seccion: 'historial' },
]

const estadoClass: Record<Turno['estado'], string> = {
  CONFIRMADO: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  CANCELADO: 'bg-red-100 text-red-700 border-red-200',
}
const estadoLabel: Record<Turno['estado'], string> = {
  CONFIRMADO: 'Confirmado', CANCELADO: 'Cancelado',
}

const fechaIsoDe = (t: { iniciaEn: string }) => t.iniciaEn.slice(0, 10)
const horaDe     = (t: { iniciaEn: string }) => t.iniciaEn.slice(11, 16)
const abrirCalendario = (input: HTMLInputElement) => input.showPicker?.()
const slotReservable = (slot: Slot) =>
  slot.disponible && new Date(slot.iniciaEn).getTime() > Date.now()
const fechaCortaDe = (t: { iniciaEn: string }) =>
  new Date(t.iniciaEn).toLocaleDateString('es-PY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).replace('.', '')

export default function AsistenteDashboard() {
  const { seccion } = useParams()
  const navigate = useNavigate()
  const { usuario, cerrar } = useSesion()
  const { toast, showToast } = useToast()

  const seccionActual = seccionesValidas.includes(seccion as SeccionAsistente)
    ? (seccion as SeccionAsistente)
    : 'dashboard'

  const [profesionales, setProfesionales] = useState<AsistenteAsignacion[]>([])
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [agendaPorProfesional, setAgendaPorProfesional] = useState<Record<number, Agenda | null>>({})
  const [slotsTurnoNuevo, setSlotsTurnoNuevo] = useState<Slot[]>([])

  const [filtrosAgenda, setFiltrosAgenda] = useState({ profesionalId: '', fechaDesde: '', fechaHasta: '' })
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
  const [turnoCancelarId, setTurnoCancelarId] = useState('')
  const [motivoCancelacion, setMotivoCancelacion] = useState('')
  const [busquedaCliente, setBusquedaCliente] = useState('')
  const [filtrosHistorial, setFiltrosHistorial] = useState({ profesionalId: 'Todos', fecha: '', estado: 'Todos' as 'Todos' | Turno['estado'] })
  const [fechaCalendario, setFechaCalendario] = useState(() => new Date().toISOString().slice(0, 10))

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
    void getProfesionalesDeAsistente(usuario.id).then(setProfesionales).catch((e) => showToast(extraerError(e), 'error'))
    void getTurnosDeAsistente(usuario.id).then(setTurnos).catch((e) => showToast(extraerError(e), 'error'))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario?.id])

  useEffect(() => {
    if (!usuario) return

    const refrescarTurnos = () => {
      void getTurnosDeAsistente(usuario.id).then(setTurnos).catch(() => undefined)
    }

    const intervalo = window.setInterval(refrescarTurnos, 1500)
    return () => window.clearInterval(intervalo)
  }, [usuario])

  // Cuando hay profesionales, cargar clientes y agendas de los asignados
  useEffect(() => {
    if (profesionales.length === 0) return
    if (!filtrosAgenda.profesionalId) {
      setFiltrosAgenda((f) => ({ ...f, profesionalId: String(profesionales[0].profesionalId) }))
    }
    if (!turnoNuevo.profesionalId) {
      setTurnoNuevo((n) => ({ ...n, profesionalId: String(profesionales[0].profesionalId) }))
    }
    Promise.all(profesionales.map((a) => getClientesDeProfesional(a.profesionalId)))
      .then((listas) => {
        const map = new Map<number, Cliente>()
        listas.flat().forEach((c) => map.set(c.id, c))
        setClientes(Array.from(map.values()))
      })
      .catch((e) => showToast(extraerError(e), 'error'))

    profesionales.forEach((a) => {
      getAgendasDeProfesional(a.profesionalId)
        .then((ags) => setAgendaPorProfesional((m) => ({ ...m, [a.profesionalId]: ags[0] ?? null })))
        .catch(() => {})
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profesionales])

  const slotsReservablesTurnoNuevo = useMemo(
    () => slotsTurnoNuevo.filter(slotReservable),
    [slotsTurnoNuevo],
  )

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
    const t = turnos.find((x) => x.id === turnoEditarId)
    if (!t) return
    setTurnoEditar({ fecha: fechaIsoDe(t), horario: horaDe(t), duracion: String(t.duracionMinutos), estado: t.estado, notas: t.notas })
  }, [turnoEditarId, turnos])

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
      const okDesde = !filtrosAgenda.fechaDesde || fechaIsoDe(t) >= filtrosAgenda.fechaDesde
      const okHasta = !filtrosAgenda.fechaHasta || fechaIsoDe(t) <= filtrosAgenda.fechaHasta
      return okProf && okDesde && okHasta
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
      const texto = `${c.nombreCompleto} ${c.email ?? ''} ${c.telefono ?? ''}`.toLowerCase()
      return q.length === 0 || texto.includes(q)
    })
  }, [clientes, turnos, busquedaCliente])

  const historialFiltrado = useMemo(() =>
    turnos.filter((t) => {
      const okProf  = filtrosHistorial.profesionalId === 'Todos' || t.profesionalId === Number(filtrosHistorial.profesionalId)
      const okFecha = filtrosHistorial.fecha.length === 0 || fechaIsoDe(t) === filtrosHistorial.fecha
      const okEst   = filtrosHistorial.estado === 'Todos' || t.estado === filtrosHistorial.estado
      return okProf && okFecha && okEst
    }),
    [turnos, filtrosHistorial],
  )

  const turnosDelDia = useMemo(() => {
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

  const cerrarSesion = () => {
    cerrandoSesionRef.current = true
    cerrar()
    navigate('/login', { replace: true })
  }

  const inicialesAsistente = (usuario?.nombreCompleto ?? '')
    .split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()

  const refrescarTurnos = () => {
    if (usuario) void getTurnosDeAsistente(usuario.id).then(setTurnos)
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
      ? !turnoNuevo.clienteExternoNombre.trim() || !turnoNuevo.clienteExternoTelefono.trim()
      : !turnoNuevo.clienteEmail.trim()
    if (clienteIncompleto || !turnoNuevo.fecha || !turnoNuevo.horario) {
      showToast('Completa cliente, fecha y horario', 'error')
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

  const onCancelarTurno = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!turnoCancelarId) return
    try {
      if (!usuario) return
      await cancelarTurnoAsistente(usuario.id, turnoCancelarId, motivoCancelacion || undefined)
      refrescarTurnos()
      setMotivoCancelacion('')
      showToast('Turno cancelado', 'success')
    } catch (err) { showToast(extraerError(err), 'error') }
  }

  if (!usuario) return null

  return (
    <div className="min-h-screen bg-fondo text-texto-principal">
      <header className="sticky top-0 z-40 border-b border-[#BBD7FF] bg-[#EAF2FF]/95 text-[#111827] shadow-sm backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-6 px-5 py-3 sm:px-8 xl:px-10">
          <Link to="/asistente" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primario text-white">
              <IconCalendar className="h-5 w-5" />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-xl font-black text-[#111827]">Agendify</span>
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-texto-secundario">Asistente</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-3 text-sm font-semibold text-texto-secundario lg:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.seccion}
                to={item.seccion === 'dashboard' ? '/asistente' : `/asistente/${item.seccion}`}
                end={item.seccion === 'dashboard'}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 ${isActive ? 'bg-primario text-white' : 'hover:bg-white hover:text-primario'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div ref={menuUsuarioRef} className="relative">
            <button onClick={() => setMenuUsuarioAbierto((v) => !v)} className="flex items-center gap-3 rounded-full border border-[#BBD7FF] bg-[#F3F7FF] px-2 py-1.5 shadow-sm hover:bg-white">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primario text-sm font-black text-white">{inicialesAsistente || 'A'}</span>
              <svg className={`h-4 w-4 text-texto-secundario transition-transform ${menuUsuarioAbierto ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
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
          <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
            <article className="rounded-lg border border-borde-suave bg-white p-6 shadow-sm xl:p-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-black text-texto-principal">Turnos del dia</h2>
                  <p className="text-sm text-texto-secundario">Agenda operativa para hoy.</p>
                </div>
                <BotonSecundario onClick={() => navigate('/asistente/agenda')}>Ver agenda</BotonSecundario>
              </div>
              <div className="mt-5 grid gap-4">
                {turnosDelDia.map((t) => (
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
                {turnosDelDia.length === 0 && <p className="text-sm text-texto-secundario">Sin turnos para hoy.</p>}
              </div>
            </article>

            <article className="rounded-lg border border-borde-suave bg-white p-6 shadow-sm xl:p-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-black text-texto-principal">Calendario</h2>
                  <p className="text-sm text-texto-secundario">Vista mensual de turnos asignados.</p>
                </div>
                <Input type="date" value={fechaCalendario} onClick={(e) => abrirCalendario(e.currentTarget)} onChange={(e) => setFechaCalendario(e.target.value)} className="max-w-[190px]" />
              </div>

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
                      onClick={() => setFechaCalendario(fechaIso)}
                      className={`min-h-[86px] rounded-lg border p-2 text-left ${
                        sel ? 'border-primario bg-primario-claro' : 'border-borde bg-fondo hover:border-primario-suave hover:bg-white'
                      } ${esMes ? 'opacity-100' : 'opacity-45'}`}
                    >
                      <span className="text-sm font-black text-texto-principal">{dia.getDate()}</span>
                      <div className="mt-2 grid gap-1">
                        {turnosDia.slice(0, 2).map((t) => (
                          <span key={t.id} className="truncate rounded bg-white px-1.5 py-1 text-[11px] font-bold text-primario">
                            {horaDe(t)} {t.profesionalNombre.split(' ')[0]}
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
            <section className="rounded-lg border border-borde-suave bg-white p-6 shadow-sm xl:p-7">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <h2 className="text-2xl font-black text-texto-principal">Agenda asignada</h2>
                  <p className="text-sm text-texto-secundario">Filtra por profesional y rango de fechas.</p>
                </div>
                <div className="grid gap-3 lg:grid-cols-3 xl:min-w-[760px]">
                  <div>
                    <Label>Profesional</Label>
                    <Select value={filtrosAgenda.profesionalId} onChange={(e) => setFiltrosAgenda({ ...filtrosAgenda, profesionalId: e.target.value })}>
                      {profesionales.map((p) => <option key={p.profesionalId} value={p.profesionalId}>{p.profesionalNombre}</option>)}
                    </Select>
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

              <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-[920px] border-separate border-spacing-y-2 text-left text-sm">
                  <thead>
                    <tr className="text-xs uppercase text-texto-secundario">
                      <th className="px-3 py-2">Profesional</th>
                      <th className="px-3 py-2">Cliente</th>
                      <th className="px-3 py-2">Fecha</th>
                      <th className="px-3 py-2">Horario</th>
                      <th className="px-3 py-2">Estado</th>
                      <th className="px-3 py-2">Notas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {turnosAgenda.map((t) => (
                      <tr key={t.id} className="bg-fondo">
                        <td className="rounded-l-lg px-3 py-3 font-bold text-texto-principal">{t.profesionalNombre}</td>
                        <td className="px-3 py-3 text-texto-secundario">{t.clienteNombre}</td>
                        <td className="px-3 py-3 text-texto-secundario">{fechaIsoDe(t)}</td>
                        <td className="px-3 py-3 text-texto-secundario">{horaDe(t)}</td>
                        <td className="px-3 py-3"><span className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${estadoClass[t.estado]}`}>{estadoLabel[t.estado]}</span></td>
                        <td className="rounded-r-lg px-3 py-3 text-texto-secundario">{t.notas || 'Sin notas'}</td>
                      </tr>
                    ))}
                    {turnosAgenda.length === 0 && (
                      <tr><td colSpan={7} className="px-3 py-6 text-center text-sm text-texto-secundario">Sin turnos.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              <form onSubmit={onCrearTurno} className="rounded-lg border border-borde-suave bg-white p-6 shadow-sm xl:col-span-2 xl:p-7">
                <h2 className="text-2xl font-black text-texto-principal">Asignar turno</h2>
                <p className="text-sm text-texto-secundario">Registra un turno para un cliente registrado o no registrado.</p>
                <div className="mt-6 grid gap-4 rounded-lg border border-borde bg-fondo p-4 lg:grid-cols-4">
                  <div className="lg:max-w-[270px]">
                    <Label>Profesional</Label>
                    <Select value={turnoNuevo.profesionalId} onChange={(e) => setTurnoNuevo({ ...turnoNuevo, profesionalId: e.target.value })}>
                      {profesionales.map((p) => <option key={p.profesionalId} value={p.profesionalId}>{p.profesionalNombre}</option>)}
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
                    <Label>Servicio (notas)</Label>
                    <Input value={turnoNuevo.notas} onChange={(e) => setTurnoNuevo({ ...turnoNuevo, notas: e.target.value })} />
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
                    <BotonPrimario type="submit" className="min-w-[220px]">Asignar</BotonPrimario>
                  </div>
                </div>
              </form>

              <div className="grid gap-6">
                <form onSubmit={onModificarTurno} className="rounded-lg border border-borde-suave bg-white p-6 shadow-sm xl:p-7">
                  <h2 className="text-2xl font-black text-texto-principal">Modificar turno</h2>
                  <div className="mt-5 grid gap-4 lg:grid-cols-2">
                    <div className="lg:max-w-[270px]">
                      <Label>Seleccionar turno</Label>
                      <Select value={turnoEditarId} onChange={(e) => setTurnoEditarId(e.target.value)}>
                        <option value="">Seleccionar...</option>
                        {turnos.filter((t) => t.estado !== 'CANCELADO').map((t) => (
                          <option key={t.id} value={t.id}>{t.profesionalNombre} - {fechaIsoDe(t)} {horaDe(t)}</option>
                        ))}
                      </Select>
                    </div>
                    <div><Label>Fecha</Label><Input type="date" value={turnoEditar.fecha} onClick={(e) => abrirCalendario(e.currentTarget)} onChange={(e) => setTurnoEditar({ ...turnoEditar, fecha: e.target.value })} /></div>
                    <div><Label>Horario</Label><Input type="time" value={turnoEditar.horario} onChange={(e) => setTurnoEditar({ ...turnoEditar, horario: e.target.value })} /></div>
                    <div className="lg:col-span-2"><Label>Notas</Label><Textarea rows={3} value={turnoEditar.notas} onChange={(e) => setTurnoEditar({ ...turnoEditar, notas: e.target.value })} /></div>
                    <BotonPrimario type="submit" className="lg:col-span-2" disabled={!turnoEditarId}>Actualizar turno</BotonPrimario>
                  </div>
                </form>

                <div className="grid gap-6 lg:grid-cols-2">
                  <form onSubmit={onCancelarTurno} className="rounded-lg border border-borde-suave bg-white p-6 shadow-sm">
                    <h2 className="text-xl font-black text-texto-principal">Cancelar turno</h2>
                    <div className="mt-5 grid gap-4">
                      <div>
                        <Label>Seleccionar turno</Label>
                        <Select value={turnoCancelarId} onChange={(e) => setTurnoCancelarId(e.target.value)}>
                          <option value="">Seleccionar...</option>
                          {turnos.filter((t) => t.estado !== 'CANCELADO').map((t) => (
                            <option key={t.id} value={t.id}>{t.profesionalNombre} - {fechaIsoDe(t)} {horaDe(t)}</option>
                          ))}
                        </Select>
                      </div>
                      <div><Label>Motivo opcional</Label><Textarea rows={3} value={motivoCancelacion} onChange={(e) => setMotivoCancelacion(e.target.value)} /></div>
                      <BotonSecundario type="submit" disabled={!turnoCancelarId}>Cancelar turno</BotonSecundario>
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
                <h2 className="text-2xl font-black text-texto-principal">Clientes</h2>
                <p className="text-sm text-texto-secundario">Personas con turnos en agendas asignadas.</p>
              </div>
              <div className="w-full xl:max-w-sm">
                <Label>Buscar cliente</Label>
                <Input value={busquedaCliente} onChange={(e) => setBusquedaCliente(e.target.value)} placeholder="Ej: Ana Garcia" />
              </div>
            </div>
            <div className="mt-6 grid gap-4 xl:grid-cols-2">
              {clientesFiltrados.map((c) => {
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
                    <div className="mt-5 border-t border-borde-suave pt-4">
                      <span className="text-xs font-bold uppercase text-texto-secundario">Historial de turnos</span>
                    </div>
                    <div className="mt-2 grid gap-2">
                      {c.turnos.map((t) => (
                        <div key={t.id} className="rounded-lg border border-borde-suave bg-white px-3 py-2">
                          <p className="text-sm font-semibold text-texto-principal">{t.profesionalNombre}</p>
                          <p className="text-sm text-texto-secundario">
                            {fechaIsoDe(t)} - {horaDe(t)} · {estadoLabel[t.estado]}
                          </p>
                        </div>
                      ))}
                    </div>
                  </article>
                )
              })}
              {clientesFiltrados.length === 0 && <p className="text-sm text-texto-secundario">Sin clientes.</p>}
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
              <div className="grid gap-3 lg:grid-cols-3 xl:max-w-4xl">
                <div>
                  <Label>Profesional</Label>
                  <Select value={filtrosHistorial.profesionalId} onChange={(e) => setFiltrosHistorial({ ...filtrosHistorial, profesionalId: e.target.value })}>
                    <option value="Todos">Todos</option>
                    {profesionales.map((p) => <option key={p.profesionalId} value={p.profesionalId}>{p.profesionalNombre}</option>)}
                  </Select>
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
                    <th className="px-3 py-2">Notas</th>
                  </tr>
                </thead>
                <tbody>
                  {historialFiltrado.map((t) => (
                    <tr key={t.id} className="bg-fondo">
                      <td className="rounded-l-lg px-3 py-3 font-bold text-texto-principal">{t.profesionalNombre}</td>
                      <td className="px-3 py-3 text-texto-secundario">{t.clienteNombre}</td>
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

      </main>

      <div id="toast-container">
        <Toast toast={toast} />
      </div>
    </div>
  )
}

