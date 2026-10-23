import { describe, it, expect } from 'vitest';
import fs from 'fs';
import { LEVEL_BLOCK_ALPHA, DIM_ROW_OPACITY } from '../../src/ui/cardV1/faceTokens.js';

// The 2.0 face stylesheet is guarded as text: the face scales from the single --cv1-w token (via --u),
// so no px length may be fixed except 1px hairlines and the container-query condition, and the
// contrast tokens in the CSS must equal the ones the unit tests prove (faceTokens.js).
const css = fs.readFileSync('styles/card-face-2-0.css', 'utf8');
const code = css.replace(/\/\*[\s\S]*?\*\//g, '');
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const block = (selector: string) => code.match(new RegExp(`${esc(selector)}\\s*\\{([^}]*)\\}`))?.[1] ?? '';

describe('card-face-2-0.css', () => {
  it('the text box tint comes from the --cv1-tint-alpha token (floor-checked in JS)', () => {
    expect(block('.cv2-textbox')).toMatch(/background:\s*rgba\(5,\s*5,\s*5,\s*var\(--cv1-tint-alpha/);
  });

  it('the text box is frosted: blur + saturate, prefixed and unprefixed', () => {
    const b = block('.cv2-textbox');
    expect(b).toMatch(/-webkit-backdrop-filter:\s*blur\(/);
    expect(b).toMatch(/[^-]backdrop-filter:\s*blur\(.*saturate\(1\.1\)/);
  });

  it('the level block alpha and the dim-row opacity equal the proven tokens', () => {
    const alpha = block('.cv2-levels').match(/background:\s*rgba\(5,\s*5,\s*5,\s*([\d.]+)\)/)?.[1];
    expect(Number(alpha)).toBe(LEVEL_BLOCK_ALPHA);
    const opacity = block('.cv2-level-row').match(/opacity:\s*([\d.]+)/)?.[1];
    expect(Number(opacity)).toBe(DIM_ROW_OPACITY);
    expect(block('.cv2-level-row[data-lit="true"]')).toMatch(/opacity:\s*1\b/);
  });

  it('the card is the size container and unlit level rows are hidden below 150px', () => {
    expect(block('.card.card-v1')).toMatch(/container:\s*cv1card\s*\/\s*inline-size/);
    const q = code.match(/@container\s+cv1card\s*\(width\s*<\s*150px\)\s*\{([\s\S]*?)\n\}/);
    expect(q, 'container query with a 150px condition').not.toBeNull();
    expect(q![1]).toMatch(/\.cv2-level-row\[data-lit="false"\]\s*\{\s*display:\s*none/);
  });

  it('no px length except 1px hairlines and the container-query condition', () => {
    const lengths = code.replace(/@container[^{]*\{/, '{').match(/-?[\d.]+px/g) ?? [];
    expect(lengths.filter((l) => l !== '1px')).toEqual([]);
  });

  it('the face zones are sized from the --u token', () => {
    for (const sel of ['.cv2-corner', '.cv2-name', '.cv2-stack', '.cv2-textbox', '.cv2-footer']) {
      expect(block(sel), sel).toContain('var(--u)');
    }
  });

  it('the detail view never clamps', () => {
    expect(block('.card-detail .cv1-face--2 .cv2-textbox')).toMatch(/max-height:\s*none/);
  });
});
