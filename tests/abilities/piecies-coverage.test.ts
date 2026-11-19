// Phase 59-08: coverage guard - every Obby 2.0 Piecie has a Card List body in a section file and a card-test case.
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
// @ts-ignore JS modules
import { PIECIES } from '../../src/data/piecies.js';
// @ts-ignore
import * as piecieEffects from '../../src/abilities/piecieEffects.js';
// @ts-ignore
import { getCopyLimit } from '../../src/data/getCopyLimit.js';
// @ts-ignore
import { PIECIE_REGISTRY } from '../ui/cards/piecie-registry-2-0.js';

const CUT = 'piecie_mp_adjuster'; // cut from Obby 2.0
// Every Piecie except the cut one counts; archived (disabled) cards need no row.
const live = (PIECIES as any[]).filter((p) => p.id !== CUT);
const dir = join(__dirname, '..', '..', 'src', 'abilities', 'piecie');
// Every .js file under src/abilities/piecie/, sub-folders included (Phase 71: starter/ holds one effect per file).
const jsFiles = (d: string): string[] => readdirSync(d, { withFileTypes: true })
  .flatMap((e) => (e.isDirectory() ? jsFiles(join(d, e.name)) : e.name.endsWith('.js') ? [join(d, e.name)] : []));
const sectionText = jsFiles(dir).map((f) => readFileSync(f, 'utf8')).join('\n');

describe('Piecie coverage (EFX-02)', () => {
  it('the Piecies are counted from the data', () => {
    expect(live.length).toBeGreaterThan(0);
  });

  it('every Piecie has at least one headless card-test case in the registry', () => {
    const have = new Set((PIECIE_REGISTRY as any[]).filter((r) => r.cases?.length).map((r) => r.piecie));
    expect(live.filter((p) => !p.disabled && !have.has(p.id)).map((p) => p.id)).toEqual([]);
  });

  it('every effectId is exported by piecieEffects.js and defined in a src/abilities/piecie/*Piecies.js section file', () => {
    const missing = live.filter((p) =>
      typeof (piecieEffects as any)[p.effectId] !== 'function'
      || !new RegExp(`export (?:function|const) ${p.effectId}\\b`).test(sectionText)).map((p) => p.id);
    expect(missing).toEqual([]);
  });

  it('five-star Piecies and Mosje Reborn (The Protector is not a Piecie in the data) are limit 1 per deck', () => {
    const one = live.filter((p) => (String(p.rarity).match(/★/g) || []).length >= 5 || p.id === 'piecie_mosje_reborn');
    expect(one.length).toBeGreaterThanOrEqual(2);
    expect(one.filter((p) => getCopyLimit(p) !== 1).map((p) => p.id)).toEqual([]);
  });
});
