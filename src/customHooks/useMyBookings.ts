import { useEffect, useMemo, useState } from 'react'
import { getMensajeError } from '../utils/errorHandling'
import { getMyBookings } from '../services/myBookings.service'
import type { BookingType, MyBookingsPage } from '../types/myBookings'
import { debounce } from '../utils/debounce'

const DEFAULT_PAGE_SIZE = 4

export const useMyBookings = (userId: number) => {
  const [activeType, setActiveType] = useState<BookingType>('FOR_ME')
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(0)
  const [data, setData] = useState<MyBookingsPage | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadBookings = async (
    nextType: BookingType = activeType,
    nextSearch: string = search,
    nextPage: number = currentPage
  ) => {
    try {
      setLoading(true)
      setError(null)

      const response = await getMyBookings(userId, {
        type: nextType,
        search: nextSearch.trim() || undefined,
        page: nextPage,
        size: DEFAULT_PAGE_SIZE,
      })

      setData(response)
    } catch (err) {
      setError(getMensajeError(err))
    } finally {
      setLoading(false)
    }
  }

  const debouncedSearch = useMemo(
    () =>
      debounce((value: string, type: BookingType) => {
        loadBookings(type, value, 0)
      }, 400),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  useEffect(() => {
    loadBookings(activeType, search, currentPage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeType, currentPage])

  useEffect(() => {
    debouncedSearch(search, activeType)
  }, [search, debouncedSearch])

  const changeType = (nextType: BookingType) => {
    setCurrentPage(0)
    setActiveType(nextType)
  }

  const changeSearch = (value: string) => {
    setCurrentPage(0)
    setSearch(value)
  }

  const goToPage = (page: number) => {
    setCurrentPage(page)
  }

  const retry = async () => {
    await loadBookings()
  }

  return {
    activeType,
    search,
    currentPage,
    data,
    loading,
    error,
    setSearch: changeSearch,
    setActiveType: changeType,
    goToPage,
    retry,
  }
}
