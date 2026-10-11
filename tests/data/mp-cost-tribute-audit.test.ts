// No-MP-currency guard (Phase 54-04, RULE-01): MP is never spent. Static scan of the
// engine, abilities, bot and main.js so no stray path charges MP again.
// (File name kept from the V4 tribute audit it replaces.)
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
// @ts-expect-error — JS module, no type declarations
import { PIECIES } from '../../src/data/piecies.js';

const ROOT = join(__dirname, '..', '..');

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.js') ? [p] : [];
  });
}

const files = [
  ...walk(join(ROOT, 'src', 'engine')),
  ...readdirSync(join(ROOT, 'src', 'abilities')).filter((f) => f.endsWith('.js')).map((f) => join(ROOT, 'src', 'abilities', f)),
  ...walk(join(ROOT, 'src', 'bot')),
  join(ROOT, 'src', 'main.js'),
];

function codeLines(): { file: string; n: number; line: string }[] {
  return files.flatMap((file) =>
    readFileSync(file, 'utf8').split('\n')
      .map((line, i) => ({ file: file.replace(ROOT, ''), n: i + 1, line }))
      .filter(({ line }) => !line.trim().startsWith('//'))
  );
}

describe('no MP currency guard', () => {
  it('nothing reads .mpCost without the mpcost-read-ok marker', () => {
    const hits = codeLines().filter(({ line }) => /\.mpCost\b/.test(line) && !line.includes('// mpcost-read-ok:'));
    expect(hits.map((h) => `${h.file}:${h.n}`)).toEqual([]);
  });

  it('nothing reads .abilityCost', () => {
    const hits = codeLines().filter(({ line }) => /\.abilityCost\b/.test(line));
    expect(hits.map((h) => `${h.file}:${h.n}`)).toEqual([]);
  });

  it('no loseMP call passes a COST source outside mpManager.js', () => {
    const hits = codeLines().filter(({ file, line }) =>
      !file.split('\\').join('/').endsWith('/src/engine/mpManager.js') && /loseMP\(.*COST/.test(line));
    expect(hits.map((h) => `${h.file}:${h.n}`)).toEqual([]);
  });

  it('the mpCost data field still exists for card faces (decision 5)', () => {
    expect((PIECIES as { mpCost?: number }[]).some((c) => 'mpCost' in c)).toBe(true);
  });
});
