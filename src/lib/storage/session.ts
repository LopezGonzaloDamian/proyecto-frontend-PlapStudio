import type { AuthResponse, Usuario } from '../../api/types'

const KEY_SESION = 'agendifySession'
const KEY_RECORDAR = 'rememberedUsers'

export function setSession(session: AuthResponse) {
  localStorage.setItem(KEY_SESION, JSON.stringify(session))
}

export function getSessionData(): AuthResponse | null {
  const raw = localStorage.getItem(KEY_SESION)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthResponse
  } catch {
    return null
  }
}

export function getSession(): Usuario | null {
  return getSessionData()?.usuario ?? null
}

export function getAuthToken(): string | null {
  return getSessionData()?.token ?? null
}

export function clearSession() {
  localStorage.removeItem(KEY_SESION)
}

export function isLoggedIn(): boolean {
  return getSessionData() != null
}

export function addRememberedUser(email: string) {
  const lista = getRememberedUsers()
  if (!lista.includes(email)) {
    localStorage.setItem(KEY_RECORDAR, JSON.stringify([...lista, email]))
  }
}

export function getRememberedUsers(): string[] {
  const raw = localStorage.getItem(KEY_RECORDAR)
  if (!raw) return []
  try {
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export function removeRememberedUser(email: string) {
  const lista = getRememberedUsers().filter((e) => e !== email)
  localStorage.setItem(KEY_RECORDAR, JSON.stringify(lista))
}
