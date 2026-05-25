import axios from 'axios'
import { API_URL } from '../config/api'
import { clearSession, getAuthToken } from '../lib/storage/session'

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = getAuthToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = axios.isAxiosError(error) ? error.config?.url ?? '' : ''
    const esIntentoDeLogin = url.includes('/auth/login')

    if (axios.isAxiosError(error) && error.response?.status === 401 && !esIntentoDeLogin) {
      clearSession()
      window.dispatchEvent(new Event('agendify:sesion'))
    }
    return Promise.reject(error)
  },
)

export function extraerError(e: unknown): string {
  if (axios.isAxiosError(e)) {
    const data = e.response?.data as { message?: string } | undefined
    return data?.message ?? e.message
  }
  if (e instanceof Error) return e.message
  return 'Error desconocido'
}
