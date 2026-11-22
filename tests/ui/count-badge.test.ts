import { describe, it, expect } from 'vitest';
// @ts-ignore plain js module
import { buildCountBadge } from '../../src/ui/board/buildCountBadge.js';

// 72.1-04 (D-05, D-13): the one count badge a phone tile shows instead of the chip row and the tag lines.
describe('buildCountBadge', () => {
  it('gear and effects: full text, compact text and the aria label', () => {
    expect(buildCountBadge({ attachments: 2, effects: 1 })).toEqual({ text: '2 gear, 1 effect', compact: '2+1', label: '2 attachments, 1 effect' });
  });
  it('gear only', () => {
    expect(buildCountBadge({ attachments: 1, effects: 0 })).toEqual({ text: '1 gear', compact: '1', label: '1 attachment' });
  });
  it('effects only, plural', () => {
    expect(buildCountBadge({ attachments: 0, effects: 3 })).toEqual({ text: '3 effects', compact: '3', label: '3 effects' });
  });
  it('nothing attached: null (no badge)', () => {
    expect(buildCountBadge({ attachments: 0, effects: 0 })).toBeNull();
    expect(buildCountBadge({})).toBeNull();
    expect(buildCountBadge()).toBeNull();
  });
  it('junk counts are treated as zero', () => {
    expect(buildCountBadge({ attachments: -2, effects: Number.NaN })).toBeNull();
    expect(buildCountBadge({ attachments: '2', effects: 0 })).toEqual({ text: '2 gear', compact: '2', label: '2 attachments' });
  });
  it('no glyphs: plain ASCII only', () => {
    const b = buildCountBadge({ attachments: 3, effects: 2 });
    for (const s of [b.text, b.compact, b.label]) expect(/^[\x20-\x7e]+$/.test(s)).toBe(true);
  });
});
