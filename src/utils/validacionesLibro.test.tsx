import { describe, test, expect } from 'vitest'
import {
    validarTitulo,
    validarAutor,
    validarEditorial,
    validarDescripcion,
    validarCantidadDePaginas,
    validarIsbn,
    validarFecha,
    validarImagen,
    formatearIsbn,
    validarFormularioLibro,
    hayErrores,
} from '../utils/validacionesLibro.ts'
import { FORM_VACIO } from '../types/libroForm.ts'

// ── validarTitulo ─────────────────────────────────────────────────────────────

describe('validarTitulo', () => {
    test('devuelve error si está vacío', () => {
        expect(validarTitulo('')).not.toBeNull()
    })

    test('devuelve error si solo tiene espacios', () => {
        expect(validarTitulo('   ')).not.toBeNull()
    })

    test('devuelve error si supera los 200 caracteres', () => {
        expect(validarTitulo('a'.repeat(201))).not.toBeNull()
    })

    test('devuelve null si es válido', () => {
        expect(validarTitulo('El señor de los anillos')).toBeNull()
    })

    test('acepta exactamente 200 caracteres', () => {
        expect(validarTitulo('a'.repeat(200))).toBeNull()
    })
})

// ── validarAutor ──────────────────────────────────────────────────────────────

describe('validarAutor', () => {
    test('devuelve error si está vacío', () => {
        expect(validarAutor('')).not.toBeNull()
    })

    test('devuelve error si supera los 100 caracteres', () => {
        expect(validarAutor('a'.repeat(101))).not.toBeNull()
    })

    test('devuelve null si es válido', () => {
        expect(validarAutor('J.R.R. Tolkien')).toBeNull()
    })
})

// ── validarEditorial ──────────────────────────────────────────────────────────

describe('validarEditorial', () => {
    test('devuelve error si está vacía', () => {
        expect(validarEditorial('')).not.toBeNull()
    })

    test('devuelve error si supera los 100 caracteres', () => {
        expect(validarEditorial('a'.repeat(101))).not.toBeNull()
    })

    test('devuelve null si es válida', () => {
        expect(validarEditorial('Minotauro')).toBeNull()
    })
})

// ── validarDescripcion ────────────────────────────────────────────────────────

describe('validarDescripcion', () => {
    test('devuelve error si está vacía', () => {
        expect(validarDescripcion('')).not.toBeNull()
    })

    test('devuelve error si supera los 500 caracteres', () => {
        expect(validarDescripcion('a'.repeat(501))).not.toBeNull()
    })

    test('devuelve null si es válida', () => {
        expect(validarDescripcion('Una descripción válida del libro.')).toBeNull()
    })

    test('acepta exactamente 500 caracteres', () => {
        expect(validarDescripcion('a'.repeat(500))).toBeNull()
    })
})

// ── validarCantidadDePaginas ──────────────────────────────────────────────────

describe('validarCantidadDePaginas', () => {
    test('devuelve error si está vacío', () => {
        expect(validarCantidadDePaginas('')).not.toBeNull()
    })

    test('devuelve error si es 0', () => {
        expect(validarCantidadDePaginas('0')).not.toBeNull()
    })

    test('devuelve error si es negativo', () => {
        expect(validarCantidadDePaginas('-1')).not.toBeNull()
    })

    test('devuelve error si supera 5000', () => {
        expect(validarCantidadDePaginas('5001')).not.toBeNull()
    })

    test('devuelve error si no es un número entero', () => {
        expect(validarCantidadDePaginas('12.5')).not.toBeNull()
    })

    test('devuelve null si es válido', () => {
        expect(validarCantidadDePaginas('304')).toBeNull()
    })

    test('acepta exactamente 1', () => {
        expect(validarCantidadDePaginas('1')).toBeNull()
    })

    test('acepta exactamente 5000', () => {
        expect(validarCantidadDePaginas('5000')).toBeNull()
    })
})

// ── validarIsbn ───────────────────────────────────────────────────────────────

describe('validarIsbn', () => {
    test('devuelve error si está vacío', () => {
        expect(validarIsbn('')).not.toBeNull()
    })

    test('devuelve error si no tiene el formato correcto', () => {
        expect(validarIsbn('1234567890123')).not.toBeNull()
    })

    test('devuelve error si empieza con 977', () => {
        expect(validarIsbn('977-1234567890')).not.toBeNull()
    })

    test('devuelve error si tiene menos de 10 dígitos después del prefijo', () => {
        expect(validarIsbn('978-123456789')).not.toBeNull()
    })

    test('devuelve null con prefijo 978', () => {
        expect(validarIsbn('978-1234567890')).toBeNull()
    })

    test('devuelve null con prefijo 979', () => {
        expect(validarIsbn('979-1234567890')).toBeNull()
    })
})

// ── validarFecha ──────────────────────────────────────────────────────────────

describe('validarFecha', () => {
    test('devuelve error si está vacía', () => {
        expect(validarFecha('')).not.toBeNull()
    })

    test('devuelve error si no es una fecha válida', () => {
        expect(validarFecha('no-es-fecha')).not.toBeNull()
    })

    test('devuelve error si es una fecha futura', () => {
        expect(validarFecha('2099-01-01')).not.toBeNull()
    })

    test('devuelve null si es una fecha pasada válida', () => {
        expect(validarFecha('2000-06-15')).toBeNull()
    })
})

// ── validarImagen ─────────────────────────────────────────────────────────────

describe('validarImagen', () => {
    test('devuelve null si está vacía — es opcional', () => {
        expect(validarImagen('')).toBeNull()
    })

    test('devuelve null si es una ruta local', () => {
        expect(validarImagen('/img/portada.jpg')).toBeNull()
    })

    test('devuelve null si es una URL https válida', () => {
        expect(validarImagen('https://sitio.com/imagen.jpg')).toBeNull()
    })

    test('devuelve error si es una URL sin dominio', () => {
        expect(validarImagen('https://asdf')).not.toBeNull()
    })

    test('devuelve error si no empieza con https, http ni /', () => {
        expect(validarImagen('ftp://sitio.com/imagen.jpg')).not.toBeNull()
    })
})

// ── formatearIsbn ─────────────────────────────────────────────────────────────

describe('formatearIsbn', () => {
    test('inserta guión después del tercer dígito', () => {
        expect(formatearIsbn('9781234567890')).toBe('978-1234567890')
    })

    test('ignora caracteres no numéricos', () => {
        expect(formatearIsbn('978abc1234567890')).toBe('978-1234567890')
    })

    test('limita a 13 dígitos', () => {
        expect(formatearIsbn('97812345678901234')).toBe('978-1234567890')
    })

    test('si tiene menos de 3 dígitos no pone guión', () => {
        expect(formatearIsbn('97')).toBe('97')
    })

    test('si tiene exactamente 3 dígitos no pone guión', () => {
        expect(formatearIsbn('978')).toBe('978')
    })
})

// ── validarFormularioLibro ────────────────────────────────────────────────────

describe('validarFormularioLibro', () => {
    test('devuelve errores cuando el form está vacío', () => {
        const errores = validarFormularioLibro(FORM_VACIO)
        expect(hayErrores(errores)).toBe(true)
    })

    test('devuelve errores solo en los campos inválidos', () => {
        const formConTituloVacio = {
            ...FORM_VACIO,
            titulo:             '',
            autor:              'J.R.R. Tolkien',  
            editorial:          'Minotauro',        
            descripcion:        'Una descripción.', 
            cantidadDePaginas:  '304',              
            isbn13:             '978-0261103573',   
            fechaDePublicacion: '1954-07-29',       
        }
        const errores = validarFormularioLibro(formConTituloVacio)
        expect(errores.titulo).not.toBeUndefined()
        expect(errores.autor).toBeUndefined()
    })

    test('no devuelve errores con un form válido completo', () => {
        const formValido = {
            titulo:             'El señor de los anillos',
            tipo:               'comun' as const,
            genero:             'drama' as const,
            autor:              'J.R.R. Tolkien',
            idioma:             'espaniol' as const,
            estado:             'bueno' as const,
            editorial:          'Minotauro',
            fechaDePublicacion: '1954-07-29',
            cantidadDePaginas:  '1200',
            isbn13:             '978-0261103573',
            descripcion:        'Una épica historia de fantasía.',
            imagen:             '',
        }
        expect(hayErrores(validarFormularioLibro(formValido))).toBe(false)
    })
})