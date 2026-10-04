import { describe, it, expect } from 'vitest';
import { PLACES } from '../../src/data/places.js';
import { formatAffinityLine } from '../../src/ui/cardV1/formatAffinityLine.js';
import { buildPlaceSpecV1 } from '../../src/ui/cardV1/buildPlaceSpecV1.js';
import { buildCardV1 } from '../../src/ui/cardV1/buildCardV1.js';

const byName = (name: string) => (PLACES as any[]).find((p) => p.name === name);

describe('card frame v1 — Place data mapping', () => {
  it('affinity line lists good/bad types and leaves empty sides out', () => {
    expect(formatAffinityLine(['FIGHTING'], ['DIGITAL'])).toBe('Good for: Fighting · Bad for: Digital');
    expect(formatAffinityLine(['DIGITAL', 'ARTISTIC'], [])).toBe('Good for: Digital, Artistic');
    expect(formatAffinityLine([], ['FIGHTING'])).toBe('Bad for: Fighting');
    expect(formatAffinityLine([], [])).toBe('');
    expect(formatAffinityLine(undefined, undefined)).toBe('');
  });
  it('The Gym face: name, PLACE pill, affinity, border text, violet, NO badge', () => {
    const html = buildCardV1(byName('The Gym'), {})!.html;
    expect(html).toContain('>The Gym<');
    expect(html).toContain('>PLACE<');
    expect(html).toContain('Good for: Fighting · Bad for: Digital');
    expect(html).toContain('Only 1 active at a time');
    expect(html).toContain('#6D28D9');
    expect(html).not.toContain('cv1-badge');
    expect(html).toContain('cv1-face--no-badge');
  });
  it('field tile has no badge either', () => {
    const html = buildCardV1(byName('The Gym'), { fieldMode: true })!.html;
    expect(html).toContain('>PLACE<');
    expect(html).not.toContain('cv1-badge');
    expect(html).not.toContain('cv1-desc');
  });
  it('every Place renders, keeps its full description, and shows no flavour/rarity', () => {
    for (const p of PLACES as any[]) {
      const out = buildCardV1(p, {});
      expect(out, p.id).not.toBeNull();
      expect(buildPlaceSpecV1(p).lines.join(' '), p.id).toBe(String(p.description).trim().replace(/\s*\n\s*/g, ' '));
      expect(out!.html.toLowerCase()).not.toContain('rarity');
      if (p.flavourText) expect(out!.html.toLowerCase()).not.toContain(String(p.flavourText).toLowerCase());
    }
  });
});
