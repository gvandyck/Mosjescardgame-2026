// getPlayerFacingDecks() is the single source of truth for the decks players
// may see (onboarding modal, guest dropdown, bot pool). 2.1 (Phase 69): exactly the
// 3 starter decks; the Example Decks, duo + original decks are hidden data.
import { describe, expect, it } from 'vitest';
// @ts-expect-error — JS module, no type declarations
import { getPlayerFacingDecks } from '../../src/data/playerFacingDecks.js';
// @ts-expect-error — JS module, no type declarations
import { STARTER_DECKS } from '../../src/data/starterDecks.js';

const EXPECTED_IDS = ['STARTER_PHYSICAL', 'STARTER_DIGITAL', 'STARTER_CREATIVE'];
const EXAMPLE_IDS = ['EXAMPLE_TAKSEN', 'EXAMPLE_REGELAARS', 'EXAMPLE_CREATIEVELINGEN'];
const DUO_IDS = ['DUO_COERT_BINTI', 'DUO_GANDOE_MICHELLE', 'DUO_CHRIS_YOURI', 'DUO_JISCA_ALYSSA', 'DUO_WEST_CLESS'];
const ORIGINALS = ['PHYSICAL_FORCE', 'DIGITAL_CONTROL', 'ARTISTIC_RHYTHM'];

describe('getPlayerFacingDecks()', () => {
  const decks: Array<{ id: string; disabled?: boolean }> = getPlayerFacingDecks();
  const ids = decks.map(d => d.id);

  it('returns exactly the 3 starter decks in order', () => {
    expect(ids).toEqual(EXPECTED_IDS);
  });

  it('never contains a duo, original or Example Deck', () => {
    for (const id of [...DUO_IDS, ...ORIGINALS, ...EXAMPLE_IDS]) expect(ids).not.toContain(id);
  });

  it('returns no disabled deck', () => {
    for (const d of decks) expect(d.disabled).toBeFalsy();
  });

  it('raw STARTER_DECKS keeps all 14 decks (data kept: 3 starter + 3 Example + 8 old), the 8 old ones disabled', () => {
    const raw: Array<{ id: string; disabled?: boolean }> = STARTER_DECKS;
    expect(raw).toHaveLength(14);
    for (const id of [...EXPECTED_IDS, ...EXAMPLE_IDS]) expect(raw.find(d => d.id === id)?.disabled, id).toBeFalsy();
    for (const id of [...DUO_IDS, ...ORIGINALS]) {
      expect(raw.find(d => d.id === id)?.disabled, id).toBe(true);
    }
  });

  it('returns full deck definitions (not just ids)', () => {
    for (const deck of getPlayerFacingDecks() as Array<Record<string, unknown>>) {
      for (const k of ['name', 'mosjes', 'piecies', 'snellePiecies', 'places', 'quests']) {
        expect(deck).toHaveProperty(k);
      }
    }
  });
});
