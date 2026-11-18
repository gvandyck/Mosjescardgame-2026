// @ts-nocheck
// Phase 71-15: DJ 80/20 (mosje_dj_8020), Jeffrey, The Silent Gambler (mosje_jeffrey_gambler) and Ming, The Natural
// (mosje_ming_natural) on the 2.1 text.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { makeEngineState } from '../helpers/makeEngineState.js';
import { mkSlot, byName, build, finish } from '../helpers/quest56.js';
import { useMosjeAbility } from '../../src/engine/turnManager.js';
import { rollQuestAttempt } from '../../src/engine/quests/rollQuestAttempt.js';
import { rollPersonalQuestAttempt } from '../../src/engine/personalQuests/rollPersonalQuestAttempt.js';
import { resolveQuestAttempt } from '../../src/engine/quests/resolveQuestAttempt.js';
import { resolveReaction } from '../../src/engine/reactions/resolveReaction.js';
import { resolvePendingChoice } from '../../src/engine/mosje/resolvePendingChoice.js';
import { settleMosjePauses } from '../../src/bot/settleMosjePauses.js';
import { pushTestDice, clearTestDice } from '../../src/engine/dice/testDiceQueue.js';
import { MOSJE_TRIGGERS } from '../../src/engine/mosje/mosjeTriggers.js';
import { ABILITY_ENERGY_COSTS } from '../../src/rules/abilityEnergyCosts.js';
import { MOSJE_ABILITY_RULES } from '../../src/rules/mosjeAbilityRules.js';

afterEach(() => { clearTestDice(); vi.restoreAllMocks(); });

const DJ = byName(/DJ 80\/20/);
const GAMBLER = byName(/Silent Gambler/);
const MING = byName(/Ming, The Natural/);
const card = (cardId: string, type = 'PIECIE') => ({ cardId, type });
const ids = (xs: any[]) => xs.map((x: any) => x.cardId);

describe('DJ 80/20: Lucky Beats (own Quest rolls only; 1 reroll, 2 from Level 2)', () => {
	// Tough It Out: one die, 4+ wins. rng 0.1 -> 1 (fail), rng 0.7 -> 5 (win).
	const quest = (djOwner: string, djOver: any = {}, turnKey = true) => {
		const { s } = build('tough_it_out', { opp: [mkSlot({ mp: 40 }), null] });
		s.turnNumber = 3;
		s.players[djOwner].activeSlots[1] = mkSlot({ mp: 30, ...djOver }, DJ);
		return s;
	};
	const stackOf = (s: any) => Object.keys(s.questStacks).find((k) => s.questStacks[k].faceUp === 'quest_tough_it_out');
	const rollOn = (s: any, rng: number) => rollQuestAttempt(s, 'player_1', { slotIndex: 0, stackId: stackOf(s), rng: () => rng });

	it('Level 1: after the owner\'s own roll one die can be rerolled, the win is re-checked', () => {
		const w = rollOn(quest('player_1'), 0.1);
		expect(w.state.pendingReaction.responderId).toBe('player_1');
		expect(w.state.pendingReaction.eligible).toEqual(['djReroll:0']);
		pushTestDice([6]);
		const r = resolveReaction(w.state, 'player_1', 'djReroll:0');
		expect(r.ok).toBe(true);
		expect(r.state.pendingReaction).toBeUndefined(); // no second reroll at Level 1
		expect(resolveQuestAttempt(r.state, undefined).win).toBe(true);
		expect(r.state.players.player_1.activeSlots[1].djRerollTurn).toBe('3:player_1');
	});
	it('Level 1: a second roll the same turn offers no reroll', () => {
		const s = quest('player_1', { djRerollTurn: '3:player_1' });
		expect(rollOn(s, 0.1).state.pendingReaction).toBeUndefined();
	});
	it('the roll of another Mosje of the owner counts too', () => {
		const s = quest('player_1');
		const w = rollOn(s, 0.1); // slot 0 rolls, DJ sits in slot 1
		expect(w.state.pendingReaction.eligible).toContain('djReroll:0');
	});
	it('D-17: after the OPPONENT\'s roll no DJ reroll is offered', () => {
		const w = rollOn(quest('player_2'), 0.7);
		expect(w.state.pendingReaction).toBeUndefined();
	});
	it('after his owner\'s Personal Quest roll the reroll is offered', () => {
		const dj = mkSlot({ mp: 40, level: 1 }, DJ);
		const s = makeEngineState({
			turnNumber: 5,
			players: { player_1: { activeSlots: [mkSlot({ level: 3, mp: 60, subtype: 'PHYSICAL', levelAtTurnStart: 3, traits: { strength: 2 } }), dj], hand: [card('pq_charge', 'PERSONAL_QUEST')], deck: [card('piecie_affoe')] }, player_2: { activeSlots: [mkSlot({ mp: 40 }), null] } },
		});
		const seq = [0.2, 0.7];
		const r = rollPersonalQuestAttempt(s, 'player_1', { cardId: 'pq_charge', slotIndex: 0, rng: () => seq.shift() });
		expect(r.state.pendingReaction.moments).toEqual(['afterOwnQuestRoll']);
		expect(r.state.pendingReaction.eligible).toContain('djReroll:0');
	});
	it('Level 2: a second single-die reroll is offered on the same roll, a third is not', () => {
		const w = rollOn(quest('player_1', { level: 2 }), 0.1);
		pushTestDice([2, 6]);
		const r1 = resolveReaction(w.state, 'player_1', 'djReroll:0');
		expect(r1.state.pendingReaction.eligible).toContain('djReroll:0');
		expect(r1.state.pendingQuestRoll.dice).toEqual([2]);
		const r2 = resolveReaction(r1.state, 'player_1', 'djReroll:0');
		expect(r2.state.pendingQuestRoll.dice).toEqual([6]);
		expect(r2.state.pendingReaction).toBeUndefined();
		expect(r2.state.players.player_1.activeSlots[1].djRerollCount).toBe(2);
	});
	it('Level 3: the same two; with two used no window on a later roll this turn; next turn it starts again', () => {
		const s = quest('player_1', { level: 3, djRerollTurn: '3:player_1', djRerollCount: 2 });
		expect(rollOn(s, 0.1).state.pendingReaction).toBeUndefined();
		const one = quest('player_1', { level: 3, djRerollTurn: '3:player_1', djRerollCount: 1 });
		expect(rollOn(one, 0.1).state.pendingReaction.eligible).toEqual(['djReroll:0']);
		s.turnNumber = 4;
		expect(rollOn(s, 0.1).state.pendingReaction.eligible).toEqual(['djReroll:0']); // a new turn key: the count starts again
	});
	it('passing leaves the roll and DJ unused', () => {
		const w = rollOn(quest('player_1'), 0.1);
		const r = resolveReaction(w.state, 'player_1', null);
		expect(r.state.pendingQuestRoll.dice).toEqual([1]);
		expect(r.state.players.player_1.activeSlots[1].djRerollTurn).toBeUndefined();
	});
	it('a sideways DJ offers nothing', () => {
		expect(rollOn(quest('player_1', { sideways: true }), 0.1).state.pendingReaction).toBeUndefined();
	});
});

describe('Jeffrey, The Silent Gambler: High Stakes (stake 1 or 2 Energy)', () => {
	const roll = (n: number) => vi.spyOn(Math, 'random').mockReturnValue((n - 0.5) / 6);
	const board = (energy = 3, deck = [card('snelle_jensen')]) => makeEngineState({
		turnNumber: 5,
		players: { player_1: { energy, deck, activeSlots: [mkSlot({ mp: 30 }, GAMBLER), null] }, player_2: { activeSlots: [mkSlot({ mp: 40 }), null] } },
	});
	const use = (s: any, stake: any) => { s._pendingTargets = { stake }; return useMosjeAbility(s, 'player_1', GAMBLER.id); };

	it('stake 2 with a 1: the 2 Energy are gone', () => {
		roll(1);
		const r = use(board(), 2);
		expect(r.success, r.error).toBe(true);
		expect(r.state.players.player_1.energy).toBe(1);
	});
	it('a 3: the Energy is unchanged', () => {
		roll(3);
		const p = use(board(), 2).state.players.player_1;
		expect(p.energy).toBe(3);
		expect(p.hand).toHaveLength(0);
		expect(p.activeSlots[0].mp).toBe(30);
	});
	it('a 6 with stake 2: Energy unchanged, draw 1, 20 MP, nothing more', () => {
		roll(6);
		const res = use(board(), 2);
		const p = res.state.players.player_1;
		expect(p.energy).toBe(3);
		expect(ids(p.hand)).toEqual(['snelle_jensen']);
		expect(p.activeSlots[0].mp).toBe(50);
		expect(p.gamblerQuestBonusTurn).toBeUndefined();
	});
	it('stake 1 with a 5: draw 1 and 10 MP', () => {
		roll(5);
		const p = use(board(), 1).state.players.player_1;
		expect(ids(p.hand)).toEqual(['snelle_jensen']);
		expect(p.activeSlots[0].mp).toBe(40);
		expect(p.energy).toBe(3);
	});
	it('a stake above the Energy is refused, nothing lost', () => {
		roll(1);
		const r = use(board(1), 2);
		expect(r.success).toBe(false);
		expect(r.state.players.player_1.energy).toBe(1);
	});
	it('after a 5-6 a Quest win the same turn gives the Quest\'s MP and no extra 15', () => {
		roll(6);
		const { s, q } = build('quick_thinking', { p1: { energy: 3, deck: [card('snelle_jensen')], activeSlots: [mkSlot({ mp: 30 }), mkSlot({ mp: 30 }, GAMBLER)] } });
		const used = use(s, 1).state;
		expect(MOSJE_TRIGGERS.questSuccess.some((t: any) => t.mosjeId === 'mosje_jeffrey_gambler')).toBe(false);
		const win = finish(used, q, true);
		expect(win.players.player_1.activeSlots[0].mp).toBe(30 + q.win);
	});
});

describe('Ming, The Natural: Lucky Draw (1 Energy, reveal and draw, a Piecie may be activated free)', () => {
	const other = () => mkSlot({ mp: 30, level: 1 }, byName(/Jeffrey, The Strongman/));
	const board = (top: string, extra: any = {}, second: any = null) => makeEngineState({
		turnNumber: 5,
		players: { player_1: { energy: 3, hand: [], deck: [card(top, top.startsWith('piecie') ? 'PIECIE' : 'X'), card('snelle_jensen')], piecieSlots: [null, null, null], activeSlots: [mkSlot({ mp: 30 }, MING), second], ...extra }, player_2: { activeSlots: [mkSlot({ mp: 40 }), null] } },
	});
	const use = (s: any) => useMosjeAbility(s, 'player_1', MING.id);
	const p1 = (s: any) => s.players.player_1;

	it('rule and cost: 1 Energy, no inputs, no old choice', () => {
		expect(ABILITY_ENERGY_COSTS.ability_ming_natural_lucky_draw).toBe(1);
		expect(MOSJE_ABILITY_RULES.ability_ming_natural_lucky_draw.inputs).toEqual([]);
		expect(MOSJE_TRIGGERS.mingActivate).toBeTruthy();
	});
	it('costs 1 Energy; the top card is revealed to both players and goes to the hand', () => {
		const r = use(board('snelle_jensen'));
		expect(r.success, r.error).toBe(true);
		expect(p1(r.state).energy).toBe(2);
		expect(ids(p1(r.state).hand)).toEqual(['snelle_jensen']);
		expect(r.state.revealed.player_1[0].cardIds).toEqual(['snelle_jensen']);
		expect(r.state.revealed.player_2[0].cardIds).toEqual(['snelle_jensen']);
	});
	it('a non-Piecie gives no MP and no pause', () => {
		for (const top of ['snelle_jensen', 'mosje_jeffrey', 'place_the_gym']) {
			const r = use(board(top));
			expect(r.state.pendingChoice).toBeUndefined();
			expect(p1(r.state).activeSlots[0].mp).toBe(30);
			expect(ids(p1(r.state).hand)).toEqual([top]);
		}
	});
	it('a Piecie that may be activated: pause with "activate" first and "keep" second', () => {
		const r = use(board('piecie_kannetje_melk'));
		const pc = r.state.pendingChoice;
		expect(pc.playerId).toBe('player_1');
		expect(pc.options.map((o: any) => o.choice)).toEqual(['activate', 'keep']);
		expect(p1(r.state).energy).toBe(2);
	});
	it('activate: the effect happens now, no Energy for it, the card ends in the pile', () => {
		const r = use(board('piecie_kannetje_melk'));
		const out = resolvePendingChoice(r.state, r.state.pendingChoice.options[0]).state;
		expect(p1(out).activeSlots[0].mp).toBe(55);
		expect(p1(out).energy).toBe(2);
		expect(ids(p1(out).graveyard)).toContain('piecie_kannetje_melk');
		expect(p1(out).hand).toHaveLength(0);
		expect(out.pendingChoice).toBeUndefined();
	});
	it('keep: it stays in the hand', () => {
		const r = use(board('piecie_kannetje_melk'));
		const out = resolvePendingChoice(r.state, r.state.pendingChoice.options[1]).state;
		expect(ids(p1(out).hand)).toEqual(['piecie_kannetje_melk']);
		expect(p1(out).activeSlots[0].mp).toBe(30);
	});
	it('a Piecie whose Needs fail (Keyboard, no Digital Mosje): no pause, stays in the hand', () => {
		const r = use(board('piecie_keyboard'));
		expect(r.state.pendingChoice).toBeUndefined();
		expect(ids(p1(r.state).hand)).toEqual(['piecie_keyboard']);
	});
	it('an Attach card (Dumbbells) attaches to the Mosje the owner picks', () => {
		const r = use(board('piecie_dumbbells', {}, other()));
		let st = resolvePendingChoice(r.state, r.state.pendingChoice.options[0]).state;
		expect(st.pendingChoice.key).toBe('attach_mosje');
		const pick = st.pendingChoice.options.find((o: any) => o.slotIndex === 1) || st.pendingChoice.options[1];
		st = resolvePendingChoice(st, pick).state;
		const att = (i: number) => (p1(st).activeSlots[i].attachments || []).map((a: any) => a.cardId);
		expect(att(1)).toEqual(['piecie_dumbbells']);
		expect(att(0)).toEqual([]);
		expect(p1(st).hand).toHaveLength(0);
		expect(p1(st).energy).toBe(2);
	});
	it('a card with an MP price (Te Hard Gaan) still takes the MP', () => {
		const r = use(board('piecie_te_hard_gaan'));
		const out = resolvePendingChoice(r.state, r.state.pendingChoice.options[0]).state;
		expect(p1(out).activeSlots[0].mp).toBe(20);
		expect(p1(out).energy).toBe(2);
	});
	it('an empty deck: refused, no Energy paid', () => {
		const r = use(board('snelle_jensen', { deck: [] }));
		expect(r.success).toBe(false);
		expect(p1(r.state).energy).toBe(3);
	});
	it('once per turn; with 0 Energy refused', () => {
		const first = use(board('snelle_jensen'));
		expect(use(first.state).success).toBe(false);
		expect(p1(first.state).energy).toBe(2);
		expect(use(board('snelle_jensen', { energy: 0 })).success).toBe(false);
	});
	it('the bot answers the pause with the first option (activate) and the game goes on', () => {
		const r = use(board('piecie_kannetje_melk'));
		const out = settleMosjePauses(r.state, []);
		expect(out.waiting).toBe(false);
		expect(out.state.pendingChoice).toBeUndefined();
		expect(p1(out.state).activeSlots[0].mp).toBe(55);
	});
});
