import type { AuthResponse, Rol, Usuario } from '../../api/types'

const KEY_SESION = 'agendifySession'
const KEY_ROL_ACTIVO = 'agendifyRolActivo'
const KEY_RECORDAR = 'rememberedUsers'

export type RolActivo = Extract<Rol, 'ADMIN' | 'PROFESIONAL' | 'ASISTENTE' | 'CLIENTE'>

function esRolActivo(valor: string | null): valor is RolActivo {
  return valor === 'ADMIN' || valor === 'PROFESIONAL' || valor === 'ASISTENTE' || valor === 'CLIENTE'
}

function prioridadRol(usuario: Usuario): RolActivo | null {
  if (usuario.roles.includes('PROFESIONAL')) return 'PROFESIONAL'
  if (usuario.roles.includes('ASISTENTE')) return 'ASISTENTE'
  if (usuario.roles.includes('CLIENTE')) return 'CLIENTE'
  if (usuario.roles.includes('ADMIN')) return 'ADMIN'
  return null
}

export function getRolActivo(): RolActivo | null {
  const valor = localStorage.getItem(KEY_ROL_ACTIVO)
  return esRolActivo(valor) ? valor : null
}

export function setRolActivo(rol: RolActivo) {
  localStorage.setItem(KEY_ROL_ACTIVO, rol)
}

export function resolverRolActivo(usuario: Usuario | null): RolActivo | null {
  if (!usuario) return null
  const guardado = getRolActivo()
  if (guardado && usuario.roles.includes(guardado)) return guardado
  const resuelto = prioridadRol(usuario)
  if (resuelto) setRolActivo(resuelto)
  return resuelto
}

export function setSession(session: AuthResponse, rolActivo?: RolActivo) {
  localStorage.setItem(KEY_SESION, JSON.stringify(session))
  if (rolActivo && session.usuario.roles.includes(rolActivo)) {
    setRolActivo(rolActivo)
  } else {
    resolverRolActivo(session.usuario)
  }
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
  localStorage.removeItem(KEY_ROL_ACTIVO)
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
