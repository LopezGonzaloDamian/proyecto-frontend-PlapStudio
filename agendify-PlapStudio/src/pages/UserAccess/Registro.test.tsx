import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axios from 'axios'
import { MemoryRouter } from 'react-router-dom'
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

// ── mock de session storage ───────────────────────────────────────────────────
vi.mock('../../lib/storage/session', () => ({
    setSession: vi.fn(),
}))

import Registro from '../../pages/UserAccess/Registro'
import { API_URL } from '../../config/api'

describe('Registro', () => {
    let spyPostAxios: MockInstance<typeof axios['post']>
    let mockNavigate: ReturnType<typeof vi.fn>

    const renderRegistro = () =>
        render(
            <MemoryRouter initialEntries={['/registro']} initialIndex={0}>
                <Registro />
            </MemoryRouter>
        )

    beforeEach(() => {
        mockNavigate = vi.fn()
        useNavigate.mockReturnValue(mockNavigate)
        vi.mock('axios')
        spyPostAxios = vi.spyOn(axios, 'post')
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    // ── render inicial ────────────────────────────────────────────────────────

    test('muestra el título al cargar', () => {
        renderRegistro()
        expect(screen.queryByText('Crea tu cuenta')).not.toBeNull()
    })

    test('el botón arranca deshabilitado si los campos están vacíos', () => {
        renderRegistro()
        const boton = screen.getByRole('button', { name: /registrarse/i }) as HTMLButtonElement
        expect(boton.disabled).toBe(true)
    })

    // ── validación de contraseñas ─────────────────────────────────────────────

    test('muestra alerta si las contraseñas no coinciden', async () => {
        renderRegistro()
        const inputs = screen.getAllByPlaceholderText('••••••••')

        await userEvent.type(inputs[0], 'password123')
        await userEvent.type(inputs[1], 'otrapassword')

        await waitFor(() => {
            expect(screen.queryByText(/las contraseñas no coinciden/i)).not.toBeNull()
        })
    })

    test('no muestra alerta si las contraseñas coinciden', async () => {
        renderRegistro()
        const inputs = screen.getAllByPlaceholderText('••••••••')

        await userEvent.type(inputs[0], 'password123')
        await userEvent.type(inputs[1], 'password123')

        await waitFor(() => {
            expect(screen.queryByText(/las contraseñas no coinciden/i)).toBeNull()
        })
    })

    test('el botón se deshabilita si las contraseñas no coinciden', async () => {
        renderRegistro()
        const inputs = screen.getAllByPlaceholderText('••••••••')

        await userEvent.type(screen.getByPlaceholderText('Ana García'), 'Ana García')
        await userEvent.type(screen.getByPlaceholderText('tu@ejemplo.com'), 'ana@mail.com')
        await userEvent.type(inputs[0], 'password123')
        await userEvent.type(inputs[1], 'otrapassword')

        const boton = screen.getByRole('button', { name: /registrarse/i }) as HTMLButtonElement
        expect(boton.disabled).toBe(true)
    })

    // ── submit ────────────────────────────────────────────────────────────────

    test('al registrarse exitosamente llama al endpoint correcto', async () => {
        spyPostAxios.mockResolvedValueOnce({
            data: { idUsuario: 5, avatarImg: null }
        })

        renderRegistro()
        const inputs = screen.getAllByPlaceholderText('••••••••')

        await userEvent.type(screen.getByPlaceholderText('Ana García'), 'Ana García')
        await userEvent.type(screen.getByPlaceholderText('tu@ejemplo.com'), 'ana@mail.com')
        await userEvent.type(inputs[0], 'password123')
        await userEvent.type(inputs[1], 'password123')
        await userEvent.click(screen.getByRole('button', { name: /registrarse/i }))

        await waitFor(() => {
            expect(spyPostAxios.mock.calls[0][0]).toBe(`${API_URL}/usuario/registro`)
        })
    })

    test('al registrarse envía nombre y apellido separados', async () => {
        spyPostAxios.mockResolvedValueOnce({
            data: { idUsuario: 5, avatarImg: null }
        })

        renderRegistro()
        const inputs = screen.getAllByPlaceholderText('••••••••')

        await userEvent.type(screen.getByPlaceholderText('Ana García'), 'Ana García')
        await userEvent.type(screen.getByPlaceholderText('tu@ejemplo.com'), 'ana@mail.com')
        await userEvent.type(inputs[0], 'password123')
        await userEvent.type(inputs[1], 'password123')
        await userEvent.click(screen.getByRole('button', { name: /registrarse/i }))

        await waitFor(() => {
            const payload = spyPostAxios.mock.calls[0][1] as Record<string, string>
            expect(payload.nombre).toBe('Ana')
            expect(payload.apellido).toBe('García')
            expect(payload.email).toBe('ana@mail.com')
        })
    })

    test('al registrarse exitosamente navega al perfil', async () => {
        spyPostAxios.mockResolvedValueOnce({
            data: { idUsuario: 5, avatarImg: null }
        })

        renderRegistro()
        const inputs = screen.getAllByPlaceholderText('••••••••')

        await userEvent.type(screen.getByPlaceholderText('Ana García'), 'Ana García')
        await userEvent.type(screen.getByPlaceholderText('tu@ejemplo.com'), 'ana@mail.com')
        await userEvent.type(inputs[0], 'password123')
        await userEvent.type(inputs[1], 'password123')
        await userEvent.click(screen.getByRole('button', { name: /registrarse/i }))

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/perfil/5')
        }, { timeout: 2000 })
    })

    test('al fallar el registro muestra mensaje de error', async () => {
        spyPostAxios.mockRejectedValueOnce(new Error('El email ya está registrado'))

        renderRegistro()
        const inputs = screen.getAllByPlaceholderText('••••••••')

        await userEvent.type(screen.getByPlaceholderText('Ana García'), 'Ana García')
        await userEvent.type(screen.getByPlaceholderText('tu@ejemplo.com'), 'ana@mail.com')
        await userEvent.type(inputs[0], 'password123')
        await userEvent.type(inputs[1], 'password123')
        await userEvent.click(screen.getByRole('button', { name: /registrarse/i }))

        await waitFor(() => {
            expect(screen.queryByText(/el email ya está registrado/i)).not.toBeNull()
        })
    })
})