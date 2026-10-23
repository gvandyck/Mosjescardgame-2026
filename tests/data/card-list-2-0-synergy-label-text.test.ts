// Phase 62-01 (D-10): `synergyLabelText` on Mosjes is the Card List "Synergy" cell (short names).
// The engine keeps reading the `synergyLabel` id array; this field is display only.
import { describe, it, expect } from 'vitest';
// @ts-ignore JS module
import { parseCardList } from '../../scripts/obby2/parseCardList.mjs';
// @ts-ignore JS module
import { readDoc } from '../../scripts/obby2/readDoc.mjs';
// @ts-ignore JS module
import { CARD_ID_MAP } from '../../scripts/obby2/cardIdMap.mjs';
// @ts-ignore JS module
import { MOSJE_SYNERGY_LABELS } from '../../scripts/obby2/mosjeSynergyLabels.mjs';
// @ts-ignore JS module
import { MOSJES } from '../../src/data/mosjes.js';

const list = parseCardList(readDoc('Obby Card Game 2.0 - Card List.md'));
const mosjes: any[] = MOSJES as any[];
const byId = (id: string) => mosjes.find((m) => m.id === id);

describe('synergyLabelText vs the Card List Synergy column (D-10)', () => {
  it('exactly the 14 Mosjes with a non-empty synergyLabel carry synergyLabelText', () => {
    const withText = mosjes.filter((m) => m.synergyLabelText).map((m) => m.id).sort();
    const withLabel = mosjes.filter((m) => (m.synergyLabel || []).length > 0).map((m) => m.id).sort();
    expect(withLabel).toHaveLength(14);
    expect(withText).toEqual(withLabel);
  });

  it('each Mosje synergyLabelText equals its Card List Synergy cell; none when the cell is empty', () => {
    expect(list.mosjes).toHaveLength(32);
    for (const row of list.mosjes) {
      const card = byId(CARD_ID_MAP.mosjes[row.name]);
      if (row.synergyCell) expect(card.synergyLabelText, row.name).toBe(row.synergyCell);
      else expect(card.synergyLabelText ?? null, row.name).toBeNull();
    }
  });

  it('the engine synergyLabel id arrays are untouched', () => {
    for (const row of list.mosjes) {
      const id = CARD_ID_MAP.mosjes[row.name];
      expect(byId(id).synergyLabel, id).toEqual(MOSJE_SYNERGY_LABELS[id] ?? []);
    }
  });
});
