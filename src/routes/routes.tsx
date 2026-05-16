import { Routes, Route, Navigate } from 'react-router-dom'
import Registro from '../pages/UserAccess/Registro'
import NotFound from '../pages/Error/NotFound'
import LoginPage from '../pages/LandingPage/LoginPage'
import ClienteDashboard from '../pages/Cliente/ClienteDashboard'
import ProfesionalDashboard from '../pages/Profesional/ProfesionalDashboard'
import AsistenteDashboard from '../pages/Asistente/AsistenteDashboard'
import { RutaPublica } from './accesoRoutes'

export default function RoutesApp() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/landing" element={<Navigate to="/login" replace />} />

      <Route element={<RutaPublica />}>
        <Route path="/cliente/registro"   element={<Registro />} />
        <Route path="/profesional/registro" element={<Registro />} />
        <Route path="/asistente/registro" element={<Registro />} />
        <Route path="/registro"           element={<Registro />} />
      </Route>

      <Route path="/cliente/login" element={<Navigate to="/login" replace />} />
      <Route path="/profesional/login" element={<Navigate to="/login" replace />} />
      <Route path="/asistente/login" element={<Navigate to="/login" replace />} />

      <Route path="/cliente"                                  element={<ClienteDashboard />} />
      <Route path="/cliente/:seccion"                         element={<ClienteDashboard />} />
      <Route path="/cliente/:seccion/:idProfesional"          element={<ClienteDashboard />} />

      <Route path="/profesional"                              element={<ProfesionalDashboard />} />
      <Route path="/profesional/:seccion"                     element={<ProfesionalDashboard />} />

      <Route path="/asistente"                                element={<AsistenteDashboard />} />
      <Route path="/asistente/:seccion"                       element={<AsistenteDashboard />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
