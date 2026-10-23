import { describe, it, expect } from 'vitest';
import { SNELLE_PIECIES } from '../../src/data/snellePiecies.js';
import { splitNeedsLead } from '../../src/ui/cardV1/splitNeedsLead.js';
import { buildSnelleSpecV1 } from '../../src/ui/cardV1/buildSnelleSpecV1.js';
import { buildCardV1 } from '../../src/ui/cardV1/buildCardV1.js';

const byName = (name: string) => (SNELLE_PIECIES as any[]).find((p) => p.name === name);
const norm = (t: string) => String(t || '').trim().replace(/\s*\n\s*/g, ' ');

// No DOM in this vitest env: read the 2.0 face from its html string.
const part = (html: string, cls: string) => html.match(new RegExp(`<div class="${cls}"[^>]*>(.*?)</div>`, 's'))?.[1] ?? null;
const textBox = (html: string) => html.slice(html.indexOf('<div class="cv2-textbox">')).split(/<div class="cv2-(?:info|pills)">/)[0];
const corner = (html: string) => html.slice(html.indexOf('<div class="cv2-corner"'), html.indexOf('<i class="cv2-divider">'));
const plain = (html: string) => html.replace(/<\/div>\s*<div/g, '</div> <div').replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const chrome = (html: string) => html.replace(textBox(html), '');

describe('card frame v1 — Snelle data mapping (2.0 face)', () => {
  it('Lucky Cóin face: name, SNELLE pill, Needs line, "Instant · any turn", cost 1, gold', () => {
    const html = buildCardV1(byName('Lucky Cóin'), {})!.html;
    expect(html).toContain('>Lucky Cóin<');
    expect(html).not.toContain('cv1-nick');
    expect(html).toContain('>SNELLE<');
    expect(part(html, 'cv2-info')).toBe('Needs: one of your Mosjes has Creative ★');
    expect(part(html, 'cv2-label')).toBe('Instant · any turn');
    expect(corner(html)).toContain('data-cv1-cost="1"');
    expect(corner(html)).toContain('>COST<');
    expect(html).toContain('#A16207');
    expect(html).toContain('#FEF9C3');
    expect(plain(textBox(html))).toBe("Reroll any dice once (yours or your opponent's). Creative ★★★: choose the result instead.");
  });

  it('Needs lines appear exactly on the 5 Snelle with needsText (Jammertje reads Mental ★★)', () => {
    const withNeeds = (SNELLE_PIECIES as any[]).filter((p) => p.needsText);
    expect(withNeeds).toHaveLength(5);
    for (const p of SNELLE_PIECIES as any[]) {
      const html = buildCardV1(p, {})!.html;
      if (p.needsText) expect(part(html, 'cv2-info'), p.id).toBe(`Needs: ${p.needsText}`);
      else expect(html, p.id).not.toContain('cv2-info');
      expect(textBox(html), p.id).not.toContain('Needs:');
    }
    expect(part(buildCardV1(byName('Jammertje Gepakt!'), {})!.html, 'cv2-info')).toBe('Needs: one of your Mosjes has Mental ★★');
    // the old V4 requirement leftovers are gone
    const specInfo = (SNELLE_PIECIES as any[]).map((p) => buildSnelleSpecV1(p).info);
    expect(specInfo.filter(Boolean)).toHaveLength(5);
    expect(specInfo.join('|')).not.toMatch(/Requires|Lvl 1\+|Bank Chilling active|Physical ★★\+/);
  });

  it('no Snelle face prints Requires, Free, MP COST, the old border text or a V4 code', () => {
    for (const p of SNELLE_PIECIES as any[]) {
      const html = chrome(buildCardV1(p, {})!.html);
      expect(html, p.id).not.toMatch(/Requires|Free|MP COST|Instant - play any time/);
      expect(html, p.id).not.toMatch(/\b(level\d|mental\d|physical\d|bankChilling)\b/);
      expect(part(html, 'cv2-label'), p.id).toBe('Instant · any turn');
      expect(html, p.id).toContain('>SNELLE<');
    }
  });

  it('cost corner: Blensen! shows 4 with "or free"; a cost N Snelle shows N; cost 0 shows 0', () => {
    const blensen = buildCardV1(byName('Blensen!'), {})!.html;
    expect(corner(blensen)).toContain('data-cv1-cost="4"');
    expect(corner(blensen)).toContain('<div class="cv2-corner-val">4</div>');
    expect(corner(blensen)).toContain('<div class="cv2-corner-sub">or free</div>');
    expect(blensen).toContain('data-cv1-stays="true"'); // stays in its slot until end of turn
    const paid = buildCardV1({ ...byName('Lucky Cóin'), cost: 3 }, {})!.html;
    expect(corner(paid)).toContain('data-cv1-cost="3"');
    expect(corner(paid)).not.toContain('cv2-corner-sub');
    const rush = buildCardV1(byName('Momentum Rush'), {})!.html;
    expect(corner(rush)).toContain('<div class="cv2-corner-val">0</div>');
    for (const p of SNELLE_PIECIES as any[]) {
      expect(corner(buildCardV1(p, {})!.html), p.id).toContain(`data-cv1-cost="${p.cost}"`);
      expect(buildCardV1(p, {})!.html.includes('data-cv1-stays="true"'), p.id).toBe(Boolean(p.stays));
    }
  });

  it('is a 2.0 spec: face 2, SNELLE_PIECIE type key, no level rows or footer', () => {
    const spec = buildSnelleSpecV1(byName('Lucky Cóin')) as any;
    expect(spec).toMatchObject({ face: 2, typeKey: 'SNELLE_PIECIE', pill: 'SNELLE', label: 'Instant · any turn', levelRows: [], footer: null, stays: false });
    expect(spec.corner).toEqual({ hook: 'cost', value: '1', label: 'COST', sub: '' });
  });

  it('field tile shows name and SNELLE pill only, no cost', () => {
    const html = buildCardV1(byName('Lucky Cóin'), { fieldMode: true })!.html;
    expect(html).toContain('>SNELLE<');
    expect(html).not.toContain('data-cv1-cost');
    expect(html).not.toContain('>COST<');
    expect(html).not.toContain('cv1-desc');
  });

  it('every Snelle renders, its text box holds the description minus the dropped Needs lead, and shows no flavour/rarity', () => {
    for (const p of SNELLE_PIECIES as any[]) {
      const out = buildCardV1(p, {});
      expect(out, p.id).not.toBeNull();
      const shown = splitNeedsLead(norm(p.description), p.needsText);
      expect(buildSnelleSpecV1(p).lines.join(' '), p.id).toBe(shown);
      expect(plain(textBox(out!.html)).replace(/\s+/g, ' ').trim(), p.id).toBe(shown);
      expect(out!.html.toLowerCase()).not.toContain('rarity');
      if (p.flavourText) expect(out!.html.toLowerCase()).not.toContain(String(p.flavourText).toLowerCase());
    }
  });

  it('escapes markup in the Needs line (T-62-05)', () => {
    const html = buildCardV1({ ...byName('Lucky Cóin'), needsText: '<script>x</script>' }, {})!.html;
    expect(part(html, 'cv2-info')).toBe('Needs: &lt;script&gt;x&lt;/script&gt;');
    expect(html).not.toContain('<script>');
  });
});
