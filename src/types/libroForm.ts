export type TipoLibro   = 'comun' | 'dedicado' | 'coleccionable'
export type GeneroLibro = 'drama' | 'ciencia_ficcion' | 'romance' | 'autoayuda' | 'disenio' | 'literatura_clasica'
export type IdiomaLibro = 'espaniol' | 'ingles' | 'frances' | 'portugues' | 'italiano' | 'chino'
export type EstadoLibro = 'excelente' | 'muy_bueno' | 'bueno' | 'regular' | 'malo'

export type FormLibro = {
    titulo:             string
    tipo:               TipoLibro
    genero:             GeneroLibro
    autor:              string
    idioma:             IdiomaLibro
    estado:             EstadoLibro
    editorial:          string
    fechaDePublicacion: string
    cantidadDePaginas:  string
    isbn13:             string
    descripcion:        string
    imagen:             string  
}

export const FORM_VACIO: FormLibro = {
    titulo:             '',
    tipo:               'comun',
    genero:             'drama',
    autor:              '',
    idioma:             'espaniol',
    estado:             'bueno',
    editorial:          '',
    fechaDePublicacion: '',
    cantidadDePaginas:  '',
    isbn13:             '',
    descripcion:        '',
    imagen:             '',
}