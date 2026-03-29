import axios from 'axios'
import { API_URL } from '../config/api'
import type { GetMyBookingsParams, MyBookingsPage } from '../types/myBookings'

export const getMyBookings = async (
  userId: number,
  params: GetMyBookingsParams
): Promise<MyBookingsPage> => {
  const { data } = await axios.get<MyBookingsPage>(`${API_URL}/users/${userId}/my-bookings`, {
    params: {
      type: params.type,
      search: params.search,
      page: params.page ?? 0,
      size: params.size ?? 4,
    },
  })

  return data
}