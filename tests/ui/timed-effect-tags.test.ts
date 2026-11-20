import { describe, it, expect } from 'vitest';
// @ts-ignore plain js modules
import { makeEngineState } from '../helpers/makeEngineState.js';
// @ts-ignore
import { createMosjeSlot } from '../../src/engine/mp/createMosjeSlot.js';
// @ts-ignore
import { MOSJES } from '../../src/data/mosjes.js';
// @ts-ignore
import { addTimedEffect } from '../../src/engine/durations/addTimedEffect.js';
// @ts-ignore
import { getTimedTotal } from '../../src/engine/durations/getTimedTotal.js';
// @ts-ignore
import { unstoppableTrigger } from '../../src/engine/attack/unstoppableTrigger.js';
// @ts-ignore
import { effect_momentum_boost } from '../../src/abilities/piecie/starter/ctrlS.js';
// @ts-ignore
import { ronaldPhilosoofMark } from '../../src/abilities/mosje/ronaldPhilosoofMark.js';
// @ts-ignore
import { addQuestDiceGrant } from '../../src/engine/quests/addQuestDiceGrant.js';
// @ts-ignore
import { describeTimedEffect } from '../../src/ui/board/describeTimedEffect.js';
// @ts-ignore
import { getTimedEffectTags } from '../../src/ui/board/getTimedEffectTags.js';
// @ts-ignore
import { toMosjeTileCards } from '../../src/ui/board/toMosjeTileCards.js';

const def = (id: string) => MOSJES.find((m: any) => m.id === id);
function stateWith(ids: string[], oppIds: string[] = []) {
  const state = makeEngineState();
  state.players.player_1.activeSlots = ids.map(id => createMosjeSlot(def(id), { level: 1, mp: 30 }));
  state.players.player_2.activeSlots = oppIds.map(id => createMosjeSlot(def(id), { level: 1, mp: 30 }));
  for (const s of [...state.players.player_1.activeSlots, ...state.players.player_2.activeSlots]) delete s.entryProtected;
  return state;
}
const target = (state: any, pid: string, si: number) => ({ playerId: pid, slotIndex: si, cardId: state.players[pid].activeSlots[si].cardId });
const add = (state: any, pid: string, si: number, extra: any) =>
  addTimedEffect(state, { target: target(state, pid, si), ownerId: pid, ...extra });

describe('describeTimedEffect', () => {
  const cases: Array<[any, string]> = [
    [{ kind: 'power', amount: 10, duration: 'untilEndOfYourNextTurn' }, '+10 Power until end of next turn'],
    [{ kind: 'power', amount: 5, duration: 'thisTurn' }, '+5 Power this turn'],
    [{ kind: 'power', amount: 10, duration: 'duringOpponentsNextTurn' }, "+10 Power during opponent's next turn"],
    [{ kind: 'power', amount: 10, duration: 'whileAttached' }, '+10 Power while attached'],
    [{ kind: 'power', amount: 10, duration: 'whilePlaceStays' }, '+10 Power while the Place stays'],
    [{ kind: 'power', amount: -10, duration: 'thisTurn' }, '−10 Power this turn'],
    [{ kind: 'noLevelDrop', amount: 1, duration: 'untilEndOfYourNextTurn' }, "Can't drop a level until end of next turn"],
  ];
  for (const [entry, text] of cases) it(`${entry.kind} ${entry.duration}`, () => expect(describeTimedEffect(entry)).toBe(text));
  it('unknown kind or duration gives empty text and never throws', () => {
    expect(describeTimedEffect({ kind: 'zzz', amount: 1, duration: 'thisTurn' })).toBe('');
    expect(describeTimedEffect({ kind: 'power', amount: 1, duration: 'zzz' })).toBe('');
    expect(describeTimedEffect(null)).toBe('');
    expect(describeTimedEffect({ kind: 'noLevelDrop', amount: 1, duration: 'thisTurn' })).toBe('');
  });
});

describe('getTimedEffectTags', () => {
  it('nothing gives []', () => {
    const state = stateWith(['mosje_alyssa_fissa']);
    expect(getTimedEffectTags(state, 'player_1', 0)).toEqual([]);
    expect(getTimedEffectTags(null, 'player_1', 0)).toEqual([]);
  });

  it("Alyssa's Unstoppable trigger gives the Power tag", () => {
    const state = stateWith(['mosje_alyssa_bulldozer']);
    unstoppableTrigger({ state, targetPlayerId: 'player_1', targetSlotIndex: 0, final: 20 });
    const tags = getTimedEffectTags(state, 'player_1', 0);
    expect(tags.map((t: any) => t.text)).toEqual(['+10 Power until end of next turn']);
    expect(tags[0].kind).toBe('effect');
  });

  it('Ctrl+S gives the level-drop tag on the picked Mosje only', () => {
    const state = stateWith(['mosje_alyssa_fissa', 'mosje_michelle']);
    state._pendingTargets = { own_slot_index: 1 };
    const next = effect_momentum_boost(state, 'player_1');
    expect(getTimedEffectTags(next, 'player_1', 1).map((t: any) => t.text)).toEqual(["Can't drop a level until end of next turn"]);
    expect(getTimedEffectTags(next, 'player_1', 0)).toEqual([]);
  });

  it("Ronald Dr. Phill-osoof's mark shows on the target only", () => {
    const state = stateWith(['mosje_ronald_mastermind'], ['mosje_alyssa_fissa', 'mosje_michelle']);
    state._pendingTargets = { opp_slot_index: 1 };
    const next = ronaldPhilosoofMark(state, 'player_1');
    expect(getTimedEffectTags(next, 'player_2', 1).map((t: any) => t.text)).toEqual(['Rolls 1 die less on its next Quest']);
    expect(getTimedEffectTags(next, 'player_2', 0)).toEqual([]);
    expect(getTimedEffectTags(next, 'player_1', 0)).toEqual([]);
  });

  it('die grants: plus wording, singular, and a grant without slot is not shown', () => {
    const state = stateWith(['mosje_alyssa_fissa']);
    const cardId = state.players.player_1.activeSlots[0].cardId;
    addQuestDiceGrant(state, 'player_1', { amount: 2, lasts: 'untilUsed', slotIndex: 0, cardId });
    addQuestDiceGrant(state, 'player_1', { amount: 1, lasts: 'untilUsed', slotIndex: 0, cardId });
    addQuestDiceGrant(state, 'player_1', { amount: 3, lasts: 'thisTurn' });
    expect(getTimedEffectTags(state, 'player_1', 0).map((t: any) => t.text)).toEqual([
      'Rolls 2 more dice on its next Quest', 'Rolls 1 more die on its next Quest',
    ]);
  });

  it('Blensen shield shows on every Mosje of its owner, this turn only', () => {
    const state = stateWith(['mosje_alyssa_fissa', 'mosje_michelle'], ['mosje_jeffrey']);
    state.blensenShield = { playerId: 'player_1', turnNumber: state.turnNumber };
    for (const si of [0, 1]) {
      const tags = getTimedEffectTags(state, 'player_1', si);
      expect(tags.map((t: any) => t.text)).toEqual(['Shielded from cards this turn']);
      expect(tags[0].kind).toBe('shield');
    }
    expect(getTimedEffectTags(state, 'player_2', 0)).toEqual([]);
    state.turnNumber += 1;
    expect(getTimedEffectTags(state, 'player_1', 0)).toEqual([]);
  });

  it('order: timed effects, die grants, shield; inactive and foreign effects are left out', () => {
    const state = stateWith(['mosje_alyssa_fissa', 'mosje_michelle']);
    const cardId = state.players.player_1.activeSlots[0].cardId;
    add(state, 'player_1', 0, { kind: 'power', amount: 10, duration: 'thisTurn' });
    add(state, 'player_1', 1, { kind: 'power', amount: 5, duration: 'thisTurn' });
    add(state, 'player_1', 0, { kind: 'power', amount: 5, duration: 'duringOpponentsNextTurn' }); // active:false until their turn
    addQuestDiceGrant(state, 'player_1', { amount: -1, lasts: 'untilUsed', slotIndex: 0, cardId });
    state.blensenShield = { playerId: 'player_1', turnNumber: state.turnNumber };
    expect(getTimedEffectTags(state, 'player_1', 0).map((t: any) => t.text)).toEqual([
      '+10 Power this turn', 'Rolls 1 die less on its next Quest', 'Shielded from cards this turn',
    ]);
  });

  it('whileAttached needs the attachment, whilePlaceStays needs the Place (same rule as getTimedTotal)', () => {
    const state = stateWith(['mosje_alyssa_fissa']);
    add(state, 'player_1', 0, { kind: 'power', amount: 10, duration: 'whileAttached', tie: 'piecie_dumbbells' });
    add(state, 'player_1', 0, { kind: 'power', amount: 5, duration: 'whilePlaceStays', tie: 'place_x' });
    expect(getTimedEffectTags(state, 'player_1', 0)).toEqual([]);
    expect(getTimedTotal(state, 'player_1', 0, 'power')).toBe(0);
    state.players.player_1.activeSlots[0].attachments = [{ cardId: 'piecie_dumbbells' }];
    state.activePlace = 'place_x';
    expect(getTimedEffectTags(state, 'player_1', 0).map((t: any) => t.text)).toEqual(['+10 Power while attached', '+5 Power while the Place stays']);
    expect(getTimedTotal(state, 'player_1', 0, 'power')).toBe(15);
  });
});

describe('toMosjeTileCards', () => {
  it('adds tags to each live tile', () => {
    const state = stateWith(['mosje_alyssa_fissa', 'mosje_michelle']);
    add(state, 'player_1', 1, { kind: 'power', amount: 10, duration: 'thisTurn' });
    const tiles = toMosjeTileCards(state, 'player_1');
    expect(tiles[0].tags).toEqual([]);
    expect(tiles[1].tags.map((t: any) => t.text)).toEqual(['+10 Power this turn']);
  });
});
