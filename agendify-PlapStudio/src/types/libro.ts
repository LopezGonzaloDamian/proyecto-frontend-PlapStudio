export type Libro = {
    id: string
    titulo: string
    autor: string
    genero: string
    estado: 'Disponible' | 'Prestado'
    fechaAgregado: string
    colorPortada: string
}

export type LibrosTarjeta = {
    id: number,
    titulo: string,
    imagen: string,
    genero: string,
    autor: string,
    fechaDeAlta: string,
    disponible: boolean,
}