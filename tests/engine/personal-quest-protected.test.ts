// Phase 70-06 (D-06): an opponent's effect never discards, takes or sets aside a Personal Quest in a hand;
// the owner's own discards may.
import { describe, it, expect } from 'vitest';
// @ts-ignore JS module
import { isOpponentProof } from '../../src/engine/hand/isOpponentProof.js';
// @ts-ignore JS module
import { opponentPickableHand } from '../../src/engine/hand/opponentPickableHand.js';
// @ts-ignore JS module
import { discardFromHand } from '../../src/engine/hand/discardFromHand.js';
// @ts-ignore JS module
import { effect_jantje_jantje } from '../../src/abilities/piecie/attackRevealPiecies.js';
// @ts-ignore JS module
import { effect_stookerino } from '../../src/abilities/piecie/utilityDrawPiecies.js';
// @ts-ignore JS module
import { bintiDiscardChoice } from '../../src/abilities/mosje/bintiDiscardChoice.js';
// @ts-ignore JS module
import { discardChoice } from '../../src/abilities/piecie/discardChoice.js';
// @ts-ignore JS module
import { useMosjeAbility } from '../../src/engine/turnManager.js';
// @ts-ignore JS module
import { makeEngineState } from '../helpers/makeEngineState.js';
// @ts-ignore JS module
import { mkSlot, byName } from '../helpers/quest56.js';

const PQ = { cardId: 'pq_charge', type: 'PERSONAL_QUEST' };
const PIECIE = { cardId: 'piecie_affoe', type: 'PIECIE' };
const ids = (hand: any[]) => hand.map((c) => c.cardId);

const board = (oppHand: any[], extra: any = {}) => makeEngineState({
  turnNumber: 5,
  players: {
    player_1: { energy: 6, activeSlots: [mkSlot({ mp: 50 }), null], piecieSlots: [{ cardId: 'piecie_stookerino', type: 'PIECIE', faceDown: true }, null, null], ...extra },
    player_2: { hand: oppHand, activeSlots: [mkSlot({ mp: 40 }), null] },
  },
});

describe('hand helpers', () => {
  it('isOpponentProof is true for a Personal Quest only', () => {
    expect(isOpponentProof(PQ)).toBe(true);
    expect(isOpponentProof(PIECIE)).toBe(false);
    expect(isOpponentProof(undefined)).toBe(false);
  });
  it('opponentPickableHand returns the indexes that are not Personal Quests', () => {
    expect(opponentPickableHand([PQ, PIECIE, PQ, PIECIE])).toEqual([1, 3]);
    expect(opponentPickableHand([PQ])).toEqual([]);
  });
  it('discardFromHand refuses a Personal Quest for another player, allows it for the owner', () => {
    const s = board([PQ, PIECIE]);
    expect(discardFromHand(s, 'player_2', 0, { byPlayerId: 'player_1' })).toBeNull();
    expect(ids(s.players.player_2.hand)).toEqual(['pq_charge', 'piecie_affoe']);
    expect(s.players.player_2.graveyard).toHaveLength(0);
    const own = discardFromHand(s, 'player_2', 0, { byPlayerId: 'player_2' });
    expect(own.cardId).toBe('pq_charge');
    expect(ids(s.players.player_2.hand)).toEqual(['piecie_affoe']);
    expect(s.players.player_2.graveyard.map((e: any) => e.cardId)).toEqual(['pq_charge']);
    const other = discardFromHand(s, 'player_2', 0, { byPlayerId: 'player_1' });
    expect(other.cardId).toBe('piecie_affoe');
    expect(discardFromHand(s, 'player_2', 5, {})).toBeNull();
  });
});

describe('Jantje Jantje (name a card, discard it from the opponent hand)', () => {
  const run = (hand: any[], label: string) => {
    const s = board(hand);
    s.players.player_1._pendingTargets = { jantje_name: { label, cardId: 'x' } };
    return effect_jantje_jantje(s, 'player_1', { jantjeSlot: 0 });
  };
  it('naming the Personal Quest is a miss: it stays in hand', () => {
    const r = run([PQ, PIECIE], 'Charge!');
    expect(ids(r.players.player_2.hand)).toEqual(['pq_charge', 'piecie_affoe']);
    expect(r.players.player_1.activeSlots[0].mp).toBeLessThan(50); // the miss still costs MP
  });
  it('naming a Piecie still hits it', () => {
    const r = run([PQ, PIECIE], 'Affoe');
    expect(ids(r.players.player_2.hand)).toEqual(['pq_charge']);
  });
});

describe('Stookerino (discard a chosen card from the opponent hand)', () => {
  it('the options skip the Personal Quest', () => {
    const r = effect_stookerino(board([PQ, PIECIE]), 'player_1', { stookSlot: 0 });
    expect(r.needChoice.options.map((o: any) => o.cardId)).toEqual(['piecie_affoe']);
  });
  it('a forged pick of the Personal Quest discards nothing', () => {
    const s = board([PQ, PIECIE]);
    s.players.player_1._pendingTargets = { stook_card: { label: 'Charge!', cardId: 'pq_charge' } };
    const r = effect_stookerino(s, 'player_1', { stookSlot: 0 });
    expect(ids(r.players.player_2.hand)).toEqual(['pq_charge', 'piecie_affoe']);
  });
  it('with only a Personal Quest in hand there is no pause and nothing is discarded', () => {
    const r = effect_stookerino(board([PQ]), 'player_1', { stookSlot: 0 });
    expect(r.needChoice).toBeUndefined();
    expect(ids(r.players.player_2.hand)).toEqual(['pq_charge']);
  });
});

describe("Binti's Cutting Words (the opponent discards a card of their choice)", () => {
  const run = (hand: any[], pick?: any) => {
    const s = board(hand);
    if (pick) s.players.player_2._pendingTargets = { binti_discard_card: pick };
    return bintiDiscardChoice.run(s, { playerId: 'player_1', discarderId: 'player_2' });
  };
  it('the choice list does not contain the Personal Quest', () => {
    const r = run([PQ, PIECIE]);
    expect(r.needChoice.options.map((o: any) => o.cardId)).toEqual(['piecie_affoe']);
  });
  it('with only a Personal Quest in hand there is no pause and nothing is discarded', () => {
    const r = run([PQ]);
    expect(r.needChoice).toBeUndefined();
    expect(ids(r.players.player_2.hand)).toEqual(['pq_charge']);
    expect(r.players.player_2.graveyard).toHaveLength(0);
  });
  it('a forged answer naming the Personal Quest is refused', () => {
    const r = run([PQ, PIECIE], { label: 'Charge!', cardId: 'pq_charge' });
    expect(ids(r.players.player_2.hand)).toEqual(['pq_charge', 'piecie_affoe']);
    expect(r.players.player_2.graveyard).toHaveLength(0);
  });
  it('a legal answer discards the chosen Piecie', () => {
    const r = run([PQ, PIECIE], { label: 'Affoe', cardId: 'piecie_affoe' });
    expect(ids(r.players.player_2.hand)).toEqual(['pq_charge']);
    expect(r.players.player_2.graveyard.map((e: any) => e.cardId)).toEqual(['piecie_affoe']);
  });
});

describe('the owner can discard their own Personal Quest', () => {
  it('discardChoice offers it and discards it', () => {
    const s = board([], { hand: [PQ] });
    const asked = discardChoice(s, 'player_1', 'k');
    expect(asked.needChoice.options.map((o: any) => o.cardId)).toEqual(['pq_charge']);
    s.players.player_1._pendingTargets = { k: { label: 'Charge!', cardId: 'pq_charge' } };
    const done = discardChoice(s, 'player_1', 'k');
    expect(ids(done.players.player_1.hand)).toEqual([]);
    expect(done.players.player_1.graveyard.map((e: any) => e.cardId)).toEqual(['pq_charge']);
  });
});
