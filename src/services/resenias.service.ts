import axios from 'axios'
import { API_URL } from '../config/api'
import type { Comentario } from '../types/detalleLibro'

export type ReviewFromBookingPayload = {
  rating: number
  comment: string
}

export async function getReseniasLibro(
  idLibro: number,
  soloUltimas = false
): Promise<Comentario[]> {
  const response = await axios.get(`${API_URL}/libros/${idLibro}/resenias`, {
    params: { soloUltimas },
  })

  return response.data
}

export async function saveBookReviewFromBooking(
  bookingId: number,
  payload: ReviewFromBookingPayload
): Promise<void> {
  await axios.post(`${API_URL}/bookings/${bookingId}/review`, {
    puntaje: payload.rating,
    comentario: payload.comment,
  })
}
