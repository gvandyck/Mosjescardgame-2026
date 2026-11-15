// Phase 69-01 guard: the 15 starter Mosjes and 59 starter cards in src/data match handover/cards.json
// (name, text, cost, rarity, type / subtype, start MP, Power and trait rows). cards.json is read-only here.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
// @ts-ignore JS module
import { MOSJES } from '../../src/data/mosjes.js';
// @ts-ignore JS module
import { PIECIES } from '../../src/data/piecies.js';
// @ts-ignore JS module
import { SNELLE_PIECIES } from '../../src/data/snellePiecies.js';
// @ts-ignore JS module
import { PLACES } from '../../src/data/places.js';
// @ts-ignore JS module
import { PENDING_STARTER_EFFECTS } from '../../src/data/pendingStarterEffects.js';

const J = JSON.parse(readFileSync(join(__dirname, '..', '..', 'docs', 'obby-2.0', 'handover', 'cards.json'), 'utf8'));
const mosjes: any[] = J.mosjes.filter((m: any) => m.set === 'starter');
const cards: any[] = J.cards.filter((c: any) => c.starter === true || c.set === 'starter');
const TRAIT: Record<string, string> = { Str: 'strength', Tech: 'technical', Art: 'artistic', Men: 'mental', Soc: 'social', Res: 'resilient' };
const stars = (n: number) => '★'.repeat(n);

// "LV1 Str ★★ · Art ★ · Soc ★" -> { strength: 2, artistic: 1, social: 1 }
function parseRow(row: string) {
  const out: Record<string, number> = {};
  for (const part of row.replace(/^LV\d\s*/, '').split('·')) {
    const m = /^\s*(\w+)\s+(★+)\s*$/.exec(part);
    if (!m) throw new Error(`bad trait row: ${row}`);
    out[TRAIT[m[1]]] = m[2].length;
  }
  return out;
}

describe('starter set (cards.json) vs src/data', () => {
  it('has 15 Mosjes and 59 cards', () => {
    expect(mosjes).toHaveLength(15);
    expect(cards).toHaveLength(59);
    expect(cards.filter((c) => c.isNew)).toHaveLength(17);
  });

  describe.each(mosjes)('Mosje $name', (m) => {
    const d = (MOSJES as any[]).find((x) => x.id === m.dataId);
    it('matches', () => {
      expect(d, `no data Mosje ${m.dataId}`).toBeTruthy();
      expect(d.name).toBe(m.name);
      expect(d.subtype).toBe(m.type.toUpperCase());
      expect(d.cost).toBe(m.cost);
      expect(d.startMP).toBe(m.startMP);
      expect(d.abilityDescription).toBe(m.ability);
      expect(d.rarity).toBe('★★★★');
      const powers = m.power.split('/').map(Number);
      expect(d.levels.map((l: any) => l.power)).toEqual(powers);
      expect(d.levels.map((l: any) => l.traits)).toEqual(m.traits.map(parseRow));
      expect(d.traits).toEqual(parseRow(m.traits[0]));
    });
  });

  const pool = [...PIECIES, ...SNELLE_PIECIES, ...PLACES] as any[];
  describe.each(cards)('Card $name', (c) => {
    const d = c.isNew ? pool.find((x) => x.name === c.name) : pool.find((x) => x.id === c.dataId);
    it('matches', () => {
      expect(d, `no data card for ${c.name}`).toBeTruthy();
      expect(d.name).toBe(c.name);
      expect(d.description ?? d.text).toBe(c.text);
      expect(d.cost).toBe(c.cost);
      expect(d.rarity).toBe(stars(c.rarity));
      expect(d.disabled).not.toBe(true);
      if (c.kind === 'piecie') expect(d.piecieKind).toBe(c.subtype);
      else expect(d.piecieKind).toBeUndefined();
      if (c.kind === 'piecie' && ['food', 'gear', 'pet', 'substance'].includes(c.subtype)) expect(d.tag).toBe(c.subtype);
    });
    if (c.isNew) {
      it('is listed as a pending starter effect (Phase 71)', () => {
        expect(PENDING_STARTER_EFFECTS).toContain(d.effectId);
        expect(d.isBoosterOnly).toBe(false);
      });
    }
  });

  it('pending effect list holds exactly the 17 new cards', () => {
    expect(new Set(PENDING_STARTER_EFFECTS).size).toBe(17);
  });

  it('the 17 archived cards are disabled but kept', () => {
    for (const name of J.dataCardsWithoutText) {
      const d = pool.find((x) => x.name === name);
      expect(d, name).toBeTruthy();
      expect(d.disabled, name).toBe(true);
    }
  });
});
