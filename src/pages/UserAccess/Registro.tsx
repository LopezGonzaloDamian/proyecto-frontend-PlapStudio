import { useState, type FormEvent, type ChangeEvent } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'

import InputGenerico from '../../components/AccesoUsuario/InputGenerico'
import { CardAcceso, HeaderAcceso } from '../../components/AccesoUsuario/CardAcceso'
import { IconoUsuario, IconoEmail, IconoCandado } from '../../components/AccesoUsuario/IconosAcceso'
import { BotonPrimario } from '../../components/common/ui'

import { setSession } from '../../lib/storage/session'
import { useToast } from '../../customHooks/useToast'
import { Toast } from '../../components/common/toast'

export default function Registro() {
    const [form, setForm] = useState({
        nombre: '',
        apellido: '',
        email: '',
        telefono: '',
        password: '',
    })
    const [enviando, setEnviando] = useState(false)

    const navigate = useNavigate()
    const location = useLocation()
    const { toast, showToast } = useToast()
    const esProfesional = location.pathname.startsWith('/profesional')
    const rolActual = esProfesional ? 'profesional' : 'cliente'

    const onChange = (e: ChangeEvent<HTMLInputElement>) =>
        setForm({ ...form, [e.target.name]: e.target.value })

    const puedeEnviar =
        form.nombre.trim().length > 0 &&
        form.apellido.trim().length > 0 &&
        form.email.trim().length > 0 &&
        form.telefono.trim().length > 0 &&
        form.password.trim().length > 0 &&
        !enviando

    async function enviar(evento: FormEvent<HTMLFormElement>) {
        evento.preventDefault()
        if (!puedeEnviar) return

        setEnviando(true)
        const idUsuarioMock = esProfesional ? 'profesional-demo' : 'cliente-demo'
        setSession(idUsuarioMock)
        showToast(
            esProfesional ? 'Cuenta mock creada. Ya podes administrar tu agenda.' : 'Cuenta mock creada. Ya podes reservar turnos.',
            'success',
        )

        setTimeout(() => {
            setEnviando(false)
            navigate(esProfesional ? '/profesional' : `/home/${idUsuarioMock}`)
        }, 500)
    }

    return (
        <CardAcceso>
            <HeaderAcceso
                titulo={`Registro ${rolActual}`}
                subtitulo={esProfesional
                    ? 'Registrate gratis y administra turnos en la demo profesional.'
                    : 'Registrate gratis y reserva turnos en la demo de cliente.'
                }
            />

            <form className="w-full flex flex-col gap-4" onSubmit={enviar} autoComplete="off">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <InputGenerico
                        label="Nombre"
                        name="nombre"
                        value={form.nombre}
                        onChange={onChange}
                        placeholder="Ana"
                        type="text"
                        icono={<IconoUsuario />}
                    />

                    <InputGenerico
                        label="Apellido"
                        name="apellido"
                        value={form.apellido}
                        onChange={onChange}
                        placeholder="Garcia"
                        type="text"
                    />
                </div>

                <InputGenerico
                    label="Email"
                    name="email"
                    value={form.email}
                    onChange={onChange}
                    placeholder="cliente@agendify.com"
                    type="text"
                    icono={<IconoEmail />}
                />

                <InputGenerico
                    label="Telefono"
                    name="telefono"
                    value={form.telefono}
                    onChange={onChange}
                    placeholder="+595 981 000 000"
                    type="tel"
                    icono={<IconoUsuario />}
                />

                <InputGenerico
                    label="Contrasena"
                    name="password"
                    value={form.password}
                    onChange={onChange}
                    placeholder="********"
                    type="password"
                    icono={<IconoCandado />}
                />

                <BotonPrimario
                    type="submit"
                    fullWidth
                    disabled={!puedeEnviar}
                    className="py-4 text-base rounded-xl"
                >
                    {enviando ? 'Registrando...' : 'Registrarse'}
                </BotonPrimario>
            </form>

            <p className="text-xs text-texto-secundario text-center">
                Ya tienes una cuenta?{' '}
                <Link to={`/${rolActual}/login`} className="text-primario font-semibold hover:underline">
                    Inicia sesion
                </Link>
            </p>

            <div id="toast-container">
                <Toast toast={toast} />
            </div>
        </CardAcceso>
    )
}
