// Phase 53-01: QUEST_BANDS, getFrameTier, getCopyLimit.
import { describe, it, expect } from 'vitest';
// @ts-ignore JS module
import { QUEST_BANDS } from '../../src/data/questBands.js';
// @ts-ignore JS module
import { getFrameTier } from '../../src/data/getFrameTier.js';
// @ts-ignore JS module
import { getCopyLimit } from '../../src/data/getCopyLimit.js';
// @ts-ignore JS module
import { parseCardList } from '../../scripts/obby2/parseCardList.mjs';
// @ts-ignore JS module
import { readDoc } from '../../scripts/obby2/readDoc.mjs';

describe('getFrameTier', () => {
  it('Mosjes are always full art (4), 5 when foil or five-star', () => {
    expect(getFrameTier({ type: 'MOSJE', rarity: '★★' })).toBe(4);
    expect(getFrameTier({ type: 'MOSJE', rarity: '★★', foil: true })).toBe(5);
    expect(getFrameTier({ type: 'MOSJE', rarity: '★★★★★' })).toBe(5);
  });
  it('other types follow the star count; Quests are always 1', () => {
    expect(getFrameTier({ type: 'PIECIE', rarity: '★★★' })).toBe(3);
    expect(getFrameTier({ type: 'PLACE' })).toBe(1);
    expect(getFrameTier({ type: 'QUEST' })).toBe(1);
    expect(getFrameTier({ type: 'QUEST', rarity: '★★★' })).toBe(1);
  });
});

describe('getCopyLimit', () => {
  it('limitPerDeck wins, else 1 for five stars, else 2', () => {
    expect(getCopyLimit({ rarity: '★★', limitPerDeck: 1 })).toBe(1);
    expect(getCopyLimit({ rarity: '★★★★★' })).toBe(1);
    expect(getCopyLimit({ rarity: '★★★' })).toBe(2);
  });
});

describe('QUEST_BANDS', () => {
  it('equals the Card List band table', () => {
    const { bands } = parseCardList(readDoc('Obby Card Game 2.0 - Card List.md'));
    expect(Object.keys(QUEST_BANDS)).toHaveLength(7);
    expect(QUEST_BANDS).toEqual(bands);
  });
});
