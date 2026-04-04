import axios from 'axios'
import { API_URL } from '../config/api'
import type { LoginResponse } from '../types/login'

export type NuevoUsuarioPayload = {
    nombre: string
    apellido: string
    email: string
    password: string
}

export async function registrarUsuario(payload: NuevoUsuarioPayload): Promise<LoginResponse> {
    const { data } = await axios.post<LoginResponse>(`${API_URL}/usuario/registro`, payload)
    return data
}