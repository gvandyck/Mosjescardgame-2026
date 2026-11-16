// Phase 70-06 (D-07, D-19): one generic Needs checker with a reason when a Need is false.
import { describe, it, expect } from 'vitest';
// @ts-ignore JS module
import { checkNeeds } from '../../src/engine/needs/checkNeeds.js';
// @ts-ignore JS module
import { makeEngineState } from '../helpers/makeEngineState.js';
// @ts-ignore JS module
import { mkSlot, byName } from '../helpers/quest56.js';
// @ts-ignore JS module
import { applyMpLossToSlot } from '../../src/engine/mp/applyMpLossToSlot.js';
// @ts-ignore JS module
import { payMpCost } from '../../src/engine/costs/payMpCost.js';
// @ts-ignore JS module
import { startTurn } from '../../src/engine/turnManager.js';

const card = (cardId: string, type = 'PIECIE') => ({ cardId, type });
const placed = (cardId: string, canActivateOnTurn = 1) => ({ cardId, type: 'PIECIE', faceDown: true, activated: false, playedOnTurn: 1, canActivateOnTurn });
const base = (p1: any = {}, p2: any = {}, top: any = {}) => makeEngineState({
  turnNumber: 5,
  players: { player_1: { activeSlots: [mkSlot({ mp: 60, level: 3 }), null], ...p1 }, player_2: { activeSlots: [mkSlot({ mp: 40 }), null], ...p2 } },
  ...top,
});
const ctx = (state: any, extra: any = {}) => ({ state, playerId: 'player_1', slotIndex: 0, cardId: 'pq_x', ...extra });
const ok = (state: any, needs: any[], extra: any = {}) => checkNeeds(ctx(state, extra), needs);

describe('checkNeeds', () => {
  it('an empty list is ok; an unknown kind is not', () => {
    expect(ok(base(), []).ok).toBe(true);
    const r = ok(base(), [{ kind: 'nonsense' }]);
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/nonsense/);
  });
  it('placeInPlay', () => {
    const need = [{ kind: 'placeInPlay', placeId: 'place_the_gym' }];
    expect(ok(base({}, {}, { activePlace: 'place_the_gym' }), need).ok).toBe(true);
    const r = ok(base({}, {}, { activePlace: 'place_skiffa' }), need);
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('Needs: Gym in play');
  });
  it('mosjeMinMP', () => {
    const need = [{ kind: 'mosjeMinMP', amount: 61 }];
    expect(ok(base(), need).ok).toBe(false);
    expect(ok(base(), need).reason).toMatch(/61\+ MP/);
    expect(ok(base(), [{ kind: 'mosjeMinMP', amount: 60 }]).ok).toBe(true);
  });
  it('mosjesOnField', () => {
    const need = [{ kind: 'mosjesOnField', count: 2 }];
    expect(ok(base(), need).ok).toBe(false);
    const two = base({ activeSlots: [mkSlot({ mp: 60 }), mkSlot({ mp: 30 })] });
    expect(ok(two, need).ok).toBe(true);
    two.players.player_1.activeSlots[1].isDefeated = true;
    expect(ok(two, need).ok).toBe(false);
  });
  it('handSizeOther counts the hand without the card itself', () => {
    const need = [{ kind: 'handSizeOther', count: 5 }];
    const hand = (n: number) => [card('pq_x', 'PERSONAL_QUEST'), ...Array.from({ length: n }, () => card('piecie_affoe'))];
    expect(ok(base({ hand: hand(5) }), need).ok).toBe(true);
    const r = ok(base({ hand: hand(4) }), need);
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/5/);
  });
  it('opponentHandMax uses the opponent hand size', () => {
    const need = [{ kind: 'opponentHandMax', count: 2 }];
    expect(ok(base({}, { hand: [card('a'), card('b')] }), need).ok).toBe(true);
    expect(ok(base({}, { hand: [card('a'), card('b'), card('c')] }), need).ok).toBe(false);
  });
  describe('readyPiecie', () => {
    const gear = [{ kind: 'readyPiecie', tag: 'gear', count: 1 }];
    it('counts a ready face-down gear card', () => {
      const r = ok(base({ piecieSlots: [placed('piecie_dumbbells'), null, null] }), gear);
      expect(r.ok).toBe(true);
      expect(r.picks.readyPiecies).toEqual([{ zone: 'slot', slotIndex: 0, cardId: 'piecie_dumbbells' }]);
    });
    it('counts an attached gear card', () => {
      const s = base();
      s.players.player_1.activeSlots[0].attachments = [{ cardId: 'piecie_rugbybal', attachedTurn: 2 }];
      const r = ok(s, gear);
      expect(r.ok).toBe(true);
      expect(r.picks.readyPiecies[0].zone).toBe('attached');
    });
    it('does not count a Piecie placed this turn, or the wrong tag', () => {
      const r = ok(base({ piecieSlots: [placed('piecie_dumbbells', 6), placed('piecie_kannetje_melk'), null] }), gear);
      expect(r.ok).toBe(false);
      expect(r.reason).toMatch(/gear/);
    });
    it('by name', () => {
      const need = [{ kind: 'readyPiecie', name: 'piecie_ronald_kip', count: 1 }];
      expect(ok(base({ piecieSlots: [placed('piecie_ronald_kip'), null, null] }), need).ok).toBe(true);
      expect(ok(base({ piecieSlots: [placed('piecie_dumbbells'), null, null] }), need).ok).toBe(false);
    });
    it('the choice names which ones when they qualify, otherwise it is refused', () => {
      const s = base({ piecieSlots: [placed('piecie_dumbbells'), placed('piecie_rugbybal'), null] });
      const pick = ok(s, gear, { choice: { readyPiecies: [{ zone: 'slot', slotIndex: 1, cardId: 'piecie_rugbybal' }] } });
      expect(pick.ok).toBe(true);
      expect(pick.picks.readyPiecies).toEqual([{ zone: 'slot', slotIndex: 1, cardId: 'piecie_rugbybal' }]);
      const bad = ok(s, gear, { choice: { readyPiecies: [{ zone: 'slot', slotIndex: 2, cardId: 'piecie_rugbybal' }] } });
      expect(bad.ok).toBe(false);
    });
  });
  describe('mosjeLostMPSinceLastTurnStart', () => {
    const need = [{ kind: 'mosjeLostMPSinceLastTurnStart' }];
    const bump = (s: any) => { s.players.player_1.deck = [card('piecie_affoe'), card('piecie_affoe'), card('piecie_affoe')]; return s; };
    const lv2 = () => base({ activeSlots: [mkSlot({ mp: 60, level: 2 }, byName(/Ronald, The Master Chef/)), null] });
    const nextOwnTurn = (s: any) => { s.activePlayerId = 'player_1'; s.turnNumber += 2; return startTurn(bump(s), 'player_1'); };
    it('false when nothing was lost', () => {
      expect(ok(base(), need).ok).toBe(false);
      expect(ok(base(), need).reason).toMatch(/lost MP/);
    });
    it('true after an MP loss this turn, and after a paid MP cost', () => {
      const s = base();
      applyMpLossToSlot({ state: s, playerId: 'player_1', slot: s.players.player_1.activeSlots[0], amount: 5, source: 'test' });
      expect(ok(s, need).ok).toBe(true);
      const t = base();
      payMpCost(t.players.player_1.activeSlots[0], 5);
      expect(ok(t, need).ok).toBe(true);
    });
    it('true for a loss since my last turn started (the next own turn still sees it)', () => {
      let s = nextOwnTurn(lv2());
      payMpCost(s.players.player_1.activeSlots[0], 5);
      s = nextOwnTurn(s);
      expect(ok(s, need).ok).toBe(true);
    });
    it('false when the last loss is older than the start of my last turn', () => {
      let s = nextOwnTurn(lv2());
      payMpCost(s.players.player_1.activeSlots[0], 5);
      s = nextOwnTurn(s);
      s = nextOwnTurn(s);
      expect(ok(s, need).ok).toBe(false);
    });
  });
  it('stops at the first false Need with its reason', () => {
    const s = base({ piecieSlots: [placed('piecie_dumbbells'), null, null] });
    const r = ok(s, [{ kind: 'readyPiecie', tag: 'gear', count: 1 }, { kind: 'mosjeMinMP', amount: 99 }]);
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/99/);
  });
});
