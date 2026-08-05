import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import NotFound from './NotFound'

describe('NotFound (page 404)', () => {
    it('affiche le code 404 et un lien de retour à la connexion', () => {
        render(
            <MemoryRouter>
                <NotFound />
            </MemoryRouter>
        )

        expect(screen.getByText('404')).toBeInTheDocument()
        expect(screen.getByText('Page introuvable')).toBeInTheDocument()

        const link = screen.getByRole('link', { name: /retour à la connexion/i })
        expect(link).toHaveAttribute('href', '/login')
    })
})
