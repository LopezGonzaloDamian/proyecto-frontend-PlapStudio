import { useEffect, useState } from 'react'
import type { AuthResponse, Usuario } from '../api/types'
import { getSession, getSessionData, clearSession, setSession } from '../lib/storage/session'

const KEY_EVENT = 'agendify:sesion'

export function useSesion() {
  const [usuario, setUsuario] = useState<Usuario | null>(() => getSession())

  useEffect(() => {
    const onChange = () => setUsuario(getSession())
    window.addEventListener(KEY_EVENT, onChange)
    window.addEventListener('storage', onChange)
    return () => {
      window.removeEventListener(KEY_EVENT, onChange)
      window.removeEventListener('storage', onChange)
    }
  }, [])

  return {
    usuario,
    sesion: getSessionData(),
    iniciar: (auth: AuthResponse) => {
      setSession(auth)
      setUsuario(auth.usuario)
      window.dispatchEvent(new Event(KEY_EVENT))
    },
    cerrar: () => {
      clearSession()
      setUsuario(null)
      window.dispatchEvent(new Event(KEY_EVENT))
    },
  }
}
