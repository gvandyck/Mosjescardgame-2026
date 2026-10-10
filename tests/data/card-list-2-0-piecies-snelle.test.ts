// Phase 53-04 (E29, Piecie + Snelle part): Card List 2.0 vs piecies.js / snellePiecies.js.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
// @ts-ignore JS module
import { parseCardList } from '../../scripts/obby2/parseCardList.mjs';
// @ts-ignore JS module
import { readDoc } from '../../scripts/obby2/readDoc.mjs';
// @ts-ignore JS module
import { CARD_ID_MAP } from '../../scripts/obby2/cardIdMap.mjs';
// @ts-ignore JS module
import { STAYS_BY_ID } from '../../scripts/obby2/staysById.mjs';
// @ts-ignore JS module
import { GIVES_MP_IDS } from '../../scripts/obby2/givesMpIds.mjs';
// @ts-ignore JS module
import { PIECIES } from '../../src/data/piecies.js';
// @ts-ignore JS module
import { SNELLE_PIECIES } from '../../src/data/snellePiecies.js';
// @ts-ignore JS module
import { PLACES } from '../../src/data/places.js';

const list = parseCardList(readDoc('Obby Card Game 2.0 - Card List.md'));
const all: any[] = [...PIECIES, ...SNELLE_PIECIES];
const get = (id: string) => all.find((c) => c.id === id);
const stars = (r: string) => (r.match(/★/g) || []).length;

const rows = [
  ...list.piecies.map((r: any) => ({ r, id: CARD_ID_MAP.piecies[r.name], type: 'piecie' })),
  ...list.snelle.map((r: any) => ({ r, id: CARD_ID_MAP.snelle[r.name], type: 'snelle' })),
];

describe('Card List 2.0 Piecies and Snelle', () => {
  it('has 73 + 20 rows', () => {
    expect(list.piecies).toHaveLength(73);
    expect(list.snelle).toHaveLength(20);
  });
  it('name, text, cost, rarity, tag, group match the Card List', () => {
    for (const { r, id, type } of rows) {
      const c = get(id);
      expect(c, r.name).toBeTruthy();
      expect(c.name).toBe(r.name);
      expect(c.description).toBe(r.text);
      expect(c.cost).toBe(r.cost);
      expect(c.rarity).toBe(r.rarity);
      if (type === 'piecie') { expect(c.tag).toBe(r.tag); expect(c.group).toBe(r.group); }
      else expect(c.tag).toBeNull();
    }
  });
  it('stays is set on exactly the 14 Stays cards', () => {
    expect(Object.keys(STAYS_BY_ID)).toHaveLength(14);
    for (const { id } of rows) expect(get(id).stays, id).toBe(STAYS_BY_ID[id] ?? null);
    expect(rows.filter(({ id }) => get(id).stays !== null)).toHaveLength(14);
  });
  it('levelGate 2 only on Harde Didde, Klaar Met Jou, Dikke Taks', () => {
    const gated = rows.filter(({ id }) => get(id).levelGate === 2).map(({ id }) => id).sort();
    expect(gated).toEqual(['piecie_dikke_taks', 'piecie_harde_didde', 'piecie_klaar_met_jou']);
    for (const { id } of rows) expect([2, null]).toContain(get(id).levelGate);
  });
  it('limitPerDeck is 1 on five-star cards, The Protector and Mosje Reborn, else 2', () => {
    for (const { r, id } of rows) {
      const one = stars(r.rarity) === 5 || id === 'snelle_the_protector' || id === 'piecie_mosje_reborn';
      expect(get(id).limitPerDeck, id).toBe(one ? 1 : 2);
    }
  });
  it('givesMP is true exactly for the agreed list', () => {
    expect(GIVES_MP_IDS).toHaveLength(31);
    for (const { id } of rows) expect(get(id).givesMP, id).toBe(GIVES_MP_IDS.includes(id));
  });
  it('Blensen! costs 4 and says "4 or free"; other Snelle have no costText', () => {
    expect(get('snelle_blensen').cost).toBe(4);
    expect(get('snelle_blensen').costText).toBe('4 or free');
    for (const c of SNELLE_PIECIES.filter((s: any) => s.id !== 'snelle_blensen')) expect(c.costText, c.id).toBeNull();
  });
  it('renames: Nature\'s Gift, Eendjes Voeren (Place), Lucky Cóin', () => {
    expect(get('piecie_eendjes_voeren').name).toBe("Nature's Gift");
    expect((PLACES as any[]).find((p) => p.id === 'place_eendjes_voeren').name).toBe('Eendjes Voeren');
    expect(get('snelle_lucky_coin').name).toBe('Lucky Cóin');
  });
  it('has exactly 4 open-rules TODO markers in piecies.js', () => {
    const src = fs.readFileSync(new URL('../../src/data/piecies.js', import.meta.url), 'utf8');
    expect(src.split('TODO(phase 59): confirm').length - 1).toBe(4);
  });
});
