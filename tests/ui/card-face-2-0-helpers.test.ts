// Phase 62-01: pure 2.0 face helpers (cost, Piecie label, level rows, needs split, tint tokens).
import { describe, it, expect } from 'vitest';
// @ts-ignore JS module
import { readDoc } from '../../scripts/obby2/readDoc.mjs';
// @ts-ignore JS module
import { CARD_ID_MAP } from '../../scripts/obby2/cardIdMap.mjs';
import { MOSJES } from '../../src/data/mosjes.js';
import { PIECIES } from '../../src/data/piecies.js';
import { SNELLE_PIECIES } from '../../src/data/snellePiecies.js';
import { formatEnergyCost } from '../../src/ui/cardV1/formatEnergyCost.js';
import { getPiecieLabel } from '../../src/ui/cardV1/getPiecieLabel.js';
import { getLevelRows } from '../../src/ui/cardV1/getLevelRows.js';
import { splitNeedsLead } from '../../src/ui/cardV1/splitNeedsLead.js';
import { resolveTintAlpha } from '../../src/ui/cardV1/resolveTintAlpha.js';
import {
  TEXTBOX_TINT_ALPHA, TINT_ALPHA_FLOOR, LEVEL_BLOCK_ALPHA, DIM_ROW_OPACITY, TEXT_SIZES,
} from '../../src/ui/cardV1/faceTokens.js';
import { compositeOver, contrastRatio } from '../helpers/contrast.js';

const WHITE = [255, 255, 255];
const INK = [5, 5, 5];

describe('formatEnergyCost (D-04)', () => {
  it('a 0-cost card is "0" with the label COST, never Free or MP COST', () => {
    const c = formatEnergyCost({ cost: 0 });
    expect(c).toEqual({ value: '0', label: 'COST', sub: '' });
    expect(JSON.stringify(c)).not.toMatch(/Free|MP COST/);
  });
  it('plain costs and a missing cost', () => {
    expect(formatEnergyCost({ cost: 3 }).value).toBe('3');
    expect(formatEnergyCost({}).value).toBe('0');
    expect(formatEnergyCost(undefined).value).toBe('0');
    expect(formatEnergyCost({ cost: -2 }).value).toBe('0');
  });
  it('Blensen! shows 4 with "or free" under COST', () => {
    expect(formatEnergyCost({ cost: 4, costText: '4 or free' })).toEqual({ value: '4', label: 'COST', sub: 'or free' });
  });
  it('every real Piecie and Snelle formats a numeric value with the COST label', () => {
    for (const c of [...PIECIES, ...SNELLE_PIECIES] as any[]) {
      const f = formatEnergyCost(c);
      expect(f.value, c.id).toMatch(/^\d+$/);
      expect(f.label, c.id).toBe('COST');
    }
  });
});

describe('getPiecieLabel (D-07, tag first)', () => {
  it('tag wins over group', () => {
    expect(getPiecieLabel({ tag: 'food', group: 'mp' })).toBe('Food');
    expect(getPiecieLabel({ tag: 'gear', group: 'attack' })).toBe('Gear');
    expect(getPiecieLabel({ tag: 'substance', group: 'utility' })).toBe('Substance');
    expect(getPiecieLabel({ tag: 'pet', group: null })).toBe('Pet');
  });
  it('falls back to the group', () => {
    expect(getPiecieLabel({ tag: null, group: 'attack' })).toBe('Attack');
    expect(getPiecieLabel({ tag: null, group: 'mp' })).toBe('MP');
    expect(getPiecieLabel({ group: 'utility' })).toBe('Utility');
  });
  it('neither gives an empty label', () => {
    expect(getPiecieLabel({ tag: null, group: null })).toBe('');
    expect(getPiecieLabel({})).toBe('');
  });
  it('every Card List Piecie gets a label from the 7 allowed values', () => {
    const allowed = ['Food', 'Gear', 'Substance', 'Pet', 'MP', 'Attack', 'Utility'];
    // piecie_mp_adjuster is a disabled dev tool without tag/group, not a Card List card.
    const live = (PIECIES as any[]).filter((p) => !p.disabled);
    expect(live).toHaveLength(73);
    for (const p of live) {
      const label = getPiecieLabel(p);
      expect(label, p.id).not.toBe('');
      expect(allowed, p.id).toContain(label);
    }
  });
});

const gandoe = (MOSJES as any[]).find((m) => m.id === CARD_ID_MAP.mosjes['Gandoe, The Unpredictable Wizard']);

describe('getLevelRows (D-06)', () => {
  it('gives 3 rows, L1 lit by default', () => {
    const rows = getLevelRows(gandoe);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toEqual({ level: 1, label: 'L1', text: 'Power 10 · Phys ★★ · Res ★ · Cre ★★', lit: true });
    expect(rows.map((r: any) => r.lit)).toEqual([true, false, false]);
  });
  it('level 2 lights row 2 only; the level is clamped to 1..3', () => {
    expect(getLevelRows(gandoe, 2).map((r: any) => r.lit)).toEqual([false, true, false]);
    expect(getLevelRows(gandoe, 3).map((r: any) => r.lit)).toEqual([false, false, true]);
    expect(getLevelRows(gandoe, 9).map((r: any) => r.lit)).toEqual([false, false, true]);
    expect(getLevelRows(gandoe, 0).map((r: any) => r.lit)).toEqual([true, false, false]);
    expect(getLevelRows(gandoe, 'x').map((r: any) => r.lit)).toEqual([true, false, false]);
  });
  it('a card without 3 levels has no rows', () => {
    expect(getLevelRows({})).toEqual([]);
    expect(getLevelRows({ levels: [{ power: 1, traits: {} }] })).toEqual([]);
    expect(getLevelRows(null)).toEqual([]);
  });
  it('a level without traits is just the Power', () => {
    const rows = getLevelRows({ levels: [{ power: 5, traits: {} }, { power: 6, traits: {} }, { power: 7, traits: {} }] });
    expect(rows.map((r: any) => r.text)).toEqual(['Power 5', 'Power 6', 'Power 7']);
  });
  it('every Card List Mosje row text equals the Card List level cell', () => {
    const doc: string = readDoc('Obby Card Game 2.0 - Card List.md');
    let checked = 0;
    for (const line of doc.split('\n')) {
      if (!line.includes('L1: Power')) continue;
      const cells = line.split('|').map((s) => s.trim());
      const name = cells[1].replace(/\s*\*\(name owed\)\*/, '');
      const expected = cells[5].split('<br>').map((seg) => seg.trim().replace(/^L\d: /, ''));
      const card = (MOSJES as any[]).find((m) => m.id === CARD_ID_MAP.mosjes[name]);
      expect(card, name).toBeTruthy();
      expect(getLevelRows(card).map((r: any) => r.text), name).toEqual(expected);
      checked += 1;
    }
    expect(checked).toBe(32);
  });
});

describe('splitNeedsLead (D-03, D-12)', () => {
  it('strips "Needs: X." and "Only if X:" / "Only if X."', () => {
    expect(splitNeedsLead('Needs: X. Rest.', 'X')).toBe('Rest.');
    expect(splitNeedsLead('Only if X: it gains 30 MP.', 'X')).toBe('It gains 30 MP.');
    expect(splitNeedsLead('Only if X. This turn ...', 'X')).toBe('This turn ...');
  });
  it('without a (matching) needsText the description is unchanged', () => {
    expect(splitNeedsLead('Needs: X. Rest.', '')).toBe('Needs: X. Rest.');
    expect(splitNeedsLead('Needs: X. Rest.', undefined)).toBe('Needs: X. Rest.');
    expect(splitNeedsLead('Needs: X. Rest.', 'Y')).toBe('Needs: X. Rest.');
    expect(splitNeedsLead('Plain text.', 'X')).toBe('Plain text.');
  });
  it('for the 16 needsText cards the lead is removed and the rest is a suffix of the description', () => {
    const cards = ([...PIECIES, ...SNELLE_PIECIES] as any[]).filter((c) => c.needsText);
    expect(cards).toHaveLength(16);
    for (const c of cards) {
      const rest = splitNeedsLead(c.description, c.needsText);
      expect(rest, c.id).not.toBe(c.description);
      expect(rest.length, c.id).toBeGreaterThan(0);
      expect(c.description.toLowerCase().endsWith(rest.toLowerCase()), c.id).toBe(true);
      expect(rest.charAt(0), c.id).toBe(rest.charAt(0).toUpperCase());
    }
  });
});

describe('tint tokens and contrast (D-05)', () => {
  it('resolveTintAlpha defaults, floors at .60 and caps at 1', () => {
    expect(resolveTintAlpha(undefined)).toBe(TEXTBOX_TINT_ALPHA);
    expect(resolveTintAlpha('nope')).toBe(TEXTBOX_TINT_ALPHA);
    expect(resolveTintAlpha(0.3)).toBe(TINT_ALPHA_FLOOR);
    expect(resolveTintAlpha(0.75)).toBe(0.75);
    expect(resolveTintAlpha(4)).toBe(1);
  });
  it('the token values are the UI-SPEC values', () => {
    expect([TEXTBOX_TINT_ALPHA, TINT_ALPHA_FLOOR, LEVEL_BLOCK_ALPHA, DIM_ROW_OPACITY]).toEqual([0.62, 0.6, 0.8, 0.55]);
    expect(TEXT_SIZES).toEqual([14.5, 13, 11.5]);
  });
  it('white text on the tint at its .60 floor over pure white art is 4.5:1 or better', () => {
    const bg = compositeOver(INK, TINT_ALPHA_FLOOR, WHITE);
    expect(contrastRatio(WHITE, bg)).toBeGreaterThanOrEqual(4.5);
    const bgDefault = compositeOver(INK, TEXTBOX_TINT_ALPHA, WHITE);
    expect(contrastRatio(WHITE, bgDefault)).toBeGreaterThan(contrastRatio(WHITE, bg));
  });
  it('dim level rows (.55) on the .80 block over pure white art are 4.5:1 or better', () => {
    const block = compositeOver(INK, LEVEL_BLOCK_ALPHA, WHITE);
    const text = compositeOver(WHITE, DIM_ROW_OPACITY, block);
    expect(contrastRatio(text, block)).toBeGreaterThanOrEqual(4.5);
  });
  it('control: a .40 tint over white art fails 4.5:1', () => {
    const bg = compositeOver(INK, 0.4, WHITE);
    expect(contrastRatio(WHITE, bg)).toBeLessThan(4.5);
  });
});
