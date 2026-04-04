import { FormLibro } from '../types/libroForm'
import { LibroDetalleDTO } from '../types/libroDTO'

// ── Validación de campos del backend ─────────────────────────────────────────

/**
 * Verifica que un valor del backend sea un valor válido del tipo esperado.
 * Más seguro que un casteo con `as` — si el backend manda un valor inesperado
 * lo detectamos en lugar de silenciarlo.
 */
function validarCampo<T extends string>(
    valor: string,
    valoresValidos: readonly T[],
    fallback: T
): T {
    return valoresValidos.includes(valor as T) ? (valor as T) : fallback
}

const GENEROS = ['drama', 'ciencia_ficcion', 'romance', 'autoayuda', 'disenio', 'literatura_clasica'] as const
const IDIOMAS = ['espaniol', 'ingles', 'frances', 'portugues', 'italiano', 'chino'] as const
const ESTADOS = ['excelente', 'muy_bueno', 'bueno', 'regular', 'malo'] as const

const TIPO_MAP: Record<string, FormLibro['tipo']> = {
    'Común':         'comun',
    'Dedicado':      'dedicado',
    'Coleccionable': 'coleccionable',
}

// ── Adaptadores ───────────────────────────────────────────────────────────────

/**
 * LibroDetalleDTO (backend) → FormLibro (UI)
 * Se usa al pre-cargar el formulario en modo edición.
 */
export const dtoToForm = (dto: LibroDetalleDTO): FormLibro => ({
    titulo:             dto.titulo,
    descripcion:        dto.descripcion,
    genero:             validarCampo(dto.genero,  GENEROS,  'drama'),
    autor:              dto.autor,
    cantidadDePaginas:  String(dto.cantidadDePaginas),
    isbn13:             dto.isbn13,
    idioma:             validarCampo(dto.idioma,  IDIOMAS,  'espaniol'),
    editorial:          dto.editorial,
    fechaDePublicacion: String(dto.fechaDePublicacion),
    estado:             validarCampo(dto.estado,  ESTADOS,  'bueno'),
    tipo:               TIPO_MAP[dto.tipoDeLibro] ?? 'comun',
    imagen:             dto.imagen,
})

/**
 * FormLibro (UI) → payload para el backend
 * Solo convierte cantidadDePaginas de string a number.
 */
export const formToRequest = (form: FormLibro) => ({
    ...form,
    cantidadDePaginas: Number(form.cantidadDePaginas),
})