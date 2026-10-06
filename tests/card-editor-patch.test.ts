// Card editor: pure text patching of src/data/*.js (rarity + artFocus), plus edit validation.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
// @ts-ignore - plain .mjs helper
import { patchCardSource } from '../scripts/card-editor/patchCardSource.mjs';
// @ts-ignore
import { validateEdit } from '../scripts/card-editor/validateEdit.mjs';

const SRC = `export const X = [
  {
    id: "card_a",
    name: "A",
    artPath: "assets/a.png",
    rarity: "★★",
    isBoosterOnly: false
  },
  {
    id: "card_b",
    name: "B",
    nested: { id: "inner" },
    rarity: "★",
    artFocus: "10% 20%",
    artPath: "assets/b.png"
  }
];
`;

describe('patchCardSource', () => {
  it('changes rarity of one card only', () => {
    const out = patchCardSource(SRC, 'card_a', { rarity: '★★★★' });
    expect(out).toContain('rarity: "★★★★",');
    expect(out).toContain('rarity: "★",');
    expect(out.replace('★★★★', '★★')).toBe(SRC);
  });
  it('adds artFocus before artPath, replaces it, and removes it with ""', () => {
    const added = patchCardSource(SRC, 'card_a', { artFocus: '30% 70%' });
    expect(added).toContain('artFocus: "30% 70%",\n    artPath: "assets/a.png"');
    const replaced = patchCardSource(SRC, 'card_b', { artFocus: '55% 5%' });
    expect(replaced).toContain('artFocus: "55% 5%"');
    expect(replaced).not.toContain('10% 20%');
    const removed = patchCardSource(SRC, 'card_b', { artFocus: '' });
    expect(removed).not.toContain('artFocus');
  });
  it('ignores nested ids and returns null for an unknown id', () => {
    expect(patchCardSource(SRC, 'inner', { rarity: '★' })).toBeNull();
    expect(patchCardSource(SRC, 'nope', { rarity: '★' })).toBeNull();
  });
  it('works on every real data file: every card id round-trips untouched when set to its own rarity', () => {
    for (const f of ['mosjes', 'piecies', 'places', 'snellePiecies', 'quests']) {
      const src = fs.readFileSync(`src/data/${f}.js`, 'utf8');
      for (const m of src.matchAll(/^([ \t]*)id:\s*"([^"]+)",?/gm)) {
        const id = m[2];
        const block = src.slice(m.index, m.index + 2500);
        const r = /rarity:\s*"(★+)"/.exec(block);
        if (!r || !/(mosje|piecie|place|snelle|quest)_/.test(id)) continue;
        expect(patchCardSource(src, id, { rarity: r[1] }), `${f} ${id}`).toBe(src);
      }
    }
  });
});

describe('validateEdit', () => {
  it('accepts only strict ids, 1-4 stars and "x% y%" focus values', () => {
    expect(validateEdit({ id: 'card_a', rarity: '★★' })).toBeNull();
    expect(validateEdit({ id: 'card_a', artFocus: '50% 12.5%' })).toBeNull();
    expect(validateEdit({ id: 'card_a', artFocus: '' })).toBeNull();
    expect(validateEdit({ id: '../x', rarity: '★' })).not.toBeNull();
    expect(validateEdit({ id: 'a', rarity: '★★★★★' })).not.toBeNull();
    expect(validateEdit({ id: 'a', artFocus: 'url(x)' })).not.toBeNull();
    expect(validateEdit({ id: 'a' })).not.toBeNull();
  });
});
