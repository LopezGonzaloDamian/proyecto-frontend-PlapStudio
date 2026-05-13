import { useState, type FormEvent, type ChangeEvent } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'

import InputGenerico from '../../components/AccesoUsuario/InputGenerico'
import { CardAcceso, HeaderAcceso } from '../../components/AccesoUsuario/CardAcceso'
import { IconoUsuario, IconoEmail, IconoCandado } from '../../components/AccesoUsuario/IconosAcceso'
import { BotonPrimario } from '../../components/common/ui'

import { useToast } from '../../customHooks/useToast'
import { Toast } from '../../components/common/toast'
import { useSesion } from '../../customHooks/useSesion'
import { registro as registroApi } from '../../api/auth'
import { extraerError } from '../../api/client'
import type { Rol } from '../../api/types'

export default function Registro() {
    const [form, setForm] = useState({
        nombre: '',
        apellido: '',
        email: '',
        telefono: '',
        password: '',
        especialidad: '',
    })
    const [enviando, setEnviando] = useState(false)

    const navigate = useNavigate()
    const location = useLocation()
    const { toast, showToast } = useToast()
    const { iniciar } = useSesion()
    const esProfesional = location.pathname.startsWith('/profesional')
    const esAsistente   = location.pathname.startsWith('/asistente')
    const rolActual = esProfesional ? 'profesional' : esAsistente ? 'asistente' : 'cliente'
    const rolBack: Rol  = esProfesional ? 'PROFESIONAL' : esAsistente ? 'ASISTENTE' : 'CLIENTE'

    const onChange = (e: ChangeEvent<HTMLInputElement>) =>
        setForm({ ...form, [e.target.name]: e.target.value })

    const puedeEnviar =
        form.nombre.trim().length > 0 &&
        form.apellido.trim().length > 0 &&
        form.email.trim().length > 0 &&
        form.telefono.trim().length > 0 &&
        form.password.trim().length > 0 &&
        (!esProfesional || form.especialidad.trim().length > 0) &&
        !enviando

    async function enviar(evento: FormEvent<HTMLFormElement>) {
        evento.preventDefault()
        if (!puedeEnviar) return

        setEnviando(true)
        try {
            const usuario = await registroApi({
                email: form.email.trim(),
                password: form.password,
                nombreCompleto: `${form.nombre.trim()} ${form.apellido.trim()}`,
                telefono: form.telefono.trim(),
                rol: rolBack,
                especialidad: esProfesional ? form.especialidad.trim() : undefined,
            })
            iniciar(usuario)
            showToast(
                esProfesional ? 'Cuenta creada. Ya podes administrar tu agenda.'
              : esAsistente   ? 'Cuenta creada. Ya podes operar agendas asignadas.'
                              : 'Cuenta creada. Ya podes reservar turnos.',
                'success',
            )
            const destino = esProfesional ? '/profesional' : esAsistente ? '/asistente' : '/cliente'
            setTimeout(() => navigate(destino), 400)
        } catch (e) {
            showToast(extraerError(e), 'error')
            setEnviando(false)
        }
    }

    return (
        <CardAcceso>
            <HeaderAcceso
                titulo={`Registro ${rolActual}`}
                subtitulo={
                    esProfesional ? 'Registrate gratis para administrar tu agenda profesional.'
                  : esAsistente   ? 'Registrate como asistente para operar agendas de profesionales.'
                                  : 'Registrate gratis y reserva turnos en pocos clics.'
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
                    label="Contraseña"
                    name="password"
                    value={form.password}
                    onChange={onChange}
                    placeholder="********"
                    type="password"
                    icono={<IconoCandado />}
                />

                {esProfesional && (
                    <InputGenerico
                        label="Servicio"
                        name="especialidad"
                        value={form.especialidad}
                        onChange={onChange}
                        placeholder="Ej: Peluqueria"
                        type="text"
                    />
                )}

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
                <Link to="/landing" className="text-primario font-semibold hover:underline">
                    Inicia sesion
                </Link>
            </p>

            <div id="toast-container">
                <Toast toast={toast} />
            </div>
        </CardAcceso>
    )
}
