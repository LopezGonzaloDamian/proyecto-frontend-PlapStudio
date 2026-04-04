import { API_URL } from '../config/api'
import axios from 'axios'
import { FormLibro } from '../types/libroForm'
import { LibroDetalleDTO } from '../types/libroDTO'
import { formToRequest } from '../utils/libroAdaptadores'

export async function getLibroPorId(id: string): Promise<LibroDetalleDTO> {
    const { data } = await axios.get<LibroDetalleDTO>(`${API_URL}/libros/${id}`)
    return data
}

export async function crearLibro(form: FormLibro, idUsuario: number): Promise<LibroDetalleDTO> {
    const { data } = await axios.post<LibroDetalleDTO>(
        `${API_URL}/libros`,
        formToRequest(form),
        { params: { idUsuario } }
    )
    return data
}

export async function actualizarLibro(id: string, form: FormLibro, idUsuario: number): Promise<LibroDetalleDTO> {
    const { data } = await axios.put<LibroDetalleDTO>(
        `${API_URL}/libros/${id}`,
        formToRequest(form),
        { params: { idUsuario } }
    )
    return data
}