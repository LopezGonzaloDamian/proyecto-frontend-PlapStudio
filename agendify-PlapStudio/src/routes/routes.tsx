import { Routes, Route, Navigate } from 'react-router-dom'
import Login from '../pages/UserAccess/Login'
import Registro from '../pages/UserAccess/Registro'
import NotFound from '../pages/Error/NotFound'
import LandingPage from '../pages/LandingPage/LandingPage'
import AppLayout from '../layouts/AppLayout'

import { RutaProtegida, RutaPublica } from './accesoRoutes'
import { IdIgualSesion } from './sesionActiva'

export default function RoutesApp() {
  return (
    <Routes>
      {/* Redirección raíz */}
      <Route path="/" element={<Navigate to="/landing" replace />} />

      {/* Rutas públicas — redirigen a /home/:id si ya hay sesión */}
      <Route element={<RutaPublica />}>
        <Route path="/landing"   element={<LandingPage />} />
        <Route path="/login"    element={<Login />} />
        <Route path="/registro" element={<Registro />} />
      </Route>

      {/* Rutas privadas — redirigen a /login si no hay sesión */}
      <Route element={<RutaProtegida />}>
        <Route element={<AppLayout />}>

          {/* Solo /perfil/:id requiere que el :id coincida con la sesión */}
          <Route element={<IdIgualSesion />}>
          </Route>

        </Route>
      </Route>
      
      {/* Catch-all — cualquier URL que no matchee ninguna ruta */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}