import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axios from 'axios'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { vi, expect, test, beforeEach, afterEach, describe, type MockInstance, type MockedFunction } from 'vitest'

// ── mock de useNavigate ───────────────────────────────────────────────────────
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom')
    return {
        ...actual,
        useNavigate: vi.fn(),
    }
})
const { useNavigate: useNavigateRaw } = await import('react-router-dom')
const useNavigate = useNavigateRaw as unknown as MockedFunction<() => ReturnType<typeof vi.fn>>

// ── mock de session ───────────────────────────────────────────────────────────
vi.mock('../../lib/storage/session', () => ({
    getSession: vi.fn(() => '1'),
}))

import { EditarLibro } from '../pages/EdicionAltaLibro/EditarLibro'
import { API_URL } from '../config/api'

const libroMock = {
    id:                 1,
    titulo:             'El señor de los anillos',
    imagen:             '',
    descripcion:        'Una épica historia de fantasía.',
    genero:             'drama',
    autor:              'J.R.R. Tolkien',
    cantidadDePaginas:  1200,
    isbn13:             '978-0261103573',
    idioma:             'espaniol',
    editorial:          'Minotauro',
    fechaDePublicacion: '1954-07-29',
    estado:             'bueno',
    tipoDeLibro:        'Común',
    ranking:            4.5,
    duenio:             { id: 1, nombre: 'Ana', apellido: 'García', username: 'ana_garcia' },
}

// helper para completar todos los campos obligatorios del alta
const completarFormulario = async () => {
    await userEvent.type(screen.getByPlaceholderText('Título del libro'),       'El señor de los anillos')
    await userEvent.type(screen.getByPlaceholderText('Nombre del autor'),        'J.R.R. Tolkien')
    await userEvent.type(screen.getByPlaceholderText('Editorial'),               'Minotauro')
    await userEvent.type(screen.getByPlaceholderText('304'),                     '1200')
    await userEvent.type(screen.getByPlaceholderText('978-XXXXXXXXXX'),          '978-0261103573')
    await userEvent.type(screen.getByPlaceholderText('Descripción del libro...'), 'Una épica historia de fantasía.')
    // fecha — buscamos el input type="date" por su tipo
    const fechaInput = document.querySelector('input[type="date"]') as HTMLInputElement
    await userEvent.type(fechaInput, '1954-07-29')
}

describe('EditarLibro', () => {
    let spyGetAxios:  MockInstance<typeof axios['get']>
    let spyPostAxios: MockInstance<typeof axios['post']>
    let mockNavigate: ReturnType<typeof vi.fn>

    const renderAlta = () =>
        render(
            <MemoryRouter initialEntries={['/nuevo-libro']}>
                <Routes>
                    <Route path="/nuevo-libro" element={<EditarLibro />} />
                </Routes>
            </MemoryRouter>
        )

    const renderEdicion = () =>
        render(
            <MemoryRouter initialEntries={['/editar-libro/1']}>
                <Routes>
                    <Route path="/editar-libro/:id" element={<EditarLibro />} />
                </Routes>
            </MemoryRouter>
        )

    beforeEach(() => {
        mockNavigate = vi.fn()
        useNavigate.mockReturnValue(mockNavigate)
        spyGetAxios  = vi.spyOn(axios, 'get')
        spyPostAxios = vi.spyOn(axios, 'post')
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    // ── modo alta ─────────────────────────────────────────────────────────────

    describe('modo alta', () => {
        test('muestra el título "Agregar Nuevo Libro"', () => {
            renderAlta()
            expect(screen.queryByText('Agregar Nuevo Libro')).not.toBeNull()
        })

        test('el botón Guardar arranca deshabilitado', () => {
            renderAlta()
            const boton = screen.getByRole('button', { name: /guardar/i }) as HTMLButtonElement
            expect(boton.disabled).toBe(true)
        })

        test('no hace GET al backend al montar', () => {
            renderAlta()
            expect(spyGetAxios).not.toHaveBeenCalled()
        })

        test('al guardar llama a POST /libros', async () => {
            spyPostAxios.mockResolvedValueOnce({ data: { ...libroMock, id: 2 } })
            renderAlta()

            await completarFormulario()

            await waitFor(() => {
                const boton = screen.getByRole('button', { name: /guardar/i }) as HTMLButtonElement
                expect(boton.disabled).toBe(false)
            })

            await userEvent.click(screen.getByRole('button', { name: /guardar/i }))

            await waitFor(() => {
                expect(spyPostAxios.mock.calls[0][0]).toBe(`${API_URL}/libros`)
            })
        })
    })

    // ── modo edición ──────────────────────────────────────────────────────────

    describe('modo edición', () => {
        test('muestra el título "Editar Detalles del Libro"', async () => {
            spyGetAxios.mockResolvedValueOnce({ data: libroMock })
            renderEdicion()

            await waitFor(() => {
                expect(screen.queryByText('Editar Detalles del Libro')).not.toBeNull()
            })
        })

        test('hace GET al backend al montar', async () => {
            spyGetAxios.mockResolvedValueOnce({ data: libroMock })
            renderEdicion()

            await waitFor(() => {
                expect(spyGetAxios.mock.calls[0][0]).toBe(`${API_URL}/libros/1`)
            })
        })

        test('el botón Guardar arranca deshabilitado si no hay cambios', async () => {
            spyGetAxios.mockResolvedValueOnce({ data: libroMock })
            renderEdicion()

            await waitFor(() => {
                expect(screen.queryByText('Cargando libro...')).toBeNull()
            })

            const boton = screen.getByRole('button', { name: /guardar/i }) as HTMLButtonElement
            expect(boton.disabled).toBe(true)
        })

    })
})