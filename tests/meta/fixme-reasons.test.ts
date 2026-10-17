// SHELL-04 guard (closed out in Phase 60-08): every test.fixme / test.skip / it.skip / describe.skip names a LATER phase (61+) and a reason.
// Phase 59 and 60 are done, so nothing may be parked on them any more.
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

describe('SHELL-04: every fixme/skip names Phase 61 or later and a reason', () => {
  it('no un-owned fixme or skip in tests/, and none parked on Phase 59 or 60', () => {
    const offenders: string[] = [];
    for (const f of walk(TESTS)) {
      const lines = readFileSync(f, 'utf8').split('\n');
      lines.forEach((line, i) => {
        if (!MARKER.test(line)) return;
        // Environment viewers (WATCH=1) are not parked game rules.
        if (/process\.env/.test(line)) return;
        const window = lines.slice(Math.max(0, i - 3), i + 1).join('\n');
        const m = window.match(/Phase (6[1-9]|[7-9]\d|\d{3,})\b[^\n]*?[:,)\s-]+\s*([^\n]*)/);
        const reason = m ? m[2].trim() : '';
        if (!m || reason.length < 10) offenders.push(`${f.replace(TESTS, 'tests')}:${i + 1}  ${line.trim().slice(0, 90)}`);
      });
    }
    expect(offenders).toEqual([]);
  });

  it('the guard accepts Phase 61+ with a reason and rejects Phase 59 / 60 or a missing reason', () => {
    const accepts = (text: string) => {
      const m = text.match(/Phase (6[1-9]|[7-9]\d|\d{3,})\b[^\n]*?[:,)\s-]+\s*([^\n]*)/);
      return !!m && m[2].trim().length >= 10;
    };
    expect(accepts('// KNOWN GAP (Phase 61): the bot does not use this yet')).toBe(true);
    expect(accepts('// KNOWN GAP (Phase 64): lobby flow is wired with the sim re-point')).toBe(true);
    expect(accepts('// KNOWN GAP (Phase 60): Eendjes Voeren is rewritten with the Place effects')).toBe(false);
    expect(accepts('// KNOWN GAP (Phase 59): a Piecie reason that is long enough')).toBe(false);
    expect(accepts('// KNOWN GAP (Phase 61):')).toBe(false);
    expect(accepts('// parked for later')).toBe(false);
  });
});
