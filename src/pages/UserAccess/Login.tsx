import { useState, type FormEvent, type ChangeEvent, useRef, useEffect, type MouseEvent as ReactMouseEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'

import InputGenerico from '../../components/AccesoUsuario/InputGenerico'
import { CardAcceso, HeaderAcceso } from '../../components/AccesoUsuario/CardAcceso'
import { IconoEmail, IconoCandado } from '../../components/AccesoUsuario/IconosAcceso'
import { BotonPrimario } from '../../components/common/ui'

import { setSession, addRememberedUser, getRememberedUsers, removeRememberedUser } from '../../lib/storage/session'
import { useToast } from '../../customHooks/useToast'
import { Toast } from '../../components/common/toast'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [recordarme, setRecordarme] = useState(false)
    const [enviando, setEnviando] = useState(false)
    const [mostrarDropdown, setMostrarDropdown] = useState(false)
    const [usuariosRecordados, setUsuariosRecordados] = useState<string[]>(() => getRememberedUsers())

    const dropdownRef = useRef<HTMLDivElement>(null)
    const navigate = useNavigate()
    const { toast, showToast } = useToast()

    useEffect(() => {
        const handleClickAfuera = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setMostrarDropdown(false)
            }
        }
        document.addEventListener('mousedown', handleClickAfuera)
        return () => document.removeEventListener('mousedown', handleClickAfuera)
    }, [])

    const emailTrim = email.trim()
    const passwordTrim = password.trim()
    const puedeIngresar = emailTrim.length > 0 && passwordTrim.length > 0

    const onChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.name === 'username') {
            setEmail(e.target.value)
            setMostrarDropdown(true)
        }
        if (e.target.name === 'password') setPassword(e.target.value)
    }

    const sugerencias = usuariosRecordados.filter((u) =>
        u.toLowerCase().includes(emailTrim.toLowerCase()),
    )

    const seleccionarUsuario = (mail: string) => {
        setEmail(mail)
        setRecordarme(true)
        setMostrarDropdown(false)
    }

    const olvidarUsuario = (mail: string, e: ReactMouseEvent<HTMLButtonElement>) => {
        e.stopPropagation()
        removeRememberedUser(mail)
        setUsuariosRecordados(getRememberedUsers())
    }

    async function enviar(evento: FormEvent<HTMLFormElement>) {
        evento.preventDefault()
        if (!puedeIngresar || enviando) return

        setEnviando(true)
        const idUsuarioMock = 'cliente-demo'

        if (recordarme) {
            addRememberedUser(emailTrim)
        } else {
            removeRememberedUser(emailTrim)
        }
        setUsuariosRecordados(getRememberedUsers())
        setSession(idUsuarioMock)

        showToast('Inicio de sesion mock exitoso.', 'success')
        setTimeout(() => {
            setEnviando(false)
            navigate(`/home/${idUsuarioMock}`)
        }, 500)
    }

    return (
        <CardAcceso>
            <HeaderAcceso
                titulo="Login cliente"
                subtitulo="Ingresa tus datos para ver el dashboard mock de cliente."
            />

            <form className="w-full flex flex-col gap-4" onSubmit={enviar} autoComplete="off">
                <div className="relative" ref={dropdownRef}>
                    <InputGenerico
                        label="Email"
                        name="username"
                        value={email}
                        onChange={onChange}
                        onFocus={() => setMostrarDropdown(true)}
                        placeholder="cliente@agendify.com"
                        type="text"
                        icono={<IconoEmail />}
                    />

                    {mostrarDropdown && sugerencias.length > 0 && (
                        <ul className="absolute z-10 w-full bg-white border border-borde rounded-xl shadow-lg mt-1 overflow-hidden">
                            {sugerencias.map((mail) => (
                                <li
                                    key={mail}
                                    onClick={() => seleccionarUsuario(mail)}
                                    className="flex items-center justify-between px-4 py-2.5 text-sm text-texto-principal hover:bg-fondo cursor-pointer"
                                >
                                    <span>{mail}</span>
                                    <button
                                        type="button"
                                        onClick={(e) => olvidarUsuario(mail, e)}
                                        className="text-texto-suave hover:text-peligro transition-colors ml-2"
                                        aria-label="Olvidar usuario"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <InputGenerico
                    label="Contrasena"
                    name="password"
                    value={password}
                    onChange={onChange}
                    placeholder="********"
                    type="password"
                    icono={<IconoCandado />}
                />

                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={recordarme}
                        onChange={(e) => setRecordarme(e.target.checked)}
                        className="w-4 h-4 rounded border-[#e0e0e0] accent-confirmacion cursor-pointer"
                    />
                    <span className="text-sm text-texto-secundario">Recordarme</span>
                </label>

                <BotonPrimario
                    type="submit"
                    fullWidth
                    disabled={!puedeIngresar || enviando}
                    className="py-4 text-base rounded-xl"
                >
                    {enviando ? 'Ingresando...' : 'Ingresar'}
                </BotonPrimario>
            </form>

            <p className="text-xs text-texto-secundario text-center">
                Aun no tienes una cuenta?{' '}
                <Link to="/cliente/registro" className="text-primario font-semibold hover:underline">
                    Registrate gratis
                </Link>
            </p>

            <div id="toast-container">
                <Toast toast={toast} />
            </div>
        </CardAcceso>
    )
}
