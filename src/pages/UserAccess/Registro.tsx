import { useState, type FormEvent, type ChangeEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'

import InputGenerico from '../../components/AccesoUsuario/InputGenerico'
import { CardAcceso, HeaderAcceso } from '../../components/AccesoUsuario/CardAcceso'
import { IconoUsuario, IconoEmail, IconoCandado } from '../../components/AccesoUsuario/IconosAcceso'
import { BotonPrimario } from '../../components/common/ui'

import { registrarUsuario } from '../../services/registro.service'
import { setSession } from '../../lib/storage/session'
import type { LoginResponse } from '../../types/login'

import { useToast } from '../../customHooks/useToast'
import { Toast } from '../../components/common/toast'
import { getMensajeError } from '../../utils/errorHandling'

export default function Registro() {
    const [form, setForm] = useState({
        nombreCompleto: '',  // se separa en nombre + apellido antes de enviarlo
        email:          '',
        password:       '',
        password2:      '',
    })
    const [enviando, setEnviando] = useState(false)

    const navigate = useNavigate()
    const { toast, showToast } = useToast()

    const onChange = (e: ChangeEvent<HTMLInputElement>) =>
        setForm({ ...form, [e.target.name]: e.target.value })

    const contrasenasNoCoinciden =
        form.password.length > 0 &&
        form.password2.length > 0 &&
        form.password !== form.password2

    const puedeEnviar =
        form.nombreCompleto.trim().length > 0 &&
        form.email.trim().length > 0 &&
        form.password.trim().length > 0 &&
        form.password2.trim().length > 0 &&
        !contrasenasNoCoinciden &&
        !enviando

    /**
     * Separa "Ana García" en { nombre: "Ana", apellido: "García" }.
     * Si el usuario ingresó un solo token (ej: "Ana"), apellido queda vacío.
     * Si ingresó más de dos tokens (ej: "María de los Ángeles Ruiz"),
     * el primero es nombre y el resto se une como apellido.
     */
    const separarNombreCompleto = (nombreCompleto: string) => {
        const partes = nombreCompleto.trim().split(/\s+/)
        const nombre   = partes[0] ?? ''
        const apellido = partes.slice(1).join(' ')
        return { nombre, apellido }
    }

    async function enviar(evento: FormEvent<HTMLFormElement>) {
        evento.preventDefault()
        if (!puedeEnviar) return

        setEnviando(true)
        try {
            const { nombre, apellido } = separarNombreCompleto(form.nombreCompleto)

            const payload = {
                nombre,
                apellido,
                email:    form.email.trim(),
                password: form.password.trim(),
            }

            const resp: LoginResponse = await registrarUsuario(payload)

            if (!resp.idUsuario) {
                showToast('No se pudo registrar.', 'error')
                return
            }

            setSession(resp.idUsuario)
            showToast('Cuenta creada con éxito.', 'success')
            setTimeout(() => navigate(`/perfil/${resp.idUsuario}`), 1200)
        } catch (error: unknown) {
            const mensaje = getMensajeError(error)
            showToast(mensaje, 'error')
        } finally {
            setEnviando(false)
        }
    }

    return (
        <CardAcceso>
            <HeaderAcceso
                titulo="Crear cuenta"
                subtitulo="Registrate gratis y empezá a reservar turnos al instante."
            />

            <form className="w-full flex flex-col gap-4" onSubmit={enviar} autoComplete="off">
                <InputGenerico
                    label="Nombre Completo*"
                    name="nombreCompleto"
                    value={form.nombreCompleto}
                    onChange={onChange}
                    placeholder="Ana García"
                    type="text"
                    icono={<IconoUsuario />}
                />

                <InputGenerico
                    label="Correo Electrónico*"
                    name="email"
                    value={form.email}
                    onChange={onChange}
                    placeholder="tu@ejemplo.com"
                    type="text"
                    icono={<IconoEmail />}
                />

                <InputGenerico
                    label="Contraseña*"
                    name="password"
                    value={form.password}
                    onChange={onChange}
                    placeholder="••••••••"
                    type="password"
                    icono={<IconoCandado />}
                />

                <div className="flex flex-col gap-1">
                    <InputGenerico
                        label="Re-ingrese la Contraseña*"
                        name="password2"
                        value={form.password2}
                        onChange={onChange}
                        placeholder="••••••••"
                        type="password"
                        icono={<IconoCandado />}
                        className={contrasenasNoCoinciden
                            ? 'border-peligro focus:border-peligro'
                            : undefined}
                    />
                    {contrasenasNoCoinciden && (
                        <small className="text-xs text-peligro mt-0.5">
                            ⚠ Las contraseñas no coinciden
                        </small>
                    )}
                </div>

                <BotonPrimario
                    type="submit"
                    fullWidth
                    disabled={!puedeEnviar}
                    className="py-4 text-base rounded-xl"
                >
                    {enviando ? 'Registrando…' : 'Registrarse'}
                </BotonPrimario>
            </form>

            <p className="text-xs text-texto-secundario text-center">
                ¿Ya tienes una cuenta?{' '}
                <Link to="/login" className="text-primario font-semibold hover:underline">
                    Inicia sesión
                </Link>
            </p>

            <div id="toast-container">
                <Toast toast={toast} />
            </div>
        </CardAcceso>
    )
}
