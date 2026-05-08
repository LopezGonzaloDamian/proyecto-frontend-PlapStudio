import { api } from './client'
import type { AsistenteAsignacion, Turno, TurnoCreate, TurnoUpdate } from './types'

export async function getProfesionalesDeAsistente(usuarioId: number): Promise<AsistenteAsignacion[]> {
  const { data } = await api.get<AsistenteAsignacion[]>(`/asistentes/${usuarioId}/profesionales`)
  return data
}

export async function getTurnosDeAsistente(usuarioId: number): Promise<Turno[]> {
  const { data } = await api.get<Turno[]>(`/asistentes/${usuarioId}/turnos`)
  return data
}

export async function reservarTurnoAsistente(usuarioId: number, req: TurnoCreate): Promise<Turno> {
  const { data } = await api.post<Turno>(`/asistentes/${usuarioId}/turnos`, req)
  return data
}

export async function modificarTurnoAsistente(usuarioId: number, id: string, req: TurnoUpdate): Promise<Turno> {
  const { data } = await api.put<Turno>(`/asistentes/${usuarioId}/turnos/${id}`, req)
  return data
}

export async function actualizarNotasTurnoAsistente(usuarioId: number, id: string, notas: string): Promise<Turno> {
  const { data } = await api.patch<Turno>(`/asistentes/${usuarioId}/turnos/${id}/notas`, { notas })
  return data
}

export async function cancelarTurnoAsistente(usuarioId: number, id: string, motivo?: string): Promise<Turno> {
  const { data } = await api.patch<Turno>(`/asistentes/${usuarioId}/turnos/${id}/cancelar`, { motivo })
  return data
}

export async function getAsistentesDeProfesional(profesionalId: number): Promise<AsistenteAsignacion[]> {
  const { data } = await api.get<AsistenteAsignacion[]>(`/asistentes/profesional/${profesionalId}`)
  return data
}

export async function asignarAsistente(profesionalId: number, asistenteId: number): Promise<AsistenteAsignacion> {
  const { data } = await api.post<AsistenteAsignacion>('/asistentes', { profesionalId, asistenteId })
  return data
}

export async function desasignarAsistente(id: string): Promise<void> {
  await api.delete(`/asistentes/${id}`)
}
