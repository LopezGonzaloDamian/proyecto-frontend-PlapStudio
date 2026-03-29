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
    setSession:           vi.fn(),
    addRememberedUser:    vi.fn(),
    getRememberedUsers:   vi.fn(() => []),
    removeRememberedUser: vi.fn(),
}))

import Login from '../../pages/UserAccess/Login'
import { API_URL } from '../../config/api'

describe('Login', () => {
    let spyPostAxios: MockInstance<typeof axios['post']>
    let mockNavigate: ReturnType<typeof vi.fn>

    const renderLogin = () =>
        render(
            <MemoryRouter initialEntries={['/login']} initialIndex={0}>
                <Login />
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
        renderLogin()
        expect(screen.queryByText('BookLibre')).not.toBeNull()
    })

    test('el botón de ingresar arranca deshabilitado si los campos están vacíos', () => {
        renderLogin()
        const boton = screen.getByRole('button', { name: /ingresar/i }) as HTMLButtonElement
        expect(boton.disabled).toBe(true)
    })

    // ── interacción ───────────────────────────────────────────────────────────

    test('el botón se habilita cuando se completan email y password', async () => {
        renderLogin()
        await userEvent.type(screen.getByPlaceholderText('tu@ejemplo.com'), 'ana@mail.com')
        await userEvent.type(screen.getByPlaceholderText('••••••••'), '1234')

        const boton = screen.getByRole('button', { name: /ingresar/i }) as HTMLButtonElement
        expect(boton.disabled).toBe(false)
    })

    test('al hacer login exitoso llama al endpoint correcto', async () => {
        spyPostAxios.mockResolvedValueOnce({
            data: { idUsuario: 1, avatarImg: null }
        })

        renderLogin()
        await userEvent.type(screen.getByPlaceholderText('tu@ejemplo.com'), 'ana@mail.com')
        await userEvent.type(screen.getByPlaceholderText('••••••••'), '1234')
        await userEvent.click(screen.getByRole('button', { name: /ingresar/i }))

        await waitFor(() => {
            expect(spyPostAxios.mock.calls[0][0]).toBe(`${API_URL}/usuario/login`)
        })
    })

    test('al hacer login exitoso envía email y password correctos', async () => {
        spyPostAxios.mockResolvedValueOnce({
            data: { idUsuario: 1, avatarImg: null }
        })

        renderLogin()
        await userEvent.type(screen.getByPlaceholderText('tu@ejemplo.com'), 'ana@mail.com')
        await userEvent.type(screen.getByPlaceholderText('••••••••'), '1234')
        await userEvent.click(screen.getByRole('button', { name: /ingresar/i }))

        await waitFor(() => {
            expect(spyPostAxios.mock.calls[0][1]).toEqual({
                email:    'ana@mail.com',
                password: '1234',
            })
        })
    })

    /* test('al hacer login exitoso navega al perfil del usuario', async () => {
        spyPostAxios.mockResolvedValueOnce({
            data: { idUsuario: 1, avatarImg: null }
        })

        renderLogin()
        await userEvent.type(screen.getByPlaceholderText('tu@ejemplo.com'), 'ana@mail.com')
        await userEvent.type(screen.getByPlaceholderText('••••••••'), '1234')
        await userEvent.click(screen.getByRole('button', { name: /ingresar/i }))

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/perfil/1')
        }, { timeout: 2000 })
    }) */

    test('al hacer login fallido muestra mensaje de error', async () => {
        spyPostAxios.mockRejectedValueOnce(new Error('Credenciales incorrectas'))

        renderLogin()
        await userEvent.type(screen.getByPlaceholderText('tu@ejemplo.com'), 'ana@mail.com')
        await userEvent.type(screen.getByPlaceholderText('••••••••'), 'wrongpassword')
        await userEvent.click(screen.getByRole('button', { name: /ingresar/i }))

        await waitFor(() => {
            expect(screen.queryByText(/credenciales incorrectas/i)).not.toBeNull()
        })
    })

    test('al tildar recordarme y hacer login llama a addRememberedUser', async () => {
        const { addRememberedUser } = await import('../../lib/storage/session')

        spyPostAxios.mockResolvedValueOnce({
            data: { idUsuario: 1, avatarImg: null }
        })

        renderLogin()
        await userEvent.type(screen.getByPlaceholderText('tu@ejemplo.com'), 'ana@mail.com')
        await userEvent.type(screen.getByPlaceholderText('••••••••'), '1234')
        await userEvent.click(screen.getByRole('checkbox'))
        await userEvent.click(screen.getByRole('button', { name: /ingresar/i }))

        await waitFor(() => {
            expect(addRememberedUser).toHaveBeenCalledWith('ana@mail.com')
        })
    })
})