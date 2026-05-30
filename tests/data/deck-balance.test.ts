// BAL-02, BAL-03, BAL-04: Data integrity checks for deck compositions and quest economy
// Filled in by Plan 02 (quest data) and Plan 05 (deck composition)
import { describe, expect, it } from 'vitest';
// @ts-expect-error — JS module, no type declarations
import { STARTER_DECKS } from '../../src/data/starterDecks.js';
// @ts-expect-error — JS module, no type declarations
import { QUESTS } from '../../src/data/quests.js';

describe('deck balance data integrity', () => {
  describe('quest economy (BAL-04)', () => {
    it('no quest has failMP worse than -20', () => {
      const violations = QUESTS.filter((q: { failMP: number }) => q.failMP < -20);
      expect(violations).toEqual([]);
    });

    it('all quests have successMP of at least 40', () => {
      const violations = QUESTS.filter((q: { successMP: number }) => q.successMP < 40);
      expect(violations).toEqual([]);
    });
  });

  describe('Digital Control deck (BAL-01)', () => {
    it('deck contains piecie_keyboard', () => {
      const dc = STARTER_DECKS.find((d: { id: string }) => d.id === 'DIGITAL_CONTROL');
      expect(dc?.piecies).toContain('piecie_keyboard');
    });

    it('deck contains piecie_mouse', () => {
      const dc = STARTER_DECKS.find((d: { id: string }) => d.id === 'DIGITAL_CONTROL');
      expect(dc?.piecies).toContain('piecie_mouse');
    });

    it('deck contains piecie_controller', () => {
      const dc = STARTER_DECKS.find((d: { id: string }) => d.id === 'DIGITAL_CONTROL');
      expect(dc?.piecies).toContain('piecie_controller');
    });
  });

  describe('Physical Force deck (BAL-02)', () => {
    it('deck contains piecie_grammetje_pieter', () => {
      const pf = STARTER_DECKS.find((d: { id: string }) => d.id === 'PHYSICAL_FORCE');
      expect(pf?.piecies).toContain('piecie_grammetje_pieter');
    });

    it('deck contains piecie_tikker', () => {
      const pf = STARTER_DECKS.find((d: { id: string }) => d.id === 'PHYSICAL_FORCE');
      expect(pf?.piecies).toContain('piecie_tikker');
    });
  });

  describe('Artistic Rhythm deck (BAL-03)', () => {
    it('deck contains piecie_larry_zegeltje', () => {
      const ar = STARTER_DECKS.find((d: { id: string }) => d.id === 'ARTISTIC_RHYTHM');
      expect(ar?.piecies).toContain('piecie_larry_zegeltje');
    });

    it('deck contains piecie_grammetje_pieter', () => {
      const ar = STARTER_DECKS.find((d: { id: string }) => d.id === 'ARTISTIC_RHYTHM');
      expect(ar?.piecies).toContain('piecie_grammetje_pieter');
    });
  });
});
