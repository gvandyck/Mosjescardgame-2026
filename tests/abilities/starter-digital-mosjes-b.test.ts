// @ts-nocheck
// Phase 71-13: FPS Coert (mosje_fps_coert) and FPS West (mosje_fps_west) on the 2.1 text.
import { afterEach, describe, expect, it } from 'vitest';
import { makeEngineState } from '../helpers/makeEngineState.js';
import { createMosjeSlot } from '../../src/engine/mp/createMosjeSlot.js';
import { startTurn, useMosjeAbility } from '../../src/engine/turnManager.js';
import { runMosjeTriggers } from '../../src/engine/mosje/runMosjeTriggers.js';
import { resolvePendingChoice } from '../../src/engine/mosje/resolvePendingChoice.js';
import { MOSJES } from '../../src/data/mosjes.js';
import { MOSJE_TRIGGERS } from '../../src/engine/mosje/mosjeTriggers.js';
import { MOSJE_ABILITY_RULES } from '../../src/rules/mosjeAbilityRules.js';
import { pushTestDice, clearTestDice } from '../../src/engine/dice/testDiceQueue.js';
import { getBotView } from '../../src/bot/strategy/getBotView.js';

afterEach(() => clearTestDice());

const def = (id: string) => MOSJES.find((m: any) => m.id === id);
const mk = (id: string, mp = 30, extra: any = {}) => { const s = createMosjeSlot(def(id), { level: 1, mp }); s.entryProtected = false; return Object.assign(s, extra); };
const slotOf = (s: any, pid: string, i: number) => s.players[pid].activeSlots[i];

describe('FPS Coert: Headshot Precision (2.1)', () => {
	const board = (opp: any[] = [mk('mosje_jeffrey', 50), mk('mosje_binti', 50)]) => makeEngineState({
		turnNumber: 3, players: { player_1: { activeSlots: [mk('mosje_fps_coert'), null] }, player_2: { activeSlots: opp } },
	});
	const win = (s: any, rollTrait: string, slotIndex = 0) => runMosjeTriggers(s, 'questSuccess', { playerId: 'player_1', slotIndex, quest: { rollTrait, category: 'x' }, amount: 40 });

	it.each([5, 6])('rolled trait Tech, die %i: +30 MP and the owner picks the Mosje that loses 15', (die) => {
		pushTestDice([die]);
		const s = win(board(), 'technical');
		expect(s.pendingChoice.playerId).toBe('player_1');
		expect(s.pendingChoice.options).toHaveLength(2);
		const r = resolvePendingChoice(s, s.pendingChoice.options[1]).state;
		expect(slotOf(r, 'player_1', 0).mp).toBe(60);
		expect(slotOf(r, 'player_2', 1).mp).toBe(35);
		expect(slotOf(r, 'player_2', 0).mp).toBe(50);
	});
	it('die 4: nothing', () => {
		pushTestDice([4]);
		const s = win(board(), 'technical');
		expect(s.pendingChoice).toBeUndefined();
		expect(slotOf(s, 'player_1', 0).mp).toBe(30);
	});
	it('a Quest that rolls Str counts', () => {
		pushTestDice([5]);
		const s = win(board([mk('mosje_jeffrey', 50), null]), 'strength');
		expect(slotOf(s, 'player_1', 0).mp).toBe(60);
		expect(slotOf(s, 'player_2', 0).mp).toBe(35);
	});
	it('Soc, best trait and no trait roll no die', () => {
		for (const t of ['social', 'best', 'none', undefined]) {
			clearTestDice(); pushTestDice([6]);
			const s = win(board(), t as any);
			expect(slotOf(s, 'player_1', 0).mp).toBe(30);
			expect(s.pendingChoice).toBeUndefined();
		}
	});
	it('the 15 is a card effect: a Res 2 target loses all 15', () => {
		pushTestDice([6]);
		const t = mk('mosje_jeffrey', 50); t.traits = { ...t.traits, resilient: 2 };
		const s = win(board([t, null]), 'technical');
		expect(slotOf(s, 'player_2', 0).mp).toBe(35);
	});
	it('no legal opponent Mosje (all fresh): he still gains 30', () => {
		pushTestDice([6]);
		const s = win(board([mk('mosje_jeffrey', 50, { entryProtected: true }), null]), 'technical');
		expect(s.pendingChoice).toBeUndefined();
		expect(slotOf(s, 'player_1', 0).mp).toBe(60);
		expect(slotOf(s, 'player_2', 0).mp).toBe(50);
	});
	it('a fresh Mosje is not offered', () => {
		pushTestDice([6]);
		const s = win(board([mk('mosje_jeffrey', 50, { entryProtected: true }), mk('mosje_binti', 50)]), 'technical');
		expect(slotOf(s, 'player_2', 0).mp).toBe(50);
		expect(slotOf(s, 'player_2', 1).mp).toBe(35);
	});
	it('a Mosje that Blensen! shields is not offered, and the hit is a recorded Target', () => {
		pushTestDice([6]);
		const b = board(); b.blensenShield = { playerId: 'player_2', turnNumber: b.turnNumber };
		const s = win(b, 'technical');
		expect(slotOf(s, 'player_2', 0).mp).toBe(50);
		expect(slotOf(s, 'player_2', 1).mp).toBe(50);
		expect(slotOf(s, 'player_1', 0).mp).toBe(60);
		const open = board();
		pushTestDice([6]);
		const out = win(open, 'technical');
		const r = resolvePendingChoice(out, out.pendingChoice.options[0]).state;
		expect(r.targetedThisAction).toEqual([{ playerId: 'player_2', slotIndex: 0 }]);
	});
	it("a partner's win does not fire it", () => {
		pushTestDice([6]);
		const b = board(); b.players.player_1.activeSlots[1] = mk('mosje_jeffrey', 30);
		const s = win(b, 'technical', 1);
		expect(slotOf(s, 'player_1', 1).mp).toBe(30);
		expect(slotOf(s, 'player_1', 0).mp).toBe(30);
	});
});

describe('FPS West: Tactical Analysis (2.1)', () => {
	const hand = (...ids: string[]) => ids.map(cardId => ({ cardId, type: cardId.startsWith('pq_') ? 'PERSONAL_QUEST' : 'PIECIE' }));
	const game = (oppHand: any[], westMp = 40, energy = 3, oppDeck: any[] = hand('d1', 'd2')) => makeEngineState({
		turnNumber: 3,
		players: { player_1: { energy, activeSlots: [mk('mosje_fps_west', westMp), null] }, player_2: { hand: oppHand, deck: oppDeck, activeSlots: [mk('mosje_jeffrey'), null] } },
	});
	const use = (s: any) => useMosjeAbility(s, 'player_1', 'mosje_fps_west');
	const west = (s: any) => slotOf(s, 'player_1', 0);
	const ids = (xs: any[]) => xs.map((x: any) => x.cardId);

	it('rules: no inputs, 1 Energy, the old guess game is gone', () => {
		expect(MOSJE_ABILITY_RULES.ability_fps_west_tactical_analysis.inputs).toEqual([]);
		expect(MOSJE_TRIGGERS.fpsWestBottom).toBeTruthy();
		expect(MOSJE_TRIGGERS.endOfTurn.some((t: any) => t.mosjeId === 'mosje_fps_west')).toBe(false);
		expect(MOSJE_TRIGGERS.cardPlayedFromHand.some((t: any) => t.mosjeId === 'mosje_fps_west')).toBe(false);
	});
	it('costs 1 Energy, shows the whole hand (a Personal Quest too) to the owner only, then pauses', () => {
		const r = use(game(hand('a', 'pq_x', 'b')));
		expect(r.success, r.error).toBe(true);
		expect(r.state.players.player_1.energy).toBe(2);
		expect(r.state.revealed.player_1[0].cardIds).toEqual(['a', 'pq_x', 'b']);
		expect(r.state.revealed.player_2).toBeUndefined();
		expect(r.state.pendingChoice.playerId).toBe('player_1');
	});
	it('options: "Leave it" first, then every pickable card, never a Personal Quest', () => {
		const r = use(game(hand('a', 'pq_x', 'b')));
		const o = r.state.pendingChoice.options;
		expect(o).toHaveLength(3);
		expect(o[0].label).toBe('Leave it');
		expect(o.map((x: any) => x.index)).toEqual([-1, 0, 2]);
	});
	it('Leave it: nothing more happens', () => {
		const r = use(game(hand('a', 'b')));
		const out = resolvePendingChoice(r.state, r.state.pendingChoice.options[0]).state;
		expect(west(out).mp).toBe(40);
		expect(ids(out.players.player_2.hand)).toEqual(['a', 'b']);
		expect(ids(out.players.player_2.deck)).toEqual(['d1', 'd2']);
	});
	it('a card: he loses exactly 20 MP (no Resilient), the card goes to the bottom, they draw 1', () => {
		const g = game(hand('a', 'b'));
		west(g).traits = { ...west(g).traits, resilient: 3 };
		const r = use(g);
		const out = resolvePendingChoice(r.state, r.state.pendingChoice.options[2]).state; // b
		expect(west(out).mp).toBe(20);
		expect(ids(out.players.player_2.hand)).toEqual(['a', 'd1']);
		expect(ids(out.players.player_2.deck)).toEqual(['d2', 'b']);
	});
	it('a Personal Quest can not be forged in', () => {
		const r = use(game(hand('a', 'pq_x')));
		const bad = resolvePendingChoice(r.state, { label: 'pq', index: 1 });
		expect(bad.success).toBe(false);
		expect(west(bad.state).mp).toBe(40);
	});
	it('only Personal Quests or an empty hand: shown, no pause', () => {
		const a = use(game(hand('pq_x', 'pq_y')));
		expect(a.success).toBe(true);
		expect(a.state.pendingChoice).toBeUndefined();
		expect(a.state.revealed.player_1[0].cardIds).toHaveLength(2);
		const b = use(game([]));
		expect(b.success).toBe(true);
		expect(b.state.pendingChoice).toBeUndefined();
	});
	it('at 20 MP or less he can not pay: hand shown, no pause', () => {
		const r = use(game(hand('a', 'b'), 20));
		expect(r.success).toBe(true);
		expect(r.state.pendingChoice).toBeUndefined();
		expect(west(r.state).mp).toBe(20);
		expect(r.state.revealed.player_1).toHaveLength(1);
	});
	it('once per turn, refused with 0 Energy, refused when sideways', () => {
		const r = use(game(hand('a')));
		const out = resolvePendingChoice(r.state, r.state.pendingChoice.options[0]).state;
		expect(use(out).success).toBe(false);
		expect(use(game(hand('a'), 40, 0)).success).toBe(false);
		const sw = game(hand('a')); west(sw).sideways = true;
		expect(use(sw).success).toBe(false);
	});
	it('the opponent view never holds the pause options', () => {
		const r = use(game(hand('a', 'b')));
		const view = getBotView(r.state, 'player_2');
		expect(JSON.stringify(view.pendingChoice || {})).not.toContain('"a"');
	});
	it('nothing is guessed or settled: a played card or an end of turn changes no MP', () => {
		const g = game(hand('a'));
		const r = use(g);
		const done = resolvePendingChoice(r.state, r.state.pendingChoice.options[0]).state;
		expect(west(done).fpsWestGuess).toBeUndefined();
		const played = runMosjeTriggers(done, 'cardPlayedFromHand', { playerId: 'player_2', cardType: 'PIECIE' });
		const ended = runMosjeTriggers(played, 'endOfTurn', { playerId: 'player_2' });
		expect(west(ended).mp).toBe(40);
	});
	it('the old synergy with FPS Coert is off: a Quest win gives the two no extra MP', () => {
		expect(def('mosje_fps_west').synergyEffect).toBeNull();
	});
});
