import { describe, it, expect, afterEach, vi } from 'vitest';
import { MOSJES } from '../../src/data/mosjes.js';
import { getRarityTier } from '../../src/ui/cardV1/getRarityTier.js';
import { isFullArt } from '../../src/ui/cardV1/isFullArt.js';
import { isTierLayoutEnabled } from '../../src/ui/cardV1/isTierLayoutEnabled.js';
import { getTierAttributes } from '../../src/ui/cardV1/getTierAttributes.js';
import { buildCardV1 } from '../../src/ui/cardV1/buildCardV1.js';
import { buildFaceV1 } from '../../src/ui/cardV1/buildFaceV1.js';
import { buildFieldFaceV1 } from '../../src/ui/cardV1/buildFieldFaceV1.js';
import { PIECIES } from '../../src/data/piecies.js';
import { PLACES } from '../../src/data/places.js';
import { buildTierChrome } from '../../src/ui/cardV1/buildTierChrome.js';
import { buildShineLayers } from '../../src/ui/cardV1/buildShineLayers.js';
import { getAbilityTextSize } from '../../src/ui/cardV1/getAbilityTextSize.js';
import { getTierFadeHeight } from '../../src/ui/cardV1/getTierFadeHeight.js';
import { buildMosjeSpecV1 } from '../../src/ui/cardV1/buildMosjeSpecV1.js';

const setSearch = (search: string) => vi.stubGlobal('window', { location: { search, origin: 'http://localhost', href: 'http://localhost/' } });
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
  it('all four tiers are implemented', () => {
    setSearch('');
    for (const t of [1, 2, 3, 4]) expect(isTierLayoutEnabled(t)).toBe(true);
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
    setSearch('?tiers=off');
    expect(getTierAttributes({ rarity: '★★★' })).toEqual({
      tier: 3, layout: 'boxed', classes: 'card--tier-3 card--boxed', enabled: false,
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
    for (const fieldMode of [false, true]) {
      const r = buildCardV1(card, { fieldMode }) as any;
      const tier = getRarityTier(card);
      expect(r.tier).toBe(tier);
      expect(r.dataTier).toBe(String(tier));
      expect(r.className).toContain(`card--tier-${tier}`);
      expect(r.className).toContain(fieldMode ? 'card-v1--field' : 'card-v1--full');
    }
  });
  it('face html is identical to the pre-tier face builder with ?tiers=off', () => {
    setSearch('?tiers=off');
    const c = { ...card, rarity: '★★★' };
    const spec = buildMosjeSpecV1(c);
    expect((buildCardV1(c) as any).html).toBe(buildFaceV1(spec));
    expect((buildCardV1(card, { fieldMode: true }) as any).html).toBe(buildFieldFaceV1(buildMosjeSpecV1(card)));
  });
});

// No DOM in this vitest env: read class lists in document order from the html string.
const classesIn = (html: string) => [...html.matchAll(/<(?:div|i|img) [^>]*class="([^"]+)"/g)].map((m) => m[1]);
const windowOf = (html: string) => html.slice(html.indexOf('<div class="cv1-window">') + 24, html.indexOf('<div class="cv1-name">'));
const count = (html: string, cls: string) => classesIn(html).filter((c) => c.split(' ').includes(cls)).length;

describe('buildTierChrome', () => {
  it('4 diamonds, first `tier` lit, plus two OBBY side labels', () => {
    for (const tier of [1, 2, 3, 4]) {
      const html = buildTierChrome(tier);
      const cls = classesIn(html);
      const diamonds = cls.filter((c) => c.split(' ').includes('ct-diamond'));
      expect(diamonds.length).toBe(4);
      expect(diamonds.map((c) => c.includes('ct-diamond--lit'))).toEqual([0, 1, 2, 3].map((i) => i < tier));
      const sides = cls.filter((c) => c.split(' ').includes('ct-side'));
      expect(sides.length).toBe(2);
      expect(sides[0]).toContain('ct-side--l');
      expect(html.match(/>OBBY CARD GAME</g)!.length).toBe(2);
    }
  });
});

describe('buildShineLayers', () => {
  it('holo, sweep, 3 glints in order', () => {
    const kids = classesIn(buildShineLayers()).map((c) => c.split(' ')[0]);
    expect(kids).toEqual(['ct-holo', 'ct-sweep', 'ct-glint', 'ct-glint', 'ct-glint']);
  });
});

describe('getAbilityTextSize (full art)', () => {
  it('Mosje 14, 3-line Place 15, one-sentence Piecie/Snelle 18', () => {
    expect(getAbilityTextSize({ lines: ['a. b.', 'c.', 'd.'], typeKey: 'MOSJE', layout: 'fullart' })).toBe(14);
    expect(getAbilityTextSize({ lines: ['Gain 10 MP.', 'Draw 1 card.', 'Lose 5 MP.'], typeKey: 'PLACE', layout: 'fullart' })).toBe(15);
    expect(getAbilityTextSize({ lines: ['Gain 10 MP.'], typeKey: 'PIECIE', layout: 'fullart' })).toBe(18);
    expect(getAbilityTextSize({ lines: ['Gain 10 MP.'], typeKey: 'SNELLE_PIECIE', layout: 'fullart' })).toBe(18);
    expect(getAbilityTextSize({ lines: ['x'.repeat(300)], typeKey: 'PIECIE', layout: 'fullart' })).toBe(14);
  });
});

describe('getTierFadeHeight', () => {
  it('380 for long Mosje text, 250-300 otherwise', () => {
    expect(getTierFadeHeight({ typeKey: 'MOSJE', lines: ['a', 'b', 'c'] })).toBe(380);
    expect(getTierFadeHeight({ typeKey: 'MOSJE', lines: ['x'.repeat(250)] })).toBe(380);
    for (const v of [getTierFadeHeight({ typeKey: 'MOSJE', lines: ['short'] }), getTierFadeHeight({ typeKey: 'PIECIE', lines: ['a', 'b', 'c'] })]) {
      expect(v).toBeGreaterThanOrEqual(250);
      expect(v).toBeLessThanOrEqual(300);
    }
  });
});

describe('tier 4 face', () => {
  const base = MOSJES.find((m: any) => m.artPath) as any;
  const t4 = { ...base, rarity: '★★★★' };
  it('window layers follow CardTiers7/8 order: art, fades, holo, sweep, glints', () => {
    setSearch('');
    const html = (buildCardV1(t4) as any).html;
    const kids = classesIn(windowOf(html)).map((c) => c.split(' ').pop());
    expect(kids).toEqual(['cv1-art', 'cv1-fade--bottom', 'cv1-fade--top', 'ct-holo', 'ct-sweep', 'ct-glint--1', 'ct-glint--2', 'ct-glint--3']);
    expect(count(html, 'cv1-stripe')).toBe(0);
    expect(count(html, 'cv1-diamond')).toBe(0);
    expect(count(html, 'ct-diamond--lit')).toBe(4);
    const spec = buildMosjeSpecV1(t4);
    const style = html.match(/class="cv1-face[^"]*" style="([^"]+)"/)![1];
    expect(style).toContain(`--cv1-desc-size:${getAbilityTextSize({ lines: spec.lines, typeKey: 'MOSJE', layout: 'fullart' })};`);
    expect(style).toContain(`--cv1-fade:${getTierFadeHeight({ typeKey: 'MOSJE', lines: spec.lines })}`);
  });
  it('art-less tier 4 card keeps window, shine and fades, no img', () => {
    setSearch('');
    const w = windowOf((buildCardV1({ ...t4, artPath: undefined }) as any).html);
    expect(w).not.toContain('<img');
    expect(count(w, 'ct-holo')).toBe(1);
    expect(count(w, 'ct-sweep')).toBe(1);
    expect(count(w, 'ct-glint')).toBe(3);
    expect(count(w, 'cv1-fade--bottom')).toBe(1);
    expect(count(w, 'cv1-fade--top')).toBe(1);
  });
  it('field mode is unchanged for every tier', () => {
    for (const c of [base, PIECIES[0], PLACES[0]] as any[]) {
      for (const tier of [1, 2, 3, 4]) {
        const r = buildCardV1({ ...c, rarity: '★'.repeat(tier) }, { fieldMode: true }) as any;
        expect(r.html).not.toContain('ct-');
      }
    }
  });
});

describe('getAbilityTextSize (boxed)', () => {
  it('one-sentence Piecie/Snelle 17, Mosje 14, 3-line Place 15, very long 13', () => {
    expect(getAbilityTextSize({ lines: ['Gain 25 MP to your active Mosje.'], typeKey: 'PIECIE', layout: 'boxed' })).toBe(17);
    expect(getAbilityTextSize({ lines: ['Gain 25 MP.'], typeKey: 'SNELLE_PIECIE', layout: 'boxed' })).toBe(17);
    expect(getAbilityTextSize({ lines: ['a. b.', 'c.', 'd.'], typeKey: 'MOSJE', layout: 'boxed' })).toBe(14);
    expect(getAbilityTextSize({ lines: ['Gain 10 MP.', 'Draw 1 card.', 'Lose 5 MP.'], typeKey: 'PLACE', layout: 'boxed' })).toBe(15);
    expect(getAbilityTextSize({ lines: ['x'.repeat(400)], typeKey: 'MOSJE', layout: 'boxed' })).toBe(13);
  });
});

describe('boxed face (tiers 1 and 2)', () => {
  const base = MOSJES.find((m: any) => m.artPath) as any;
  for (const tier of [1, 2]) {
    it(`tier ${tier}: layers, plate, diamonds, side labels, window`, () => {
      setSearch('');
      const r = buildCardV1({ ...base, rarity: '★'.repeat(tier) }) as any;
      expect(r.className).toContain('card--boxed');
      expect(r.className).toContain('card--tierlayout');
      const html = r.html;
      const order = classesIn(html).map((c) => c.split(' ')[0])
        .filter((c) => ['ct-waves', 'ct-calm', 'ct-grain', 'ct-light', 'ct-inner', 'cv1-window', 'ct-plate-waves', 'ct-plate'].includes(c));
      expect(order).toEqual(['ct-waves', 'ct-calm', 'ct-calm', 'ct-grain', 'ct-light', 'ct-inner', 'cv1-window', 'ct-plate-waves', 'ct-plate']);
      expect(count(html, `ct-inner--t${tier}`)).toBe(1);
      expect(count(html, 'ct-diamond')).toBe(4);
      expect(count(html, 'ct-diamond--lit')).toBe(tier);
      expect(count(html, 'ct-side')).toBe(2);
      expect(count(html, 'cv1-stripe')).toBe(0);
      expect(html).toMatch(/<div class="ct-plate">\s*<div class="cv1-desc">/);
      const w = windowOf(html);
      expect(w).toContain('<img');
      expect(count(w, 'ct-holo')).toBe(0);
      const style = html.match(/class="cv1-face[^"]*" style="([^"]+)"/)![1];
      const spec = buildMosjeSpecV1(base);
      expect(style).toContain(`--cv1-desc-size:${getAbilityTextSize({ lines: spec.lines, typeKey: 'MOSJE', layout: 'boxed' })};`);
    });
  }
  it('art-less boxed card keeps the window with no img', () => {
    setSearch('');
    const html = (buildCardV1({ ...PIECIES[0], artPath: undefined, rarity: '★' }) as any).html;
    expect(count(html, 'cv1-window')).toBe(1);
    expect(windowOf(html)).not.toContain('<img');
  });
  it('?tiers=off keeps the E1 face on tier 1/2', () => {
    setSearch('?tiers=off');
    const c = { ...base, rarity: '★★' };
    expect((buildCardV1(c) as any).html).toBe(buildFaceV1(buildMosjeSpecV1(c)));
  });
});

describe('boxed face tier 3 (foil)', () => {
  const base = MOSJES.find((m: any) => m.artPath) as any;
  const t3 = { ...base, rarity: '★★★' };
  it('waves wrap with tint, foil inner line, foil art ring, cosmos + rainbow in window', () => {
    setSearch('');
    const r = buildCardV1(t3) as any;
    expect(r.className).toContain('card--boxed');
    const html = r.html;
    expect(html).toMatch(/<i class="ct-waves-wrap"><i class="ct-waves"><\/i><i class="ct-rb ct-foil-anim"><\/i><\/i>/);
    expect(html).toMatch(/<i class="ct-inner ct-inner--t3"><i class="ct-ring ct-foil ct-foil-anim"><\/i><\/i>/);
    expect(count(html, 'ct-art-ring')).toBe(1);
    expect(html).toMatch(/class="ct-art-ring ct-ring ct-foil ct-foil-anim"/);
    expect(count(html, 'ct-plate-waves')).toBe(0);
    expect(count(html, 'ct-diamond--lit')).toBe(3);
    const w = windowOf(html);
    const inside = w.slice(0, w.lastIndexOf('</div>'));
    expect(classesIn(inside).map((c) => c.split(' ')[0])).toEqual(['cv1-art', 'ct-cosmos', 'ct-rainbow']);
    expect(inside).not.toContain('ct-art-ring');
  });
  it('art-less tier 3 keeps cosmos and rainbow over the placeholder', () => {
    setSearch('');
    const w = windowOf((buildCardV1({ ...PIECIES[0], artPath: undefined, rarity: '★★★' }) as any).html);
    expect(w).not.toContain('<img');
    expect(count(w, 'ct-cosmos')).toBe(1);
    expect(count(w, 'ct-rainbow')).toBe(1);
  });
  it('tiers 1/2 have no foil; field mode has no ct- markup', () => {
    setSearch('');
    for (const tier of [1, 2]) {
      const html = (buildCardV1({ ...base, rarity: '★'.repeat(tier) }) as any).html;
      expect(html).not.toContain('ct-foil');
      expect(html).not.toContain('ct-waves-wrap');
    }
    expect((buildCardV1(t3, { fieldMode: true }) as any).html).not.toContain('ct-');
  });
});
