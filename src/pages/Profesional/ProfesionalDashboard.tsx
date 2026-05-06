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
} from '../../api/agendas'
import { getProfesional } from '../../api/profesionales'
import {
  cancelarTurno,
  completarTurno,
  confirmarTurno,
  getTurnosProfesional,
  reservarTurno,
} from '../../api/turnos'
import { getClientesDeProfesional } from '../../api/clientes'
import { getNotificaciones, marcarTodasLeidas } from '../../api/notificaciones'
import type {
  Agenda,
  Cliente,
  DiaSemana,
  Notificacion,
  Profesional,
  Turno,
} from '../../api/types'

type SeccionProfesional = 'agenda' | 'clientes' | 'pagos' | 'notificaciones'
const seccionesValidas: SeccionProfesional[] = ['agenda', 'clientes', 'pagos', 'notificaciones']

const navItems: Array<{ label: string; seccion: SeccionProfesional | 'dashboard' }> = [
  { label: 'Dashboard', seccion: 'dashboard' },
  { label: 'Agenda', seccion: 'agenda' },
  { label: 'Clientes', seccion: 'clientes' },
  { label: 'Pagos', seccion: 'pagos' },
]

const estadoClass: Record<Turno['estado'], string> = {
  PENDIENTE: 'bg-amber-100 text-amber-800 border-amber-200',
  CONFIRMADO: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  CANCELADO: 'bg-red-100 text-red-700 border-red-200',
  COMPLETADO: 'bg-violet-100 text-violet-800 border-violet-200',
}

const estadoLabel: Record<Turno['estado'], string> = {
  PENDIENTE: 'Pendiente', CONFIRMADO: 'Confirmado', CANCELADO: 'Cancelado', COMPLETADO: 'Realizado',
}

const diasLabels: Record<DiaSemana, string> = {
  MONDAY: 'Lunes', TUESDAY: 'Martes', WEDNESDAY: 'Miercoles', THURSDAY: 'Jueves',
  FRIDAY: 'Viernes', SATURDAY: 'Sabado', SUNDAY: 'Domingo',
}

const formatPrecio = (precio: number) =>
  new Intl.NumberFormat('es-PY', { style: 'currency', currency: 'PYG', maximumFractionDigits: 0 }).format(precio)

const fechaIsoDe = (t: { iniciaEn: string }) => t.iniciaEn.slice(0, 10)
const horaDe     = (t: { iniciaEn: string }) => t.iniciaEn.slice(11, 16)

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
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])

  const [filtros, setFiltros] = useState<{ fecha: string; estado: 'Todos' | Turno['estado'] }>({ fecha: '', estado: 'Todos' })
  const [nuevoTurno, setNuevoTurno] = useState({ clienteId: '', servicio: '', fecha: '', horario: '' })

  const [nuevaAgenda, setNuevaAgenda] = useState({ nombre: 'Agenda principal', descripcion: 'Atencion presencial' })
  const [disponibilidad, setDisponibilidad] = useState({
    diaSemana: 'MONDAY' as DiaSemana, inicio: '09:00', fin: '18:00', duracion: '30',
  })

  const [menuUsuarioAbierto, setMenuUsuarioAbierto] = useState(false)
  const menuUsuarioRef = useRef<HTMLDivElement>(null)

  const profesionalId = usuario?.perfilProfesionalId ?? null

  useEffect(() => {
    if (!usuario || !usuario.roles.includes('PROFESIONAL') || profesionalId == null) {
      navigate('/profesional/login', { replace: true })
    }
  }, [usuario, profesionalId, navigate])

  useEffect(() => {
    if (!profesionalId) return
    void getProfesional(profesionalId).then(setPerfil).catch((e) => showToast(extraerError(e), 'error'))
    void getAgendasDeProfesional(profesionalId).then(setAgendas).catch((e) => showToast(extraerError(e), 'error'))
    void getTurnosProfesional(profesionalId).then(setTurnos).catch((e) => showToast(extraerError(e), 'error'))
    void getClientesDeProfesional(profesionalId).then(setClientes).catch((e) => showToast(extraerError(e), 'error'))
    if (usuario) void getNotificaciones(usuario.id).then(setNotificaciones).catch((e) => showToast(extraerError(e), 'error'))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profesionalId, usuario?.id])

  const agendaPrincipal = agendas[0] ?? null

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
        estado: t.pago!.estado,
        notas: t.notas,
      })),
    [turnos],
  )

  const pathDeSeccion = (item: { seccion: SeccionProfesional | 'dashboard' }) =>
    item.seccion === 'dashboard' ? '/profesional' : `/profesional/${item.seccion}`

  const cerrarSesion = () => {
    cerrar()
    navigate('/profesional/login')
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
    if (!nuevoTurno.clienteId || !nuevoTurno.fecha || !nuevoTurno.horario) {
      showToast('Completa cliente, fecha y horario', 'error')
      return
    }
    try {
      const turno = await reservarTurno({
        agendaId: agendaPrincipal.id,
        clienteId: parseInt(nuevoTurno.clienteId, 10),
        iniciaEn: `${nuevoTurno.fecha}T${nuevoTurno.horario}:00`,
        duracionMinutos: 45,
        notas: nuevoTurno.servicio,
      })
      setTurnos((act) => [turno, ...act])
      showToast('Turno creado', 'success')
      setNuevoTurno({ clienteId: '', servicio: '', fecha: '', horario: '' })
    } catch (err) { showToast(extraerError(err), 'error') }
  }

  const onCambiarEstado = async (id: string, accion: 'confirmar' | 'cancelar' | 'completar') => {
    try {
      const fn = accion === 'confirmar' ? confirmarTurno : accion === 'completar' ? completarTurno : cancelarTurno
      const t = await fn(id)
      setTurnos((act) => act.map((x) => (x.id === id ? t : x)))
    } catch (err) { showToast(extraerError(err), 'error') }
  }

  const inicialesProf = (perfil?.nombreCompleto ?? usuario?.nombreCompleto ?? '')
    .split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()

  if (!usuario || profesionalId == null) return null

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
                  `rounded-lg px-3 py-2 ${isActive ? 'bg-primario-claro text-primario' : 'hover:bg-primario-claro hover:text-primario'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <NavLink
              to="/profesional/notificaciones"
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 ${isActive ? 'bg-primario-claro text-primario' : 'hover:bg-primario-claro hover:text-primario'}`
              }
            >
              Notificaciones {notificaciones.filter((n) => !n.leida).length > 0 && `(${notificaciones.filter((n) => !n.leida).length})`}
            </NavLink>
          </nav>
          <div ref={menuUsuarioRef} className="relative flex items-center justify-end">
            <button onClick={() => setMenuUsuarioAbierto((v) => !v)} className="flex items-center gap-3 rounded-full border border-borde bg-white px-2 py-1.5 shadow-sm hover:bg-primario-claro">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primario text-sm font-black text-white">
                {inicialesProf || 'P'}
              </span>
              <svg className={`h-4 w-4 text-texto-secundario transition-transform ${menuUsuarioAbierto ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0l-4.25-4.51a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              </svg>
            </button>
            {menuUsuarioAbierto && (
              <div className="absolute right-0 top-[calc(100%+0.6rem)] min-w-[220px] rounded-2xl border border-borde bg-white p-2 shadow-lg">
                <div className="border-b border-borde-suave px-3 py-2">
                  <p className="text-sm font-bold text-texto-principal">{usuario.nombreCompleto}</p>
                  <p className="text-xs text-texto-secundario">{usuario.email}</p>
                </div>
                <button onClick={cerrarSesion} className="mt-2 flex w-full items-center rounded-xl px-3 py-2 text-left text-sm font-semibold text-peligro hover:bg-peligro-suave">
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
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {turnosDeHoy.map((t) => (
                <article key={t.id} className="rounded-lg border border-borde bg-fondo p-4">
                  <h3 className="font-black text-texto-principal">{horaDe(t)} - {t.clienteNombre}</h3>
                  <p className="text-sm text-texto-secundario">{t.notas || 'Sin notas'}</p>
                  <span className={`mt-3 inline-flex rounded-lg border px-2.5 py-1 text-xs font-bold ${estadoClass[t.estado]}`}>{estadoLabel[t.estado]}</span>
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
                  <h2 className="text-2xl font-black text-texto-principal">Mi agenda</h2>
                  <p className="mt-1 text-sm text-texto-secundario">{agendaPrincipal.nombre}</p>
                  <p className="mt-1 text-xs text-texto-secundario">{agendaPrincipal.descripcion}</p>

                  <h3 className="mt-6 text-lg font-bold text-texto-principal">Configuraciones horarias</h3>
                  <div className="mt-3 space-y-2">
                    {agendaPrincipal.configuraciones.length === 0 && (
                      <p className="text-sm text-texto-secundario">Aun no agregaste disponibilidades.</p>
                    )}
                    {agendaPrincipal.configuraciones.map((c) => (
                      <div key={c.id} className="flex items-center justify-between rounded-lg border border-borde bg-fondo px-4 py-2">
                        <div className="text-sm text-texto-principal">
                          <span className="font-bold">{diasLabels[c.diaSemana]}</span> · {c.inicioSlot.slice(0,5)} a {c.finSlot.slice(0,5)} · cada {c.duracionSlotMinutos} min
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

            <section className="rounded-lg border border-borde-suave bg-white p-6 shadow-sm xl:p-7">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <h2 className="text-2xl font-black text-texto-principal">Gestionar turnos</h2>
                  <p className="text-sm text-texto-secundario">Confirmar, cancelar o marcar como realizados.</p>
                </div>
                <div className="grid gap-3 lg:grid-cols-3 xl:min-w-[620px]">
                  <div><Label>Fecha</Label><Input type="date" value={filtros.fecha} onChange={(e) => setFiltros({ ...filtros, fecha: e.target.value })} /></div>
                  <div>
                    <Label>Estado</Label>
                    <Select value={filtros.estado} onChange={(e) => setFiltros({ ...filtros, estado: e.target.value as typeof filtros.estado })}>
                      <option value="Todos">Todos</option>
                      <option value="PENDIENTE">Pendiente</option>
                      <option value="CONFIRMADO">Confirmado</option>
                      <option value="CANCELADO">Cancelado</option>
                      <option value="COMPLETADO">Realizado</option>
                    </Select>
                  </div>
                  <BotonSecundario type="button" className="self-end" onClick={() => setFiltros({ fecha: '', estado: 'Todos' })}>Limpiar filtros</BotonSecundario>
                </div>
              </div>

              <form onSubmit={onCrearTurno} className="mt-6 grid gap-3 rounded-lg border border-borde bg-fondo p-4 lg:grid-cols-[1.1fr_1.1fr_0.9fr_0.8fr_auto]">
                <div>
                  <Label>Cliente</Label>
                  <Select value={nuevoTurno.clienteId} onChange={(e) => setNuevoTurno({ ...nuevoTurno, clienteId: e.target.value })}>
                    <option value="">Seleccionar...</option>
                    {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombreCompleto}</option>)}
                  </Select>
                </div>
                <div><Label>Servicio (notas)</Label><Input value={nuevoTurno.servicio} onChange={(e) => setNuevoTurno({ ...nuevoTurno, servicio: e.target.value })} /></div>
                <div><Label>Fecha</Label><Input type="date" value={nuevoTurno.fecha} onChange={(e) => setNuevoTurno({ ...nuevoTurno, fecha: e.target.value })} /></div>
                <div><Label>Horario</Label><Input type="time" value={nuevoTurno.horario} onChange={(e) => setNuevoTurno({ ...nuevoTurno, horario: e.target.value })} /></div>
                <BotonPrimario type="submit" className="self-end">Crear turno</BotonPrimario>
              </form>

              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[820px] border-separate border-spacing-y-2 text-left text-sm">
                  <thead>
                    <tr className="text-xs uppercase text-texto-secundario">
                      <th className="px-3 py-2">Cliente</th>
                      <th className="px-3 py-2">Notas</th>
                      <th className="px-3 py-2">Fecha</th>
                      <th className="px-3 py-2">Estado</th>
                      <th className="px-3 py-2">Pago</th>
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
                        <td className="px-3 py-3 font-semibold text-texto-principal">{t.pago?.estado ?? '-'}</td>
                        <td className="rounded-r-lg px-3 py-3">
                          <div className="flex flex-wrap gap-2">
                            {t.estado === 'PENDIENTE' && <button onClick={() => onCambiarEstado(t.id, 'confirmar')} className="rounded-lg border border-primario-suave bg-white px-3 py-2 text-xs font-bold text-primario hover:bg-primario-claro">Confirmar</button>}
                            {t.estado === 'CONFIRMADO' && <button onClick={() => onCambiarEstado(t.id, 'completar')} className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50">Realizado</button>}
                            {t.estado !== 'CANCELADO' && t.estado !== 'COMPLETADO' && <button onClick={() => onCambiarEstado(t.id, 'cancelar')} className="rounded-lg border border-peligro-suave bg-white px-3 py-2 text-xs font-bold text-peligro hover:bg-peligro-suave">Cancelar</button>}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {turnosFiltrados.length === 0 && (
                      <tr><td colSpan={6} className="px-3 py-6 text-center text-sm text-texto-secundario">Sin turnos.</td></tr>
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
              {clientes.map((c) => {
                const turnosCliente = turnos.filter((t) => t.clienteId === c.id)
                return (
                  <div key={c.id} className="rounded-lg border border-borde bg-fondo p-4">
                    <h3 className="font-black text-texto-principal">{c.nombreCompleto}</h3>
                    <p className="text-sm text-texto-secundario">{c.email} - {c.telefono}</p>
                    <div className="mt-3">
                      <span className="text-xs font-bold uppercase text-texto-secundario">Historial</span>
                      <ul className="mt-1 list-inside list-disc text-sm text-texto-secundario">
                        {turnosCliente.map((t) => (
                          <li key={t.id}>{fechaIsoDe(t)} {horaDe(t)} - {estadoLabel[t.estado]} {t.notas && `(${t.notas})`}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )
              })}
              {clientes.length === 0 && <p className="text-sm text-texto-secundario">Aun no tenes clientes con turnos.</p>}
            </div>
          </section>
        )}

        {seccionActual === 'pagos' && (
          <section className="rounded-lg border border-borde-suave bg-white p-6 shadow-sm xl:p-7">
            <h2 className="text-2xl font-black text-texto-principal">Pagos</h2>
            <p className="mt-1 text-sm text-texto-secundario">Pagos asociados a tus turnos.</p>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[720px] border-separate border-spacing-y-2 text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase text-texto-secundario">
                    <th className="px-3 py-2">Cliente</th>
                    <th className="px-3 py-2">Turno</th>
                    <th className="px-3 py-2">Fecha</th>
                    <th className="px-3 py-2">Monto</th>
                    <th className="px-3 py-2">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {pagosTabla.map((p) => (
                    <tr key={p.id} className="bg-fondo">
                      <td className="rounded-l-lg px-3 py-3 font-bold text-texto-principal">{p.clienteNombre}</td>
                      <td className="px-3 py-3 text-texto-secundario">{p.notas || p.agendaNombre}</td>
                      <td className="px-3 py-3 text-texto-secundario">{p.fecha}</td>
                      <td className="px-3 py-3 font-bold text-primario">{formatPrecio(p.monto)}</td>
                      <td className="rounded-r-lg px-3 py-3">{p.estado}</td>
                    </tr>
                  ))}
                  {pagosTabla.length === 0 && (
                    <tr><td colSpan={5} className="px-3 py-6 text-center text-sm text-texto-secundario">Sin pagos registrados.</td></tr>
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
