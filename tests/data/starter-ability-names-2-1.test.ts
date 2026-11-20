// 72-10 (D-11): no 10 Oct ability name that the 2.1 text no longer matches on the 15 starter Mosjes.
import { describe, it, expect } from 'vitest';
// @ts-ignore JS module
import { MOSJES } from '../../src/data/mosjes.js';
// @ts-ignore JS module
import { STARTER_DECKS_21 } from '../../src/data/starterDecks21.js';

const STALE = ['Chaos Roll', 'Brute Force', 'Tough Gamble', 'Strategic Insight', 'Master Plan'];
const ids: string[] = STARTER_DECKS_21.flatMap((d: any) => d.mosjes);
const starters = ids.map((id) => (MOSJES as any[]).find((m) => m.id === id));

describe('starter Mosje ability names (2.1)', () => {
  it('there are 15 starter Mosjes, all found', () => {
    expect(starters).toHaveLength(15);
    starters.forEach((m) => expect(m).toBeTruthy());
  });
  it.each(ids)('%s has an honest ability name', (id) => {
    const m = (MOSJES as any[]).find((x) => x.id === id);
    expect(typeof m.abilityName).toBe('string');
    expect(STALE).not.toContain(m.abilityName);
    expect(m.abilityName.trim().split(/\s+/).filter(Boolean).length).toBeLessThanOrEqual(3);
    expect(m.abilityName).not.toContain(':');
    if (m.abilityName) {
      const clause = String(m.abilityDescription).split(':')[0].trim();
      expect(m.abilityName).not.toBe(clause);
    }
  });
});
