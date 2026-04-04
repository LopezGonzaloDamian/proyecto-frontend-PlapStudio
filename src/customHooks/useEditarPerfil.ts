import { useState, useRef, type ChangeEvent, type FormEvent } from 'react'
import { Usuario } from '../types/usuario'
import { updateUsuario } from '../services/usuario.service'
import { EditarUsuarioForm } from '../types/usuario'

const usuarioAForm = (usuario: Usuario): EditarUsuarioForm => ({
    nombre: usuario.nombre,
    apellido: usuario.apellido,
    descripcion: usuario.descripcion,
    celular: usuario.celular,
    ciudad: usuario.ciudad,
    avatar: usuario.avatar,
    lector: usuario.lector,
    publicador: usuario.publicador,
})

const celularValido = (celular: string): boolean =>
    /^\d{10}$/.test(celular.trim())

const formularioValido = (form: EditarUsuarioForm): boolean =>
    form.nombre.trim() !== '' &&
    form.apellido.trim() !== '' &&
    (form.lector || form.publicador) &&
    celularValido(form.celular)

export const useEditarPerfil = (userId: number, usuario: Usuario, onGuardado: () => void) => {
    const formInicial = usuarioAForm(usuario)
    const [form, setForm] = useState<EditarUsuarioForm>(formInicial)
    const [guardando, setGuardando] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const formOriginal = useRef<EditarUsuarioForm>(formInicial)
    const hayCambios = JSON.stringify(form) !== JSON.stringify(formOriginal.current)
    const guardarHabilitado = formularioValido(form) && hayCambios

    const handleChange = (field: keyof EditarUsuarioForm) =>
        (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
            setForm(prev => ({ ...prev, [field]: e.target.value }))

    const handleCheckbox = (field: 'lector' | 'publicador') =>
        (e: ChangeEvent<HTMLInputElement>) =>
            setForm(prev => ({ ...prev, [field]: e.target.checked }))

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        try {
            setGuardando(true)
            setError(null)
            const actualizado = await updateUsuario(userId, form)
            formOriginal.current = usuarioAForm(actualizado)
            onGuardado()
        } catch {
            setError('No se pudo guardar el perfil por error de conexión. Intentá de nuevo.')
        } finally {
            setGuardando(false)
        }
    }

    const resetForm = () => {
        setForm(usuarioAForm(usuario))
        formOriginal.current = usuarioAForm(usuario)
        setError(null)
    }

    return { form, guardando, error, guardarHabilitado, handleChange, handleCheckbox, handleSubmit, resetForm }
}
