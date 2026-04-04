import { API_URL } from '../config/api'
import axios from 'axios'
import type { LoginResponse } from '../types/login'

export async function login({ email, password }: { email: string; password: string }) {
  const { data } = await axios.post<LoginResponse>(`${API_URL}/usuario/login`, { email, password })
  return data
}
