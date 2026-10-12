// SHELL-04 guard: every test.fixme / test.skip / it.skip / describe.skip names the later card phase (58-60) and a reason.
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const TESTS = join(__dirname, '..');
const SKIP_DIRS = new Set(['node_modules', '_archive', 'screenshots']);
const MARKER = /\b(test\.fixme|test\.skip|it\.skip|describe\.skip)\s*\(/;
const SELF = 'fixme-reasons.test.ts';

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    if (SKIP_DIRS.has(n)) return [];
    const p = join(dir, n);
    if (statSync(p).isDirectory()) return walk(p);
    return /\.(js|ts)$/.test(n) && n !== SELF ? [p] : [];
  });
}

describe('SHELL-04: every fixme/skip names Phase 58-60 and a reason', () => {
  it('no un-owned fixme or skip in tests/', () => {
    const offenders: string[] = [];
    for (const f of walk(TESTS)) {
      const lines = readFileSync(f, 'utf8').split('\n');
      lines.forEach((line, i) => {
        if (!MARKER.test(line)) return;
        // Environment viewers (WATCH=1) and the registry-driven skipReason runner are not parked game rules;
        // the registry reasons are checked in the second test.
        if (/process\.env/.test(line) || /spec\.skipReason\)/.test(line)) return;
        const window = lines.slice(Math.max(0, i - 3), i + 1).join('\n');
        const m = window.match(/Phase (58|59|60)\b[^\n]*?[:,)\s-]+\s*([^\n]*)/);
        const reason = m ? m[2].trim() : '';
        if (!m || reason.length < 10) offenders.push(`${f.replace(TESTS, 'tests')}:${i + 1}  ${line.trim().slice(0, 90)}`);
      });
    }
    expect(offenders).toEqual([]);
  });

  it('every card-registry skipReason has a real reason (>= 10 chars) and names no V4 rule', () => {
    const src = readFileSync(join(TESTS, 'ui', 'cards', 'card-registry.js'), 'utf8');
    const reasons = [...src.matchAll(/skipReason:\s*'([^']*)'/g)].map((m) => m[1]);
    expect(reasons.length).toBeGreaterThan(0);
    for (const r of reasons) {
      expect(r.length, r).toBeGreaterThanOrEqual(10);
      expect(r, r).not.toMatch(/questPrepBonus|persistUntilEndOfTurn|V4 rule/);
    }
  });
});
