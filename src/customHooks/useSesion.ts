import { useEffect, useState } from 'react'
import type { Usuario } from '../api/types'
import { getSession, clearSession, setSession } from '../lib/storage/session'

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
    iniciar: (u: Usuario) => {
      setSession(u)
      setUsuario(u)
      window.dispatchEvent(new Event(KEY_EVENT))
    },
    cerrar: () => {
      clearSession()
      setUsuario(null)
      window.dispatchEvent(new Event(KEY_EVENT))
    },
  }
}
