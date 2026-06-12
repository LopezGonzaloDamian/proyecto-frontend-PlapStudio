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
import type { Rol, ServicioProfesional } from '../../api/types'

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
        serviciosConPrecio: [{ nombre: '', precio: 0 }] as ServicioProfesional[],
    })
    const [enviando, setEnviando] = useState(false)

    const navigate = useNavigate()
    const location = useLocation()
    const { toast, showToast } = useToast()
    const { iniciar } = useSesion()
    const esProfesional = location.pathname.startsWith('/profesional')
    const esAsistente   = location.pathname.startsWith('/asistente')
    const rolActual = esProfesional ? 'profesional' : esAsistente ? 'asistente' : 'cliente'
    const rolBack: Extract<Rol, 'CLIENTE' | 'PROFESIONAL' | 'ASISTENTE'> = esProfesional ? 'PROFESIONAL' : esAsistente ? 'ASISTENTE' : 'CLIENTE'

    const onChange = (e: ChangeEvent<HTMLInputElement>) =>
        setForm({ ...form, [e.target.name]: e.target.value })

    const serviciosProfesional = form.serviciosConPrecio
        .map((servicio) => ({
            nombre: servicio.nombre.trim(),
            precio: Number(servicio.precio) || 0,
        }))
        .filter((servicio) => servicio.nombre.length > 0 || servicio.precio > 0)
    const serviciosProfesionalCompletos =
        serviciosProfesional.length > 0 &&
        serviciosProfesional.every((servicio) => servicio.nombre.length > 0 && servicio.precio > 0)
    const precioCompatibilidad = serviciosProfesional[0]?.precio ?? 0
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
            serviciosProfesionalCompletos
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
                precio: esProfesional ? precioCompatibilidad : undefined,
                servicios: esProfesional ? serviciosProfesional.map((servicio) => servicio.nombre) : undefined,
                serviciosConPrecio: esProfesional ? serviciosProfesional : undefined,
            })
            iniciar(auth, rolBack)
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

                        <section className="rounded-2xl border border-borde bg-fondo p-3">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <h3 className="text-sm font-black text-texto-principal">Servicios y precios</h3>
                                    <p className="mt-1 text-xs text-texto-secundario">Agrega los servicios que vas a ofrecer.</p>
                                </div>
                                <button
                                    type="button"
                                    className="shrink-0 rounded-lg border border-primario bg-white px-3 py-2 text-xs font-bold text-primario hover:bg-primario-claro"
                                    onClick={() => setForm({
                                        ...form,
                                        serviciosConPrecio: [...form.serviciosConPrecio, { nombre: '', precio: 0 }],
                                    })}
                                >
                                    Agregar
                                </button>
                            </div>

                            <div className="mt-3 grid gap-3">
                                {form.serviciosConPrecio.map((servicio, index) => (
                                    <div key={index} className="grid gap-2 rounded-xl border border-borde bg-white p-3">
                                        <InputGenerico
                                            label="Servicio"
                                            value={servicio.nombre}
                                            onChange={(e) => {
                                                const servicios = [...form.serviciosConPrecio]
                                                servicios[index] = { ...servicio, nombre: e.target.value }
                                                setForm({ ...form, serviciosConPrecio: servicios })
                                            }}
                                            placeholder="Ej: Corte"
                                            type="text"
                                        />
                                        <InputGenerico
                                            label="Precio"
                                            value={servicio.precio || ''}
                                            onChange={(e) => {
                                                const servicios = [...form.serviciosConPrecio]
                                                servicios[index] = { ...servicio, precio: Number(e.target.value) || 0 }
                                                setForm({ ...form, serviciosConPrecio: servicios })
                                            }}
                                            placeholder="Ej: 13000"
                                            type="number"
                                            min="1"
                                            step="1"
                                        />
                                        {form.serviciosConPrecio.length > 1 && (
                                            <button
                                                type="button"
                                                className="justify-self-end rounded-lg border border-peligro-suave bg-white px-3 py-2 text-xs font-bold text-peligro hover:bg-red-50"
                                                onClick={() => setForm({
                                                    ...form,
                                                    serviciosConPrecio: form.serviciosConPrecio.filter((_, servicioIndex) => servicioIndex !== index),
                                                })}
                                            >
                                                Eliminar
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    </>
                )}

                <span className={`${!puedeEnviar ? 'cursor-not-allowed' : ''}`} title={!puedeEnviar ? 'Completa los campos requeridos para registrarte' : undefined}>
                    <BotonPrimario
                        type="submit"
                        fullWidth
                        disabled={!puedeEnviar}
                        className={`py-4 text-base rounded-xl ${!puedeEnviar ? 'pointer-events-none' : ''}`}
                    >
                        {enviando ? 'Registrando...' : 'Registrarse'}
                    </BotonPrimario>
                </span>
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

