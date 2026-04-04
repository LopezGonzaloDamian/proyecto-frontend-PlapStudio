import { Navigate, Outlet, useParams } from 'react-router-dom'
import { getSession } from '../lib/storage/session'

// Para rutas con :id (ej: /home/:id, /perfil/:id, etc.)
export function IdIgualSesion() {
    const { id } = useParams()
    const sesion = getSession()

  // si no hay sesión, que lo agarre RutaProtegida antes; igual cuidamos por las dudas
    if (!sesion) return <Navigate to="/login" replace />

  // si el :id NO coincide con la sesión → lo llevo a su /home/:sesion
    return id === sesion ? <Outlet /> : <Navigate to={`/home/${sesion}`} replace /> 
}

// Para rutas con :idUsuario (/local/:id/:idUsuario, /checkoutPedido/:id/:idUsuario)
export function IdUsuarioIgualSesion() {
    const { idUsuario } = useParams()
    const sesion = getSession()

    if (!sesion) return <Navigate to="/login" replace />

    return idUsuario === sesion ? <Outlet /> : <Navigate to={`/home/${sesion}`} replace />
}
