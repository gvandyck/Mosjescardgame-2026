import { describe, it, expect, afterEach, vi } from 'vitest';
import { MOSJES } from '../../src/data/mosjes.js';
import { getFrameTier } from '../../src/data/getFrameTier.js';
import { getRarityDiamonds } from '../../src/ui/cardV1/getRarityDiamonds.js';
import { isFullArt } from '../../src/ui/cardV1/isFullArt.js';
import { getTierAttributes } from '../../src/ui/cardV1/getTierAttributes.js';
import { buildCardV1 } from '../../src/ui/cardV1/buildCardV1.js';
import { buildFaceV1 } from '../../src/ui/cardV1/buildFaceV1.js';
import { buildFieldFaceV1 } from '../../src/ui/cardV1/buildFieldFaceV1.js';
import { PIECIES } from '../../src/data/piecies.js';
import { PLACES } from '../../src/data/places.js';
import { buildTierChrome } from '../../src/ui/cardV1/buildTierChrome.js';
import { buildShineLayers } from '../../src/ui/cardV1/buildShineLayers.js';
import { getAbilityTextSize, getBoxedTextFit } from '../../src/ui/cardV1/getAbilityTextSize.js';
import { getTierFadeHeight } from '../../src/ui/cardV1/getTierFadeHeight.js';
import { buildMosjeSpecV1 } from '../../src/ui/cardV1/buildMosjeSpecV1.js';
import { buildPlaceSpecV1 } from '../../src/ui/cardV1/buildPlaceSpecV1.js';

const setSearch = (search: string) => vi.stubGlobal('window', { location: { search, origin: 'http://localhost', href: 'http://localhost/' } });
afterEach(() => vi.unstubAllGlobals());

describe('getRarityDiamonds', () => {
  it('counts stars 1..5, capped at 5', () => {
    expect(getRarityDiamonds({ rarity: '★' })).toBe(1);
    expect(getRarityDiamonds({ rarity: '★★' })).toBe(2);
    expect(getRarityDiamonds({ rarity: '★★★' })).toBe(3);
    expect(getRarityDiamonds({ rarity: '★★★★' })).toBe(4);
    expect(getRarityDiamonds({ rarity: '★★★★★' })).toBe(5);
    expect(getRarityDiamonds({ rarity: '★★★★★★' })).toBe(5);
    expect(getRarityDiamonds({ rarity: '★ ★' })).toBe(2);
  });
  it('falls back to 1 for missing/malformed', () => {
    for (const r of [undefined, null, '', 'abc', {}]) expect(getRarityDiamonds({ rarity: r })).toBe(1);
    expect(getRarityDiamonds(undefined)).toBe(1);
  });
  it('Quests light none, whatever their rarity', () => {
    expect(getRarityDiamonds({ type: 'QUEST', rarity: '★★★' })).toBe(0);
    expect(getRarityDiamonds({ type: 'QUEST' })).toBe(0);
  });
});

describe('isFullArt', () => {
  it('tiers 4 and 5 are full art', () => {
    expect(isFullArt(4)).toBe(true);
    expect(isFullArt(5)).toBe(true);
    for (const t of [1, 2, 3]) expect(isFullArt(t)).toBe(false);
  });
});

describe('the ?tiers= URL no longer changes a face', () => {
  it('all five tiers keep the tier layout with no parameter, ?tiers=all and ?tiers=off', () => {
    for (const search of ['', '?tiers=all', '?tiers=off']) {
      setSearch(search);
      for (const t of [1, 2, 3, 4, 5]) {
        const a = getTierAttributes({ type: 'PIECIE', rarity: '★'.repeat(t) });
        expect(a.enabled, search + t).toBe(true);
        expect(a.classes, search + t).toContain('card--tierlayout');
      }
    }
  });
  it('a three-star Piecie renders the same face for every ?tiers= value', () => {
    const c = { ...PIECIES[0], rarity: '★★★' } as any;
    setSearch('');
    const base = (buildCardV1(c) as any).html;
    for (const search of ['?tiers=all', '?tiers=off']) {
      setSearch(search);
      expect((buildCardV1(c) as any).html).toBe(base);
    }
  });
});

describe('getTierAttributes', () => {
  it('builds classes for boxed and full-art tiers (non-Mosje: frame tier = rarity)', () => {
    expect(getTierAttributes({ type: 'PIECIE', rarity: '★★★' })).toEqual({
      tier: 3, layout: 'boxed', classes: 'card--tier-3 card--boxed card--tierlayout', enabled: true, diamonds: 3, foil: false,
    });
    expect(getTierAttributes({ type: 'PIECIE', rarity: '★★★★' })).toEqual({
      tier: 4, layout: 'fullart', classes: 'card--tier-4 card--fullart card--tierlayout', enabled: true, diamonds: 4, foil: false,
    });
    expect(getTierAttributes({ type: 'PIECIE', rarity: '★★★★★' })).toEqual({
      tier: 5, layout: 'fullart', classes: 'card--tier-5 card--fullart card--tierlayout', enabled: true, diamonds: 5, foil: true,
    });
  });
  it('a Mosje is always full art (4, or 5 with foil) and its diamonds show the rules rarity', () => {
    expect(getTierAttributes({ type: 'MOSJE', rarity: '★★', foil: false })).toEqual({
      tier: 4, layout: 'fullart', classes: 'card--tier-4 card--fullart card--tierlayout', enabled: true, diamonds: 2, foil: false,
    });
    expect(getTierAttributes({ type: 'MOSJE', rarity: '★', foil: true })).toEqual({
      tier: 5, layout: 'fullart', classes: 'card--tier-5 card--fullart card--tierlayout', enabled: true, diamonds: 1, foil: true,
    });
  });
  it('a Quest is tier 1 boxed with no diamonds, whatever its rarity', () => {
    expect(getTierAttributes({ type: 'QUEST', rarity: '★★★' })).toEqual({
      tier: 1, layout: 'boxed', classes: 'card--tier-1 card--boxed card--tierlayout', enabled: true, diamonds: 0, foil: false,
    });
  });
});

describe('buildCardV1 tier attributes', () => {
  const card = MOSJES.find((m: any) => m.rarity) as any;
  it('adds tier classes in full and field mode', () => {
    for (const fieldMode of [false, true]) {
      const r = buildCardV1(card, { fieldMode }) as any;
      const tier = getFrameTier(card);
      expect(r.tier).toBe(tier);
      expect(r.dataTier).toBe(String(tier));
      expect(r.diamonds).toBe(getRarityDiamonds(card));
      expect(r.className).toContain(`card--tier-${tier}`);
      expect(r.className).toContain(fieldMode ? 'card-v1--field' : 'card-v1--full');
    }
  });
  it('face html equals the face builders given the tier attributes', () => {
    const c = { ...card, rarity: '★★★' };
    const a = getTierAttributes(c);
    expect((buildCardV1(c) as any).html).toBe(buildFaceV1(buildMosjeSpecV1(c), { tier: a.tier, layoutEnabled: a.enabled, diamonds: a.diamonds }));
    expect((buildCardV1(card, { fieldMode: true }) as any).html).toBe(buildFieldFaceV1(buildMosjeSpecV1(card)));
  });
});

// No DOM in this vitest env: read class lists in document order from the html string.
const classesIn = (html: string) => [...html.matchAll(/<(?:div|i|img) [^>]*class="([^"]+)"/g)].map((m) => m[1]);
const windowOf = (html: string) => html.slice(html.indexOf('<div class="cv1-window">') + 24, html.indexOf('<div class="cv1-name">'));
const count = (html: string, cls: string) => classesIn(html).filter((c) => c.split(' ').includes(cls)).length;

describe('buildTierChrome', () => {
  it('5 diamonds, first `tier` lit, plus two OBBY side labels', () => {
    for (const tier of [1, 2, 3, 4, 5]) {
      const html = buildTierChrome(tier);
      const cls = classesIn(html);
      const diamonds = cls.filter((c) => c.split(' ').includes('ct-diamond'));
      expect(diamonds.length).toBe(5);
      expect(diamonds.map((c) => c.includes('ct-diamond--lit'))).toEqual([0, 1, 2, 3, 4].map((i) => i < tier));
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
  it('is one size (18) for every card type and length', () => {
    for (const typeKey of ['MOSJE', 'PIECIE', 'SNELLE_PIECIE', 'PLACE', 'QUEST']) {
      expect(getAbilityTextSize({ lines: ['Gain 10 MP.'], typeKey, layout: 'fullart' })).toBe(18);
      expect(getAbilityTextSize({ lines: ['x'.repeat(400)], typeKey, layout: 'fullart' })).toBe(18);
    }
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

describe('tier 4 face (full art, no foil)', () => {
  const gym = (PLACES as any[]).find((p) => p.id === 'place_the_gym');
  const t4 = { ...gym, rarity: '★★★★' };
  it('same full-art window as tier 5 but without holo, sweep or glints; 4 diamonds lit', () => {
    setSearch('');
    const r = buildCardV1(t4) as any;
    expect(r.className).toContain('card--fullart');
    expect(r.className).toContain('card--tier-4');
    const kids = classesIn(windowOf(r.html)).map((c) => c.split(' ').pop());
    expect(kids).toEqual(['cv1-art', 'cv1-fade--bottom', 'cv1-fade--top']);
    expect(count(r.html, 'ct-diamond--lit')).toBe(4);
    expect(count(r.html, 'ct-diamond')).toBe(5);
  });
});

describe('tier 5 face (full foil)', () => {
  const gym = (PLACES as any[]).find((p) => p.id === 'place_the_gym');
  const base = MOSJES.find((m: any) => m.artPath) as any;
  const t4 = { ...gym, rarity: '★★★★★' };
  it('window layers follow CardTiers7/8 order: art, fades, holo, sweep, glints', () => {
    setSearch('');
    const html = (buildCardV1(t4) as any).html;
    const kids = classesIn(windowOf(html)).map((c) => c.split(' ').pop());
    expect(kids).toEqual(['cv1-art', 'cv1-fade--bottom', 'cv1-fade--top', 'ct-holo', 'ct-sweep', 'ct-glint--1', 'ct-glint--2', 'ct-glint--3']);
    expect(count(html, 'cv1-stripe')).toBe(0);
    expect(count(html, 'cv1-diamond')).toBe(0);
    expect(count(html, 'ct-diamond--lit')).toBe(5);
    const spec = buildPlaceSpecV1(t4);
    const style = html.match(/class="cv1-face[^"]*" style="([^"]+)"/)![1];
    expect(style).toContain(`--cv1-desc-size:${getAbilityTextSize({ lines: spec.lines, typeKey: 'PLACE', layout: 'fullart' })};`);
    expect(style).toContain(`--cv1-fade:${getTierFadeHeight({ typeKey: 'PLACE', lines: spec.lines })}`);
  });
  it('art-less tier 5 card keeps window, shine and fades, no img', () => {
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
      for (const tier of [1, 2, 3, 4, 5]) {
        const r = buildCardV1({ ...c, rarity: '★'.repeat(tier) }, { fieldMode: true }) as any;
        expect(r.html).not.toContain('ct-');
      }
    }
  });
});

describe('getAbilityTextSize (boxed)', () => {
  it('is 18 for every card type, stepping down only for long text in the fixed-height plate', () => {
    for (const typeKey of ['MOSJE', 'PIECIE', 'SNELLE_PIECIE', 'PLACE', 'QUEST']) {
      expect(getAbilityTextSize({ lines: ['Gain 10 MP.'], typeKey, layout: 'boxed' })).toBe(18);
    }
    expect(getAbilityTextSize({ lines: ['x'.repeat(200)], layout: 'boxed' })).toBe(17);
    expect(getAbilityTextSize({ lines: ['x'.repeat(300)], layout: 'boxed' })).toBe(16);
  });

  it('auto-fit: keeps stepping down until the text fits the plate, never below 11.5', () => {
    const bowie = (PIECIES as any[]).find((p) => p.id === 'piecie_bowie_stormey');
    const lines = String(bowie.description).split(/(?<=[.!?])\s+/);
    const fit = getBoxedTextFit(lines);
    expect(fit.size).toBeLessThan(16); // 383 characters used to stay at 16 and ran out of the plate
    expect(fit.size).toBeGreaterThanOrEqual(11.5);
    expect(getAbilityTextSize({ lines, layout: 'boxed' })).toBe(fit.size);
  });

  it('short text keeps 18, and text that cannot fit even at the floor is reported', () => {
    expect(getBoxedTextFit(['Gain 10 MP.'])).toEqual({ size: 18, fits: true });
    const tooLong = Array.from({ length: 12 }, () => 'A long sentence that keeps going and going. '.repeat(3));
    expect(getBoxedTextFit(tooLong)).toEqual({ size: 11.5, fits: false });
  });
});

describe('boxed face (tiers 1 and 2)', () => {
  const gym = (PLACES as any[]).find((p) => p.id === 'place_the_gym');
  for (const tier of [1, 2]) {
    it(`tier ${tier}: layers, plate, diamonds, side labels, window`, () => {
      setSearch('');
      const r = buildCardV1({ ...gym, rarity: '★'.repeat(tier) }) as any;
      expect(r.className).toContain('card--boxed');
      expect(r.className).toContain('card--tierlayout');
      const html = r.html;
      const order = classesIn(html).map((c) => c.split(' ')[0])
        .filter((c) => ['ct-waves', 'ct-calm', 'ct-grain', 'ct-light', 'ct-inner', 'cv1-window', 'ct-plate-waves', 'ct-plate'].includes(c));
      expect(order).toEqual(['ct-waves', 'ct-calm', 'ct-calm', 'ct-grain', 'ct-light', 'ct-inner', 'cv1-window', 'ct-plate-waves', 'ct-plate']);
      expect(count(html, `ct-inner--t${tier}`)).toBe(1);
      expect(count(html, 'ct-diamond')).toBe(5);
      expect(count(html, 'ct-diamond--lit')).toBe(tier);
      expect(count(html, 'ct-side')).toBe(2);
      expect(count(html, 'cv1-stripe')).toBe(0);
      expect(html).toMatch(/<div class="ct-plate">\s*<div class="cv1-desc">/);
      const w = windowOf(html);
      expect(w).toContain('<img');
      expect(count(w, 'ct-holo')).toBe(0);
      const style = html.match(/class="cv1-face[^"]*" style="([^"]+)"/)![1];
      const spec = buildPlaceSpecV1(gym);
      expect(style).toContain(`--cv1-desc-size:${getAbilityTextSize({ lines: spec.lines, typeKey: 'PLACE', layout: 'boxed' })};`);
    });
  }
  it('art-less boxed card keeps the window with no img', () => {
    setSearch('');
    const html = (buildCardV1({ ...PIECIES[0], artPath: undefined, rarity: '★' }) as any).html;
    expect(count(html, 'cv1-window')).toBe(1);
    expect(windowOf(html)).not.toContain('<img');
  });
  it('a ★★ Place with ?tiers=off still renders the boxed tier layout (no cv1-stripe)', () => {
    setSearch('?tiers=off');
    const r = buildCardV1({ ...gym, rarity: '★★' }) as any;
    expect(r.className).toContain('card--boxed');
    expect(r.className).toContain('card--tierlayout');
    expect(count(r.html, 'cv1-stripe')).toBe(0);
    expect(count(r.html, 'ct-diamond--lit')).toBe(2);
  });
  it('a Mosje is never boxed: ★ and ★★ Mosjes render the full-art frame with their rarity diamonds', () => {
    const base = MOSJES.find((m: any) => m.artPath) as any;
    for (const tier of [1, 2]) {
      const r = buildCardV1({ ...base, foil: false, rarity: '★'.repeat(tier) }) as any;
      expect(r.className).toContain('card--fullart');
      expect(r.className).not.toContain('card--boxed');
      expect(count(r.html, 'ct-diamond--lit')).toBe(tier);
    }
  });
});

describe('boxed face tier 3 (foil)', () => {
  const gym = (PLACES as any[]).find((p) => p.id === 'place_the_gym');
  const t3 = { ...gym, rarity: '★★★' };
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
      const html = (buildCardV1({ ...gym, rarity: '★'.repeat(tier) }) as any).html;
      expect(html).not.toContain('ct-foil');
      expect(html).not.toContain('ct-waves-wrap');
    }
    expect((buildCardV1(t3, { fieldMode: true }) as any).html).not.toContain('ct-');
  });
});
