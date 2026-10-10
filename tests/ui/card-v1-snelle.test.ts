import { describe, it, expect } from 'vitest';
import { SNELLE_PIECIES } from '../../src/data/snellePiecies.js';
import { buildSnelleSpecV1 } from '../../src/ui/cardV1/buildSnelleSpecV1.js';
import { buildCardV1 } from '../../src/ui/cardV1/buildCardV1.js';

const byName = (name: string) => (SNELLE_PIECIES as any[]).find((p) => p.name === name);

describe('card frame v1 — Snelle data mapping', () => {
  it('Lucky Cóin face: name, SNELLE pill, Requires line, instant border text, Free badge, gold', () => {
    const html = buildCardV1(byName('Lucky Cóin'), {})!.html;
    expect(html).toContain('>Lucky Cóin<');
    expect(html).not.toContain('cv1-nick');
    expect(html).toContain('>SNELLE<');
    expect(html).toContain('Requires: Any');
    expect(html).toContain('Instant - play any time');
    expect(html).toMatch(/data-cv1-mp>Free</);
    expect(html).toContain('#A16207');
    expect(html).toContain('#FEF9C3');
  });
  it('requirement variants read as text (Mental ★★+, Physical ★★+, Mental ★★★, Bank Chilling)', () => {
    const texts = (SNELLE_PIECIES as any[]).map((p) => buildSnelleSpecV1(p).info);
    expect(texts).toContain('Requires: Mental ★★+');
    expect(texts).toContain('Requires: Physical ★★+');
    expect(texts).toContain('Requires: Mental ★★★');
    expect(texts).toContain('Requires: Bank Chilling active');
    expect(texts).toContain('Requires: Lvl 1+');
  });
  it('paid Snelle (none in the data today) would show the MP cost', () => {
    const html = buildCardV1({ ...byName('Lucky Cóin'), mpCost: 10 }, {})!.html;
    expect(html).toMatch(/data-cv1-mp>10</);
    expect(html).toContain('MP COST');
  });
  it('field tile shows name, SNELLE pill and COST badge only', () => {
    const html = buildCardV1(byName('Lucky Cóin'), { fieldMode: true })!.html;
    expect(html).toContain('>SNELLE<');
    expect(html).toContain('>COST<');
    expect(html).not.toContain('cv1-desc');
  });
  it('every Snelle renders, keeps its full description, and shows no flavour/rarity', () => {
    for (const p of SNELLE_PIECIES as any[]) {
      const out = buildCardV1(p, {});
      expect(out, p.id).not.toBeNull();
      expect(buildSnelleSpecV1(p).lines.join(' '), p.id).toBe(String(p.description).trim().replace(/\s*\n\s*/g, ' '));
      expect(out!.html.toLowerCase()).not.toContain('rarity');
      if (p.flavourText) expect(out!.html.toLowerCase()).not.toContain(String(p.flavourText).toLowerCase());
    }
  });
});
