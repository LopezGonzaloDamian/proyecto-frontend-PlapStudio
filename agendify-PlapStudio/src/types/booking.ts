export type Booking = {
  id: number
  title: string
  author: string
  gender: string
  isbn: string
  language: string
  pages: number
  type: string
  bibliokarmas: number
  bookingDateFrom: string
  bookingDateUntil: string
  state: 'Excelente' | 'Muy bueno' | 'Bueno' | 'Regular'
  img: string
  owner: string
  rating: number
  available: boolean
}

export type BookingsResponse = {
  bookings: Booking[]
}