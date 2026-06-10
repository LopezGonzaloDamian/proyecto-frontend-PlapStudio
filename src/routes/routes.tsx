import { Routes, Route, Navigate } from 'react-router-dom'
import Registro from '../pages/UserAccess/Registro'
import NotFound from '../pages/Error/NotFound'
import LoginPage from '../pages/LandingPage/LoginPage'
import LandingPage from '../pages/LandingPage/LandingPage'
import ClienteDashboard from '../pages/Cliente/ClienteDashboard'
import ProfesionalDashboard from '../pages/Profesional/ProfesionalDashboard'
import AsistenteDashboard from '../pages/Asistente/AsistenteDashboard'
import SeleccionRol from '../pages/UserAccess/SeleccionRol'
import GuidePage from '../pages/Public/GuidePage'
import SupportPage from '../pages/Public/SupportPage'
import PublicLayout from '../components/PublicSite/PublicLayout'
import { RutaProtegida, RutaPublica, RutaSeleccionRol } from './accesoRoutes'

export default function RoutesApp() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/landing" replace />} />

      <Route element={<PublicLayout />}>
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/guia-de-uso" element={<GuidePage />} />
        <Route path="/soporte" element={<SupportPage />} />
      </Route>

      <Route element={<RutaPublica />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cliente/login" element={<Navigate to="/login" replace />} />
        <Route path="/profesional/login" element={<Navigate to="/login" replace />} />
        <Route path="/asistente/login" element={<Navigate to="/login" replace />} />
        <Route path="/cliente/registro" element={<Registro />} />
        <Route path="/profesional/registro" element={<Registro />} />
        <Route path="/asistente/registro" element={<Registro />} />
        <Route path="/registro" element={<Registro />} />
      </Route>

      <Route element={<RutaSeleccionRol />}>
        <Route path="/seleccionar-rol" element={<SeleccionRol />} />
      </Route>

      <Route element={<RutaProtegida />}>
        <Route path="/cliente" element={<ClienteDashboard />} />
        <Route path="/cliente/:seccion" element={<ClienteDashboard />} />
        <Route path="/cliente/:seccion/:idProfesional" element={<ClienteDashboard />} />

        <Route path="/profesional" element={<ProfesionalDashboard />} />
        <Route path="/profesional/:seccion" element={<ProfesionalDashboard />} />

        <Route path="/asistente" element={<AsistenteDashboard />} />
        <Route path="/asistente/:seccion" element={<AsistenteDashboard />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
