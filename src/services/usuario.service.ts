import { Usuario } from '../types/usuario'
import { API_URL } from '../config/api'
import { ParamsBusqueda } from '../customHooks/useGestorLibros'
import axios from 'axios'
import { LibrosTarjeta } from '../types/libro'

export async function getUsuario(id: number) : Promise<Usuario> {
  const response = await axios.get(`${API_URL}/perfil/${id}`)
  return response.data
}

export interface RespuestaPaginadaLibros {
    libros: LibrosTarjeta[]
    totalPaginas: number
}

export const getLibrosUsuario = async (
    idUsuario: number, 
    params: ParamsBusqueda
): Promise<RespuestaPaginadaLibros> => {
    const { data } = await axios.get<RespuestaPaginadaLibros>(`${API_URL}/libros/usuario/${idUsuario}`, { params })
    return data
}

export async function deleteBookOfUser(idUser: number, idBook: number) {
  await axios.delete(`${API_URL}/delete-book/${idUser}/${idBook}`)
}

export async function updateUsuario(id: number, datos: Partial<Usuario>): Promise<Usuario> {
  const response = await axios.put(`${API_URL}/perfil/${id}`, datos)
  return response.data
}
