import { LibrosTarjeta } from './libro'

export type Usuario = {
  nombre: string
  apellido: string
  descripcion: string
  bibliokarmas: number
  celular: string
  email: string
  avatar: string
  ciudad: string
  fechaDeAlta: string
  lector : boolean
  publicador : boolean
  libros: LibrosTarjeta[]
  librosPrestados: number
  librosLeidos: number
}

export type EditarUsuarioForm = {
    nombre: string
    apellido: string
    descripcion: string
    celular: string
    ciudad: string
    avatar: string
    lector: boolean
    publicador: boolean
}