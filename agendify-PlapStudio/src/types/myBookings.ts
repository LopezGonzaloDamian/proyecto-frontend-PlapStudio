export type BookingType = 'FOR_ME' | 'BY_ME'

export type BookingStatus = 'ACTIVO' | 'PROXIMO_A_VENCER' | 'DEVUELTO'

export type UserReview = {
  rating: number
  comment: string
}

export type MyBookingCard = {
  bookingId: number
  title: string
  author: string
  image: string
  personLabel: string
  personName: string
  startDate: string
  endDate: string
  bibliokarmas: number
  rating: number
  status: BookingStatus
  canReview: boolean
  hasReview: boolean
  userReview: UserReview | null
}

export type MyBookingsPage = {
  items: MyBookingCard[]
  page: number
  size: number
  totalItems: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
}

export type GetMyBookingsParams = {
  type: BookingType
  search?: string
  page?: number
  size?: number
}
