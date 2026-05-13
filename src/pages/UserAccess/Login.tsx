import { useState, type FormEvent, type ChangeEvent, useRef, useEffect, type MouseEvent as ReactMouseEvent } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'

import InputGenerico from '../../components/AccesoUsuario/InputGenerico'
import { CardAcceso, HeaderAcceso } from '../../components/AccesoUsuario/CardAcceso'
import GoogleLoginButton from '../../components/AccesoUsuario/GoogleLoginButton'
import { IconoEmail, IconoCandado } from '../../components/AccesoUsuario/IconosAcceso'
import { BotonPrimario } from '../../components/common/ui'

import { addRememberedUser, getRememberedUsers, removeRememberedUser } from '../../lib/storage/session'
import { useToast } from '../../customHooks/useToast'
import { Toast } from '../../components/common/toast'
import { useSesion } from '../../customHooks/useSesion'
import { login as loginApi, loginConGoogle } from '../../api/auth'
import { extraerError } from '../../api/client'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [recordarme, setRecordarme] = useState(false)
    const [enviando, setEnviando] = useState(false)
    const [mostrarDropdown, setMostrarDropdown] = useState(false)
    const [usuariosRecordados, setUsuariosRecordados] = useState<string[]>(() => getRememberedUsers())

    const dropdownRef = useRef<HTMLDivElement>(null)
    const navigate = useNavigate()
    const location = useLocation()
    const { toast, showToast } = useToast()
    const { iniciar } = useSesion()
    const esProfesional = location.pathname.startsWith('/profesional')
    const esAsistente   = location.pathname.startsWith('/asistente')
    const esLoginGeneral = location.pathname === '/login'
    const rolActual = esProfesional ? 'profesional' : esAsistente ? 'asistente' : 'cliente'

    const destinoPorUsuario = (roles: string[], requiereSeleccionRol: boolean) => {
        if (requiereSeleccionRol || roles.includes('SIN_DEFINIR')) return '/seleccionar-rol'
        if (roles.includes('PROFESIONAL')) return '/profesional'
        if (roles.includes('ASISTENTE')) return '/asistente'
        return '/cliente'
    }

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
        try {
            const auth = await loginApi({ email: emailTrim, password: passwordTrim })

            if (recordarme) addRememberedUser(emailTrim)
            else            removeRememberedUser(emailTrim)
            setUsuariosRecordados(getRememberedUsers())

            iniciar(auth)
            showToast(`Hola, ${auth.usuario.nombreCompleto}`, 'success')

            const destino = destinoPorUsuario(auth.usuario.roles, auth.usuario.requiereSeleccionRol)
            setTimeout(() => navigate(destino), 400)
        } catch (e) {
            showToast(extraerError(e), 'error')
            setEnviando(false)
        }
    }

    async function ingresarConGoogle(credential: string) {
        if (enviando) return
        setEnviando(true)
        try {
            const auth = await loginConGoogle({ credential })
            iniciar(auth)
            showToast(`Hola, ${auth.usuario.nombreCompleto}`, 'success')
            setTimeout(() => navigate(destinoPorUsuario(auth.usuario.roles, auth.usuario.requiereSeleccionRol)), 300)
        } catch (error) {
            showToast(extraerError(error), 'error')
            setEnviando(false)
        }
    }

    return (
        <CardAcceso>
            <HeaderAcceso
                titulo={esLoginGeneral ? 'Login' : `Login ${rolActual}`}
                subtitulo={
                    esLoginGeneral ? 'Ingresa tus datos y te llevamos a tu panel automaticamente.'
                  : esProfesional ? 'Ingresa tus datos para acceder al dashboard profesional.'
                  : esAsistente   ? 'Ingresa tus datos para acceder al panel del asistente.'
                                  : 'Ingresa tus datos para reservar y gestionar tus turnos.'
                }
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
                        className="w-4 h-4 rounded border-borde accent-primario cursor-pointer"
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

            <div className="w-full">
                <div className="my-4 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.12em] text-texto-suave">
                    <span className="h-px flex-1 bg-borde" />
                    <span>o continua con</span>
                    <span className="h-px flex-1 bg-borde" />
                </div>
                <GoogleLoginButton onCredential={ingresarConGoogle} />
            </div>

            <p className="text-xs text-texto-secundario text-center">
                Aun no tienes una cuenta?{' '}
                <Link to={esLoginGeneral ? '/landing' : `/${rolActual}/registro`} className="text-primario font-semibold hover:underline">
                    Registrate gratis
                </Link>
            </p>

            <div id="toast-container">
                <Toast toast={toast} />
            </div>
        </CardAcceso>
    )
}
