import { api } from './client'
import type { Resena, ResenaCreate } from './types'

export async function getResenasProfesional(profesionalId: number): Promise<Resena[]> {
  const { data } = await api.get<Resena[]>(`/resenas/profesional/${profesionalId}`)
  return data
}

export async function crearResena(req: ResenaCreate): Promise<Resena> {
  const { data } = await api.post<Resena>('/resenas', req)
  return data
}
