import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { getSession, resolverRolActivo } from '../lib/storage/session'

function destinoPorRol() {
  const usuario = getSession()
  if (!usuario) return '/login'
  if (usuario.requiereSeleccionRol || usuario.roles.includes('SIN_DEFINIR')) return '/seleccionar-rol'
  const rolActivo = resolverRolActivo(usuario)
  if (rolActivo === 'PROFESIONAL') return '/profesional'
  if (rolActivo === 'ASISTENTE') return '/asistente'
  return '/cliente'
}

export function RutaProtegida() {
  const usuario = getSession()
  const location = useLocation()
  if (!usuario) return <Navigate to="/login" replace state={{ from: location }} />
  if (usuario.requiereSeleccionRol || usuario.roles.includes('SIN_DEFINIR')) {
    return <Navigate to="/seleccionar-rol" replace />
  }
  return <Outlet />
}

export function RutaPublica() {
  const usuario = getSession()
  if (!usuario) return <Outlet />
  return <Navigate to={destinoPorRol()} replace />
}

export function RutaSeleccionRol() {
  const usuario = getSession()
  if (!usuario) return <Navigate to="/login" replace />
  if (!(usuario.requiereSeleccionRol || usuario.roles.includes('SIN_DEFINIR'))) {
    return <Navigate to={destinoPorRol()} replace />
  }
  return <Outlet />
}
