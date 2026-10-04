import { describe, it, expect } from 'vitest';
import { PIECIES } from '../../src/data/piecies.js';
import { getRequirementText } from '../../src/ui/cardV1/getRequirementText.js';
import { getPiecieCategoryLabel } from '../../src/ui/cardV1/getPiecieCategoryLabel.js';
import { formatCost } from '../../src/ui/cardV1/formatCost.js';
import { getDescriptionLayout } from '../../src/ui/cardV1/getDescriptionLayout.js';
import { buildPiecieSpecV1 } from '../../src/ui/cardV1/buildPiecieSpecV1.js';
import { buildCardV1 } from '../../src/ui/cardV1/buildCardV1.js';

const byName = (name: string) => (PIECIES as any[]).find((p) => p.name === name);

describe('card frame v1 — Piecie data mapping', () => {
  it('requirement codes become readable text', () => {
    expect(getRequirementText('any')).toBe('Any');
    expect(getRequirementText(undefined)).toBe('Any');
    expect(getRequirementText('level1')).toBe('Lvl 1+');
    expect(getRequirementText('level2')).toBe('Lvl 2+');
    expect(getRequirementText('mental2')).toBe('Mental ★★+');
    expect(getRequirementText('physical2')).toBe('Physical ★★+');
    expect(getRequirementText('mental3')).toBe('Mental ★★★');
    expect(getRequirementText('bankChilling')).toBe('Bank Chilling active');
  });
  it('every requirement code in the Piecie data maps to non-raw text', () => {
    for (const p of PIECIES as any[]) {
      const text = getRequirementText(p.requirement);
      expect(text, p.id).not.toMatch(/^[a-z]+\d*$/);
    }
  });
  it('every Piecie subtype has a category label (no invented categories)', () => {
    const labels = new Set((PIECIES as any[]).map((p) => getPiecieCategoryLabel(p.subtype)));
    expect([...labels].sort()).toEqual(
      ['Attack', 'Digital Equipment', 'Momentum-Gaining', 'Pet Protection', 'Physical Equipment', 'Substance', 'Utility'],
    );
  });
  it('cost badge: Free for 0, number for paid, label COST / MP COST', () => {
    expect(formatCost(0)).toMatchObject({ value: 'Free', label: 'COST', word: true });
    expect(formatCost(undefined)).toMatchObject({ value: 'Free' });
    expect(formatCost(40)).toMatchObject({ value: '40', label: 'MP COST', fieldLabel: 'COST' });
  });
  it('Kannetje Melk face: name only, PIECIE pill, Requires line, category, Free badge', () => {
    const html = buildCardV1(byName('Kannetje Melk'), {})!.html;
    expect(html).toContain('>Kannetje Melk<');
    expect(html).not.toContain('cv1-nick');
    expect(html).toContain('>PIECIE<');
    expect(html).toContain('Requires: Any');
    expect(html).toContain('Momentum-Gaining');
    expect(html).toMatch(/data-cv1-mp>Free</);
    expect(html).toContain('#15803D');
    expect(html).toContain('Gain 25 MP to your active Mosje.');
  });
  it('paid Piecie shows the MP cost; description text is unchanged', () => {
    const force = byName('Welloe Force');
    const html = buildCardV1(force, {})!.html;
    expect(html).toMatch(/data-cv1-mp>40</);
    expect(html).toContain('MP COST');
    const spec = buildPiecieSpecV1(force);
    expect(spec.lines.join(' ')).toBe(force.description);
  });
  it('no flavour text or rarity on the face', () => {
    for (const p of PIECIES as any[]) {
      const html = buildCardV1(p, {})!.html.toLowerCase();
      expect(html).not.toContain('rarity');
      if (p.flavourText) expect(html).not.toContain(String(p.flavourText).toLowerCase());
    }
  });
  it('field tile: name, PIECIE pill, COST badge, no description', () => {
    const html = buildCardV1(byName('Kannetje Melk'), { fieldMode: true })!.html;
    expect(html).toContain('>PIECIE<');
    expect(html).toMatch(/data-cv1-mp>Free</);
    expect(html).toContain('>COST<');
    expect(html).not.toContain('cv1-desc');
  });
  it('short text is set larger, long text steps down, nothing exceeds the card', () => {
    expect(getDescriptionLayout(['Gain 25 MP to your active Mosje.'], { allowLarge: true, minFade: 250 })).toMatchObject({ size: 18, fade: 250, overflow: false });
    const long = getDescriptionLayout(Array.from({ length: 5 }, () => 'A long sentence about what happens. '.repeat(4)), { allowLarge: true, minFade: 250 });
    expect(long.size).toBeLessThan(16);
    expect(long.size).toBeGreaterThanOrEqual(12.5);
  });
  it('every Piecie renders without throwing and keeps its full description text', () => {
    for (const p of PIECIES as any[]) {
      const out = buildCardV1(p, {});
      expect(out, p.id).not.toBeNull();
      expect(buildPiecieSpecV1(p).lines.join(' '), p.id).toBe(String(p.description).trim().replace(/\s*\n\s*/g, ' '));
    }
  });
});
