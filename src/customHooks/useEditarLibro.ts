import { useState, useRef, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { FormLibro, FORM_VACIO } from '../types/libroForm'
import { getLibroPorId, crearLibro, actualizarLibro } from '../services/libro.service'
import { dtoToForm } from '../utils/libroAdaptadores'
import { validarFormularioLibro, validarImagen, validarIsbn, hayErrores, type ErroresFormulario } from '../utils/validacionesLibro'
import { getSession } from '../lib/storage/session'
import { useOnInit } from './hooks'
import { useToast } from './useToast'
import { getMensajeError } from '../utils/errorHandling'

export const useEditarLibro = (id?: string) => {
    const navigate    = useNavigate()
    const modoEdicion = Boolean(id)
    const idUsuario   = Number(getSession())
    const { toast, showToast } = useToast()

    const [form, setForm]             = useState<FormLibro>(FORM_VACIO)
    const [errores, setErrores]       = useState<ErroresFormulario>({})
    const [cargando, setCargando]     = useState<boolean>(modoEdicion)
    const [guardando, setGuardando]   = useState<boolean>(false)
    const [errorCarga, setErrorCarga] = useState<string | null>(null)

    const formOriginal      = useRef<FormLibro>(FORM_VACIO)
    const hayCambios        = JSON.stringify(form) !== JSON.stringify(formOriginal.current)
    const guardarHabilitado = !hayErrores(validarFormularioLibro(form)) && hayCambios

    const cargarLibro = async (libroId: string) => {
        try {
            setCargando(true)
            const dto = await getLibroPorId(libroId)

            if (dto.duenio.id !== idUsuario) {
                navigate(`/perfil/${idUsuario}`)
                return
            }

            const formCargado = dtoToForm(dto)
            setForm(formCargado)
            formOriginal.current = formCargado
        } catch (err) {
            setErrorCarga(getMensajeError(err))
        } finally {
            setCargando(false)
        }
    }

    useOnInit(() => {
        if (!id) return
        cargarLibro(id)
    })

    const handleChange = (field: keyof FormLibro) =>
        (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
            const nuevoForm = { ...form, [field]: e.target.value }
            setForm((prev: FormLibro) => ({ ...prev, [field]: e.target.value }))
            const nuevosErrores = validarFormularioLibro(nuevoForm)
            setErrores((prev: ErroresFormulario) => ({ ...prev, [field]: nuevosErrores[field] }))
        }

    const handleIsbnChange = (valor: string): void => {
        setForm((prev: FormLibro) => ({ ...prev, isbn13: valor }))
        setErrores((prev: ErroresFormulario) => ({ ...prev, isbn13: validarIsbn(valor) ?? undefined }))
    }

    const handleImagenChange = (url: string): void => {
        setForm((prev: FormLibro) => ({ ...prev, imagen: url }))
        setErrores((prev: ErroresFormulario) => ({ ...prev, imagen: validarImagen(url) ?? undefined }))
    }

    const handleImagenEliminar = (): void => {
        setForm((prev: FormLibro) => ({ ...prev, imagen: '' }))
        setErrores((prev: ErroresFormulario) => ({ ...prev, imagen: undefined }))
    }

    const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault()
        try {
            setGuardando(true)
            if (modoEdicion && id) {
                await actualizarLibro(id, form, idUsuario)
            } else {
                await crearLibro(form, idUsuario)
            }
            showToast('Libro guardado con éxito.', 'success')
            setTimeout(() => navigate(`/perfil/${idUsuario}`), 1200)
        } catch (err) {
            showToast(getMensajeError(err), 'error')
        } finally {
            setGuardando(false)
        }
    }

    return {
        form,
        errores,
        toast,
        modoEdicion,
        cargando,
        guardando,
        errorCarga,
        guardarHabilitado,
        handleChange,
        handleIsbnChange,
        handleImagenChange,
        handleImagenEliminar,
        handleSubmit,
    }
}