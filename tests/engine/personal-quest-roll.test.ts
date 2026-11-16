// @ts-nocheck
// Phase 70-08 (D-02, D-03, D-15): who may attempt a Personal Quest, how many dice it rolls, when the roll wins.
import { describe, it, expect } from 'vitest';
import { makeEngineState } from '../helpers/makeEngineState.js';
import { mkSlot, byName } from '../helpers/quest56.js';
import { canAttemptPersonalQuest } from '../../src/engine/personalQuests/canAttemptPersonalQuest.js';
import { isPersonalQuestWin } from '../../src/engine/personalQuests/isPersonalQuestWin.js';
import { getPersonalQuestDice } from '../../src/engine/personalQuests/getPersonalQuestDice.js';
import { getPersonalQuestDef } from '../../src/engine/personalQuests/getPersonalQuestDef.js';
import { pqRollTrait } from '../../src/engine/personalQuests/pqRollTrait.js';
import { startTurn } from '../../src/engine/turnManager.js';

const pq = (cardId = 'pq_charge') => ({ cardId, type: 'PERSONAL_QUEST' });
const phys = (over = {}) => mkSlot({ level: 3, mp: 60, subtype: 'PHYSICAL', levelAtTurnStart: 3, ...over });
function build({ slot = phys(), hand = [pq()], p1 = {}, top = {} } = {}) {
  return makeEngineState({
    turnNumber: 5,
    players: { player_1: { activeSlots: [slot, null], hand, ...p1 }, player_2: { activeSlots: [mkSlot({ mp: 40 }), null] } },
    ...top,
  });
}
const can = (s, o = {}) => canAttemptPersonalQuest(s, 'player_1', { cardId: 'pq_charge', slotIndex: 0, ...o });

describe('canAttemptPersonalQuest (D-02)', () => {
  it('the legal case', () => {
    expect(can(build())).toEqual({ ok: true });
  });
  it('the card is not in the hand', () => {
    const r = can(build({ hand: [] }));
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/hand/i);
  });
  it('the card is not a Personal Quest', () => {
    const r = canAttemptPersonalQuest(build({ hand: [{ cardId: 'piecie_dumbbells', type: 'PIECIE' }] }), 'player_1', { cardId: 'piecie_dumbbells', slotIndex: 0 });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/Personal Quest/i);
  });
  it('not the player turn', () => {
    const r = can(build({ top: { activePlayerId: 'player_2' } }));
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/turn/i);
  });
  it('a cooldown turn', () => {
    const r = can(build({ p1: { cooldownTurn: true } }));
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/cooldown/i);
  });
  it('Level 2', () => {
    const r = can(build({ slot: phys({ level: 2, levelAtTurnStart: 2 }) }));
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/Level 3/);
  });
  it('sideways', () => {
    const r = can(build({ slot: phys({ sideways: true }) }));
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/cannot act/i);
  });
  it('fresh', () => {
    const r = can(build({ slot: phys({ entryProtected: true }) }));
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/fresh/i);
  });
  it('already acted this turn', () => {
    const r = can(build({ slot: phys({ actedThisTurn: true }) }));
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/already acted/i);
  });
  it('wrong Mosje type', () => {
    const r = can(build({ slot: phys({ subtype: 'DIGITAL' }) }));
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/type/i);
  });
  it('the designed-for Mosje is not required: any Level 3 Physical Mosje may attempt', () => {
    expect(can(build({ slot: phys({ cardId: 'mosje_somebody_else' }) })).ok).toBe(true);
  });
  it('levelled up this turn (started at Level 2)', () => {
    const r = can(build({ slot: phys({ levelAtTurnStart: 2 }) }));
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/started this turn at Level 3/i);
  });
  it('a Mosje with no start-of-turn record (summoned this turn) is refused', () => {
    const slot = phys();
    delete slot.levelAtTurnStart;
    expect(can(build({ slot })).ok).toBe(false);
  });
  it('Needs false: the reason comes from checkNeeds', () => {
    const r = can(build({ slot: phys({ mp: 30 }) }));
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/31\+ MP/);
  });
  it('Pay cannot be paid: exactly 30 MP leaves 0 (the MP-cost floor), with Needs lifted', () => {
    const def = getPersonalQuestDef('pq_charge');
    const original = def.needs;
    def.needs = [];
    try {
      const r = can(build({ slot: phys({ mp: 30 }) }));
      expect(r.ok).toBe(false);
      expect(r.error).toMatch(/30 MP/);
      expect(can(build({ slot: phys({ mp: 35 }) })).ok).toBe(true);
    } finally { def.needs = original; }
  });
  it('Pay: Aloha Tech Support with 1 Energy', () => {
    const slot = mkSlot({ level: 3, mp: 60, subtype: 'DIGITAL', levelAtTurnStart: 3 });
    const hand = [pq('pq_aloha_tech_support'), ...Array.from({ length: 5 }, () => ({ cardId: 'piecie_affoe', type: 'PIECIE' }))];
    const gear = { cardId: 'piecie_dumbbells', type: 'PIECIE', faceDown: true, activated: false, playedOnTurn: 1, canActivateOnTurn: 1 };
    const s = build({ slot, hand, p1: { energy: 1, piecieSlots: [gear, null, null] } });
    const r = canAttemptPersonalQuest(s, 'player_1', { cardId: 'pq_aloha_tech_support', slotIndex: 0 });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/Energy/i);
    s.players.player_1.energy = 2;
    expect(canAttemptPersonalQuest(s, 'player_1', { cardId: 'pq_aloha_tech_support', slotIndex: 0 }).ok).toBe(true);
  });
});

describe('startTurn records the level at turn start', () => {
  it('on every Mosje of the active player', () => {
    const s = build({ slot: mkSlot({ level: 2, mp: 40 }, byName(/Alyssa/)) });
    const after = startTurn(s);
    expect(after.players.player_1.activeSlots[0].levelAtTurnStart).toBe(2);
  });
});

describe('isPersonalQuestWin', () => {
  const two4 = { count: 2, face: 4, orHigher: true };
  it('2x 4+', () => {
    expect(isPersonalQuestWin(two4, [4, 6, 1])).toBe(true);
    expect(isPersonalQuestWin(two4, [4, 3, 3])).toBe(false);
  });
  it('1x exactly 6', () => {
    const six = { count: 1, face: 6, orHigher: false };
    expect(isPersonalQuestWin(six, [1, 6])).toBe(true);
    expect(isPersonalQuestWin(six, [5, 5])).toBe(false);
  });
  it('any 2 the same', () => {
    const same = { count: 2, face: null, orHigher: false, anySame: true };
    expect(isPersonalQuestWin(same, [2, 5, 2])).toBe(true);
    expect(isPersonalQuestWin(same, [1, 2, 3])).toBe(false);
  });
  it('an empty roll fails', () => {
    expect(isPersonalQuestWin(two4, [])).toBe(false);
  });
});

describe('getPersonalQuestDice', () => {
  const dice = (cardId, slot, state = build({ slot }), extra = {}) =>
    getPersonalQuestDice(state, 'player_1', slot, getPersonalQuestDef(cardId), extra);
  it('maps the trait', () => {
    expect(pqRollTrait(getPersonalQuestDef('pq_charge'))).toBe('strength');
    expect(pqRollTrait(getPersonalQuestDef('pq_vibe_coded'))).toBe('technical');
    expect(pqRollTrait(getPersonalQuestDef('pq_beginners_luck'))).toBe('artistic');
  });
  it('1 die per star, minimum 1', () => {
    expect(dice('pq_charge', phys({ traits: { strength: 3 } }))).toBe(3);
    expect(dice('pq_charge', phys({ traits: { strength: 0 } }))).toBe(1);
  });
  it('Gym adds a die on a Str roll only', () => {
    const slot = phys({ traits: { strength: 2, technical: 2 } });
    expect(dice('pq_charge', slot, build({ slot, top: { activePlace: 'place_the_gym' } }))).toBe(3);
    expect(dice('pq_vibe_coded', slot, build({ slot, top: { activePlace: 'place_the_gym' } }))).toBe(2);
  });
  it('questExtraDice adds', () => {
    const slot = phys({ traits: { strength: 2 } });
    expect(dice('pq_charge', slot, build({ slot, p1: { questExtraDice: 2 } }))).toBe(4);
  });
  it('High Roller: 1 die per 2 Energy paid', () => {
    const slot = phys({ traits: { artistic: 1 } });
    expect(dice('pq_high_roller', slot, build({ slot }), { energyPaid: 4 })).toBe(3);
    expect(dice('pq_high_roller', slot, build({ slot }), { energyPaid: 3 })).toBe(2);
    expect(dice('pq_high_roller', slot, build({ slot }), { energyPaid: 0 })).toBe(1);
  });
  it('never more than 6', () => {
    const slot = phys({ traits: { artistic: 3 } });
    expect(dice('pq_high_roller', slot, build({ slot }), { energyPaid: 12 })).toBe(6);
  });
});
