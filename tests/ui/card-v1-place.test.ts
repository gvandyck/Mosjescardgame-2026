import { describe, it, expect } from 'vitest';
import { PLACES } from '../../src/data/places.js';
import { formatGoodBadLine } from '../../src/ui/cardV1/formatGoodBadLine.js';
import { buildPlaceSpecV1 } from '../../src/ui/cardV1/buildPlaceSpecV1.js';
import { buildCardV1 } from '../../src/ui/cardV1/buildCardV1.js';

const byName = (name: string) => (PLACES as any[]).find((p) => p.name === name);
// the V4 border text of a Place; built from parts so it never appears as a string in the repo
const V4_BORDER = ['Only 1', 'act' + 'ive'].join(' ');
const norm = (t: string) => String(t || '').trim().replace(/\s*\n\s*/g, ' ');

// No DOM in this vitest env: read the 2.0 face from its html string.
const unescape = (s: string) => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const part = (html: string, cls: string) => {
  const m = html.match(new RegExp(`<div class="${cls}"[^>]*>(.*?)</div>`, 's'));
  return m ? unescape(m[1]) : null;
};
const textBox = (html: string) => html.slice(html.indexOf('<div class="cv2-textbox">')).split(/<div class="cv2-(?:info|pills)">/)[0];
const corner = (html: string) => html.slice(html.indexOf('<div class="cv2-corner"'), html.indexOf('<i class="cv2-divider">'));
const plain = (html: string) => unescape(html.replace(/<\/div>\s*<div/g, '</div> <div').replace(/<[^>]+>/g, ''));

describe('card frame v1 — Place data mapping (2.0 face)', () => {
  it('good / bad line prints the Card List words exactly as written and leaves empty sides out', () => {
    expect(formatGoodBadLine(['Social Mosjes', 'Questers'], ['Attackers'])).toBe('Good for: Social Mosjes, Questers · Bad for: Attackers');
    expect(formatGoodBadLine(['Fighting'], ['Digital', 'Artistic'])).toBe('Good for: Fighting · Bad for: Digital, Artistic');
    expect(formatGoodBadLine([], ['low-MP Mosjes'])).toBe('Bad for: low-MP Mosjes');
    expect(formatGoodBadLine(['Coert / Binti decks'], [])).toBe('Good for: Coert / Binti decks');
    expect(formatGoodBadLine([], [])).toBe('');
    expect(formatGoodBadLine(undefined, undefined)).toBe('');
  });

  it('The Gym face: cost 3, name, PLACE pill, Good/Bad line, "Only 1 in play", violet, NO badge', () => {
    const html = buildCardV1(byName('The Gym'), {})!.html;
    expect(html).toContain('>The Gym<');
    expect(corner(html)).toContain('data-cv1-cost="3"');
    expect(corner(html)).toContain('>COST<');
    expect(html).toContain('>PLACE<');
    expect(part(html, 'cv2-info')).toBe('Good for: Fighting · Bad for: Digital, Artistic');
    expect(part(html, 'cv2-label')).toBe('Only 1 in play');
    expect(html).toContain('#6D28D9');
    expect(html).not.toContain(V4_BORDER);
    expect(html).not.toContain('cv1-badge');
    expect(html).not.toContain('cv2-footer');
  });

  it('is a 2.0 spec: face 2, PLACE type key, cost corner, no level rows or footer', () => {
    const spec = buildPlaceSpecV1(byName('The Gym')) as any;
    expect(spec).toMatchObject({ face: 2, typeKey: 'PLACE', pill: 'PLACE', label: 'Only 1 in play', levelRows: [], footer: null, stays: false });
    expect(spec.corner).toEqual({ hook: 'cost', value: '3', label: 'COST', sub: '' });
  });

  it('every Place shows its Energy cost in the corner (cost 0 would show 0)', () => {
    for (const p of PLACES as any[]) {
      expect(corner(buildCardV1(p, {})!.html), p.id).toContain(`data-cv1-cost="${Number(p.cost) || 0}"`);
    }
    const free = buildCardV1({ ...byName('The Gym'), cost: 0 }, {})!.html;
    expect(corner(free)).toContain('<div class="cv2-corner-val">0</div>');
  });

  it('field tile has the PLACE pill, no badge and no cost either', () => {
    const html = buildCardV1(byName('The Gym'), { fieldMode: true })!.html;
    expect(html).toContain('>PLACE<');
    expect(html).not.toContain('cv1-badge');
    expect(html).not.toContain('data-cv1-cost');
    expect(html).not.toContain('>COST<');
    expect(html).not.toContain('cv1-desc');
  });

  it('every Place renders, its info line equals the Card List words, its text box holds the description, no flavour/rarity', () => {
    for (const p of PLACES as any[]) {
      const out = buildCardV1(p, {});
      expect(out, p.id).not.toBeNull();
      const info = formatGoodBadLine(p.goodFor, p.badFor);
      if (info) expect(part(out!.html, 'cv2-info'), p.id).toBe(info);
      else expect(out!.html, p.id).not.toContain('cv2-info');
      expect(buildPlaceSpecV1(p).lines.join(' '), p.id).toBe(norm(p.description));
      expect(plain(textBox(out!.html)).replace(/\s+/g, ' ').trim(), p.id).toBe(norm(p.description));
      expect(out!.html, p.id).toContain('>PLACE<');
      expect(out!.html, p.id).not.toContain(V4_BORDER);
      expect(out!.html, p.id).not.toMatch(/MP COST|Free</);
      expect(out!.html.toLowerCase()).not.toContain('rarity');
      if (p.flavourText) expect(out!.html.toLowerCase()).not.toContain(String(p.flavourText).toLowerCase());
    }
  });

  it('the Card List words are never re-cased (low-MP Mosjes, Coert / Binti decks)', () => {
    const drain = buildCardV1(byName('Drain Zone'), {})!.html;
    expect(part(drain, 'cv2-info')).toBe('Good for: Attackers, the player who is behind · Bad for: Level 3 holders, low-MP Mosjes');
    const delluft = (PLACES as any[]).find((p) => p.id === 'place_delluft');
    expect(part(buildCardV1(delluft, {})!.html, 'cv2-info')).toBe('Good for: Coert / Binti decks · Bad for: Cless decks, everyone else');
  });

  it('escapes markup in the Good/Bad line and the text box', () => {
    const html = buildCardV1({ ...byName('The Gym'), goodFor: ['<i>x</i>'], description: 'Gain <b>1</b>.' }, {})!.html;
    expect(html).not.toContain('<i>x</i>');
    expect(html).not.toContain('<b>1</b>');
    expect(part(html, 'cv2-info')).toBe('Good for: <i>x</i> · Bad for: Digital, Artistic');
    expect(html).toContain('&lt;i&gt;x&lt;/i&gt;');
  });
});
