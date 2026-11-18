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
import { PENDING_STARTER_EFFECTS } from '../../src/data/pendingStarterEffects.js';
// @ts-ignore
import { REGISTRY_PENDING } from '../helpers/registryPending.js';
// @ts-ignore
import { PIECIE_REGISTRY } from '../ui/cards/piecie-registry-2-0.js';

const CUT = 'piecie_mp_adjuster'; // cut from Obby 2.0
// Phase 69: the 11 starter Piecies added for 2.1 have no handler or card-test case yet (Phase 71: effect follows the
// new text). They are listed in PENDING_STARTER_EFFECTS and skipped here; remove an id there when its handler lands.
const pending = new Set(PENDING_STARTER_EFFECTS as string[]);
// A card is skipped for the row check while its card id is in REGISTRY_PENDING; archived (disabled) cards need no row.
const rowPending = new Set(REGISTRY_PENDING as string[]);
const live = (PIECIES as any[]).filter((p) => p.id !== CUT && !pending.has(p.effectId));
const dir = join(__dirname, '..', '..', 'src', 'abilities', 'piecie');
const sectionText = readdirSync(dir).filter((f) => f.endsWith('Piecies.js')).map((f) => readFileSync(join(dir, f), 'utf8')).join('\n');

describe('Piecie coverage (EFX-02)', () => {
  it('the Piecies with an effect and the pending 2.1 starter Piecies are counted from the data', () => {
    const all = (PIECIES as any[]).filter((p) => p.id !== CUT);
    expect(live.length).toBeGreaterThan(0);
    expect(live.length + all.filter((p) => pending.has(p.effectId)).length).toBe(all.length);
  });

  it('every Piecie has at least one headless card-test case in the registry', () => {
    const have = new Set((PIECIE_REGISTRY as any[]).filter((r) => r.cases?.length).map((r) => r.piecie));
    expect(live.filter((p) => !p.disabled && !rowPending.has(p.id) && !have.has(p.id)).map((p) => p.id)).toEqual([]);
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
