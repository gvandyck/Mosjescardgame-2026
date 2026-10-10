import { describe, it, expect } from 'vitest';
// @ts-ignore dev-only mjs
import { patchCard } from '../../scripts/obby2/patchCard.mjs';

const card = (id: string, extra = '') =>
  [
    '  {',
    `    id: "${id}",`,
    '    name: "Old",',
    '    traits: {',
    '      name: "nested",',
    '    },',
    extra,
    '    artPath: "a.jpg",',
    '    rarity: "★"',
    '  },',
  ].filter((l) => l !== '').join('\r\n');
const SRC = `export const X = [\r\n${card('a')}\r\n${card('b')}\r\n];\r\n`;

describe('patchCard', () => {
  it('replaces an existing key in place and inserts a missing one before artPath', () => {
    const out = patchCard(SRC, 'a', { name: 'New', cost: 3 });
    expect(out).toContain('    name: "New",\r\n');
    expect(out).toContain('    cost: 3,\r\n    artPath: "a.jpg"');
    expect(out.split('name: "Old"').length - 1).toBe(1); // card b untouched
  });
  it('keeps CRLF and leaves nested same-name keys alone', () => {
    const out = patchCard(SRC, 'a', { name: 'New' });
    expect(out.replace(/\r\n/g, '')).not.toContain('\n');
    expect(out).toContain('      name: "nested",');
  });
  it('round-trips quotes and backslashes', () => {
    const val = 'say "hi" \\ there';
    const out = patchCard(SRC, 'a', { abilityName: val });
    expect(out).toContain(`abilityName: ${JSON.stringify(val)},`);
  });
  it('is idempotent', () => {
    const f = { name: 'New', cost: 3, levels: [{ power: 1, traits: { a: 1 } }] };
    const once = patchCard(SRC, 'a', f);
    expect(patchCard(once, 'a', f)).toBe(once);
  });
  it('throws on multi-line existing value and returns null for unknown id', () => {
    const multi = SRC.replace('    name: "Old",', '    name:\r\n      "Old",');
    expect(() => patchCard(multi, 'a', { name: 'x' })).toThrow();
    expect(patchCard(SRC, 'zzz', { name: 'x' })).toBeNull();
  });
});
