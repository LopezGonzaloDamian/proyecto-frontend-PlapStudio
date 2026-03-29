import { FormLibro } from '../types/libroForm'

// ── Tipo de errores ───────────────────────────────────────────────────────────

export type ErroresFormulario = Partial<Record<keyof FormLibro, string>>

// ── Funciones de validación por campo ────────────────────────────────────────

export const validarTitulo = (titulo: string): string | null => {
    if (titulo.trim() === '')       return 'El título no puede estar vacío'
    if (titulo.trim().length > 200) return 'El título no puede superar los 200 caracteres'
    return null
}

export const validarAutor = (autor: string): string | null => {
    if (autor.trim() === '')       return 'El autor no puede estar vacío'
    if (autor.trim().length > 100) return 'El autor no puede superar los 100 caracteres'
    return null
}

export const validarEditorial = (editorial: string): string | null => {
    if (editorial.trim() === '')       return 'La editorial no puede estar vacía'
    if (editorial.trim().length > 100) return 'La editorial no puede superar los 100 caracteres'
    return null
}

export const validarDescripcion = (descripcion: string): string | null => {
    if (descripcion.trim() === '')       return 'La descripción no puede estar vacía'
    if (descripcion.trim().length > 500) return 'La descripción no puede superar los 500 caracteres'
    return null
}

export const validarCantidadDePaginas = (cantidadDePaginas: string): string | null => {
    const num = Number(cantidadDePaginas)
    if (cantidadDePaginas.trim() === '')      return 'La cantidad de páginas no puede estar vacía'
    if (isNaN(num) || !Number.isInteger(num)) return 'La cantidad de páginas debe ser un número entero'
    if (num < 1)                              return 'La cantidad de páginas debe ser al menos 1'
    if (num > 5000)                           return 'La cantidad de páginas no puede superar 5000'
    return null
}

export const validarIsbn = (isbn13: string): string | null => {
    if (isbn13.trim() === '') return 'El ISBN no puede estar vacío'
    const patronIsbn = /^97[89]-\d{10}$/
    if (!patronIsbn.test(isbn13))
        return 'El ISBN debe tener el formato 978-XXXXXXXXXX o 979-XXXXXXXXXX'
    return null
}

/**
 * Formatea el ISBN automáticamente al formato 978-XXXXXXXXXX.
 * Solo permite dígitos, limita a 13, inserta el guión después del tercer dígito.
 */
export const formatearIsbn = (valor: string): string => {
    const soloDigitos = valor.replace(/\D/g, '').slice(0, 13)
    if (soloDigitos.length <= 3) return soloDigitos
    return `${soloDigitos.slice(0, 3)}-${soloDigitos.slice(3)}`
}

export const validarFecha = (fecha: string): string | null => {
    if (fecha.trim() === '') return 'La fecha de publicación no puede estar vacía'
    const fechaDate = new Date(fecha)
    if (isNaN(fechaDate.getTime())) return 'La fecha de publicación no es válida'
    if (fechaDate > new Date())     return 'La fecha de publicación no puede ser futura'
    return null
}

export const validarImagen = (imagen: string): string | null => {
    if (imagen.trim() === '') return null
    if (imagen.startsWith('/')) return null
    if (!/^https?:\/\/.+\..+/.test(imagen))
        return 'La URL debe tener el formato https://sitio.com/imagen.jpg'
    return null
}

// ── Validación completa — devuelve un error por campo ────────────────────────

export const validarFormularioLibro = (form: FormLibro): ErroresFormulario => ({
    titulo:             validarTitulo(form.titulo)                       ?? undefined,
    autor:              validarAutor(form.autor)                         ?? undefined,
    editorial:          validarEditorial(form.editorial)                 ?? undefined,
    descripcion:        validarDescripcion(form.descripcion)             ?? undefined,
    cantidadDePaginas:  validarCantidadDePaginas(form.cantidadDePaginas) ?? undefined,
    isbn13:             validarIsbn(form.isbn13)                         ?? undefined,
    fechaDePublicacion: validarFecha(form.fechaDePublicacion)            ?? undefined,
    imagen:             validarImagen(form.imagen)                       ?? undefined,
})

export const hayErrores = (errores: ErroresFormulario): boolean =>
    Object.values(errores).some(v => v !== undefined)