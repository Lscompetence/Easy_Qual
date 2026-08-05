import { describe, it, expect } from 'vitest'
import { CRITERIA_COLORS, getCriterionColor } from './theme'

describe('theme utils', () => {
    it('définit les couleurs des 7 critères Qualiopi', () => {
        for (let id = 1; id <= 7; id++) {
            expect(CRITERIA_COLORS[id]).toBeDefined()
            expect(CRITERIA_COLORS[id].primary).toMatch(/^#[0-9a-f]{6}$/i)
        }
    })

    it('retourne la couleur du critère demandé', () => {
        expect(getCriterionColor(3)).toBe(CRITERIA_COLORS[3])
        expect(getCriterionColor(7)).toBe(CRITERIA_COLORS[7])
    })

    it('retombe sur le critère 1 pour un id inconnu', () => {
        expect(getCriterionColor(99)).toBe(CRITERIA_COLORS[1])
        expect(getCriterionColor(undefined)).toBe(CRITERIA_COLORS[1])
        expect(getCriterionColor(null)).toBe(CRITERIA_COLORS[1])
    })
})
