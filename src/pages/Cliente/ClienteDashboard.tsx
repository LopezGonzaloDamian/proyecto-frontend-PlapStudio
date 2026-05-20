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
  { label: 'Panel de Control', seccion: 'dashboard' },
  { label: 'Buscar', seccion: 'buscar' },
]

const formatPrecio = (precio: number) =>
  `$ ${new Intl.NumberFormat('es-PY', { maximumFractionDigits: 0 }).format(precio)}`

const estadoClass: Record<Turno['estado'], string> = {
  CONFIRMADO: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  CANCELADO: 'bg-red-100 text-red-700 border-red-200',
}

const estadoLabel: Record<Turno['estado'], string> = {
  CONFIRMADO: 'Confirmado',
  CANCELADO: 'Cancelado',
}

function fechaIsoDe(t: { iniciaEn: string }): string {
  return t.iniciaEn.slice(0, 10)
}

function horaDe(t: { iniciaEn: string }): string {
  return t.iniciaEn.slice(11, 16)
}

function fechaCortaDe(t: { iniciaEn: string }): string {
  return new Date(t.iniciaEn).toLocaleDateString('es-PY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).replace('.', '')
}

function textoPdfSeguro(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
}

type PdfObjeto = string | Uint8Array
type PdfObjetoCompleto = PdfObjeto | PdfObjeto[]

function asciiBytes(texto: string) {
  return Uint8Array.from(texto, (char) => char.charCodeAt(0))
}

function descargarBlobPdf(nombreArchivo: string, objetos: PdfObjetoCompleto[]) {
  const chunks: Uint8Array[] = []
  const offsets = [0]
  let length = 0

  const push = (parte: PdfObjeto) => {
    const bytes = typeof parte === 'string' ? asciiBytes(parte) : parte
    chunks.push(bytes)
    length += bytes.length
  }

  push('%PDF-1.4\n')
  objetos.forEach((objeto) => {
    offsets.push(length)
    const partes = Array.isArray(objeto) ? objeto : [objeto]
    partes.forEach(push)
  })

  const xrefOffset = length
  push(`xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n`)
  offsets.slice(1).forEach((offset) => {
    push(`${String(offset).padStart(10, '0')} 00000 n \n`)
  })
  push(`trailer\n<< /Size ${objetos.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`)

  const blob = new Blob(chunks as unknown as BlobPart[], { type: 'application/pdf' })
  const url = globalThis.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nombreArchivo
  link.click()
  globalThis.URL.revokeObjectURL(url)
}

function descargarPdf(nombreArchivo: string, contenido: string, logo?: { bytes: Uint8Array; width: number; height: number }) {
  const recursosImagen = logo ? ' /XObject << /Im1 6 0 R >>' : ''
  const contenidoObjetoId = logo ? 7 : 6
  const objetos: PdfObjetoCompleto[] = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >>${recursosImagen} >> /Contents ${contenidoObjetoId} 0 R >>\nendobj\n`,
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n',
  ]

  if (logo) {
    objetos.push([
      `6 0 obj\n<< /Type /XObject /Subtype /Image /Width ${logo.width} /Height ${logo.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${logo.bytes.length} >>\nstream\n`,
      logo.bytes,
      '\nendstream\nendobj\n',
    ])
  }

  objetos.push(`${contenidoObjetoId} 0 obj\n<< /Length ${asciiBytes(contenido).length} >>\nstream\n${contenido}\nendstream\nendobj\n`)
  descargarBlobPdf(nombreArchivo, objetos)
}

async function cargarImagenPdf(src: string) {
  const respuesta = await fetch(src)
  const blob = await respuesta.blob()
  const bytes = new Uint8Array(await blob.arrayBuffer())
  const url = globalThis.URL.createObjectURL(blob)
  try {
    const dimensiones = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
      img.onerror = () => reject(new Error('No se pudo cargar el logo'))
      img.src = url
    })
    return { bytes, ...dimensiones }
  } finally {
    globalThis.URL.revokeObjectURL(url)
  }
}

function textoPdf(x: number, y: number, texto: string, size = 11, bold = false) {
  return `BT /${bold ? 'F2' : 'F1'} ${size} Tf 1 0 0 1 ${x} ${y} Tm (${textoPdfSeguro(texto)}) Tj ET`
}

function color(r: number, g: number, b: number) {
  return `${r} ${g} ${b} rg ${r} ${g} ${b} RG`
}

function linea(x1: number, y1: number, x2: number, y2: number, gris = 0.88) {
  return `${gris} ${gris} ${gris} RG ${x1} ${y1} m ${x2} ${y2} l S`
}

function circulo(x: number, y: number, radio: number) {
  return `${x - radio} ${y - radio} ${radio * 2} ${radio * 2} re f`
}

function cvuFicticio(seed: string) {
  const soloNumeros = seed.replace(/\D/g, '')
  return `00000031000${soloNumeros.padEnd(11, '0').slice(0, 11)}`
}

function numeroOperacion(seed: string) {
  return seed.replace(/\D/g, '').padEnd(12, '0').slice(0, 12)
}

function fechaComprobante(turno: Turno) {
  return `${fechaCortaDe(turno)} a las ${horaDe(turno)} hs`
}

async function descargarComprobanteReserva(params: {
  turno: Turno
  clienteNombre: string
  clienteEmail: string
  profesional: Profesional
  servicio: string
  valorTurno: number
  senaReserva: number
  medioPago: string
}) {
  const motivo = params.servicio.trim() || 'Varios'
  const logo = await cargarImagenPdf('/img/mercado-pago.jpg').catch(() => undefined)
  const contenido = [
    logo ? 'q 92 0 0 47 55 775 cm /Im1 Do Q' : [
      color(0.0, 0.35, 0.85),
      circulo(70, 805, 14),
      textoPdf(92, 805, 'mercado', 16, true),
      textoPdf(92, 788, 'pago', 16, true),
    ].join('\n'),

    color(0, 0, 0),
    textoPdf(55, 748, 'Comprobante de transferencia', 18, true),
    textoPdf(55, 726, fechaComprobante(params.turno), 10),
    linea(55, 700, 430, 700),

    textoPdf(55, 662, formatPrecio(params.senaReserva), 25, true),
    textoPdf(55, 642, `Motivo: ${motivo}`, 10),

    color(0.12, 0.48, 1),
    circulo(58, 590, 3),
    linea(58, 586, 58, 476, 0.75),
    circulo(58, 472, 3),

    color(0, 0, 0),
    textoPdf(72, 582, 'De', 11),
    textoPdf(72, 562, params.clienteNombre, 14, true),
    textoPdf(72, 542, `Email: ${params.clienteEmail}`, 10),
    textoPdf(72, 524, 'Mercado Pago', 10),
    textoPdf(72, 506, `CVU: ${cvuFicticio(params.clienteEmail)}`, 10),

    textoPdf(72, 462, 'Para', 11),
    textoPdf(72, 442, params.profesional.nombreCompleto, 14, true),
    textoPdf(72, 422, `Email: ${params.profesional.email}`, 10),
    textoPdf(72, 404, 'Mercado Pago', 10),
    textoPdf(72, 386, `CVU: ${cvuFicticio(params.profesional.email)}`, 10),

    linea(55, 350, 430, 350),
    textoPdf(55, 316, 'Numero de operacion de Mercado Pago', 10),
    textoPdf(55, 294, numeroOperacion(params.turno.id), 11, true),
  ].join('\n')

  descargarPdf(`comprobante-mercado-pago-${params.turno.id}.pdf`, contenido, logo)
}

function AvatarProfesional({ nombre, urlAvatar }: { nombre: string; urlAvatar?: string }) {
  const iniciales = nombre.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()
  return (
    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[18px] bg-primario text-2xl font-black text-white shadow-sm">
      {urlAvatar ? (
        <img src={urlAvatar} alt={nombre} className="block h-full w-full object-cover object-center" />
      ) : (
        iniciales
      )}
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
  const medioPago = 'Mercado Pago mock'
  const [mostrarCheckout, setMostrarCheckout] = useState(false)
  const [turnoConfirmado, setTurnoConfirmado] = useState<Turno | null>(null)
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
  const precioTurno = profesionalDetalle?.precio ?? 0
  const senaReserva = Math.max(Math.round(precioTurno * 0.5), 500)

  useEffect(() => {
    if (cerrandoSesionRef.current) return
    if (!usuario || usuario.perfilClienteId == null) {
      navigate('/login', { replace: true })
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

  useEffect(() => {
    if (!usuario?.perfilClienteId) return

    const refrescarDatosOperativos = () => {
      void getTurnosCliente(usuario.perfilClienteId!).then(setTurnos).catch(() => undefined)
      void getNotificaciones(usuario.id).then(setNotificaciones).catch(() => undefined)
    }

    const intervalo = window.setInterval(refrescarDatosOperativos, 1500)
    return () => window.clearInterval(intervalo)
  }, [usuario])

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
    setTurnoConfirmado(null)
    setMostrarCheckout(true)
  }

  const confirmarReserva = async () => {
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
        pagarAlReservar: true,
        medioPago,
      })
      setTurnos((actuales) => [turno, ...actuales])
      setTurnoConfirmado(turno)
      showToast('Turno reservado y seña pagada', 'success')
      // Refrescar slots y notificaciones
      void getSlots(agenda.id, fechaDeseada).then(setSlots)
      void getNotificaciones(usuario.id).then(setNotificaciones)
    } catch (err) {
      showToast(extraerError(err), 'error')
    } finally {
      setEnviandoReserva(false)
    }
  }

  const imprimirComprobante = () => {
    if (!usuario || !profesionalDetalle || !turnoConfirmado) return
    descargarComprobanteReserva({
      turno: turnoConfirmado,
      clienteNombre: usuario.nombreCompleto,
      clienteEmail: usuario.email,
      profesional: profesionalDetalle,
      servicio,
      valorTurno: precioTurno,
      senaReserva,
      medioPago,
    })
  }

  const cancelar = async (id: string) => {
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
    navigate('/login', { replace: true })
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
            <span className="flex flex-col leading-tight">
              <span className="text-xl font-black text-texto-principal">Agendify</span>
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-texto-secundario">Cliente</span>
            </span>
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
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-borde bg-white p-1 shadow-lg">
                  <button
                    onClick={cerrarSesion}
                    className="flex w-full items-center gap-2.5 rounded-lg px-4 py-2.5 text-sm font-semibold text-peligro transition-colors hover:bg-peligro-suave"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6A2.25 2.25 0 005.25 5.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                    </svg>
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
              <article className="rounded-[28px] border border-primario-suave bg-white p-6 shadow-sm xl:p-7">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <span className="text-sm font-bold uppercase tracking-[0.12em] text-primario">Hoy</span>
                    <h2 className="mt-2 text-3xl font-black text-texto-principal">Turnos del dia</h2>
                  </div>
                </div>
                <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {turnosHoy.length > 0 ? turnosHoy.map((t) => (
                    <div key={t.id} className="rounded-2xl border border-borde bg-fondo p-5 shadow-sm">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <span className="text-[11px] font-bold uppercase text-texto-suave">Fecha y hora</span>
                          <p className="mt-1 text-sm font-semibold text-texto-principal">{fechaCortaDe(t)} - {horaDe(t)}</p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex rounded-lg border px-3 py-1 text-sm font-bold ${estadoClass[t.estado]}`}>{estadoLabel[t.estado]}</span>
                        </div>
                      </div>
                      <div className="mt-5 space-y-4">
                        <div>
                          <span className="text-[11px] font-bold uppercase text-texto-suave">Profesional</span>
                          <p className="mt-1 text-sm font-semibold text-texto-principal">{t.profesionalNombre}</p>
                        </div>
                        <div>
                          <span className="text-[11px] font-bold uppercase text-texto-suave">Motivo</span>
                          <p className="mt-1 text-sm font-semibold text-texto-principal">{t.notas || t.agendaNombre}</p>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="rounded-2xl border border-dashed border-borde bg-fondo px-4 py-8 text-sm text-texto-secundario sm:col-span-2 xl:col-span-3">
                      No tenes turnos para hoy.
                    </div>
                  )}
                </div>
              </article>
            </section>

            <section className="rounded-[28px] border border-primario-suave bg-white p-6 shadow-sm xl:p-7">
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
                      <div key={t.id} className="rounded-2xl border border-borde bg-white p-5 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <span className="text-[11px] font-bold uppercase text-texto-suave">Fecha y hora</span>
                            <p className="mt-1 text-sm font-semibold text-texto-principal">{fechaCortaDe(t)} - {horaDe(t)}</p>
                          </div>
                          <span className={`inline-flex rounded-lg border px-3 py-1 text-sm font-bold ${estadoClass[t.estado]}`}>{estadoLabel[t.estado]}</span>
                        </div>
                        <div className="mt-5 space-y-4">
                          <div>
                            <span className="text-[11px] font-bold uppercase text-texto-suave">Profesional</span>
                            <p className="mt-1 text-sm font-semibold text-texto-principal">{t.profesionalNombre}</p>
                          </div>
                          <div>
                            <span className="text-[11px] font-bold uppercase text-texto-suave">Motivo</span>
                            <p className="mt-1 text-sm font-semibold text-texto-principal">{t.notas || t.agendaNombre}</p>
                          </div>
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
              <div className="mt-5 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {turnos.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-borde px-4 py-8 text-sm text-texto-secundario md:col-span-2 2xl:col-span-3">
                    Aun no tenes turnos.
                  </div>
                )}
                {turnos.map((t) => (
                  <div key={t.id} className="rounded-2xl border border-borde bg-fondo p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold uppercase text-texto-secundario">Fecha y hora</p>
                        <p className="mt-2 text-sm font-semibold text-texto-principal">{fechaCortaDe(t)} - {horaDe(t)}</p>
                      </div>
                      <span className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${estadoClass[t.estado]}`}>{estadoLabel[t.estado]}</span>
                    </div>
                    <div className="mt-5 grid gap-5">
                      <div>
                        <p className="text-xs font-bold uppercase text-texto-secundario">Profesional</p>
                        <p className="mt-2 text-sm font-semibold text-texto-principal">{t.profesionalNombre}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase text-texto-secundario">Motivo / servicio</p>
                        <p className="mt-2 text-sm font-semibold text-texto-principal">{t.notas || t.agendaNombre}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase text-texto-secundario">Monto</p>
                        <p className="mt-2 text-sm font-semibold text-texto-principal">{t.pago ? formatPrecio(t.pago.monto) : '-'}</p>
                      </div>
                    </div>
                    {t.estado !== 'CANCELADO' && (
                      <div className="mt-6 flex justify-end">
                        <button onClick={() => cancelar(t.id)} className="rounded-lg border border-peligro-suave bg-white px-4 py-2 text-xs font-bold text-peligro hover:bg-peligro-suave">Cancelar turno</button>
                      </div>
                    )}
                    </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-borde-suave bg-white p-6 shadow-sm xl:p-7">
              <h2 className="text-2xl font-black text-texto-principal">Favoritos</h2>
              <p className="text-sm text-texto-secundario">Profesionales guardados.</p>
              <div className="mt-5 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                {favoritos.map((f) => (
                  <article key={f.id} className="rounded-lg border border-borde bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="text-[11px] font-bold uppercase text-texto-suave">Profesional</span>
                        <h3 className="mt-1 text-sm font-semibold text-texto-principal">{f.profesional.nombreCompleto}</h3>
                      </div>
                      <button
                        onClick={() => toggleFavorito(f.profesional.id)}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-amber-500 transition-colors hover:bg-amber-100"
                        aria-label={`Quitar ${f.profesional.nombreCompleto} de favoritos`}
                      >
                        <IconStar className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="mt-6 grid gap-4">
                      <div>
                        <span className="text-[11px] font-bold uppercase text-texto-suave">Especialidad</span>
                        <p className="mt-1 text-sm font-semibold text-texto-principal">{f.profesional.especialidad}</p>
                      </div>
                      <div>
                        <span className="text-[11px] font-bold uppercase text-texto-suave">Ubicacion</span>
                        <p className="mt-1 text-sm font-semibold text-texto-principal">{f.profesional.ubicacion}</p>
                      </div>
                      <div>
                        <span className="text-[11px] font-bold uppercase text-texto-suave">Servicio base</span>
                        <p className="mt-1 text-sm font-semibold text-texto-principal">{formatPrecio(f.profesional.precio)}</p>
                      </div>
                    </div>

                    <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
                      <BotonSecundario type="button" onClick={() => verPerfilProfesional(f.profesional)}>
                        Ver perfil
                      </BotonSecundario>
                      <BotonSecundario type="button" onClick={() => irAReservarProfesional(f.profesional)}>
                        Reservar turno
                      </BotonSecundario>
                    </div>
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
                <div><Label>Ubicación</Label><Input value={ubicacion} onChange={(e) => setUbicacion(e.target.value)} placeholder="Ej: San Martín" /></div>
                <div><Label>Fecha deseada</Label><Input type="date" value={fechaDeseada} onChange={(e) => setFechaDeseada(e.target.value)} /></div>
              </div>
              <div className="mt-6 grid gap-4">
                {resultados.map((p) => (
                  <article key={p.id} className="rounded-[22px] border border-primario-suave bg-white p-5 shadow-sm transition-colors hover:border-primario xl:p-6">
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div className="flex gap-4">
                          <AvatarProfesional nombre={p.nombreCompleto} urlAvatar={p.urlAvatar} />
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
                      <div className="border-t border-primario-suave pt-3.5 flex justify-between">
                        <button onClick={() => verPerfilProfesional(p)} className="text-sm font-bold text-texto-secundario hover:text-primario">Ver perfil</button>
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
                <AvatarProfesional nombre={profesionalDetalle.nombreCompleto} urlAvatar={profesionalDetalle.urlAvatar} />
                <div>
                  <span className="text-xs font-bold uppercase tracking-[0.12em] text-primario">Perfil profesional</span>
                  <h2 className="mt-1 text-3xl font-black text-texto-principal">{profesionalDetalle.nombreCompleto}</h2>
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

            <section className="mt-8 rounded-[18px] border border-borde bg-fondo p-5">
              <h3 className="text-lg font-black text-texto-principal">Detalles</h3>
              <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
                <div><span className="text-[11px] font-bold uppercase text-texto-suave">Rubro</span><p className="mt-2 text-sm font-semibold">{profesionalDetalle.especialidad}</p></div>
                <div><span className="text-[11px] font-bold uppercase text-texto-suave">Telefono</span><p className="mt-2 text-sm font-semibold">{profesionalDetalle.telefono}</p></div>
                <div><span className="text-[11px] font-bold uppercase text-texto-suave">Mail</span><p className="mt-2 text-sm font-semibold break-all">{profesionalDetalle.email}</p></div>
                <div><span className="text-[11px] font-bold uppercase text-texto-suave">Direccion</span><p className="mt-2 text-sm font-semibold">{profesionalDetalle.direccion}</p></div>
                <div><span className="text-[11px] font-bold uppercase text-texto-suave">Valor del turno</span><p className="mt-2 text-sm font-semibold">{formatPrecio(profesionalDetalle.precio)}</p></div>
                <div className="sm:col-span-2 xl:col-span-5">
                  <span className="text-[11px] font-bold uppercase text-texto-suave">Turnos disponibles para:</span>
                  <div className="mt-3 flex items-center gap-2 mb-3">
                    <Input type="date" value={fechaDeseada} onChange={(e) => setFechaDeseada(e.target.value)} className="max-w-[180px]" />
                  </div>
                  {slots.filter((s) => s.disponible).length > 0 && (
                    <p className="mb-3 text-[11px] font-bold uppercase text-texto-suave">Selecciona un horario disponible:</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {slots.filter((s) => s.disponible).map((s) => (
                      <span key={s.iniciaEn} className="rounded-lg border border-primario-suave bg-white px-3 py-2 text-sm font-bold text-primario">
                        {s.iniciaEn.slice(11, 16)}
                      </span>
                    ))}
                    {slots.filter((s) => s.disponible).length === 0 && (
                      <span className="text-sm text-texto-secundario">No hay turnos disponibles para esta fecha.</span>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => irAReservarProfesional(profesionalDetalle)}
                className="inline-flex items-center justify-center gap-3 rounded-xl bg-primario px-6 py-3 text-base font-black text-white hover:bg-primario-hover"
              >
                <IconCalendar className="h-5 w-5" />
                Reservar turno
              </button>
            </div>
          </section>
        )}

        {seccionActual === 'reservar' && profesionalDetalle && (
          <section className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
            <aside className="rounded-[28px] border border-primario-suave bg-white p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <AvatarProfesional nombre={profesionalDetalle.nombreCompleto} urlAvatar={profesionalDetalle.urlAvatar} />
                <div>
                  <h2 className="text-3xl font-black text-texto-principal">{profesionalDetalle.nombreCompleto}</h2>
                </div>
              </div>
              <div className="mt-6 grid gap-3">
                <div className="rounded-2xl bg-fondo p-4">
                  <span className="text-[11px] font-bold uppercase text-texto-suave">Rubro</span>
                  <p className="mt-1 text-sm font-black text-texto-principal">{profesionalDetalle.especialidad}</p>
                </div>
                <div className="rounded-2xl bg-fondo p-4">
                  <span className="text-[11px] font-bold uppercase text-texto-suave">Direccion</span>
                  <p className="mt-1 text-sm font-black text-texto-principal">{profesionalDetalle.direccion}</p>
                </div>
                <div className="rounded-2xl bg-fondo p-4">
                  <span className="text-[11px] font-bold uppercase text-texto-suave">Valor del turno</span>
                  <p className="mt-1 text-sm font-black text-texto-principal">{formatPrecio(profesionalDetalle.precio)}</p>
                </div>
              </div>
            </aside>

            <form onSubmit={reservar} className="rounded-[28px] border border-borde-suave bg-white p-6 shadow-sm xl:p-8">
              {!mostrarCheckout ? (
                <>
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
                    <div className="xl:col-span-2 rounded-2xl bg-fondo p-4">
                      <span className="text-xs font-bold uppercase text-texto-secundario">Seleccione un horario para la fecha {fechaDeseada}</span>
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
                    <div className="xl:col-span-2">
                      <Label>Observaciones opcionales</Label>
                      <Textarea rows={4} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Ej: Prefiero recordatorio por WhatsApp." />
                    </div>
                  </div>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <BotonPrimario type="submit" className="w-full sm:w-auto" disabled={enviandoReserva || !horarioSeleccionado}>
                      <IconCheck className="h-5 w-5" />
                      Registrar turno
                    </BotonPrimario>
                    <BotonSecundario type="button" onClick={() => verPerfilProfesional(profesionalDetalle)}>
                      Volver al perfil
                    </BotonSecundario>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-3xl font-black text-texto-principal">Confirmar turno</h2>
                  <p className="mt-2 text-sm text-texto-secundario">Revisa la reserva y paga la seña para confirmar el turno.</p>

                  <div className="mt-6 rounded-2xl border border-primario-suave bg-primario-claro p-5">
                    <div className="grid gap-4 xl:grid-cols-2">
                      <div>
                        <span className="text-[11px] font-bold uppercase text-texto-suave">Profesional</span>
                        <p className="mt-1 font-black text-texto-principal">{profesionalDetalle.nombreCompleto}</p>
                      </div>
                      <div>
                        <span className="text-[11px] font-bold uppercase text-texto-suave">Servicio</span>
                        <p className="mt-1 font-black text-texto-principal">{servicio}</p>
                      </div>
                      <div>
                        <span className="text-[11px] font-bold uppercase text-texto-suave">Fecha y horario</span>
                        <p className="mt-1 font-black text-texto-principal">{fechaDeseada} - {horarioSeleccionado.slice(11, 16)}</p>
                      </div>
                    </div>

                    <div className="mt-5 rounded-2xl border border-borde bg-white p-4">
                      <div className="flex items-center justify-between gap-4 text-sm">
                        <span className="text-texto-secundario">Valor del turno</span>
                        <strong className="text-texto-principal">{formatPrecio(precioTurno)}</strong>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-4 text-sm">
                        <span className="text-texto-secundario">Seña requerida 50%</span>
                        <strong className="text-texto-principal">{formatPrecio(senaReserva)}</strong>
                      </div>
                    </div>
                  </div>

                  <section className="mt-5 rounded-2xl border border-borde bg-white p-5">
                    <h3 className="text-2xl font-black text-texto-principal">Elegi como pagar</h3>
                    <div className="mt-4 overflow-hidden rounded-2xl border border-borde bg-white">
                      <div className="flex items-center gap-4 border-b border-borde px-4 py-4">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-primario">
                          <span className="h-2.5 w-2.5 rounded-full bg-primario" />
                        </span>
                        <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-borde bg-white">
                          <img src="/img/mercado-pago.jpg" alt="Mercado Pago" className="h-full w-full object-contain p-1" />
                        </span>
                        <div>
                          <p className="font-black text-texto-principal">Mercado Pago</p>
                        </div>
                      </div>
                      <div className="bg-fondo p-4">
                        <p className="text-lg font-black text-texto-principal">Elegi las cuotas</p>
                        <div className="mt-3 rounded-xl border border-borde bg-white px-4 py-3">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-primario">
                                <span className="h-2.5 w-2.5 rounded-full bg-primario" />
                              </span>
                              <span className="font-semibold text-texto-principal">1x {formatPrecio(senaReserva)}</span>
                            </div>
                            <span className="text-xs font-semibold text-texto-secundario">Sin interes</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <BotonPrimario
                      type="button"
                      className="w-full sm:w-auto"
                      disabled={enviandoReserva}
                      onClick={turnoConfirmado ? imprimirComprobante : confirmarReserva}
                    >
                      <IconCheck className="h-5 w-5" />
                      {enviandoReserva ? 'Procesando pago...' : turnoConfirmado ? 'Imprimir comprobante' : 'Confirmar y pagar'}
                    </BotonPrimario>
                    <BotonSecundario type="button" onClick={() => setMostrarCheckout(false)}>
                      Volver a editar
                    </BotonSecundario>
                  </div>
                </>
              )}
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

