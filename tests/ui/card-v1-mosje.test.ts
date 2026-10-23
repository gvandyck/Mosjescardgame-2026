import { describe, it, expect } from 'vitest';
import { MOSJES } from '../../src/data/mosjes.js';
import { parseMosjeName } from '../../src/ui/cardV1/parseMosjeName.js';
import { splitSentences } from '../../src/ui/cardV1/splitSentences.js';
import { buildMosjeSpecV1 } from '../../src/ui/cardV1/buildMosjeSpecV1.js';
import { formatSynergyLabel } from '../../src/ui/cardV1/formatSynergyLabel.js';
import { formatAbilityLine } from '../../src/ui/cardV1/formatAbilityLine.js';
import { fitFirstName } from '../../src/ui/cardV1/fitFirstName.js';
import { getDescriptionLayout } from '../../src/ui/cardV1/getDescriptionLayout.js';
import { getMosjeTypeKey } from '../../src/ui/cardV1/getMosjeTypeKey.js';
import { buildCardV1 } from '../../src/ui/cardV1/buildCardV1.js';

const byName = (name: string) => MOSJES.find((m: any) => m.name === name) as any;

describe('card frame v1 — Mosje name parsing', () => {
  it('splits first name and nickname', () => {
    expect(parseMosjeName('[Alyssa] The Bulldozer')).toEqual({ firstName: 'Alyssa', nickname: 'The Bulldozer' });
  });
  it('handles a missing nickname', () => {
    expect(parseMosjeName('[FPS Coert]')).toEqual({ firstName: 'FPS Coert', nickname: '' });
    expect(parseMosjeName('[Dancing/DDR Chris]')).toEqual({ firstName: 'Dancing/DDR Chris', nickname: '' });
  });
  it('handles a placeholder first name and nested quotes', () => {
    expect(parseMosjeName('[...] The Hacker')).toEqual({ firstName: '...', nickname: 'The Hacker' });
    expect(parseMosjeName('[Tuk "The Builder"] The Sims Architect')).toEqual({
      firstName: 'Tuk "The Builder"',
      nickname: 'The Sims Architect',
    });
  });
  it('splits the 2.0 comma form at the first ", "', () => {
    expect(parseMosjeName('Alyssa, The Bulldozer')).toEqual({ firstName: 'Alyssa', nickname: 'The Bulldozer' });
    expect(parseMosjeName('[...], The Hacker')).toEqual({ firstName: '...', nickname: 'The Hacker' });
    expect(parseMosjeName('Tuk "The Builder", The Sims Architect')).toEqual({
      firstName: 'Tuk "The Builder"',
      nickname: 'The Sims Architect',
    });
    expect(parseMosjeName('DJ 80/20, The Lucky Mixer')).toEqual({ firstName: 'DJ 80/20', nickname: 'The Lucky Mixer' });
    expect(parseMosjeName('FPS Coert')).toEqual({ firstName: 'FPS Coert', nickname: '' });
  });
  it('falls back when the name has no brackets', () => {
    expect(parseMosjeName('Plain Name')).toEqual({ firstName: 'Plain Name', nickname: '' });
    expect(parseMosjeName('')).toEqual({ firstName: 'Mosje', nickname: '' });
  });
  it('parses every real Mosje into a non-empty first name', () => {
    for (const m of MOSJES as any[]) expect(parseMosjeName(m.name).firstName.length, m.id).toBeGreaterThan(0);
  });
});

describe('card frame v1 — description formatting never changes the text', () => {
  it('splits at sentence breaks only and keeps every character', () => {
    const text = 'Draw 2 cards. Pick one (Level 1+ only). Then discard.';
    const lines = splitSentences(text);
    expect(lines).toEqual(['Draw 2 cards.', 'Pick one (Level 1+ only).', 'Then discard.']);
    expect(lines.join(' ')).toBe(text);
  });
  it('does not split inside brackets or on decimals/abbreviations without a capital', () => {
    expect(splitSentences('Gain 1.5x MP (Roll 5-6. Bonus). e.g. later')).toHaveLength(1);
  });
  it('round-trips the ability text of every Mosje', () => {
    for (const m of MOSJES as any[]) {
      const text = String(m.abilityDescription || '').trim();
      expect(splitSentences(text).join(' '), m.id).toBe(text.replace(/\s*\n\s*/g, ' '));
    }
  });
  it('bolds an ability name but not a "While ..." condition', () => {
    expect(formatAbilityLine('Unstoppable (comeback): this Mosje gains 5 MP.')).toBe(
      '<b>Unstoppable (comeback):</b> this Mosje gains 5 MP.',
    );
    expect(formatAbilityLine('While X is on your field: gain 10 MP.')).not.toContain('<b>');
  });
  it('escapes markup in card text', () => {
    expect(formatAbilityLine('Name: <script>')).toBe('<b>Name:</b> &lt;script&gt;');
  });
});

// No DOM in this vitest env: read the 2.0 face from its html string.
const stat = (html: string, key: string) => html.match(new RegExp(`<div class="cv2-stat[^"]*" data-cv1-${key}="([^"]*)">(.*?)</div></div>`, 's'));
const rowTag = (n: number, lit: boolean) => `data-cv1-level-row="${n}" data-lit="${lit}"`;
const norm = (t: string) => String(t || '').trim().replace(/\s*\n\s*/g, ' ');

describe('card frame v1 — Mosje face data mapping', () => {
  it('the 2.0 face has no traits info line; traits live in the level rows', () => {
    const html = buildCardV1(byName('Alyssa, The Bulldozer'), {})!.html;
    expect(html).not.toContain('cv2-info');
    expect(html).not.toContain('Physical ★★★'); // the old "Physical ★★★ · Resilient ★★" info line is gone
    expect(html).toContain('Power 20 · Phys ★★★ · Res ★★ · Soc ★★★'); // row 1
  });
  it('first name shrinks for long names, never below 24px, never above 40px', () => {
    expect(fitFirstName('Alyssa')).toBe(40);
    expect(fitFirstName('Dancing/DDR Chris')).toBeLessThan(40);
    expect(fitFirstName('Dancing/DDR Chris')).toBeGreaterThanOrEqual(24);
    expect(fitFirstName('X'.repeat(60))).toBe(24);
  });
  it('first name takes the 2.0 max, min and available width as optional parameters', () => {
    expect(fitFirstName('Alyssa', 36, 22, 280)).toBe(36);
    expect(fitFirstName('X'.repeat(60), 36, 22, 280)).toBe(22);
    const mid = fitFirstName('Dancing/DDR Chris', 36, 22, 280);
    expect(mid).toBeGreaterThanOrEqual(22);
    expect(mid).toBeLessThan(36);
  });
  it('description layout steps down for long text and flags impossible text', () => {
    expect(getDescriptionLayout(['Short.']).size).toBe(14.5);
    expect(getDescriptionLayout(['Short.']).fade).toBe(250);
    const long = Array.from({ length: 6 }, () => 'A fairly long sentence about what happens to the board when this triggers. '.repeat(3));
    const layout = getDescriptionLayout(long);
    expect(layout.size).toBeLessThan(14.5);
    expect(layout.size).toBeGreaterThanOrEqual(12.5);
    expect(layout.fade).toBeGreaterThan(380);
  });
  it('type colour comes from the Mosje subtype, with a safe fallback', () => {
    expect(getMosjeTypeKey({ subtype: 'DIGITAL' })).toBe('DIGITAL');
    expect(getMosjeTypeKey({ subtype: 'ARTISTIC' })).toBe('ARTISTIC');
    expect(getMosjeTypeKey({ subtype: 'nope' })).toBe('FIGHTING');
    expect(getMosjeTypeKey(undefined)).toBe('FIGHTING');
  });

  it('2.0 face: cost, name, nickname, the lit level row, Power / LVL / MP footer, type label (Alyssa, level 2)', () => {
    const alyssa = { ...byName('Alyssa, The Bulldozer'), mp: 35, level: 2 };
    const html = buildCardV1(alyssa, {})!.html;
    expect(html).toContain('cv1-face cv1-face--2');
    expect(html).toMatch(/data-cv1-cost="4"/);
    expect(html).toContain('>Alyssa<');
    expect(html).toContain('>The Bulldozer<');
    expect(html).toContain('>COST<');
    expect(html).toContain(rowTag(2, true));
    expect(html).toContain(rowTag(1, false));
    expect(html).toContain(rowTag(3, false));
    expect(stat(html, 'power')![1]).toBe('30'); // level 2 power
    expect(stat(html, 'mp')![1]).toBe('35');
    expect(html).toContain('LVL 2');
    expect(html).toContain('FIGHTING MOSJE');
    expect(html).toContain('#C2410C');
    expect(html).not.toContain('cv2-info');
    expect(html).not.toContain('cv1-badge'); // no MP badge box any more
  });
  it('2.0 face uses printed Start MP, LVL 1 and a lit first row for a hand card with no live state', () => {
    const coert = byName('FPS Coert');
    const html = buildCardV1(coert, {})!.html;
    expect(html).toContain('LVL 1');
    expect(html).toContain(rowTag(1, true));
    expect(html).toContain(rowTag(2, false));
    expect(stat(html, 'mp')![1]).toBe(String(coert.startMP)); // 20
    expect(stat(html, 'power')![1]).toBe(String(coert.levels[0].power)); // 10
    expect(html).not.toContain('cv2-nick'); // no nickname, no second line
  });
  it('a temporary (Tactician) MP shows big with the real MP small under it', () => {
    const html = buildCardV1({ ...byName('Alyssa, The Bulldozer'), mp: 40, tempMp: 75 }, {})!.html;
    const mp = stat(html, 'mp')!;
    expect(mp[1]).toBe('40'); // the data hook carries the real MP
    expect(mp[2]).toMatch(/cv2-stat-val">75</);
    expect(mp[2]).toMatch(/cv2-stat-sub">40</);
    const plain = stat(buildCardV1({ ...byName('Alyssa, The Bulldozer'), mp: 40 }, {})!.html, 'mp')!;
    expect(plain[2]).not.toContain('cv2-stat-sub');
  });
  it('the cost block shows the Energy cost, and 0 as "0"', () => {
    const cost = (c: any) => buildCardV1(c, {})!.html.match(/data-cv1-cost="([^"]*)"/)?.[1];
    expect(cost({ ...byName('Alyssa, The Bulldozer'), cost: 0 })).toBe('0');
    expect(cost({ ...byName('Alyssa, The Bulldozer'), cost: 7 })).toBe('7');
  });
  it('a synergy holder shows its "While ..." text, a non-holder the "Synergy:" label with the Card List short names', () => {
    const lines = (name: string) => buildMosjeSpecV1(byName(name)).lines;
    const martin = lines('Martin, The Historian');
    expect(martin.some((l: string) => l.startsWith('While Cless, The Teacher is also on your field:'))).toBe(true);
    expect(martin.some((l: string) => l.startsWith('Synergy:'))).toBe(false);
    expect(lines('AZN Cless, The Wild Card')).toContain('Synergy: Senor West, ViannaPoes');
    expect(lines('Cless, The Teacher')).toContain('Synergy: Martin, The Historian, ViannaPoes');
    expect(lines('Alyssa, The Bulldozer').some((l: string) => l.startsWith('Synergy:'))).toBe(false);
  });
  it('formatSynergyLabel prints "Synergy: <text>" or nothing', () => {
    expect(formatSynergyLabel('Senor West, ViannaPoes')).toBe('Synergy: Senor West, ViannaPoes');
    expect(formatSynergyLabel('')).toBe('');
    expect(formatSynergyLabel(undefined as any)).toBe('');
  });
  it('the face text keeps every character of the card text (only the Synergy label is added)', () => {
    for (const m of MOSJES as any[]) {
      const lines = buildMosjeSpecV1(m).lines.filter((l: string) => !l.startsWith('Synergy: '));
      const expected = norm(m.abilityDescription || m.description || '') + (m.synergyEffect ? ` ${m.synergyEffect}` : '');
      expect(lines.join(' ').trim(), m.id).toBe(expected.trim());
      if (m.synergyEffect) expect(buildMosjeSpecV1(m).lines.some((l: string) => l.startsWith('Synergy: ')), `${m.id} holder has no label`).toBe(false);
    }
  });
  it('a Mosje without level data still renders (no rows, Power 0)', () => {
    const html = buildCardV1({ type: 'MOSJE', name: 'A, B', subtype: 'DIGITAL', startMP: 10 }, {})!.html;
    expect(html).not.toContain('data-cv1-level-row');
    expect(stat(html, 'power')![1]).toBe('0');
  });
  it('full face never shows flavour text or rarity', () => {
    const jisca = byName('Jisca, The Maestro');
    const html = buildCardV1(jisca, {})!.html;
    expect(html).not.toContain(jisca.flavourText);
    expect(html.toLowerCase()).not.toContain('rarity'); // stars on the face are traits only
  });
  it('MP can show 0, 5, 105 in the footer', () => {
    for (const mp of [0, 5, 105]) {
      expect(stat(buildCardV1({ ...byName('Alyssa, The Bulldozer'), mp }, {})!.html, 'mp')![1]).toBe(String(mp));
    }
  });
  it('escapes markup in the name, text, label and level rows of the 2.0 face', () => {
    const evil = {
      type: 'MOSJE', subtype: 'DIGITAL', name: '<img src=x onerror=1>, The <b>Boss</b>', cost: 2,
      abilityDescription: 'Name: <script>alert(1)</script>', synergyLabelText: '<i>Pal</i>', startMP: 5,
      levels: [{ power: 1, traits: {} }, { power: 2, traits: {} }, { power: 3, traits: {} }],
    };
    const html = buildCardV1(evil, {})!.html;
    for (const bad of ['<img src=x', '<script', '<b>Boss', '<i>Pal']) expect(html, bad).not.toContain(bad);
    expect(html).toContain('&lt;img src=x onerror=1&gt;');
    expect(html).toContain('&lt;script&gt;');
  });
  it('field tile: single-line name, L<level> pill, badge, no description', () => {
    const html = buildCardV1({ ...byName('Alyssa, The Bulldozer'), mp: 20, level: 3 }, { fieldMode: true })!.html;
    expect(html).toContain('>L3<');
    expect(html).toMatch(/data-cv1-mp>20</);
    expect(html).not.toContain('cv1-desc');
    expect(html).not.toContain('cv1-info');
  });
  it('card art falls back cleanly: no <img> when art is missing or a placeholder', () => {
    expect(buildCardV1({ ...byName('Alyssa, The Bulldozer'), artPath: '' }, {})!.html).not.toContain('<img');
    expect(buildCardV1({ ...byName('Alyssa, The Bulldozer'), artPath: 'assets/x/placeholder.png' }, {})!.html).not.toContain('<img');
  });
  it('buildCardV1 handles Mosje, Piecie, Snelle and Place and Quest; unknown types fall through to the old renderer', () => {
    expect(buildCardV1({ type: 'MOSJE', name: '[A] B', subtype: 'DIGITAL' }, {})?.className).toBe('card-v1 card-v1--full card--tier-4 card--fullart card--tierlayout');
    expect(buildCardV1({ type: 'MOSJE', name: '[A] B' }, { fieldMode: true })?.className).toBe('card-v1 card-v1--field card--tier-4 card--fullart card--tierlayout');
    expect(buildCardV1({ type: 'QUEST', name: 'Q', questType: 'PERSONAL', rarity: '★★★' }, {})?.className).toBe('card-v1 card-v1--full card--tier-1 card--boxed card--tierlayout');
    expect(buildCardV1({ type: 'UNKNOWN' }, {})).toBeNull();
  });
});
