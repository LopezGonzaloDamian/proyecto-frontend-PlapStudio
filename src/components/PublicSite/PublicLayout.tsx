import { Outlet } from 'react-router-dom'
import Footer from '../LandingPage/Footer'
import PublicNavbar from './PublicNavbar'

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-white text-texto-principal">
      <PublicNavbar />
      <div className="pt-24">
        <Outlet />
      </div>
      <Footer />
    </div>
  )
}
