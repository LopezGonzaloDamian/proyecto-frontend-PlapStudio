import axios from 'axios'
import { API_URL } from '../config/api'
import type { LibroDetalleResponse } from '../types/detalleLibro'

export async function getLibroDetalle(id: number): Promise<LibroDetalleResponse> {
  const response = await axios.get(`${API_URL}/libros/${id}`)
  return response.data
}