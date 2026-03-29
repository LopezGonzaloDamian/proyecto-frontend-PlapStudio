import { useCallback, useEffect, useState } from 'react'
import { LibrosTarjeta } from 'src/types/libro'
import { getLibrosUsuario } from 'src/services/usuario.service'
import { getMensajeError } from 'src/utils/errorHandling'

export type FiltroEstado = 'Todos' | 'Disponible' | 'Prestado'
export type Campo = 'estado' | 'fechaAgregado' | 'ninguno'
export type Direccion = 'asc' | 'desc' | 'ninguno'

export type CriterioOrden = {
    campo: Campo
    direccion: Direccion
}

export type ParamsBusqueda = {
    pagina: number
    tamanio: number
    campo: Campo
    direccion: Direccion
    filtro: FiltroEstado
}

const calcularNuevaDireccion = (orden: CriterioOrden, campo: string): Direccion => {
    if (orden.campo !== campo) return 'asc'
    if (orden.direccion === 'asc') return 'desc'
    return 'ninguno'
}

export const useGestorLibros = (idUsuario: number, onError?: (message: string) => void) => {
    const [libros, setLibros] = useState<LibrosTarjeta[]>([])
    const [totalPaginas, setTotalPaginas] = useState(1)
    const [params, setParams] = useState<ParamsBusqueda>({
        pagina: 1,
        tamanio: 3,
        campo: 'ninguno',
        direccion: 'ninguno',
        filtro: 'Todos'
    })

    const librosDelBack = useCallback(async () => {
        try {
            const datos = await getLibrosUsuario(idUsuario, params)
            setLibros(datos.libros)
            setTotalPaginas(datos.totalPaginas)
        } catch (err) {
            const errorMessage = getMensajeError(err)
            onError?.(errorMessage)
        }
    }, [idUsuario, params, onError])

    useEffect(() => {
        librosDelBack()
    }, [librosDelBack])

    const ordenarLista = (campo: 'estado' | 'fechaAgregado') => {
        const nuevaDireccion = calcularNuevaDireccion({ campo: params.campo, direccion: params.direccion }, campo)
        setParams(prev => ({
            ...prev,
            campo: nuevaDireccion !== 'ninguno' ? campo : 'ninguno',
            direccion: nuevaDireccion,
            pagina: 1
        }))
    }

    const filtrarPorEstado = (filtro: FiltroEstado) => {
        setParams(prev => ({ ...prev, filtro, pagina: 1 }))
    }

    const cambiarPagina = (pagina: number) => {
        setParams(prev => ({ ...prev, pagina }))
    }

    return { 
        libros, 
        totalPaginas, 
        params, 
        ordenarLista, 
        filtrarPorEstado, 
        cambiarPagina, 
        librosDelBack 
    }
}