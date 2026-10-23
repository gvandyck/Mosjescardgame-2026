import { describe, it, expect } from 'vitest';
import { PIECIES } from '../../src/data/piecies.js';
import { getPiecieLabel } from '../../src/ui/cardV1/getPiecieLabel.js';
import { splitNeedsLead } from '../../src/ui/cardV1/splitNeedsLead.js';
import { formatCost } from '../../src/ui/cardV1/formatCost.js';
import { getDescriptionLayout } from '../../src/ui/cardV1/getDescriptionLayout.js';
import { buildPiecieSpecV1 } from '../../src/ui/cardV1/buildPiecieSpecV1.js';
import { buildCardV1 } from '../../src/ui/cardV1/buildCardV1.js';

const byName = (name: string) => (PIECIES as any[]).find((p) => p.name === name);
// The 73 Card List Piecies (piecie_mp_adjuster is a disabled dev tool without tag or group).
const LIVE = (PIECIES as any[]).filter((p) => !p.disabled);
const norm = (t: string) => String(t || '').trim().replace(/\s*\n\s*/g, ' ');

// No DOM in this vitest env: read the 2.0 face from its html string.
const part = (html: string, cls: string) => html.match(new RegExp(`<div class="${cls}"[^>]*>(.*?)</div>`, 's'))?.[1] ?? null;
const textBox = (html: string) => html.slice(html.indexOf('<div class="cv2-textbox">')).split(/<div class="cv2-(?:info|pills)">/)[0];
const corner = (html: string) => html.slice(html.indexOf('<div class="cv2-corner"'), html.indexOf('<i class="cv2-divider">'));
const plain = (html: string) => html.replace(/<\/div>\s*<div/g, '</div> <div').replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
// Everything on the face outside the text box (corner, name, info, pill, label).
const chrome = (html: string) => html.replace(textBox(html), '');

describe('card frame v1 — Piecie data mapping (2.0 face)', () => {
  it('the Needs line comes from needsText and is not repeated in the text box', () => {
    const taks = byName('Dikke Taks');
    const html = buildCardV1(taks, {})!.html;
    expect(part(html, 'cv2-info')).toBe('Needs: one of your Mosjes at Level 2+');
    expect(textBox(html)).not.toContain('Needs:');
    expect(plain(textBox(html))).toContain('One of your Mosjes gets +10 Power this turn');
    expect(buildPiecieSpecV1(taks).info).toBe('Needs: one of your Mosjes at Level 2+');
    // no needsText = no info line at all (never "Requires: Any")
    const melk = buildCardV1(byName('Kannetje Melk'), {})!.html;
    expect(melk).not.toContain('cv2-info');
    expect(buildPiecieSpecV1(byName('Kannetje Melk')).info).toBe('');
  });

  it('no Piecie face prints a V4 requirement code, "Requires" or an old sub-category', () => {
    expect(LIVE).toHaveLength(73);
    for (const p of LIVE) {
      const html = chrome(buildCardV1(p, {})!.html);
      expect(html, p.id).not.toMatch(/Requires/);
      expect(html, p.id).not.toMatch(/\b(level\d|mental\d|physical\d|bankChilling)\b/);
      expect(html, p.id).not.toMatch(/Momentum-Gaining|Digital Equipment|Physical Equipment|Pet Protection/);
    }
  });

  it('Needs lines appear exactly on the Piecies with needsText', () => {
    const withNeeds = LIVE.filter((p) => p.needsText);
    expect(withNeeds).toHaveLength(11);
    for (const p of LIVE) {
      const html = buildCardV1(p, {})!.html;
      if (p.needsText) expect(part(html, 'cv2-info'), p.id).toBe(`Needs: ${p.needsText}`);
      else expect(html, p.id).not.toContain('cv2-info');
    }
  });

  it('every Piecie face shows the tag-first label (Food / Gear / Substance / Pet, else MP / Attack / Utility)', () => {
    const seen = new Set<string>();
    for (const p of LIVE) {
      const label = getPiecieLabel(p);
      expect(label, p.id).not.toBe('');
      expect(part(buildCardV1(p, {})!.html, 'cv2-label'), p.id).toBe(label);
      seen.add(label);
    }
    expect([...seen].sort()).toEqual(['Attack', 'Food', 'Gear', 'MP', 'Pet', 'Substance', 'Utility']);
  });

  it('cost corner: 0 renders 0, label COST, never Free / MP COST', () => {
    expect(formatCost(0)).toMatchObject({ value: 'Free', label: 'COST', word: true }); // legacy field tile only (62-05)
    const melk = buildCardV1(byName('Kannetje Melk'), {})!.html;
    expect(corner(melk)).toContain('data-cv1-cost="0"');
    expect(corner(melk)).toContain('<div class="cv2-corner-val">0</div>');
    expect(corner(melk)).toContain('>COST<');
    for (const p of LIVE) {
      const html = buildCardV1(p, {})!.html;
      expect(corner(html), p.id).toContain(`data-cv1-cost="${p.cost}"`);
      expect(chrome(html), p.id).not.toMatch(/Free|MP COST/);
    }
  });

  it('Kannetje Melk face: name, PIECIE pill, no Needs line, Food, cost 0, green', () => {
    const html = buildCardV1(byName('Kannetje Melk'), {})!.html;
    expect(html).toContain('>Kannetje Melk<');
    expect(html).not.toContain('cv1-nick');
    expect(html).toContain('>PIECIE<');
    expect(part(html, 'cv2-label')).toBe('Food'); // its group is "mp", the tag wins
    expect(html).not.toContain('cv2-info');
    expect(html).toContain('#15803D');
    expect(plain(textBox(html))).toBe('One of your Mosjes gains 25 MP.');
    expect(html).not.toContain('data-cv1-stays');
  });

  it('Welloe Force (cost 2, stays): corner 2, STAYS chip, description text unchanged', () => {
    const force = byName('Welloe Force');
    const html = buildCardV1(force, {})!.html;
    expect(corner(html)).toContain('data-cv1-cost="2"');
    expect(corner(html)).toContain('<div class="cv2-corner-val">2</div>');
    expect(html).toContain('data-cv1-stays="true"');
    expect(html).toContain('>STAYS<');
    expect(buildPiecieSpecV1(force).lines.join(' ')).toBe(force.description);
  });

  it('a STAYS chip sits next to the pill on exactly the Piecies with stays', () => {
    expect(LIVE.filter((p) => p.stays)).toHaveLength(15);
    for (const p of LIVE) {
      const html = buildCardV1(p, {})!.html;
      expect(html.includes('data-cv1-stays="true"'), p.id).toBe(Boolean(p.stays));
      expect(buildPiecieSpecV1(p).stays, p.id).toBe(Boolean(p.stays));
      if (p.stays) expect(html, p.id).toMatch(/<span class="cv2-pill">PIECIE<\/span><span class="cv2-chip" data-cv1-stays="true">STAYS<\/span>/);
    }
  });

  it('is a 2.0 spec: face 2, PIECIE type key, Energy cost corner, no level rows or footer', () => {
    const spec = buildPiecieSpecV1(byName('Dikke Taks')) as any;
    expect(spec).toMatchObject({ face: 2, typeKey: 'PIECIE', pill: 'PIECIE', label: 'Attack', levelRows: [], footer: null });
    expect(spec.corner).toEqual({ hook: 'cost', value: '3', label: 'COST', sub: '' });
  });

  it('no flavour text or rarity on the face', () => {
    for (const p of PIECIES as any[]) {
      const html = buildCardV1(p, {})!.html.toLowerCase();
      expect(html).not.toContain('rarity');
      if (p.flavourText) expect(html).not.toContain(String(p.flavourText).toLowerCase());
    }
  });

  it('field tile: name, PIECIE pill, COST badge, no description (legacy tile until 62-05)', () => {
    const html = buildCardV1(byName('Kannetje Melk'), { fieldMode: true })!.html;
    expect(html).toContain('>PIECIE<');
    expect(html).toMatch(/data-cv1-mp>Free</);
    expect(html).toContain('>COST<');
    expect(html).not.toContain('cv1-desc');
  });

  it('short text is set larger, long text steps down, nothing exceeds the card (legacy helper until 62-06)', () => {
    expect(getDescriptionLayout(['One of your Mosjes gains 25 MP.'], { allowLarge: true, minFade: 250 })).toMatchObject({ size: 18, fade: 250, overflow: false });
    const long = getDescriptionLayout(Array.from({ length: 5 }, () => 'A long sentence about what happens. '.repeat(4)), { allowLarge: true, minFade: 250 });
    expect(long.size).toBeLessThan(16);
    expect(long.size).toBeGreaterThanOrEqual(12.5);
  });

  it('every Piecie renders without throwing; its text box holds the description minus the dropped Needs lead', () => {
    for (const p of PIECIES as any[]) {
      const out = buildCardV1(p, {});
      expect(out, p.id).not.toBeNull();
      const shown = splitNeedsLead(norm(p.description), p.needsText);
      expect(buildPiecieSpecV1(p).lines.join(' '), p.id).toBe(shown);
      expect(plain(textBox(out!.html)).replace(/\s+/g, ' ').trim(), p.id).toBe(shown);
    }
  });

  it('the dropped lead is exactly the Needs sentence: the description starts with it, one capital changes', () => {
    for (const p of LIVE.filter((x) => x.needsText)) {
      const text = norm(p.description);
      const lead = [`Needs: ${p.needsText}.`, `Only if ${p.needsText}:`, `Only if ${p.needsText}.`].find((l) => text.startsWith(l));
      expect(lead, `${p.id} starts with its Needs sentence`).toBeTruthy();
      const rest = text.slice(lead!.length).trim();
      expect(splitNeedsLead(text, p.needsText), p.id).toBe(rest.charAt(0).toUpperCase() + rest.slice(1));
      expect(rest.slice(1), p.id).toBe(splitNeedsLead(text, p.needsText).slice(1)); // no other character changes
    }
  });

  it('escapes markup in the Needs line, label and name (T-62-05)', () => {
    const html = buildCardV1({ ...byName('Dikke Taks'), needsText: 'x <b>bold</b>', name: 'A <i>B</i>' }, {})!.html;
    expect(part(html, 'cv2-info')).toBe('Needs: x &lt;b&gt;bold&lt;/b&gt;');
    expect(html).not.toContain('<b>bold');
    expect(html).not.toContain('<i>B');
    expect(html).toContain('A &lt;i&gt;B&lt;/i&gt;');
  });
});
