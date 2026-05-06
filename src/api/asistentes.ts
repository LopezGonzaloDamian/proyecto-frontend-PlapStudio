import { api } from './client'
import type { AsistenteAsignacion, Turno } from './types'

export async function getProfesionalesDeAsistente(usuarioId: number): Promise<AsistenteAsignacion[]> {
  const { data } = await api.get<AsistenteAsignacion[]>(`/asistentes/${usuarioId}/profesionales`)
  return data
}

export async function getTurnosDeAsistente(usuarioId: number): Promise<Turno[]> {
  const { data } = await api.get<Turno[]>(`/asistentes/${usuarioId}/turnos`)
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
