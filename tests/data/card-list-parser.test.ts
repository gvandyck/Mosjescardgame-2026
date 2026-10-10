// Phase 53-01: the shared Card List / Example Decks parser reads the real docs.
import { describe, it, expect } from 'vitest';
// @ts-ignore JS module
import { parseCardList } from '../../scripts/obby2/parseCardList.mjs';
// @ts-ignore JS module
import { parseExampleDecks } from '../../scripts/obby2/parseExampleDecks.mjs';
// @ts-ignore JS module
import { CARD_ID_MAP } from '../../scripts/obby2/cardIdMap.mjs';
// @ts-ignore JS module
import { ALL_CARDS } from '../../src/data/cardIndex.js';
// @ts-ignore JS module
import { readDoc } from '../../scripts/obby2/readDoc.mjs';

const list = parseCardList(readDoc('Obby Card Game 2.0 - Card List.md'));
const decks = parseExampleDecks(readDoc('Obby Card Game 2.0 - Example Decks.md'));
const count = (rows: any[], f: (r: any) => boolean) => rows.filter(f).length;

describe('parseCardList', () => {
  it('parses 32 / 38 / 73 / 20 / 20 = 183 rows', () => {
    expect(list.mosjes).toHaveLength(32);
    expect(list.quests).toHaveLength(38);
    expect(list.piecies).toHaveLength(73);
    expect(list.snelle).toHaveLength(20);
    expect(list.places).toHaveLength(20);
  });

  it('splits quests into stacks 13 / 13 / 12', () => {
    for (const [s, n] of [['FIGHTING', 13], ['DIGITAL', 13], ['ARTISTIC', 12]] as const) {
      expect(count(list.quests, (q) => q.stack === s)).toBe(n);
    }
  });

  it('counts quest bands', () => {
    const want: Record<string, number> = {
      steady: 9, skilled: 5, heroic: 3, prepared: 9, gated: 6, coin_flip: 3, trained: 3,
    };
    for (const [b, n] of Object.entries(want)) expect(count(list.quests, (q) => q.band === b)).toBe(n);
    expect(Object.keys(list.bands).sort()).toEqual(Object.keys(want).sort());
  });

  it('every quest win/lose equals its band row', () => {
    for (const q of list.quests) {
      expect({ w: q.win, l: q.lose }, q.name).toEqual({ w: list.bands[q.band].win, l: list.bands[q.band].lose });
    }
  });

  it('Mosjes have 3 levels, Power multiple of 10 and non-decreasing, startMP multiple of 5', () => {
    for (const m of list.mosjes) {
      expect(m.levels, m.name).toHaveLength(3);
      const p = m.levels.map((l: any) => l.power);
      p.forEach((x: number) => expect(x % 10).toBe(0));
      expect(p[0] <= p[1] && p[1] <= p[2], m.name).toBe(true);
      expect(m.startMP % 5).toBe(0);
    }
  });

  it('Mosje ability and holder text', () => {
    const martin = list.mosjes.find((m: any) => m.name === 'Martin, The Precision Driver');
    expect(martin.abilities.map((a: any) => a.name)).toEqual(['Perfect Line', 'Pit Stop']);
    expect(count(list.mosjes, (m) => m.holderText !== null)).toBe(5);
    expect(list.mosjes.find((m: any) => m.name === '[...], The Hacker')).toBeTruthy();
  });

  it('Blensen! is the only non-integer cost', () => {
    const b = list.snelle.find((s: any) => s.name === 'Blensen!');
    expect(b.cost).toBe(4);
    expect(b.costText).toBe('4 or free');
    expect(count(list.snelle, (s) => s.costText !== null)).toBe(1);
  });

  it('piecie tags: food 7, pet 5, substance 9, gear 6', () => {
    for (const [t, n] of [['food', 7], ['pet', 5], ['substance', 9], ['gear', 6]] as const) {
      expect(count(list.piecies, (p) => p.tag === t), t).toBe(n);
    }
  });

  it('pet texts start with the shared pet line', () => {
    const pets = list.piecies.filter((p: any) => p.tag === 'pet');
    expect(pets).toHaveLength(5);
    for (const p of pets) expect(p.text.startsWith('Stays until the end of your next turn.')).toBe(true);
  });
});

describe('CARD_ID_MAP', () => {
  const types = [['mosjes', 32], ['quests', 38], ['piecies', 73], ['snelle', 20], ['places', 20]] as const;

  it('has an entry for every parsed row and the right sizes', () => {
    for (const [t, n] of types) {
      expect(Object.keys(CARD_ID_MAP[t]), t).toHaveLength(n);
      for (const row of list[t]) expect(CARD_ID_MAP[t][row.name], `${t}: ${row.name}`).toBeTruthy();
    }
  });

  it('has 183 unique ids and all of them exist in ALL_CARDS', () => {
    const ids = types.flatMap(([t]) => Object.values(CARD_ID_MAP[t]) as string[]);
    expect(new Set(ids).size).toBe(183);
    const live = new Set(ALL_CARDS.map((c: any) => c.id));
    expect(ids.filter((id) => !live.has(id))).toEqual([]);
  });
});

describe('parseExampleDecks', () => {
  it('parses 3 decks of 30 cards with the starting Mosje inside', () => {
    expect(decks.map((d: any) => d.key)).toEqual(['taksen', 'regelaars', 'creatievelingen']);
    for (const d of decks) {
      expect(d.entries.reduce((s: number, e: any) => s + e.qty, 0), d.name).toBe(30);
      expect(d.entries.some((e: any) => e.name === d.startingMosjeName), d.name).toBe(true);
    }
  });
});
