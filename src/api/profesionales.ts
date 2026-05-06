import { api } from './client'
import type { Profesional, ProfesionalSummary, ProfesionalUpdate } from './types'

export async function buscarProfesionales(filtros: {
  query?: string
  especialidad?: string
  ubicacion?: string
} = {}): Promise<ProfesionalSummary[]> {
  const { data } = await api.get<ProfesionalSummary[]>('/profesionales', { params: filtros })
  return data
}

export async function getProfesional(id: number): Promise<Profesional> {
  const { data } = await api.get<Profesional>(`/profesionales/${id}`)
  return data
}

export async function getDestacados(): Promise<ProfesionalSummary[]> {
  const { data } = await api.get<ProfesionalSummary[]>('/profesionales/destacados')
  return data
}

export async function actualizarProfesional(id: number, req: ProfesionalUpdate): Promise<Profesional> {
  const { data } = await api.put<Profesional>(`/profesionales/${id}`, req)
  return data
}
