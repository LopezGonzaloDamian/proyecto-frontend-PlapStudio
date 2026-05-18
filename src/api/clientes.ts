import { api } from './client'
import type { Cliente } from './types'

export async function getCliente(id: number): Promise<Cliente> {
  const { data } = await api.get<Cliente>(`/clientes/${id}`)
  return data
}

export async function getClientes(): Promise<Cliente[]> {
  const { data } = await api.get<Cliente[]>('/clientes')
  return data
}

export async function getClientesDeProfesional(profesionalId: number): Promise<Cliente[]> {
  const { data } = await api.get<Cliente[]>(`/clientes/profesional/${profesionalId}`)
  return data
}
