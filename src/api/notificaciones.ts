import { api } from './client'
import type { Notificacion } from './types'

export async function getNotificaciones(usuarioId: number): Promise<Notificacion[]> {
  const { data } = await api.get<Notificacion[]>(`/notificaciones/usuario/${usuarioId}`)
  return data
}

export async function marcarLeida(id: string): Promise<Notificacion> {
  const { data } = await api.patch<Notificacion>(`/notificaciones/${id}/leer`)
  return data
}

export async function marcarTodasLeidas(usuarioId: number): Promise<void> {
  await api.patch(`/notificaciones/usuario/${usuarioId}/leer-todas`)
}
