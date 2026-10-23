import { describe, it, expect, afterEach, vi } from 'vitest';
import { MOSJES } from '../../src/data/mosjes.js';
import { getFrameTier } from '../../src/data/getFrameTier.js';
import { getRarityDiamonds } from '../../src/ui/cardV1/getRarityDiamonds.js';
import { isFullArt } from '../../src/ui/cardV1/isFullArt.js';
import { getTierAttributes } from '../../src/ui/cardV1/getTierAttributes.js';
import { buildCardV1 } from '../../src/ui/cardV1/buildCardV1.js';
import { buildPopupFace } from '../../src/ui/cardV1/buildPopupFace.js';
import { buildFieldTile } from '../../src/ui/cardV1/buildFieldTile.js';
import { PIECIES } from '../../src/data/piecies.js';
import { PLACES } from '../../src/data/places.js';
import { buildTierChrome } from '../../src/ui/cardV1/buildTierChrome.js';
import { buildShineLayers } from '../../src/ui/cardV1/buildShineLayers.js';
import { getTierFadeHeight } from '../../src/ui/cardV1/getTierFadeHeight.js';
import { getTextBoxLayout } from '../../src/ui/cardV1/getTextBoxLayout.js';
import { splitSentences } from '../../src/ui/cardV1/splitSentences.js';
import { SNELLE_PIECIES } from '../../src/data/snellePiecies.js';
import { QUESTS } from '../../src/data/quests.js';
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
    expect((buildCardV1(c) as any).html).toBe(buildPopupFace(buildMosjeSpecV1(c), a));
    expect((buildCardV1(card, { fieldMode: true }) as any).html).toBe(buildFieldTile(buildMosjeSpecV1(card), getTierAttributes(card)));
  });
});

// No DOM in this vitest env: read class lists in document order from the html string.
const classesIn = (html: string) => [...html.matchAll(/<(?:div|i|img) [^>]*class="([^"]+)"/g)].map((m) => m[1]);
// The window layers end where the name starts: legacy faces (Place, Quest) have .cv1-name, 2.0 faces (Mosje, Piecie, Snelle)
// have the cost corner right after the window (and the tier 3 art ring).
const windowOf = (html: string) => {
  const ends = ['<div class="cv1-name">', '<div class="cv2-corner"'].map((m) => html.indexOf(m)).filter((i) => i >= 0);
  return html.slice(html.indexOf('<div class="cv1-window">') + 24, Math.min(...ends));
};
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

// The ability text size of a rendered 2.0 face: the --cv1-text-size the text box layout put on it.
const textSizeOf = (card: any) => Number((buildCardV1(card, {}) as any).html.match(/--cv1-text-size:([\d.]+)/)![1]);
// The same one-sentence text on a card of each type (the Piecie / Snelle Needs lead and the Quest cost line are off).
const sameText = (text: string, rarity: string) => ({
  MOSJE: { ...(MOSJES as any[])[0], abilityDescription: text, synergyEffect: null, synergyLabelText: null, rarity },
  PIECIE: { ...(PIECIES as any[]).find((p) => !p.needsText), description: text, rarity },
  SNELLE_PIECIE: { ...(SNELLE_PIECIES as any[]).find((p) => !p.needsText), description: text, rarity },
  PLACE: { ...(PLACES as any[])[0], description: text, rarity },
  QUEST: { ...(QUESTS as any[]).find((q) => q.stack), costText: null, extras: text },
});

describe('getTextBoxLayout (full art)', () => {
  it('gives one size for the same text whatever the card type', () => {
    // Short text: the five real faces agree with the layout (a full-art card per type: 4 stars; Mosjes are always full
    // art, Quests are tier 1 and boxed). A long single paragraph: the types with a full-art box and no level rows.
    for (const text of ['Gain 10 MP.', 'x'.repeat(400)]) {
      expect(getTextBoxLayout({ lines: [text], layout: 'fullart' })).toEqual({ size: 14.5, clamped: false });
    }
    for (const [type, card] of Object.entries(sameText('Gain 10 MP.', '★★★★'))) expect(textSizeOf(card), type).toBe(14.5);
    const { MOSJE, QUEST, ...plain } = sameText('x'.repeat(400), '★★★★');
    for (const [type, card] of Object.entries(plain)) expect(textSizeOf(card), type).toBe(14.5);
  });

  it('a long text steps down by the same amount on every full-art type that has no level rows', () => {
    const long = 'x'.repeat(600);
    expect(getTextBoxLayout({ lines: [long], layout: 'fullart' }).size).toBe(13);
    const { MOSJE, QUEST, ...plain } = sameText(long, '★★★★');
    for (const [type, card] of Object.entries(plain)) expect(textSizeOf(card), type).toBe(13);
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
    expect(style).toContain(`--cv1-text-size:${getTextBoxLayout({ lines: spec.lines, levelRowCount: 0, layout: 'fullart', info: spec.info }).size};`);
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
  it('field tiles carry no tier chrome at any tier', () => {
    for (const c of [base, PIECIES[0], PLACES[0]] as any[]) {
      for (const tier of [1, 2, 3, 4, 5]) {
        const r = buildCardV1({ ...c, rarity: '★'.repeat(tier) }, { fieldMode: true }) as any;
        expect(r.html).not.toContain('ct-');
      }
    }
  });
});

describe('getTextBoxLayout (boxed)', () => {
  it('the boxed box steps down no later than full art for the same text, and is the same size on every boxed type', () => {
    for (let n = 0; n <= 1500; n += 25) {
      const full = getTextBoxLayout({ lines: ['x'.repeat(n)], layout: 'fullart' });
      const boxed = getTextBoxLayout({ lines: ['x'.repeat(n)], layout: 'boxed' });
      expect(boxed.size, `${n} chars`).toBeLessThanOrEqual(full.size);
      if (full.clamped) expect(boxed.clamped, `${n} chars`).toBe(true);
    }
    // boxed faces (tier 1, one star): the same text gets the same size on a Piecie, Snelle, Place and Quest
    const { MOSJE, ...boxedTypes } = sameText('x'.repeat(500), '★');
    const sizes = Object.entries(boxedTypes).map(([type, card]) => [type, textSizeOf(card)]);
    expect(new Set(sizes.map(([, size]) => size)).size, JSON.stringify(sizes)).toBe(1);
    expect(sizes[0][1]).toBe(getTextBoxLayout({ lines: ['x'.repeat(500)], layout: 'boxed' }).size);
  });

  it('auto-fit: Bowie & Stormey (387 characters) steps down in the boxed text box, never below 11.5', () => {
    const bowie = (PIECIES as any[]).find((p) => p.id === 'piecie_bowie_stormey');
    const lines = splitSentences(bowie.description);
    const fit = getTextBoxLayout({ lines, layout: 'boxed' });
    expect(fit.size).toBeLessThan(14.5); // it did not fit at the top size
    expect(fit.size).toBeGreaterThanOrEqual(11.5);
    expect(fit.clamped, 'what cannot fit at the floor is flagged').toBe(true);
    expect(getTextBoxLayout({ lines, layout: 'fullart' })).toEqual({ size: 14.5, clamped: false }); // the roomier full-art box holds it
  });

  it('short text keeps the top size, and text that cannot fit even at the floor is flagged clamped', () => {
    expect(getTextBoxLayout({ lines: ['Gain 10 MP.'], layout: 'boxed' })).toEqual({ size: 14.5, clamped: false });
    const tooLong = Array.from({ length: 12 }, () => 'A long sentence that keeps going and going. '.repeat(3));
    expect(getTextBoxLayout({ lines: tooLong, layout: 'boxed' })).toEqual({ size: 11.5, clamped: true });
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
        .filter((c) => ['ct-waves', 'ct-calm', 'ct-grain', 'ct-light', 'ct-inner', 'cv1-window', 'cv2-textbox', 'ct-plate-waves', 'ct-plate'].includes(c));
      // 2.0 face: the layers, the window, then the frosted text box (no plate, no plate waves)
      expect(order).toEqual(['ct-waves', 'ct-calm', 'ct-calm', 'ct-grain', 'ct-light', 'ct-inner', 'cv1-window', 'cv2-textbox']);
      expect(count(html, `ct-inner--t${tier}`)).toBe(1);
      expect(count(html, 'ct-diamond')).toBe(5);
      expect(count(html, 'ct-diamond--lit')).toBe(tier);
      expect(count(html, 'ct-side')).toBe(2);
      expect(count(html, 'cv1-stripe')).toBe(0);
      expect(html).not.toContain('ct-plate');
      expect(html).not.toContain('cv1-desc');
      const w = windowOf(html);
      expect(w).toContain('<img');
      expect(count(w, 'ct-holo')).toBe(0);
      const style = html.match(/class="cv1-face[^"]*" style="([^"]+)"/)![1];
      const spec = buildPlaceSpecV1(gym);
      expect(style).toContain(`--cv1-text-size:${getTextBoxLayout({ lines: spec.lines, levelRowCount: 0, layout: 'boxed', info: spec.info }).size};`);
      expect(style).toContain(`--cv1-fade:${getTierFadeHeight({ typeKey: 'PLACE', lines: spec.lines })}`);
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
