import axios from 'axios'
import { API_URL } from '../config/api'

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

export function extraerError(e: unknown): string {
  if (axios.isAxiosError(e)) {
    const data = e.response?.data as { message?: string } | undefined
    return data?.message ?? e.message
  }
  if (e instanceof Error) return e.message
  return 'Error desconocido'
}
