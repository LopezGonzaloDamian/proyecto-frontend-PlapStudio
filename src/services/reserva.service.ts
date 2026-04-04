 import axios from 'axios'
import { API_URL } from '../config/api'
import {ConfirmarReservaRequest} from 'src/types/detalleLibro'


export async function confirmarReserva(idLibro: number, body: ConfirmarReservaRequest): Promise<void> {
  await axios.post(`${API_URL}/libros/${idLibro}/confirmar-reserva`, body)
}