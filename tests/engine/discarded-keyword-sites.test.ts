// @ts-nocheck
// Phase 71-08 (D-27): every plain discard from a hand goes through discardFromHand, so the Discarded hook fires.
// One case per site: a test-only hook on a card, the card discarded there, the hook fires once and the card is in the pile once.
import { describe, it, expect, afterEach } from 'vitest';
import { KEYWORD_HOOKS } from '../../src/engine/keywords/keywordHooks.js';
import { martinDriverPitStop } from '../../src/abilities/mosje/martinDriverPitStop.js';
import { aznClessRiskReward } from '../../src/abilities/mosje/aznClessRiskReward.js';
import { QUEST_EXTRAS } from '../../src/engine/quests/questExtras.js';
import { QUEST_COSTS } from '../../src/engine/quests/questCosts.js';
import { discardFromHandCost } from '../../src/engine/costs/kinds/discardFromHandCost.js';
import { createMosjeSlot } from '../../src/engine/mp/createMosjeSlot.js';
import { MOSJES } from '../../src/data/mosjes.js';
import { makeEngineState } from '../helpers/makeEngineState.js';

const CARD = 'piecie_kannetje_melk';
const OTHER = 'piecie_protein_shake';
const calls: any[] = [];
afterEach(() => { delete KEYWORD_HOOKS.discarded[CARD]; calls.length = 0; });
const watch = () => { KEYWORD_HOOKS.discarded[CARD] = (s: any, ctx: any) => { calls.push(ctx); return s; }; };
const card = (cardId: string) => ({ cardId, type: 'PIECIE', faceDown: false });
const inPile = (s: any, id = CARD) => s.players.player_1.graveyard.filter((e: any) => e.cardId === id).length;
const mk = () => {
	const s: any = makeEngineState({ turnNumber: 5 });
	s.players.player_1.hand = [card(CARD), card(OTHER), card(OTHER)];
	s.players.player_1.deck = [card(OTHER), card(OTHER), card(OTHER), card(OTHER)];
	return s;
};
const fired = () => {
	expect(calls).toHaveLength(1);
	expect(calls[0]).toMatchObject({ playerId: 'player_1', ownerId: 'player_1', byPlayerId: 'player_1' });
};

describe('Discarded fires at every plain hand discard site', () => {
	it('Martin, The Precision Driver: Pit Stop', () => {
		watch();
		const s = mk();
		s.players.player_1.activeSlots[0] = createMosjeSlot(MOSJES.find((m: any) => m.id === 'mosje_martin_driver'), { level: 1, mp: 50 });
		s._pendingTargets = { discard_cards: [0, 1] };
		const out = martinDriverPitStop(s, 'player_1');
		fired();
		expect(inPile(out)).toBe(1);
		expect(out.players.player_1.graveyard).toHaveLength(2);
		expect(out.players.player_1.hand).toHaveLength(1 + 3);
	});
	it('AZN Cless: Risk & Reward on a 1', () => {
		watch();
		const s = mk();
		s.players.player_1._pendingTargets = { cless_discard: { handIndex: 0 } };
		const out = aznClessRiskReward.run(s, { roll: 1, ownerId: 'player_1' });
		fired();
		expect(inPile(out)).toBe(1);
		expect(out.players.player_1.hand).toHaveLength(2);
	});
	it('a Quest "Also" discard (Strategy Puzzle)', () => {
		watch();
		const s = mk();
		const n = QUEST_EXTRAS.quest_strategy_puzzle.extraDice({ state: s, playerId: 'player_1', player: s.players.player_1 }, { discardHandIndex: 0 });
		expect(n).toBe(1);
		fired();
		expect(inPile(s)).toBe(1);
		expect(s.players.player_1.hand).toHaveLength(2);
	});
	it('a Quest fail discard (Vraag Aad)', () => {
		watch();
		const s = mk();
		const r = QUEST_EXTRAS.quest_geen_raad_vraag_aad.failBase(s, { playerId: 'player_1' }, { vraagAadDiscardHandIndex: 0 });
		expect(r.base).toBe(10);
		fired();
		expect(inPile(r.s)).toBe(1);
		expect(r.s.players.player_1.hand).toHaveLength(2);
	});
	it('a Quest cost (discard 1 Piecie from the hand)', () => {
		watch();
		const s = mk();
		const ctx: any = { state: s, playerId: 'player_1', player: s.players.player_1 };
		QUEST_COSTS.discard_hand_piecie.pay(ctx, { zone: 'hand', index: 0 });
		fired();
		expect(inPile(s)).toBe(1);
		expect(s.players.player_1.hand).toHaveLength(2);
		expect(ctx.discarded).toEqual([CARD]);
	});
	it('a Personal Quest Pay line (discardFromHand cost)', () => {
		watch();
		const s = mk();
		const ctx: any = { state: s, playerId: 'player_1' };
		discardFromHandCost.pay(ctx, { type: 'PIECIE', count: 1 }, { handCardIds: [CARD] });
		fired();
		expect(inPile(s)).toBe(1);
		expect(s.players.player_1.hand).toHaveLength(2);
	});
});
