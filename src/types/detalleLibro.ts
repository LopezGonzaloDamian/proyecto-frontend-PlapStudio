export interface LibroDetalleResponse {
  id: number
  titulo: string
  imagen: string
  descripcion: string
  genero: string
  autor: string
  cantidadDePaginas: number
  isbn13: string
  idioma: string
  editorial: string
  fechaDePublicacion: string
  estado: string
  tipoDeLibro: string
  ranking: number
}

export interface Reserva {
  rango: string
  recogida: string
  devolucion: string
  duracion: string
}

export interface Comentario {
  id: number
  usuario: string
  imagen: string
  puntuacion: number
  comentario: string
}

export interface ConfirmarReservaRequest {
  idUsuario: number
  desde: string
  hasta: string
}