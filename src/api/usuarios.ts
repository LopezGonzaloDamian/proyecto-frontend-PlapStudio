import { api } from './client'
import type { Rol, Usuario } from './types'

export async function getUsuarios(rol?: Rol): Promise<Usuario[]> {
  const { data } = await api.get<Usuario[]>('/usuarios', { params: rol ? { rol } : undefined })
  return data
}
