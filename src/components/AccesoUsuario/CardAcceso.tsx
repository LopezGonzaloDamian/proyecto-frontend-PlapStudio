import { type ReactNode } from 'react'
import { IconCalendar } from '../LandingPage/Icons'

// ── CardAcceso ────────────────────────────────────────────────────────────────
// Contenedor compartido entre Login y Registro.
// Usa el mismo gradiente del hero del landing para coherencia visual.

interface CardAccesoProps {
    children: ReactNode
}

export const CardAcceso = ({ children }: CardAccesoProps) => (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4
        bg-linear-to-br from-primario via-primario-hover to-primario-oscuro relative overflow-hidden">

        {/* Decorative blobs — mismo estilo que el hero */}
        <div className="absolute -top-32 -right-32 w-80 h-80 bg-acento rounded-full opacity-20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-white rounded-full opacity-15 blur-3xl pointer-events-none" />

        {/* Card */}
        <div className="relative z-10 w-full max-w-sm flex flex-col items-center gap-6
            bg-white rounded-3xl px-8 py-5 shadow-2xl">
            {children}
        </div>
    </div>
)

// ── HeaderAcceso ──────────────────────────────────────────────────────────────
// Ícono + título + subtítulo compartido entre Login y Registro.

interface HeaderAccesoProps {
    icono: string
    titulo: string
    subtitulo: string
}

export const HeaderAcceso = ({ titulo, subtitulo }: Omit<HeaderAccesoProps, 'icono'>) => (
    <div className="flex flex-col items-center gap-3">
        <div className="w-14 h-14 bg-primario rounded-2xl flex items-center justify-center shadow-sm">
            <IconCalendar className="w-8 h-8 text-white" />
        </div>
        <div className="flex flex-col items-center gap-1">
            <span className="text-2xl font-black text-texto-principal">{titulo}</span>
            <p className="text-xs text-texto-secundario text-center leading-relaxed">{subtitulo}</p>
        </div>
    </div>
)
