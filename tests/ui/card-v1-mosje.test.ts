import { describe, it, expect } from 'vitest';
import { MOSJES } from '../../src/data/mosjes.js';
import { parseMosjeName } from '../../src/ui/cardV1/parseMosjeName.js';
import { splitSentences } from '../../src/ui/cardV1/splitSentences.js';
import { formatTraitsLine } from '../../src/ui/cardV1/formatTraitsLine.js';
import { formatAbilityLine } from '../../src/ui/cardV1/formatAbilityLine.js';
import { fitFirstName } from '../../src/ui/cardV1/fitFirstName.js';
import { getDescriptionLayout } from '../../src/ui/cardV1/getDescriptionLayout.js';
import { getMosjeTypeKey } from '../../src/ui/cardV1/getMosjeTypeKey.js';
import { buildMosjeFaceV1 } from '../../src/ui/cardV1/buildMosjeFaceV1.js';
import { buildMosjeFieldV1 } from '../../src/ui/cardV1/buildMosjeFieldV1.js';
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

describe('card frame v1 — Mosje face data mapping', () => {
  it('traits line lists starred traits with filled stars only', () => {
    expect(formatTraitsLine({ physical: 3, resilient: 2, social: 3, mental: 0 })).toBe(
      'Physical ★★★ · Resilient ★★ · Social ★★★',
    );
  });
  it('first name shrinks for long names, never below 24px, never above 40px', () => {
    expect(fitFirstName('Alyssa')).toBe(40);
    expect(fitFirstName('Dancing/DDR Chris')).toBeLessThan(40);
    expect(fitFirstName('Dancing/DDR Chris')).toBeGreaterThanOrEqual(24);
    expect(fitFirstName('X'.repeat(60))).toBe(24);
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

  it('full face: name, nickname, LVL pill, live MP, type label, traits (Alyssa)', () => {
    const alyssa = { ...byName('[Alyssa] The Bulldozer'), mp: 35, level: 1 };
    const html = buildMosjeFaceV1(alyssa);
    expect(html).toContain('>Alyssa<');
    expect(html).toContain('>The Bulldozer<');
    expect(html).toContain('LVL 2'); // internal level 1 -> displayed Level 2
    expect(html).toMatch(/data-cv1-mp>35</);
    expect(html).toContain('Fighting Mosje');
    expect(html).toContain('#C2410C');
    expect(html).toContain('Physical ★★★');
  });
  it('full face uses printed Start MP and LVL 1 for a hand card with no live state', () => {
    const html = buildMosjeFaceV1(byName('[FPS Coert]'));
    expect(html).toContain('LVL 1');
    expect(html).toMatch(/data-cv1-mp>\d+</);
    expect(html).not.toContain('cv1-nick'); // no nickname, no second line
  });
  it('full face never shows flavour text or rarity', () => {
    const jisca = byName('[Jisca] The Maestro');
    const html = buildMosjeFaceV1(jisca);
    expect(html).not.toContain(jisca.flavourText);
    expect(html.toLowerCase()).not.toContain('rarity'); // stars on the face are traits only
  });
  it('MP badge can show 0, 5, 100+', () => {
    for (const mp of [0, 5, 105]) {
      expect(buildMosjeFaceV1({ ...byName('[Alyssa] The Bulldozer'), mp })).toMatch(new RegExp(`data-cv1-mp>${mp}<`));
    }
  });
  it('field tile: single-line name, L<level> pill, badge, no description', () => {
    const html = buildMosjeFieldV1({ ...byName('[Alyssa] The Bulldozer'), mp: 20, level: 2 });
    expect(html).toContain('>L3<');
    expect(html).toMatch(/data-cv1-mp>20</);
    expect(html).not.toContain('cv1-desc');
    expect(html).not.toContain('cv1-info');
  });
  it('card art falls back cleanly: no <img> when art is missing or a placeholder', () => {
    expect(buildMosjeFaceV1({ ...byName('[Alyssa] The Bulldozer'), artPath: '' })).not.toContain('<img');
    expect(buildMosjeFaceV1({ ...byName('[Alyssa] The Bulldozer'), artPath: 'assets/x/placeholder.png' })).not.toContain('<img');
  });
  it('buildCardV1 handles Mosje only; other card types fall through to the old renderer', () => {
    expect(buildCardV1({ type: 'MOSJE', name: '[A] B', subtype: 'DIGITAL' }, {})?.className).toBe('card-v1 card-v1--full');
    expect(buildCardV1({ type: 'MOSJE', name: '[A] B' }, { fieldMode: true })?.className).toBe('card-v1 card-v1--field');
    for (const type of ['PIECIE', 'SNELLE_PIECIE', 'PLACE', 'QUEST']) expect(buildCardV1({ type }, {})).toBeNull();
  });
});
