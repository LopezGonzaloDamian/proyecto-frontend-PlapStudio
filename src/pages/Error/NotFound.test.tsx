import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, test, expect } from 'vitest'
import NotFound from '../../pages/Error/NotFound'

const renderError404 = (path = '/ruta-inexistente') =>
    render(
        <MemoryRouter initialEntries={[path]}>
            <NotFound />
        </MemoryRouter>
    )

describe('NotFound', () => {
    test('muestra el título "Página no encontrada"', () => {
        renderError404()
        expect(screen.queryByText('Página no encontrada')).not.toBeNull()
    })

    test('muestra el código 404', () => {
        renderError404()
        expect(screen.getAllByText('404').length).toBeGreaterThan(0)
    })

    test('muestra la URL actual', () => {
        renderError404('/una-ruta-que-no-existe')
        expect(screen.queryByText('/una-ruta-que-no-existe')).not.toBeNull()
    })

    test('el link apunta a /login', () => {
        renderError404()
        const link = screen.getByRole('link', { name: /volver al inicio/i }) as HTMLAnchorElement
        expect(link.getAttribute('href')).toBe('/login')
    })

    test('muestra el mensaje descriptivo', () => {
        renderError404()
        expect(screen.queryByText(/la página que buscás no existe/i)).not.toBeNull()
    })
})