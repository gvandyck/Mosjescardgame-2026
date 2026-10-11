// No-Level-0 guard (Phase 54-08, RULE-02): the 2.0 rules have Levels 1-3 only.
// Static scan of src/**/*.js, tests/**/*.ts, tests/helpers/*.js and tests/ui/**/*.js.
// A line may opt out with a `level0-ok` marker (e.g. a test proving Level 0 input is normalised to 1).
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(__dirname, '..', '..');
const SKIP_DIRS = new Set(['node_modules', '_archive']);
const SELF = 'no-level-zero.test.ts';

const PATTERNS = [
  /\blevel\s*:\s*0\b/,
  /\blevel\s*={2,3}\s*0\b/,
  /\blevel\s*=\s*0\b/,
  /\blevel\s*(\|\||\?\?)\s*0\b/,
];

export function isLevelZeroLine(line: string): boolean {
  const t = line.trim();
  if (t.startsWith('//') || t.startsWith('*') || t.startsWith('/*')) return false;
  if (line.includes('level0-ok')) return false;
  return PATTERNS.some((re) => re.test(line));
}

function walk(dir: string, ext: string[]): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    if (SKIP_DIRS.has(name)) return [];
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return walk(p, ext);
    return ext.some((e) => p.endsWith(e)) && !p.endsWith(SELF) ? [p] : [];
  });
}

describe('no Level 0 guard', () => {
  it('src, vitest tests and helpers contain no Level 0 literal or default', () => {
    const files = [
      ...walk(join(ROOT, 'src'), ['.js']),
      ...walk(join(ROOT, 'tests'), ['.ts']),
      ...walk(join(ROOT, 'tests', 'helpers'), ['.js']),
      ...walk(join(ROOT, 'tests', 'ui'), ['.js']),
    ];
    const hits = [...new Set(files)].flatMap((file) =>
      readFileSync(file, 'utf8').split('\n')
        .map((line, i) => (isLevelZeroLine(line) ? `${file.replace(ROOT, '')}:${i + 1}` : ''))
        .filter(Boolean)
    );
    expect(hits).toEqual([]);
  });

  it('self-check: regex catches Level 0 forms and ignores lookalikes', () => {
    expect(isLevelZeroLine('const s = { level: 0 };')).toBe(true);
    expect(isLevelZeroLine('const l = slot.level || 0;')).toBe(true);
    expect(isLevelZeroLine('const l = slot.level ?? 0;')).toBe(true);
    expect(isLevelZeroLine('if (slot.level === 0) {}')).toBe(true);
    expect(isLevelZeroLine('const s = { level: 10 };')).toBe(false);
    expect(isLevelZeroLine('// Level 0 was V4, level: 0')).toBe(false);
    expect(isLevelZeroLine('f({ level: 0 }) // level0-ok: normalised to 1')).toBe(false);
  });
});
