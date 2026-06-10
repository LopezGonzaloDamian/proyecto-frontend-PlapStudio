import { useEffect, useState } from 'react'
import type { AuthResponse, Usuario } from '../api/types'
import {
  clearSession,
  getSession,
  getSessionData,
  resolverRolActivo,
  setRolActivo,
  setSession,
  type RolActivo,
} from '../lib/storage/session'

const KEY_EVENT = 'agendify:sesion'

export function useSesion() {
  const [usuario, setUsuario] = useState<Usuario | null>(() => getSession())
  const [rolActivo, setRolActivoState] = useState<RolActivo | null>(() => resolverRolActivo(getSession()))

  useEffect(() => {
    const onChange = () => {
      const usuarioActual = getSession()
      setUsuario(usuarioActual)
      setRolActivoState(resolverRolActivo(usuarioActual))
    }
    window.addEventListener(KEY_EVENT, onChange)
    window.addEventListener('storage', onChange)
    return () => {
      window.removeEventListener(KEY_EVENT, onChange)
      window.removeEventListener('storage', onChange)
    }
  }, [])

  return {
    usuario,
    rolActivo,
    sesion: getSessionData(),
    iniciar: (auth: AuthResponse, nuevoRolActivo?: RolActivo) => {
      setSession(auth, nuevoRolActivo)
      setUsuario(auth.usuario)
      setRolActivoState(resolverRolActivo(auth.usuario))
      window.dispatchEvent(new Event(KEY_EVENT))
    },
    cambiarRolActivo: (rol: RolActivo) => {
      setRolActivo(rol)
      setRolActivoState(rol)
      window.dispatchEvent(new Event(KEY_EVENT))
    },
    cerrar: () => {
      clearSession()
      setUsuario(null)
      setRolActivoState(null)
      window.dispatchEvent(new Event(KEY_EVENT))
    },
  }
}
