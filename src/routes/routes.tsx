import { Routes, Route, Navigate } from 'react-router-dom'
import Login from '../pages/UserAccess/Login'
import Registro from '../pages/UserAccess/Registro'
import NotFound from '../pages/Error/NotFound'
import LandingPage from '../pages/LandingPage/LandingPage'
import ClienteDashboardMock from '../pages/Cliente/ClienteDashboardMock'
import ProfesionalDashboardMock from '../pages/Profesional/ProfesionalDashboardMock'
// import { RutaProtegida, RutaPublica } from './accesoRoutes'
// import AppLayout from '../layouts/AppLayout'
// import { IdIgualSesion } from './sesionActiva'
import { RutaPublica } from './accesoRoutes'

export default function RoutesApp() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/landing" replace />} />
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/cliente/login" element={<Login />} />
      <Route path="/cliente/registro" element={<Registro />} />
      <Route path="/profesional/login" element={<Login />} />
      <Route path="/profesional/registro" element={<Registro />} />
      <Route path="/cliente" element={<ClienteDashboardMock />} />
      <Route path="/cliente/:seccion" element={<ClienteDashboardMock />} />
      <Route path="/cliente/:seccion/:idProfesional" element={<ClienteDashboardMock />} />
      <Route path="/home/:id" element={<ClienteDashboardMock />} />
      <Route path="/home/:id/:seccion" element={<ClienteDashboardMock />} />
      <Route path="/home/:id/:seccion/:idProfesional" element={<ClienteDashboardMock />} />
      <Route path="/profesional" element={<ProfesionalDashboardMock />} />
      <Route path="/profesional/:seccion" element={<ProfesionalDashboardMock />} />

      <Route element={<RutaPublica />}>
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}


// export default function RoutesApp() {
//   return (
//     <Routes>
//       {/* Redirección raíz */}
//       <Route path="/" element={<Navigate to="/landing" replace />} />

//       {/* Rutas públicas — redirigen a /home/:id si ya hay sesión */}
//       <Route element={<RutaPublica />}>
//         <Route path="/landing"   element={<LandingPage />} />
//         <Route path="/login"    element={<Login />} />
//         <Route path="/registro" element={<Registro />} />
//       </Route>

//       {/* Rutas privadas — redirigen a /login si no hay sesión */}
//       <Route element={<RutaProtegida />}>
//         <Route element={<AppLayout />}>

//           {/* Solo /perfil/:id requiere que el :id coincida con la sesión */}
//           <Route element={<IdIgualSesion />}>
//           </Route>

//         </Route>
//       </Route>
      
//       {/* Catch-all — cualquier URL que no matchee ninguna ruta */}
//       <Route path="*" element={<NotFound />} />
//     </Routes>
//   )
// } 
