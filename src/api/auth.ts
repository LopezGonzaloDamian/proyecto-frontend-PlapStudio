import { api } from './client'
import type { LoginRequest, RegistroRequest, Usuario } from './types'

export async function login(req: LoginRequest): Promise<Usuario> {
  const { data } = await api.post<Usuario>('/auth/login', req)
  return data
}

export async function registro(req: RegistroRequest): Promise<Usuario> {
  const { data } = await api.post<Usuario>('/auth/registro', req)
  return data
}
