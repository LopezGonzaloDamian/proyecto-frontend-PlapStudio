import { useState, type InputHTMLAttributes , type ReactNode } from 'react'

// Al extender React.InputHTMLAttributes<HTMLInputElement> el componente acepta
// automáticamente todas las props nativas de un input — onFocus, onBlur,
// maxLength, disabled, etc. — sin declararlas una por una.
// Las props propias del componente (label, icono) se agregan encima.
type Props = InputHTMLAttributes<HTMLInputElement> & {
    label: string
    icono?: ReactNode
}

export default function InputGenerico({ label, icono, className, type = 'text', ...rest }: Props) {
    const [mostrar, setMostrar] = useState(false)
    const esPassword = type === 'password'
    const tipoInput  = esPassword ? (mostrar ? 'text' : 'password') : type
    const iconoOjo   = mostrar ? '/img/eye-off.svg' : '/img/eye.svg'

    return (
        <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-texto-secundario">
                {label}
            </span>

            <div className="relative flex items-center">
                {icono && (
                    <span className="absolute left-3.5 flex items-center text-texto-suave pointer-events-none">
                        {icono}
                    </span>
                )}

                <input
                    {...rest}
                    type={tipoInput}
                    className={`w-full box-border py-3 rounded-xl
                        border border-borde bg-white
                        text-base text-texto-principal
                        placeholder:text-texto-suave
                        outline-none focus:border-primario focus:ring-2 focus:ring-primario/20
                        transition-colors
                        ${icono ? 'pl-10' : 'px-3.5'}
                        ${esPassword ? 'pr-11' : 'pr-3.5'}
                        ${className ?? ''}`}
                />

                {esPassword && (
                    <button
                        type="button"
                        onClick={() => setMostrar(ver => !ver)}
                        aria-label={mostrar ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        className="absolute right-3 flex items-center justify-center w-7 h-7
                            bg-transparent border-none cursor-pointer p-0"
                    >
                        <img src={iconoOjo} alt="ojito" className="w-5 h-5" />
                    </button>
                )}
            </div>
        </label>
    )
}