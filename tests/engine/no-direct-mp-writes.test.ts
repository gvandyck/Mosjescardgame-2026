// MP funnel guard (Phase 54-13, RULE-02/03/09): every relative MP change in a funnelled
// file must go through applyGainToSlot / applyMpLossToSlot. A line may opt out with an
// inline `mp-direct-ok: <reason>` marker (absolute sets, Leipe Swap, V4 clamps).
// 54-14 added the ability/Quest/Snelle files; 54-15 extends FUNNELLED_FILES.
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// 54-15: every MP-writing file outside the funnel modules (src/engine/mp/**, mpManager.js).
function listJs(dir: string): string[] {
  const abs = join(__dirname, '..', '..', dir);
  return readdirSync(abs, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? listJs(`${dir}/${e.name}`) : e.name.endsWith('.js') ? [`${dir}/${e.name}`] : [],
  );
}

const FUNNELLED_FILES = [
  ...listJs('src/abilities'),
  ...listJs('src/bot'),
  'src/engine/turnManager.js',
  'src/engine/gameState.js',
  'src/engine/victoryChecker.js',
  'src/main.js',
];

const PATTERNS = [/\.mp\s*[+-]=/, /\.mp\s*=\s*[^=;]*\.mp\b/];

export function isDirectMpWrite(line: string): boolean {
  const t = line.trim();
  if (t.startsWith('//') || t.startsWith('*') || t.startsWith('/*')) return false;
  if (line.includes('mp-direct-ok:')) return false;
  return PATTERNS.some((re) => re.test(line));
}

describe('MP funnel guard', () => {
  it('flags relative writes and ignores marked / comparison lines', () => {
    expect(isDirectMpWrite('slot.mp += 10;')).toBe(true);
    expect(isDirectMpWrite('s.mp = Math.max(0, s.mp - 5);')).toBe(true);
    expect(isDirectMpWrite('s.mp = 50; // mp-direct-ok: restore')).toBe(false);
    expect(isDirectMpWrite('if (s.mp === 0) return;')).toBe(false);
    expect(isDirectMpWrite('// slot.mp += 10')).toBe(false);
  });

  for (const file of FUNNELLED_FILES) {
    it(`${file} has no unmarked relative .mp write`, () => {
      const lines = readFileSync(join(__dirname, '..', '..', file), 'utf8').split('\n');
      const bad = lines
        .map((l, i) => (isDirectMpWrite(l) ? `${file}:${i + 1}: ${l.trim()}` : null))
        .filter(Boolean);
      expect(bad, bad.join('\n')).toEqual([]);
    });
  }
});
