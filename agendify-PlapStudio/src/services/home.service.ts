import axios from 'axios'
import { API_URL } from '../config/api'
import type { BookingsResponse } from '../types/booking'
import type { HomeFilters } from '../types/homeFilters'
import type { RawRecommendedBooking } from '../types/home.api'
import { mapFiltersToRequest, mapToBooking } from '../mappers/home.mapper'

export const getHomeData = async (idUsuario: number): Promise<BookingsResponse> => {
  const { data } = await axios.get<RawRecommendedBooking[]>(
    `${API_URL}/reservas-recomendadas/${idUsuario}`
  )

  return {
    bookings: data.map(mapToBooking),
  }
}

export const getFilteredHomeData = async (
  idUsuario: number,
  filters: HomeFilters
): Promise<BookingsResponse> => {
  const requestBody = mapFiltersToRequest(filters)

  const { data } = await axios.post<RawRecommendedBooking[]>(
    `${API_URL}/reservas-filtradas/${idUsuario}`,
    requestBody
  )

  return {
    bookings: data.map(mapToBooking),
  }
}