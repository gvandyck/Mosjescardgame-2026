// ONBOARD-05: getPlayerFacingDecks() is the single source of truth for the
// decks players may see (onboarding modal, guest dropdown, bot pool).
// It returns exactly the 5 duo decks and never the 3 originals.
import { describe, expect, it } from 'vitest';
// @ts-expect-error — JS module, no type declarations
import { getPlayerFacingDecks } from '../../src/data/playerFacingDecks.js';
// @ts-expect-error — JS module, no type declarations
import { STARTER_DECKS } from '../../src/data/starterDecks.js';

const EXPECTED_DUO_IDS = [
  'DUO_COERT_BINTI',
  'DUO_GANDOE_MICHELLE',
  'DUO_CHRIS_YOURI',
  'DUO_JISCA_ALYSSA',
  'DUO_WEST_CLESS',
];

describe('getPlayerFacingDecks()', () => {
  const decks: Array<{ id: string }> = getPlayerFacingDecks();
  const ids = decks.map(d => d.id);

  it('returns exactly 5 decks', () => {
    expect(decks).toHaveLength(5);
  });

  it('every returned deck id starts with DUO_', () => {
    for (const id of ids) {
      expect(id.startsWith('DUO_')).toBe(true);
    }
  });

  it('returns exactly the 5 expected duo ids', () => {
    expect(new Set(ids)).toEqual(new Set(EXPECTED_DUO_IDS));
  });

  it('never contains the 3 original decks', () => {
    expect(ids).not.toContain('PHYSICAL_FORCE');
    expect(ids).not.toContain('DIGITAL_CONTROL');
    expect(ids).not.toContain('ARTISTIC_RHYTHM');
  });

  it('preserves STARTER_DECKS order', () => {
    const sourceOrder = STARTER_DECKS
      .map((d: { id: string }) => d.id)
      .filter((id: string) => EXPECTED_DUO_IDS.includes(id));
    expect(ids).toEqual(sourceOrder);
  });

  it('returns full deck definitions (not just ids)', () => {
    for (const deck of getPlayerFacingDecks() as Array<Record<string, unknown>>) {
      expect(deck).toHaveProperty('name');
      expect(deck).toHaveProperty('mosjes');
      expect(deck).toHaveProperty('piecies');
      expect(deck).toHaveProperty('snellePiecies');
      expect(deck).toHaveProperty('places');
      expect(deck).toHaveProperty('quests');
    }
  });
});
