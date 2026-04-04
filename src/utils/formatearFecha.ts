// Pa fechas tipo "5 de mayo"
export function formatearFecha(fechaISO: string): string {
  if (!fechaISO) return ''
  const fecha = new Date(fechaISO)
  return fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })
}

// Pa fecha y hora
export function formatearFechaHora(fechaISO: string): string {
  if (!fechaISO) return ''
  const fecha = new Date(fechaISO)
  const opciones: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }
  return fecha.toLocaleDateString('es-ES', opciones)
}

function parsearFecha(fecha: string): Date | null {
  if (!fecha) return null

  if (fecha.includes('/')) {
    const partes = fecha.split('/')
    if (partes.length !== 3) return null

    const [mes, dia, anio] = partes.map(Number)
    if (!mes || !dia || !anio) return null

    return new Date(anio, mes - 1, dia)
  }

  if (fecha.includes('-')) {
    const partes = fecha.split('-')
    if (partes.length !== 3) return null

    const [anio, mes, dia] = partes.map(Number)
    if (!anio || !mes || !dia) return null

    return new Date(anio, mes - 1, dia)
  }

  return null
}

export function calcularDuracion(desde: string, hasta: string): string {
  if (!desde || !hasta) return '-'

  const fechaDesde = parsearFecha(desde)
  const fechaHasta = parsearFecha(hasta)

  if (!fechaDesde || !fechaHasta) return '-'

  const diferencia = fechaHasta.getTime() - fechaDesde.getTime()
  const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24)) + 1

  if (isNaN(dias) || dias <= 0) return '-'

  return `${dias} días`
}