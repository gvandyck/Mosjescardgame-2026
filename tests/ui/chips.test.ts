import { describe, it, expect } from 'vitest';
// @ts-ignore plain js modules
import { CHIP_KINDS } from '../../src/ui/chips/chipKinds.js';
// @ts-ignore
import { buildChipHtml } from '../../src/ui/chips/buildChipHtml.js';
// @ts-ignore
import { buildChipRowHtml } from '../../src/ui/chips/buildChipRowHtml.js';
// @ts-ignore
import { buildTagLinesHtml } from '../../src/ui/chips/buildTagLinesHtml.js';

describe('CHIP_KINDS', () => {
  it('has the six kinds with hex colours', () => {
    for (const k of ['gear', 'pet', 'protector', 'effect', 'shield', 'neutral']) {
      expect(CHIP_KINDS[k].main).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(CHIP_KINDS[k].tint).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });
});

describe('buildChipHtml', () => {
  it('draws a span by default and a button when interactive', () => {
    const s = buildChipHtml({ label: 'Sword', kind: 'gear', title: 'Sword' });
    expect(s).toContain('<span');
    expect(s).toContain('chip--gear');
    const b = buildChipHtml({ label: 'Sword', kind: 'gear', title: 'Sword', interactive: true });
    expect(b).toContain('<button');
    expect(b).toContain('type="button"');
    expect(b).toContain('tabindex="0"');
  });
  it('falls back to neutral for an unknown kind', () => {
    expect(buildChipHtml({ label: 'x', kind: 'nope' })).toContain('chip--neutral');
  });
  it('sets title and aria-label', () => {
    const h = buildChipHtml({ label: 'Sword', kind: 'gear', title: 'A sword' });
    expect(h).toContain('title="A sword"');
    expect(h).toContain('aria-label="A sword"');
  });
  it('cuts long labels at 14 characters, full label stays in title', () => {
    const label = 'Extremely Long Name Here';
    const h = buildChipHtml({ label, kind: 'pet' });
    expect(h).toContain('Extremely Lon…');
    expect(h).toContain(`title="${label}"`);
  });
  it('keeps colours from the table, never from input', () => {
    const h = buildChipHtml({ label: 'a', kind: 'gear', style: 'color:red', main: '#000000' } as any);
    expect(h).toContain(`--chip-main:${CHIP_KINDS.gear.main}`);
    expect(h).not.toContain('red');
    const h2 = buildChipHtml({ label: 'a', kind: 'x";background:url(evil)' });
    expect(h2).not.toContain('evil');
  });
  it('whitelists data keys and escapes values', () => {
    const h = buildChipHtml({ label: 'a', data: { 'slot-id': 'a"b', 'Bad Key': '1', 'x"y': '2' } });
    expect(h).toContain('data-slot-id="a&quot;b"');
    expect(h).not.toContain('Bad Key');
    expect(h).not.toContain('x"y');
  });
  it('escapes markup in label, title and aria-label', () => {
    const h = buildChipHtml({ label: '<img onerror=x>'.slice(0, 14), title: '<img onerror=x>' });
    expect(h).toContain('&lt;img onerror=x');
    expect(h).not.toContain('<img');
    expect(h.split('&lt;img onerror=x&gt;').length - 1).toBeGreaterThanOrEqual(2);
  });
  it('escapes markup when title is missing (falls back to label)', () => {
    const h = buildChipHtml({ label: '<img onerror=x>' });
    expect(h).not.toContain('<img');
    expect(h).toContain('aria-label="&lt;img onerror=x&gt;"');
  });
});

describe('buildChipRowHtml', () => {
  const chips = ['a', 'b', 'c', 'd', 'e'].map(l => ({ label: l, kind: 'gear' }));
  it('returns empty string for no chips', () => {
    expect(buildChipRowHtml([])).toBe('');
  });
  it('shows three chips without more by default', () => {
    const h = buildChipRowHtml(chips.slice(0, 3));
    expect(h).toContain('chip-row');
    expect(h).not.toContain('chip--more');
  });
  it('shows +N more with hidden labels in title', () => {
    const h = buildChipRowHtml(chips);
    expect(h).toContain('chip--more');
    expect(h).toContain('+2 more');
    expect(h).toContain('title="d, e"');
    expect(h).not.toContain('>d<');
  });
  it('honours max', () => {
    expect(buildChipRowHtml(chips, { max: 4 })).toContain('+1 more');
  });
});

describe('buildTagLinesHtml', () => {
  it('returns empty string for no lines', () => {
    expect(buildTagLinesHtml([])).toBe('');
  });
  it('shows two lines then +N more', () => {
    const lines = [1, 2, 3, 4].map(i => ({ text: `line ${i}`, kind: 'effect' }));
    const h = buildTagLinesHtml(lines);
    expect(h).toContain('tag-lines');
    expect(h).toContain('line 2');
    expect(h).not.toContain('line 3');
    expect(h).toContain('tag-line--more');
    expect(h).toContain('+2 more');
  });
  it('has no more line when it fits, and escapes text', () => {
    const h = buildTagLinesHtml([{ text: '<b>x</b>', kind: 'effect' }]);
    expect(h).not.toContain('tag-line--more');
    expect(h).not.toContain('<b>');
    expect(h).toContain('&lt;b&gt;');
  });
});
