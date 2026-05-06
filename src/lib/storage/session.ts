import type { Usuario } from '../../api/types'

const KEY_SESION   = 'agendifySession'
const KEY_RECORDAR = 'rememberedUsers'

// ── Sesión ────────────────────────────────────────────────────────────────────

export function setSession(usuario: Usuario) {
  localStorage.setItem(KEY_SESION, JSON.stringify(usuario))
}

export function getSession(): Usuario | null {
  const raw = localStorage.getItem(KEY_SESION)
  if (!raw) return null
  try {
    return JSON.parse(raw) as Usuario
  } catch {
    return null
  }
}

export function clearSession() {
  localStorage.removeItem(KEY_SESION)
}

export function isLoggedIn(): boolean {
  return getSession() != null
}

// ── Recordar usuarios ─────────────────────────────────────────────────────────

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
  const lista = getRememberedUsers().filter(e => e !== email)
  localStorage.setItem(KEY_RECORDAR, JSON.stringify(lista))
}
