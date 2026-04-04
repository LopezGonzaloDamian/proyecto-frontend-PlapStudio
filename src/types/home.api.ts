
export type RawUser = {
    username: string
    nombre: string
    apellido: string
  }
  
  export type RawBook = {
    id: number
    titulo: string
    imagen: string
    genero: string
    autor: string
    cantidadDePaginas: number
    isbn13: string
    idioma: string
    tipoDeLibro: string
    estado: string
    ranking: number
    duenio: RawUser
  }
  
  export type RawRecommendedBooking = {
    libro: RawBook
    usuario: RawUser
    desde: string
    hasta: string
    biblioKarmas: number
  }
  
  export type FiltrosReservaRequest = {
    titulo?: string
    genero?: string[]
    desdePaginas?: number
    hastaPaginas?: number
    desdeFecha?: string
    hastaFecha?: string
    isbn13?: string
    autor?: string
    usernamePrestador?: string
  }