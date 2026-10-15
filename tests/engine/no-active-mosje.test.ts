// RULE-10 guard: no "first active Mosje" defaults in effects; registry, UI and bot stay in sync.
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
// @ts-expect-error — JS module
import { OWN_TARGET_EFFECT_IDS } from '../../src/engine/targets/ownTargetEffects.js';
// @ts-expect-error — JS module
import { pickBotOwnTarget } from '../../src/bot/strategy/pickBotOwnTarget.js';
// @ts-expect-error — JS module
import { makeEngineState } from '../helpers/makeEngineState.js';

const SRC = join(__dirname, '..', '..', 'src');
const read = (p: string) => readFileSync(join(SRC, p), 'utf8');
const strip = (t: string) => t.split('\n').map((l) => (l.includes('//') ? l.slice(0, l.indexOf('//')) : l)).join('\n');
function walk(d: string): string[] {
  return readdirSync(d).flatMap((n) => {
    const p = join(d, n);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith('.js') ? [p] : [];
  });
}

// Own dedicated pickers (affoe, leipe_swap), tag-only lookups (boosterpackkie).
const EXEMPT = ['effect_affoe', 'effect_leipe_swap', 'effect_boosterpackkie'];

describe('no active-Mosje concept', () => {
  it('no first-active helper in abilities/engine', () => {
    for (const f of [...walk(join(SRC, 'abilities')), ...walk(join(SRC, 'engine'))]) {
      expect(strip(readFileSync(f, 'utf8')), f).not.toMatch(/getFirstActiveSlotIndex|getFirstActiveMosjeTagSlotIndex/);
    }
  });

  it('registry matches the effects that call resolveOwnTargetSlot', () => {
    const used: string[] = [];
    // V4 bodies still in piecieEffects.js, plus the Card List 2.0 section files (piecie/*.js) that pick through
    // resolvePiecieOwnSlot (directly or via gainOwnMosje / ownMosje).
    const files = ['abilities/piecieEffects.js', ...readdirSync(join(SRC, 'abilities', 'piecie'))
      .filter((n) => n.endsWith('Piecies.js')).map((n) => 'abilities/piecie/' + n)];
    for (const file of files) {
      for (const part of strip(read(file)).split(/^export /m)) {
        const name = part.match(/^(?:function|const) (effect_\w+)/)?.[1];
        if (name && /resolveOwnTargetSlot\(|resolvePiecieOwnSlot\(|gainOwnMosje\(|ownMosje\(/.test(part) && !EXEMPT.includes(name)) used.push(name);
      }
    }
    expect([...used].sort()).toEqual([...OWN_TARGET_EFFECT_IDS].sort());
  });

  it('UI and bot use the registry', () => {
    expect(read('main.js')).toContain('PIECIE_TARGETS'); // 59-01: the generic picker reads the target table
    expect(read('bot/botDriver.js')).toContain('OWN_TARGET_EFFECT_IDS');
    expect(read('bot/botDriver.js')).toContain('pickBotOwnTarget(');
  });
});

describe('pickBotOwnTarget', () => {
  const s = (a: any, b: any) =>
    makeEngineState({ players: { player_1: { activeSlots: [a, b] } } });
  const mk = (id: string, mp: number, extra = {}) => ({ cardId: id, mp, level: 1, isDefeated: false, ...extra });
  it('gain effect -> highest MP, tie -> lower slot', () => {
    expect(pickBotOwnTarget(s(mk('mosje_gandoe_wizard', 20), mk('mosje_jeffrey', 60)), 'player_1', 'effect_kannetje_melk')).toBe(1);
    expect(pickBotOwnTarget(s(mk('mosje_gandoe_wizard', 40), mk('mosje_jeffrey', 40)), 'player_1', 'effect_kannetje_melk')).toBe(0);
  });
  it('never a defeated slot', () => {
    expect(pickBotOwnTarget(s(mk('mosje_gandoe_wizard', 99, { isDefeated: true }), mk('mosje_jeffrey', 5)), 'player_1', 'effect_kannetje_melk')).toBe(1);
  });
  it('non-gain effect -> higher Power', () => {
    const a = mk('mosje_gandoe_wizard', 90, { level: 1 });
    const b = mk('mosje_gandoe_wizard', 10, { level: 3 });
    expect(pickBotOwnTarget(s(a, b), 'player_1', 'effect_stripje_bennies')).toBe(1);
  });
});
