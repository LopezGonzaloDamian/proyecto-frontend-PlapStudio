// Espejo de los DTOs del backend.

export type Rol = 'ADMIN' | 'PROFESIONAL' | 'ASISTENTE' | 'CLIENTE' | 'SIN_DEFINIR'

export type Usuario = {
  id: number
  email: string
  nombreCompleto: string
  telefono: string
  activo: boolean
  roles: Rol[]
  perfilProfesionalId: number | null
  perfilClienteId: number | null
  requiereSeleccionRol: boolean
}

export type AuthResponse = {
  token: string
  usuario: Usuario
}

export type AgendaResumen = {
  id: string
  nombre: string
  descripcion: string
  activa: boolean
}

export type Profesional = {
  id: number
  nombreCompleto: string
  email: string
  telefono: string
  especialidad: string
  biografia: string
  urlAvatar: string
  destacado: boolean
  ubicacion: string
  direccion: string
  precio: number
  cobertura: string
  matriculaNacional: string
  matriculaProvincial: string
  servicios: string[]
  agendas: AgendaResumen[]
}

export type ProfesionalSummary = {
  id: number
  nombreCompleto: string
  especialidad: string
  urlAvatar: string
  ubicacion: string
  precio: number
  destacado: boolean
  servicios: string[]
}

export type ProfesionalUpdate = {
  especialidad: string
  biografia: string
  urlAvatar: string
  ubicacion: string
  direccion: string
  precio: number
  cobertura: string
  matriculaNacional: string
  matriculaProvincial: string
  servicios: string[]
}

export type Cliente = {
  id: number
  nombreCompleto: string
  email: string
  telefono: string
  notas: string
}

export type DiaSemana =
  | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY'

export type ConfiguracionHoraria = {
  id: string | null
  diaSemana: DiaSemana
  inicioSlot: string  // "HH:mm"
  finSlot: string
  duracionSlotMinutos: number
}

export type ExcepcionAgenda = {
  id: string | null
  fechaInicio: string  // YYYY-MM-DD
  fechaFin: string
  motivo: string
}

export type Agenda = {
  id: string
  nombre: string
  descripcion: string
  activa: boolean
  profesionalId: number
  profesionalNombre: string
  configuraciones: ConfiguracionHoraria[]
  excepciones: ExcepcionAgenda[]
}

export type Slot = {
  iniciaEn: string  // ISO datetime
  duracionMinutos: number
  disponible: boolean
}

export type EstadoTurno = 'CONFIRMADO' | 'CANCELADO'

export type Pago = {
  id: string
  turnoId: string
  monto: number
  moneda: string
  estado: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'REEMBOLSADO'
  origen: 'ONLINE' | 'EXTERNO'
  referenciaProveedorMock: string | null
  pagadoEn: string | null
}

export type Turno = {
  id: string
  agendaId: string
  agendaNombre: string
  profesionalId: number
  profesionalNombre: string
  clienteId: number | null
  clienteNombre: string
  clienteTelefono: string | null
  clienteDni: string | null
  clienteEmail: string | null
  iniciaEn: string  // ISO datetime
  duracionMinutos: number
  estado: EstadoTurno
  notas: string
  pago: Pago | null
}

export type TurnoCreate = {
  agendaId: string
  clienteId?: number | null
  clienteExternoNombre?: string
  clienteExternoTelefono?: string
  clienteExternoDni?: string
  clienteExternoEmail?: string
  iniciaEn: string
  duracionMinutos: number
  notas?: string
  pagarAlReservar?: boolean
  medioPago?: string
}

export type TurnoUpdate = {
  iniciaEn: string
  duracionMinutos: number
  notas: string
  estado: EstadoTurno
}

export type Favorito = {
  id: string
  clienteId: number
  profesional: ProfesionalSummary
  agregadoEn: string
}

export type Notificacion = {
  id: string
  usuarioId: number
  canal: string
  titulo: string
  cuerpo: string
  leida: boolean
  enviadaEn: string
  recursoTipo: string | null
  recursoId: string | null
}

export type AsistenteAsignacion = {
  id: string
  profesionalId: number
  profesionalNombre: string
  profesionalEspecialidad: string
  asistenteId: number
  asistenteNombre: string
  asignadoEn: string
}

export type LoginRequest  = { email: string; password: string }
export type GoogleLoginRequest = { credential: string }
export type RegistroRequest = {
  email: string
  password: string
  nombreCompleto: string
  telefono: string
  rol: Rol
  especialidad?: string
}

export type SeleccionRolRequest = {
  rol: Exclude<Rol, 'ADMIN' | 'SIN_DEFINIR'>
  especialidad?: string
}
