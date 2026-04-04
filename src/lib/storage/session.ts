/* eslint-disable */
const KEY_SESION   = 'usuarioConectado'
const KEY_RECORDAR = 'rememberedUsers'

// ── Sesión ────────────────────────────────────────────────────────────────────

export function setSession(id: number | string) {
  localStorage.setItem(KEY_SESION, String(id))
}

export function getSession(): string | null {
  return localStorage.getItem(KEY_SESION)
}

export function clearSession() {
  localStorage.removeItem(KEY_SESION)
}

export function isLoggedIn(): boolean {
  return getSession() != null
}

// ── Recordar usuarios (lista por dispositivo) ─────────────────────────────────

/**
 * Agrega un email a la lista de usuarios recordados.
 * Si ya existe, no lo duplica.
 */
export function addRememberedUser(email: string) {
  const lista = getRememberedUsers()
  if (!lista.includes(email)) {
    localStorage.setItem(KEY_RECORDAR, JSON.stringify([...lista, email]))
  }
}

/**
 * Devuelve la lista completa de emails recordados en este dispositivo.
 */
export function getRememberedUsers(): string[] {
  const raw = localStorage.getItem(KEY_RECORDAR)
  if (!raw) return []
  try {
    return JSON.parse(raw)
  } catch {
    return []
  }
}

/**
 * Elimina un email puntual de la lista (por ejemplo si el usuario
 * destilda Recordarme en un login posterior).
 */
export function removeRememberedUser(email: string) {
  const lista = getRememberedUsers().filter(e => e !== email)
  localStorage.setItem(KEY_RECORDAR, JSON.stringify(lista))
}