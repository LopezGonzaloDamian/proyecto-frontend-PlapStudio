import { api } from './client'
import type { Rol, Usuario, UsuarioUpdate } from './types'

export async function getUsuarios(rol?: Rol): Promise<Usuario[]> {
  const { data } = await api.get<Usuario[]>('/usuarios', { params: rol ? { rol } : undefined })
  return data
}

export async function actualizarUsuario(id: number, req: UsuarioUpdate): Promise<Usuario> {
  const { data } = await api.put<Usuario>(`/usuarios/${id}`, req)
  return data
}
