import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { getSession } from '../lib/storage/session'

/** Bloquea si NO hay sesión */
export function RutaProtegida() {
    const usuario = getSession()
    const location = useLocation()
    return usuario ? <Outlet /> : <Navigate to="/login" replace state={{ from: location }} />
}

/** No deja ver login/registro si YA hay sesión */
export function RutaPublica() {
    const usuario = getSession()
    if (!usuario) return <Outlet />
    if (usuario.roles.includes('PROFESIONAL')) return <Navigate to="/profesional" replace />
    if (usuario.roles.includes('ASISTENTE'))   return <Navigate to="/asistente" replace />
    return <Navigate to="/cliente" replace />
}
