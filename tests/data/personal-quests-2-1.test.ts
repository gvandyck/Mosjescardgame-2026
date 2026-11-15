// Phase 69-02: the 12 starter Personal Quests in src/data/personalQuests.js match handover/cards.json,
// and they are resolvable but inert (never offered by boosters, never a Quest stack).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
// @ts-ignore JS module
import { PERSONAL_QUESTS } from '../../src/data/personalQuests.js';
// @ts-ignore JS module
import { MOSJES } from '../../src/data/mosjes.js';
// @ts-ignore JS module
import { getCardById } from '../../src/data/cardIndex.js';
// @ts-ignore JS module
import { QUESTS } from '../../src/data/quests.js';
// @ts-ignore JS module
import { drawPack } from '../../src/data/boosterEngine.js';

const J = JSON.parse(readFileSync(join(__dirname, '..', '..', 'docs', 'obby-2.0', 'handover', 'cards.json'), 'utf8'));
const source: any[] = J.personalQuests.filter((q: any) => q.set === 'starter');
const FACE: Record<string, number> = { '⚀': 1, '⚁': 2, '⚂': 3, '⚃': 4, '⚄': 5, '⚅': 6 };
const TRAIT: Record<string, string> = { Str: 'STR', Tech: 'TECH', Art: 'ART' };
const byName = (n: string) => PERSONAL_QUESTS.find((q: any) => q.name === n);
const line = (text: string, key: string) => {
  const m = new RegExp(`\\*\\*${key}:\\*\\*\\s*(.*?)(?=\\s*\\*\\*|$)`).exec(text);
  return m ? m[1].trim() : null;
};

describe('starter Personal Quests (cards.json personalQuests, set starter)', () => {
  it('has 12 cards, 4 per Mosje type, unique ids', () => {
    expect(source).toHaveLength(12);
    expect(PERSONAL_QUESTS).toHaveLength(12);
    expect(new Set(PERSONAL_QUESTS.map((q: any) => q.id)).size).toBe(12);
    for (const t of ['PHYSICAL', 'DIGITAL', 'CREATIVE']) {
      expect(PERSONAL_QUESTS.filter((q: any) => q.mosjeType === t)).toHaveLength(4);
    }
  });

  it('applies the rulings: Aloha Tech Support is Digital, Lucky Crescendo is Creative', () => {
    expect(byName('Aloha Tech Support').mosjeType).toBe('DIGITAL');
    expect(byName('Lucky Crescendo').mosjeType).toBe('CREATIVE');
    expect(byName('Aloha Tech Support').designedFor).toBe('mosje_coert_tech');
    expect(byName('Lucky Crescendo').designedFor).toBe('mosje_dj_8020');
  });

  for (const s of source) {
    describe(s.name, () => {
      const q = byName(s.name);
      it('matches cards.json: name, rarity and the three printed lines', () => {
        expect(q).toBeTruthy();
        expect(q.type).toBe('PERSONAL_QUEST');
        expect(q.rarity).toBe('★'.repeat(s.rarity));
        expect(q.needsText).toBe(line(s.text, 'Needs'));
        expect(q.payText).toBe(line(s.text, 'Pay'));
        expect(q.rollText).toBe(line(s.text, 'Roll'));
      });
      it('is designed for a Mosje of its own type that exists', () => {
        const m = MOSJES.find((x: any) => x.id === q.designedFor);
        expect(m).toBeTruthy();
        expect(String(m.subtype).toUpperCase()).toBe(q.mosjeType);
      });
      it('has a structured roll that agrees with the Roll line', () => {
        const roll: string = q.rollText;
        expect(q.roll.trait).toBe(TRAIT[/per (Str|Tech|Art)★/.exec(roll)![1]]);
        const need = /Need (\d)× (\S)(\+?)/.exec(roll);
        if (need) {
          expect(q.roll.need).toEqual({ count: Number(need[1]), face: FACE[need[2]], orHigher: need[3] === '+' });
        } else {
          expect(roll).toContain('any 2 the same');
          expect(q.roll.need).toEqual({ count: 2, face: null, orHigher: false, anySame: true });
        }
        const bonus = /\+1 ▣ per 2 Energy paid/.test(roll);
        expect(Boolean(q.rollExtra?.bonusDicePerEnergyPaid)).toBe(bonus);
        if (bonus) expect(q.rollExtra.bonusDicePerEnergyPaid).toEqual({ energy: 2, dice: 1 });
      });
    });
  }
});

describe('Personal Quests are resolvable but inert', () => {
  it('getCardById finds every one', () => {
    for (const q of PERSONAL_QUESTS) expect(getCardById(q.id)).toBe(q);
  });
  it('are not General Quests and are not in the Quest stacks data', () => {
    for (const q of PERSONAL_QUESTS) expect(QUESTS.some((x: any) => x.id === q.id)).toBe(false);
  });
  it('boosters never drop them', () => {
    const ids = new Set(PERSONAL_QUESTS.map((q: any) => q.id));
    for (let i = 0; i < 200; i++) for (const c of drawPack(5)) expect(ids.has(c.id)).toBe(false);
  });
  it('the 6 old questType PERSONAL Quests stay disabled', () => {
    const old = QUESTS.filter((q: any) => q.questType === 'PERSONAL');
    expect(old.length).toBeGreaterThan(0);
    for (const q of old) expect(q.disabled).toBe(true);
  });
});
