import { api } from './client'
import type { Turno, TurnoCreate, TurnoUpdate } from './types'

export async function getTurnosCliente(clienteId: number): Promise<Turno[]> {
  const { data } = await api.get<Turno[]>(`/turnos/cliente/${clienteId}`)
  return data
}

export async function getTurnosProfesional(profesionalId: number): Promise<Turno[]> {
  const { data } = await api.get<Turno[]>(`/turnos/profesional/${profesionalId}`)
  return data
}

export async function getTurnosAgenda(agendaId: string): Promise<Turno[]> {
  const { data } = await api.get<Turno[]>(`/turnos/agenda/${agendaId}`)
  return data
}

export async function reservarTurno(req: TurnoCreate): Promise<Turno> {
  const { data } = await api.post<Turno>('/turnos', req)
  return data
}

export async function modificarTurno(id: string, req: TurnoUpdate): Promise<Turno> {
  const { data } = await api.put<Turno>(`/turnos/${id}`, req)
  return data
}

export async function actualizarNotasTurno(id: string, notas: string): Promise<Turno> {
  const { data } = await api.patch<Turno>(`/turnos/${id}/notas`, { notas })
  return data
}

export async function confirmarTurno(id: string): Promise<Turno> {
  const { data } = await api.patch<Turno>(`/turnos/${id}/confirmar`)
  return data
}

export async function completarTurno(id: string): Promise<Turno> {
  const { data } = await api.patch<Turno>(`/turnos/${id}/completar`)
  return data
}

export async function cancelarTurno(id: string, motivo?: string): Promise<Turno> {
  const { data } = await api.patch<Turno>(`/turnos/${id}/cancelar`, { motivo })
  return data
}
