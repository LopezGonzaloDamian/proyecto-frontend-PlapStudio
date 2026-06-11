import { api } from './client'
import type {
  ActivarRolRequest,
  AuthResponse,
  GoogleLoginRequest,
  LoginRequest,
  RegistroRequest,
  SeleccionRolRequest,
} from './types'

export async function login(req: LoginRequest): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/login', req)
  return data
}

export async function registro(req: RegistroRequest): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/registro', req)
  return data
}

export async function loginConGoogle(req: GoogleLoginRequest): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/google', req)
  return data
}

export async function seleccionarRol(req: SeleccionRolRequest): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/select-role', req)
  return data
}

export async function activarRol(req: ActivarRolRequest): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/activate-role', req)
  return data
}

export async function authMe(): Promise<AuthResponse> {
  const { data } = await api.get<AuthResponse>('/auth/me')
  return data
}
