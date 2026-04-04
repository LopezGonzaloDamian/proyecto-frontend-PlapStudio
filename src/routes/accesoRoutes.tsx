import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { getSession } from '../lib/storage/session'

/** Bloquea si NO hay sesión */
export function RutaProtegida() {
    const id = getSession()
    const location = useLocation()
    return id ? <Outlet /> : <Navigate to="/login" replace state={{ from: location }} />
}

/** No deja ver login/registro si YA hay sesión */
export function RutaPublica() {
    const id = getSession()
    return id ? <Navigate to="/landing" replace /> : <Outlet />
}
