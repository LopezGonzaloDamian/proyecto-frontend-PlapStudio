// ─────────────────────────────────────────────────────────────────────────────
// Primitivos visuales compartidos por todo el proyecto.
// Los colores usan nombres semánticos definidos en tailwind.config.js:
//   primario / confirmacion / alta / peligro / fondo / borde / texto
//
// Para cambiar toda la paleta de la app, solo modificar tailwind.config.js.
// ─────────────────────────────────────────────────────────────────────────────

import {
    type ReactNode,
    type InputHTMLAttributes,
    type SelectHTMLAttributes,
    type TextareaHTMLAttributes,
    type ButtonHTMLAttributes,
} from 'react'

// ── Tipografía ────────────────────────────────────────────────────────────────

export const Label = ({ children }: { children: ReactNode }) => (
    <label className="block text-sm font-semibold text-texto-principal mb-1.5">
        {children}
    </label>
)

// ── Campos de formulario ──────────────────────────────────────────────────────

export const Input = (props: InputHTMLAttributes<HTMLInputElement>) => (
    <input
        {...props}
        className={`w-full px-3.5 py-2.5 rounded-lg border border-borde text-sm text-texto-principal
            placeholder:text-texto-suave bg-white
            focus:outline-none focus:ring-2 focus:ring-primario focus:border-transparent
            transition-shadow ${props.className ?? ''}`}
    />
)

export const Select = (props: SelectHTMLAttributes<HTMLSelectElement>) => (
    <div className="relative">
        <select
            {...props}
            className={`w-full appearance-none px-3.5 py-2.5 rounded-lg border border-borde
                text-sm text-texto-principal bg-white
                focus:outline-none focus:ring-2 focus:ring-primario focus:border-transparent
                transition-shadow pr-9 ${props.className ?? ''}`}
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-texto-suave text-xs">
            ▾
        </span>
    </div>
)

export const Textarea = (props: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea
        {...props}
        className={`w-full px-3.5 py-2.5 rounded-lg border border-borde text-sm text-texto-principal
            placeholder:text-texto-suave bg-white resize-none
            focus:outline-none focus:ring-2 focus:ring-primario focus:border-transparent
            transition-shadow ${props.className ?? ''}`}
    />
)

// ── Botones ───────────────────────────────────────────────────────────────────

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode
}

/**
 * Acción primaria: confirmar, continuar, iniciar sesión.
 * - variante 'primario'     → azul con texto blanco  (default, acciones dentro de la app)
 * - variante 'confirmacion' → verde con texto negro  (formularios de acceso)
 * - fullWidth               → ocupa el ancho completo del contenedor
 */
export const BotonPrimario = ({
    children,
    fullWidth = false,
    variante = 'primario',
    ...props
}: ButtonProps & { fullWidth?: boolean, variante?: 'primario' | 'confirmacion' }) => (
    <button
        {...props}
        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-[10px]
            text-sm font-bold transition-colors shadow-sm
            disabled:opacity-50 disabled:cursor-not-allowed
            ${fullWidth ? 'w-full' : ''}
            ${variante === 'primario'
                ? 'bg-primario hover:bg-primario-hover text-white'
                : 'bg-confirmacion hover:bg-confirmacion-hover text-texto-principal'}
            ${props.className ?? ''}`}
    >
        {children}
    </button>
)

/** Acción secundaria: cancelar, volver */
export const BotonSecundario = ({ children, ...props }: ButtonProps) => (
    <button
        {...props}
        className={`px-6 py-2.5 rounded-lg border border-borde bg-white text-sm font-bold
            text-texto-principal hover:bg-fondo transition-colors shadow-sm
            disabled:opacity-50 disabled:cursor-not-allowed ${props.className ?? ''}`}
    >
        {children}
    </button>
)

/** Acción de alta: agregar nuevo elemento */
export const BotonAgregar = ({ children, ...props }: ButtonProps) => (
    <button
        {...props}
        className={`px-4 py-2 bg-alta text-alta-texto rounded-lg text-sm font-bold
            hover:bg-alta-hover transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed ${props.className ?? ''}`}
    >
        {children}
    </button>
)

/** Acción de confirmación: guardar cambios con spinner */
export const BotonGuardar = ({ children, cargando = false, ...props }: ButtonProps & { cargando?: boolean }) => (
    <button
        {...props}
        disabled={cargando || props.disabled}
        className={`flex items-center gap-2 px-6 py-2.5 rounded-lg bg-confirmacion hover:bg-confirmacion-hover
            text-texto-principal text-sm font-bold transition-colors shadow-sm
            disabled:opacity-50 disabled:cursor-not-allowed ${props.className ?? ''}`}
    >
        {cargando ? (
            <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Guardando...
            </>
        ) : (
            <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {children}
            </>
        )}
    </button>
)

// ── Contenedores ──────────────────────────────────────────────────────────────

/** Card blanca estándar del proyecto */
export const Card = ({ children, className = '' }: { children: ReactNode, className?: string }) => (
    <div className={`bg-white rounded-xl shadow-sm border border-borde-suave ${className}`}>
        {children}
    </div>
)

/** Spinner de carga centrado en pantalla completa */
export const PantallaCargando = ({ texto = 'Cargando...' }: { texto?: string }) => (
    <div className="min-h-screen bg-fondo flex items-center justify-center">
        <div className="flex items-center gap-3 text-texto-secundario text-sm font-medium">
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            {texto}
        </div>
    </div>
)

/** Pantalla de error centrada con botón de acción */
export const PantallaError = ({ mensaje, onVolver }: { mensaje: string, onVolver: () => void }) => (
    <div className="min-h-screen bg-fondo flex items-center justify-center">
        <div className="bg-white rounded-xl border border-peligro-suave shadow-sm p-8 text-center max-w-sm">
            <p className="text-sm text-peligro font-medium mb-4">{mensaje}</p>
            <button
                onClick={onVolver}
                className="px-4 py-2 bg-fondo text-texto-principal rounded-lg text-sm font-bold hover:bg-borde-suave transition-colors"
            >
                Volver
            </button>
        </div>
    </div>
)