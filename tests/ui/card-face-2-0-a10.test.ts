// Phase 62-01 (Phase 7 A10 unit items): Mosje frame tier 4/5, foil rule, rarity diamonds, Quest tier 1.
import { describe, it, expect, afterEach, vi } from 'vitest';
import { MOSJES } from '../../src/data/mosjes.js';
import { PIECIES } from '../../src/data/piecies.js';
import { SNELLE_PIECIES } from '../../src/data/snellePiecies.js';
import { PLACES } from '../../src/data/places.js';
import { QUESTS } from '../../src/data/quests.js';
import { buildCardV1 } from '../../src/ui/cardV1/buildCardV1.js';

const setSearch = (search: string) => vi.stubGlobal('window', { location: { search, origin: 'http://localhost', href: 'http://localhost/' } });
afterEach(() => vi.unstubAllGlobals());

const stars = (c: any) => (String(c.rarity ?? '').match(/★/g) || []).length;
const lit = (html: string) => (html.match(/ct-diamond--lit/g) || []).length;
const tierOf = (r: any) => Number(r.dataTier);

describe('Mosje frame tier (A1): always full art, 4 or 5', () => {
  it('every Mosje renders tier 4 or 5 with card--fullart, pop-up and field mode', () => {
    expect((MOSJES as any[]).length).toBeGreaterThanOrEqual(32);
    for (const m of MOSJES as any[]) {
      for (const fieldMode of [false, true]) {
        const r = buildCardV1(m, { fieldMode }) as any;
        expect([4, 5], m.id).toContain(r.tier);
        expect(r.className, m.id).toContain('card--fullart');
        expect(r.className, m.id).not.toContain('card--boxed');
        expect(r.className, m.id).toContain(`card--tier-${r.tier}`);
      }
    }
  });

  it('tier 5 exactly when the rarity is five stars or foil is true', () => {
    for (const m of MOSJES as any[]) {
      const r = buildCardV1(m) as any;
      expect(r.tier, m.id).toBe(stars(m) >= 5 || m.foil === true ? 5 : 4);
    }
  });

  it('synthetic: one star is tier 4 without holo, five stars or foil is tier 5 with holo', () => {
    const plain = buildCardV1({ type: 'MOSJE', name: '[A] B', rarity: '★', foil: false }) as any;
    expect(plain.tier).toBe(4);
    expect(plain.html).not.toContain('ct-holo');
    const five = buildCardV1({ type: 'MOSJE', name: '[A] B', rarity: '★★★★★' }) as any;
    expect(five.tier).toBe(5);
    expect(five.html).toContain('ct-holo');
    const foil = buildCardV1({ type: 'MOSJE', name: '[A] B', rarity: '★', foil: true }) as any;
    expect(foil.tier).toBe(5);
    expect(foil.html).toContain('ct-holo');
  });

  it('foil Mosjes in the data have a holo face, the others do not', () => {
    for (const m of MOSJES as any[]) {
      const has = (buildCardV1(m) as any).html.includes('ct-holo');
      expect(has, m.id).toBe(m.foil === true || stars(m) >= 5);
    }
  });
});

describe('rarity diamonds show the rules rarity (A1)', () => {
  it('a two-star Mosje is frame tier 4 but lights 2 diamonds', () => {
    const r = buildCardV1({ type: 'MOSJE', name: '[A] B', rarity: '★★', foil: false }) as any;
    expect(r.tier).toBe(4);
    expect(r.diamonds).toBe(2);
    expect(lit(r.html)).toBe(2);
  });

  it('Mosjes, Piecies, Snelle and Places light their star count', () => {
    const all = [...MOSJES, ...PIECIES, ...SNELLE_PIECIES, ...PLACES] as any[];
    for (const c of all) {
      const r = buildCardV1(c) as any;
      expect(r, c.id).toBeTruthy();
      const expected = Math.min(5, Math.max(1, stars(c) || 1));
      expect(r.diamonds, c.id).toBe(expected);
      expect(lit(r.html), c.id).toBe(expected);
    }
  });

  it('non-Mosje cards keep the rarity as their frame tier', () => {
    for (const c of [...PIECIES, ...SNELLE_PIECIES, ...PLACES] as any[]) {
      const r = buildCardV1(c) as any;
      expect(r.tier, c.id).toBe(Math.min(5, Math.max(1, stars(c) || 1)));
    }
  });
});

describe('Quests: tier 1 boxed, no diamonds (A7)', () => {
  const quests = (QUESTS as any[]).filter((q) => q.stack);
  it('there are 38 2.0 Quests', () => {
    expect(quests).toHaveLength(38);
  });
  it('every Quest is tier 1, card--boxed and lights no diamond', () => {
    for (const q of quests) {
      for (const fieldMode of [false, true]) {
        const r = buildCardV1(q, { fieldMode }) as any;
        expect(r.tier, q.id).toBe(1);
        expect(r.className, q.id).toContain('card--tier-1');
        expect(r.className, q.id).toContain('card--boxed');
        expect(r.diamonds, q.id).toBe(0);
        if (!fieldMode) expect(lit(r.html), q.id).toBe(0);
      }
    }
  });
});

describe('the ?tiers= URL no longer changes a face', () => {
  it('?tiers=off and ?tiers=all give the same html as no parameter', () => {
    const sample = [(MOSJES as any[])[0], (PIECIES as any[])[0], (SNELLE_PIECIES as any[])[0], (PLACES as any[])[0], (QUESTS as any[]).find((q) => q.stack)];
    for (const c of sample) {
      setSearch('');
      const base = buildCardV1(c) as any;
      for (const q of ['?tiers=off', '?tiers=all']) {
        setSearch(q);
        const r = buildCardV1(c) as any;
        expect(r.html, `${c.id} ${q}`).toBe(base.html);
        expect(r.className, `${c.id} ${q}`).toBe(base.className);
        expect(r.className).toContain('card--tierlayout');
      }
    }
  });
});

// ---- Phase 62-03: A10 items checked on the real Piecie / Snelle faces ----
const cardById = (id: string) => ([...PIECIES, ...SNELLE_PIECIES] as any[]).find((c) => c.id === id);
const faceCost = (html: string) => html.match(/<div class="cv2-corner" data-cv1-cost="([^"]*)"><div class="cv2-corner-val">([^<]*)<\/div>/);
const faceLabel = (html: string) => html.match(/<div class="cv2-label">([^<]*)<\/div>/)?.[1];

describe('cost 0 renders "0" on a real face (A10)', () => {
  it('Kannetje Melk (Piecie) and Momentum Rush (Snelle) show the number 0, never Free', () => {
    for (const id of ['piecie_kannetje_melk', 'snelle_momentum_rush']) {
      const card = cardById(id);
      expect(card.cost, id).toBe(0);
      const html = (buildCardV1(card) as any).html;
      expect(faceCost(html)?.slice(1, 3), id).toEqual(['0', '0']);
      expect(html.slice(0, html.indexOf('cv2-textbox')), id).not.toMatch(/Free|MP COST/);
    }
  });
});

describe('Piecie label is tag-first on the face (A10)', () => {
  it('Kannetje Melk reads Food although its group is mp; Super Saiyan Mos reads Attack (no tag, group attack)', () => {
    const melk = cardById('piecie_kannetje_melk');
    expect(melk.group).toBe('mp');
    expect(faceLabel((buildCardV1(melk) as any).html)).toBe('Food');
    const saiyan = cardById('piecie_super_saiyan_mos');
    expect(saiyan.tag).toBeNull();
    expect(faceLabel((buildCardV1(saiyan) as any).html)).toBe('Attack');
  });
});
