// getPlayerFacingDecks() is the single source of truth for the decks players
// may see (onboarding modal, guest dropdown, bot pool). Obby 2.0: exactly the
// 3 Example Decks; duo + original decks are disabled data.
import { describe, expect, it } from 'vitest';
// @ts-expect-error — JS module, no type declarations
import { getPlayerFacingDecks } from '../../src/data/playerFacingDecks.js';
// @ts-expect-error — JS module, no type declarations
import { STARTER_DECKS } from '../../src/data/starterDecks.js';

const EXPECTED_IDS = ['EXAMPLE_TAKSEN', 'EXAMPLE_REGELAARS', 'EXAMPLE_CREATIEVELINGEN'];
const DUO_IDS = ['DUO_COERT_BINTI', 'DUO_GANDOE_MICHELLE', 'DUO_CHRIS_YOURI', 'DUO_JISCA_ALYSSA', 'DUO_WEST_CLESS'];
const ORIGINALS = ['PHYSICAL_FORCE', 'DIGITAL_CONTROL', 'ARTISTIC_RHYTHM'];

describe('getPlayerFacingDecks()', () => {
  const decks: Array<{ id: string; disabled?: boolean }> = getPlayerFacingDecks();
  const ids = decks.map(d => d.id);

  it('returns exactly the 3 Example Decks in order', () => {
    expect(ids).toEqual(EXPECTED_IDS);
  });

  it('never contains a duo or original deck', () => {
    for (const id of [...DUO_IDS, ...ORIGINALS]) expect(ids).not.toContain(id);
  });

  it('returns no disabled deck', () => {
    for (const d of decks) expect(d.disabled).toBeFalsy();
  });

  it('raw STARTER_DECKS keeps all 11 decks (data kept), the 8 old ones disabled', () => {
    const raw: Array<{ id: string; disabled?: boolean }> = STARTER_DECKS;
    expect(raw).toHaveLength(11);
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
