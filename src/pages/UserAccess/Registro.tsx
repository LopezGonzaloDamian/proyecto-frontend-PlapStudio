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
        biografia: '',
        localidad: '',
        direccion: '',
        precio: '',
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

    const precioProfesional = Number(form.precio)
    const puedeEnviar =
        form.nombre.trim().length > 0 &&
        form.apellido.trim().length > 0 &&
        form.email.trim().length > 0 &&
        form.telefono.trim().length > 0 &&
        form.password.trim().length > 0 &&
        (!esProfesional || (
            form.especialidad.trim().length > 0 &&
            form.biografia.trim().length > 0 &&
            form.localidad.trim().length > 0 &&
            form.direccion.trim().length > 0 &&
            Number.isFinite(precioProfesional) &&
            precioProfesional > 0
        )) &&
        !enviando

    async function enviar(evento: FormEvent<HTMLFormElement>) {
        evento.preventDefault()
        if (!puedeEnviar) return

        setEnviando(true)
        try {
            const auth = await registroApi({
                email: form.email.trim(),
                password: form.password,
                nombreCompleto: `${form.nombre.trim()} ${form.apellido.trim()}`,
                telefono: form.telefono.trim(),
                rol: rolBack,
                especialidad: esProfesional ? form.especialidad.trim() : undefined,
                biografia: esProfesional ? form.biografia.trim() : undefined,
                localidad: esProfesional ? form.localidad.trim() : undefined,
                direccion: esProfesional ? form.direccion.trim() : undefined,
                precio: esProfesional ? precioProfesional : undefined,
                servicios: esProfesional ? [form.especialidad.trim()] : undefined,
            })
            iniciar(auth)
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
                    placeholder="cliente@gmail.com"
                    type="text"
                    icono={<IconoEmail />}
                />

                <InputGenerico
                    label="Teléfono"
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
                    <>
                        <InputGenerico
                            label="rubro"
                            name="especialidad"
                            value={form.especialidad}
                            onChange={onChange}
                            placeholder="Ej: Peluqueria"
                            type="text"
                        />

                        <label className="flex flex-col gap-1.5">
                            <span className="text-xs font-semibold text-texto-secundario">
                                Descripcion
                            </span>
                            <textarea
                                name="biografía"
                                value={form.biografia}
                                onChange={(e) => setForm({ ...form, biografia: e.target.value })}
                                placeholder="Ej: Cortes, coloracion y tratamientos capilares."
                                rows={3}
                                className="w-full box-border px-3.5 py-3 rounded-xl border border-borde bg-white text-base text-texto-principal placeholder:text-texto-suave outline-none focus:border-primario focus:ring-2 focus:ring-primario/20 transition-colors resize-none"
                            />
                        </label>

                        <InputGenerico
                            label="Localidad"
                            name="localidad"
                            value={form.localidad}
                            onChange={onChange}
                            placeholder="Ej: Villa Maipu"
                            type="text"
                        />

                        <InputGenerico
                            label="Dirección"
                            name="direccion"
                            value={form.direccion}
                            onChange={onChange}
                            placeholder="Ej: Perdriel 2188"
                            type="text"
                        />

                        <InputGenerico
                            label="Valor del turno"
                            name="precio"
                            value={form.precio}
                            onChange={onChange}
                            placeholder="Ej: 70000"
                            type="number"
                            min="1"
                            step="1"
                        />
                    </>
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
                <Link to="/login" className="text-primario font-semibold hover:underline">
                    Inicia sesion
                </Link>
            </p>

            <div id="toast-container">
                <Toast toast={toast} />
            </div>
        </CardAcceso>
    )
}

