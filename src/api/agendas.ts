import { api } from './client'
import type { Agenda, ConfiguracionHoraria, ExcepcionAgenda, Slot } from './types'

export async function getAgenda(id: string): Promise<Agenda> {
  const { data } = await api.get<Agenda>(`/agendas/${id}`)
  return data
}

export async function getAgendasDeProfesional(profesionalId: number): Promise<Agenda[]> {
  const { data } = await api.get<Agenda[]>(`/agendas/profesional/${profesionalId}`)
  return data
}

export async function crearAgenda(req: { profesionalId: number; nombre: string; descripcion: string }): Promise<Agenda> {
  const { data } = await api.post<Agenda>('/agendas', req)
  return data
}

export async function actualizarAgenda(id: string, req: { nombre: string; descripcion: string; activa: boolean }): Promise<Agenda> {
  const { data } = await api.put<Agenda>(`/agendas/${id}`, req)
  return data
}

export async function darDeBajaAgenda(id: string): Promise<void> {
  await api.delete(`/agendas/${id}`)
}

export async function reemplazarConfiguraciones(agendaId: string, items: ConfiguracionHoraria[]): Promise<Agenda> {
  const { data } = await api.put<Agenda>(`/agendas/${agendaId}/configuraciones`, items)
  return data
}

export async function agregarConfiguracion(agendaId: string, item: ConfiguracionHoraria): Promise<Agenda> {
  const { data } = await api.post<Agenda>(`/agendas/${agendaId}/configuraciones`, item)
  return data
}

export async function eliminarConfiguracion(agendaId: string, configId: string): Promise<Agenda> {
  const { data } = await api.delete<Agenda>(`/agendas/${agendaId}/configuraciones/${configId}`)
  return data
}

export async function agregarExcepcion(agendaId: string, item: ExcepcionAgenda): Promise<Agenda> {
  const { data } = await api.post<Agenda>(`/agendas/${agendaId}/excepciones`, item)
  return data
}

export async function eliminarExcepcion(agendaId: string, excepcionId: string): Promise<Agenda> {
  const { data } = await api.delete<Agenda>(`/agendas/${agendaId}/excepciones/${excepcionId}`)
  return data
}

export async function getSlots(agendaId: string, fecha: string): Promise<Slot[]> {
  const { data } = await api.get<Slot[]>(`/agendas/${agendaId}/slots`, { params: { fecha } })
  return data
}
