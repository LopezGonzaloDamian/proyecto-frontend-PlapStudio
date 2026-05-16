import { Link, useLocation } from 'react-router-dom'

export default function NotFound() {
    const { pathname } = useLocation()

    return (
        <div className="min-h-screen bg-fondo flex flex-col items-center justify-center px-6 font-sans">

            {/* Número grande decorativo */}
            <div className="relative select-none mb-2">
                <span className="text-[12rem] font-black leading-none text-borde-suave">
                    404
                </span>
                <span className="absolute inset-0 flex items-center justify-center text-[12rem] font-black leading-none text-primario opacity-10 blur-sm">
                    404
                </span>
            </div>

            {/* Ícono libro */}
            <div className="w-16 h-16 rounded-2xl bg-primario/10 flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-primario" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
            </div>

            {/* Mensaje */}
            <h1 className="text-3xl font-black text-texto-principal mb-2 text-center">
                Página no encontrada
            </h1>
            <p className="text-sm text-texto-secundario text-center max-w-sm mb-2">
                La página que buscás no existe o fue movida a otra dirección.
            </p>
            <p className="text-xs text-texto-suave font-mono bg-white border border-borde
                px-3 py-1.5 rounded-lg mb-8">
                {pathname}
            </p>

            {/* Acción */}
            <Link
                to="/login"
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primario
                    hover:bg-primario-hover text-white text-sm font-bold transition-colors shadow-sm"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Volver al inicio
            </Link>
        </div>
    )
}

