import { useState, useRef, useEffect, type MouseEvent as ReactMouseEvent } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { clearSession, getSession } from '../lib/storage/session'
import { getUsuario } from 'src/services/usuario.service'
import type { Usuario } from 'src/types/usuario'
import { getMensajeError } from 'src/utils/errorHandling'
import { useToast } from 'src/customHooks/useToast'
import { useOnInit } from 'src/customHooks/hooks'
import { Toast } from './common/toast'

export const Navbar = () => {
    const [abierto, setAbierto]     = useState(false)
    const [usuario, setUsuario]     = useState<Usuario | null>(null)
    const dropdownRef               = useRef<HTMLDivElement>(null)
    const navigate                  = useNavigate()
    const { toast, showToast }      = useToast()

    useEffect(() => {
        const handleClickAfuera = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setAbierto(false)
            }
        }
        document.addEventListener('mousedown', handleClickAfuera)
        return () => document.removeEventListener('mousedown', handleClickAfuera)
    }, [])

    const cargarUsuario = async () => {
        const idUsuario = getSession()
        if (!idUsuario) return
        try {
            const data = await getUsuario(Number(idUsuario))
            setUsuario(data)
        } catch (err) {
            showToast(getMensajeError(err), 'error')
        }
    }

    useOnInit(() => {
        cargarUsuario()
    })

    if (!usuario) return null

    const handleLogout = (e: ReactMouseEvent<HTMLButtonElement>) => {
        e.stopPropagation()
        clearSession()
        navigate('/login')
    }

    const idUsuario = getSession()

    return (
        <header className="border-b border-slate-200 bg-white">
            <div className="flex w-full justify-between px-8 py-5">

                {/* Logo + nav */}
                <div className="flex items-center gap-14">
                    <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-sky-500" />
                        <span className="text-xl font-bold text-slate-900">BookLibre</span>
                    </div>

                    <nav className="flex gap-8 text-sm font-medium text-slate-500">
                        <NavLink
                            to={`/home/${idUsuario}`}
                            className={({ isActive }) => isActive ? 'text-sky-600' : 'hover:text-slate-800'}
                        >
                            Inicio
                        </NavLink>
                        <NavLink
                            to="/mis-prestamos"
                            className={({ isActive }) => isActive ? 'text-sky-600' : 'hover:text-slate-800'}
                        >
                            Mis Préstamos
                        </NavLink>
                        <NavLink
                            to={`/perfil/${idUsuario}`}
                            className={({ isActive }) => isActive ? 'text-sky-600' : 'hover:text-slate-800'}
                        >
                            Perfil
                        </NavLink>
                    </nav>
                </div>

                {/* Bibliokarma + avatar con dropdown */}
                <div className="flex items-center gap-12">
                    <span className="text-sm font-semibold text-slate-500">
                        {usuario.bibliokarmas} Bibliokarmas
                    </span>

                    <div className="relative" ref={dropdownRef}>
                        <button
                            type="button"
                            onClick={() => setAbierto(prev => !prev)}
                            className="flex items-center gap-1.5 rounded-full focus:outline-none
                                focus:ring-2 focus:ring-sky-400 focus:ring-offset-2"
                            aria-label="Menú de usuario"
                            aria-expanded={abierto}
                        >
                            <img
                                src={usuario.avatar}
                                alt="Avatar usuario"
                                className="h-10 w-10 rounded-full"
                            />
                            <svg
                                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200
                                    ${abierto ? 'rotate-180' : ''}`}
                                fill="none" viewBox="0 0 24 24" stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {abierto && (
                            <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl
                                border border-slate-100 shadow-lg py-1 z-50">
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm
                                        text-peligro hover:bg-red-50 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    Cerrar sesión
                                </button>
                            </div>
                        )}
                    </div>
                </div>

            </div>
            <div id="toast-container">
                <Toast toast={toast} />
            </div>
        </header>
    )
}

export default Navbar