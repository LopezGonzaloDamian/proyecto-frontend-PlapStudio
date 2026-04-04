export type DuenioDTO = {
    id:       number
    nombre:   string
    apellido: string
    username: string
}

export type LibroDetalleDTO = {
    id:                 number
    titulo:             string
    imagen:             string
    descripcion:        string
    genero:             string
    autor:              string
    cantidadDePaginas:  number
    isbn13:             string
    idioma:             string
    editorial:          string
    fechaDePublicacion: string
    estado:             string
    tipoDeLibro:        string
    ranking:            number
    duenio:             DuenioDTO
}