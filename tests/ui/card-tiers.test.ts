import { describe, it, expect, afterEach, vi } from 'vitest';
import { MOSJES } from '../../src/data/mosjes.js';
import { getRarityTier } from '../../src/ui/cardV1/getRarityTier.js';
import { isFullArt } from '../../src/ui/cardV1/isFullArt.js';
import { isTierLayoutEnabled } from '../../src/ui/cardV1/isTierLayoutEnabled.js';
import { getTierAttributes } from '../../src/ui/cardV1/getTierAttributes.js';
import { buildCardV1 } from '../../src/ui/cardV1/buildCardV1.js';
import { buildFaceV1 } from '../../src/ui/cardV1/buildFaceV1.js';
import { buildFieldFaceV1 } from '../../src/ui/cardV1/buildFieldFaceV1.js';
import { buildMosjeSpecV1 } from '../../src/ui/cardV1/buildMosjeSpecV1.js';

const setSearch = (search: string) => vi.stubGlobal('window', { location: { search } });
afterEach(() => vi.unstubAllGlobals());

describe('getRarityTier', () => {
  it('counts stars 1..4, capped at 4', () => {
    expect(getRarityTier({ rarity: '★' })).toBe(1);
    expect(getRarityTier({ rarity: '★★' })).toBe(2);
    expect(getRarityTier({ rarity: '★★★' })).toBe(3);
    expect(getRarityTier({ rarity: '★★★★' })).toBe(4);
    expect(getRarityTier({ rarity: '★★★★★' })).toBe(4);
    expect(getRarityTier({ rarity: '★ ★' })).toBe(2);
  });
  it('falls back to 1 for missing/malformed', () => {
    for (const r of [undefined, null, '', 'abc', {}]) expect(getRarityTier({ rarity: r })).toBe(1);
    expect(getRarityTier(undefined)).toBe(1);
  });
});

describe('isFullArt', () => {
  it('only tier 4 is full art', () => {
    expect(isFullArt(4)).toBe(true);
    for (const t of [1, 2, 3]) expect(isFullArt(t)).toBe(false);
  });
});

describe('isTierLayoutEnabled', () => {
  it('no tier is implemented yet', () => {
    setSearch('');
    for (const t of [1, 2, 3, 4]) expect(isTierLayoutEnabled(t)).toBe(false);
  });
  it('?tiers=all forces on, ?tiers=off forces off', () => {
    setSearch('?tiers=all');
    for (const t of [1, 2, 3, 4]) expect(isTierLayoutEnabled(t)).toBe(true);
    setSearch('?tiers=off');
    for (const t of [1, 2, 3, 4]) expect(isTierLayoutEnabled(t)).toBe(false);
  });
});

describe('getTierAttributes', () => {
  it('builds classes for boxed and full-art tiers', () => {
    setSearch('');
    expect(getTierAttributes({ rarity: '★★' })).toEqual({
      tier: 2, layout: 'boxed', classes: 'card--tier-2 card--boxed', enabled: false,
    });
    setSearch('?tiers=all');
    expect(getTierAttributes({ rarity: '★★★★' })).toEqual({
      tier: 4, layout: 'fullart', classes: 'card--tier-4 card--fullart card--tierlayout', enabled: true,
    });
  });
});

describe('buildCardV1 tier attributes', () => {
  const card = MOSJES.find((m: any) => m.rarity) as any;
  it('adds tier classes in full and field mode', () => {
    setSearch('');
    for (const fieldMode of [false, true]) {
      const r = buildCardV1(card, { fieldMode }) as any;
      const tier = getRarityTier(card);
      expect(r.tier).toBe(tier);
      expect(r.dataTier).toBe(String(tier));
      expect(r.className).toContain(`card--tier-${tier}`);
      expect(r.className).toContain(fieldMode ? 'card-v1--field' : 'card-v1--full');
    }
  });
  it('face html is identical to the pre-tier face builders', () => {
    setSearch('');
    const spec = buildMosjeSpecV1(card);
    expect((buildCardV1(card) as any).html).toBe(buildFaceV1(spec));
    expect((buildCardV1(card, { fieldMode: true }) as any).html).toBe(buildFieldFaceV1(buildMosjeSpecV1(card)));
  });
});
