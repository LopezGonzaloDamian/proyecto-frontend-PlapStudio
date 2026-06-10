import { api } from './client'
import type { Favorito } from './types'

export async function getFavoritos(clienteId: number): Promise<Favorito[]> {
  const { data } = await api.get<Favorito[]>(`/favoritos/cliente/${clienteId}`)
  return data
}

export async function toggleFavorito(clienteId: number, profesionalId: number): Promise<Favorito | null> {
  const res = await api.post('/favoritos/toggle', { clienteId, profesionalId })
  if (res.status === 204) return null
  return res.data as Favorito
}
