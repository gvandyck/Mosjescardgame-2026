// Phase 62-01 (D-03): `needsText` on Piecies/Snelle is the condition that opens the Card List text.
import { describe, it, expect } from 'vitest';
// @ts-ignore JS module
import { parseCardList } from '../../scripts/obby2/parseCardList.mjs';
// @ts-ignore JS module
import { readDoc } from '../../scripts/obby2/readDoc.mjs';
// @ts-ignore JS module
import { CARD_ID_MAP } from '../../scripts/obby2/cardIdMap.mjs';
// @ts-ignore JS module
import { PIECIES } from '../../src/data/piecies.js';
// @ts-ignore JS module
import { SNELLE_PIECIES } from '../../src/data/snellePiecies.js';

const list = parseCardList(readDoc('Obby Card Game 2.0 - Card List.md'));
const all: any[] = [...PIECIES, ...SNELLE_PIECIES];
const get = (id: string) => all.find((c) => c.id === id);

// Copied verbatim from the Card List condition (never reworded).
const NEEDS: Record<string, string> = {
  piecie_energy_surge: 'one of your Mosjes has 20 MP or less',
  piecie_dikke_taks: 'one of your Mosjes at Level 2+',
  piecie_harde_didde: 'one of your Mosjes at Level 2+',
  piecie_klaar_met_jou: 'one of your Mosjes at Level 2+',
  piecie_popo_komt: 'there are 3 or more Mosjes on the field in total',
  piecie_huisbaas: 'the top card of any discard pile is a substance Piecie',
  piecie_those_eyelashes: 'a Martin or a West is on your field',
  piecie_battle_concert: 'an Alyssa is on your field',
  piecie_keyboard: 'a Digital Mosje is on your field',
  piecie_mouse: 'a Digital Mosje is on your field',
  piecie_controller: 'a Digital Mosje is on your field',
  snelle_bijna_welloe: 'one of your Mosjes has 10 MP or less',
  snelle_perfect_dodge: 'the attacked Mosje has Physical ★★',
  snelle_lucky_coin: 'one of your Mosjes has Creative ★',
  snelle_counter_strikka: 'one of your Mosjes has Mental ★★',
  snelle_jammertje_gepakt: 'one of your Mosjes has Mental ★★',
};

const rows = [
  ...list.piecies.map((r: any) => ({ r, id: CARD_ID_MAP.piecies[r.name] })),
  ...list.snelle.map((r: any) => ({ r, id: CARD_ID_MAP.snelle[r.name] })),
];

describe('needsText vs the Card List (D-03)', () => {
  it('exactly the 16 expected cards carry needsText, with the Card List condition', () => {
    const withNeeds = all.filter((c) => c.needsText).map((c) => c.id).sort();
    expect(withNeeds).toEqual(Object.keys(NEEDS).sort());
    expect(withNeeds).toHaveLength(16);
    for (const id of Object.keys(NEEDS)) expect(get(id).needsText, id).toBe(NEEDS[id]);
  });

  it('every Card List text that opens with "Needs: " or "Only if " has a matching needsText', () => {
    let n = 0;
    for (const { r, id } of rows) {
      if (!/^(Needs: |Only if )/.test(r.text)) continue;
      const needs = get(id).needsText;
      expect(needs, r.name).toBeTruthy();
      const ok = [`Needs: ${needs}.`, `Only if ${needs}:`, `Only if ${needs}.`].some((p) => r.text.startsWith(p));
      expect(ok, `${r.name}: "${r.text.slice(0, 70)}"`).toBe(true);
      n += 1;
    }
    expect(n).toBe(16);
  });

  it('the three levelGate 2 cards say "one of your Mosjes at Level 2+"', () => {
    const gated = all.filter((c) => c.levelGate === 2);
    expect(gated).toHaveLength(3);
    for (const c of gated) expect(c.needsText, c.id).toBe('one of your Mosjes at Level 2+');
  });

  it('needsText is a bare condition: no "Needs"/"Only" prefix, no trailing "." or ":"', () => {
    for (const c of all.filter((x) => x.needsText)) {
      expect(c.needsText, c.id).not.toMatch(/^(Needs|Only)/);
      expect(c.needsText, c.id).not.toMatch(/[.:]$/);
    }
  });
});
