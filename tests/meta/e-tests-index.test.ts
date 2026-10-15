// TEST-01 guard: engine tests E1-E30 (+E7b) each exist by id in tests/**/*.test.ts and none of them sits under a skip.
// An id counts when it is in an it/test/describe title, or in the file's leading "// ... (E29 ...)" header comment
// (the Card List data tests name their E-id there). Ids found only on skipped / todo / fixme tests do NOT count.
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const TESTS = join(__dirname, '..');
const SKIP_DIRS = new Set(['node_modules', '_archive', 'screenshots']);
const SELF = 'e-tests-index.test.ts';
const IDS = [...Array.from({ length: 30 }, (_, i) => `E${i + 1}`), 'E7b'];
const CALL = /\b(it|test|describe)(\.skip|\.todo|\.fixme)?\s*(?:\.each\([^)]*\))?\s*\(\s*(['"`])([^'"`]*)/;
const ID = /\bE(\d+b?)\b/g;

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    if (SKIP_DIRS.has(n)) return [];
    const p = join(dir, n);
    if (statSync(p).isDirectory()) return walk(p);
    return /\.test\.ts$/.test(n) && n !== SELF ? [p] : [];
  });
}

const live = new Map<string, string[]>();
const skipped = new Map<string, string[]>();
const add = (map: Map<string, string[]>, id: string, file: string) => map.set(id, [...(map.get(id) ?? []), file]);

for (const f of walk(TESTS)) {
  const name = f.replace(TESTS, 'tests');
  const lines = readFileSync(f, 'utf8').split('\n');
  for (const line of lines) {
    const m = line.match(CALL);
    if (!m) continue;
    for (const id of m[4].matchAll(ID)) add(m[2] ? skipped : live, `E${id[1]}`, name);
  }
  // Header comment ids count only when the file has no skipped test at all.
  const hasSkip = lines.some((l) => /\b(it|test|describe)\.(skip|todo|fixme)\b/.test(l));
  for (const line of lines.slice(0, 4)) {
    if (!line.startsWith('//')) continue;
    for (const id of line.matchAll(ID)) add(hasSkip ? skipped : live, `E${id[1]}`, name);
  }
}

describe('TEST-01: every engine test E1-E30 (+E7b) exists and runs', () => {
  it.each(IDS)('%s has a live (not skipped) test', (id) => {
    expect(live.get(id) ?? [], `${id} is missing or only skipped (${(skipped.get(id) ?? []).join(', ')})`).not.toHaveLength(0);
  });

  it('no E-id is carried only by skipped tests', () => {
    const onlySkipped = IDS.filter((id) => !live.has(id) && skipped.has(id));
    expect(onlySkipped).toEqual([]);
  });
});
