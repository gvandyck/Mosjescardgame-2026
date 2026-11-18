// @ts-nocheck
// Phase 71-11: Alyssa, The Bulldozer (mosje_alyssa_bulldozer), Chris, The BigStepper (mosje_chris_ddr) and
// Michelle, Iron Tuk (mosje_michelle) on the 2.1 text.
import { afterEach, describe, expect, it } from 'vitest';
import { makeEngineState } from '../helpers/makeEngineState.js';
import { createMosjeSlot } from '../../src/engine/mp/createMosjeSlot.js';
import { attackMosje } from '../../src/engine/actions/attackMosje.js';
import { getPower } from '../../src/engine/mp/getPower.js';
import { loseMP } from '../../src/engine/mpManager.js';
import { expireTimedEffects } from '../../src/engine/durations/expireTimedEffects.js';
import { expireThisTurnEffects } from '../../src/engine/turn/expireThisTurnEffects.js';
import { activatePiecie } from '../../src/engine/turnManager.js';
import { resolvePendingChoice } from '../../src/engine/mosje/resolvePendingChoice.js';
import { pushTestDice, clearTestDice, shiftTestDie } from '../../src/engine/dice/testDiceQueue.js';
import { MOSJES } from '../../src/data/mosjes.js';
import { MOSJE_TRIGGERS } from '../../src/engine/mosje/mosjeTriggers.js';

const def = (id: string) => MOSJES.find((m: any) => m.id === id);
afterEach(() => clearTestDice());

function mk(id: string, mp = 50, level = 1, resilient?: number) {
	const s = createMosjeSlot(def(id), { level, mp });
	s.entryProtected = false;
	if (resilient !== undefined) s.traits = { ...s.traits, resilient };
	return s;
}
// an attacker with exactly `power` Power (Jeffrey and Michelle share a type: no triangle bonus)
function attacker(power: number) {
	const s = mk('mosje_jeffrey');
	s.powerBoost = power - getPower(s);
	return s;
}
const game = (att: any, tgt: any, extra: any = {}) => makeEngineState({
	...extra,
	players: { player_1: { activeSlots: [att, mk('mosje_jeffrey')] }, player_2: { activeSlots: [tgt, mk('mosje_jeffrey')] } },
});
const hit = (s: any, p = 0) => attackMosje(s, 'player_1', { attackerSlotIndex: p, targetPlayerId: 'player_2', targetSlotIndex: 0 });
const t0 = (s: any) => s.players.player_2.activeSlots[0];
const a0 = (s: any) => s.players.player_1.activeSlots[0];
const setPower = (s: any, p: number) => { a0(s).powerBoost = 0; a0(s).powerBoost = p - getPower(a0(s)); a0(s).actedThisTurn = false; };

describe('Alyssa, The Bulldozer (mosje_alyssa_bulldozer)', () => {
	const bull = () => mk('mosje_alyssa_bulldozer', 60, 1, 0);
	it('one attack that takes 20: +25 MP and +10 Power', () => {
		const s = hit(game(attacker(20), bull())).state;
		expect(t0(s).mp).toBe(60 - 20 + 25);
		expect(getPower(t0(s), s, 'player_2')).toBe(getPower(bull()) + 10);
	});
	it('two attacks of 10 in one turn fire on the second', () => {
		let s = hit(game(attacker(10), bull())).state;
		expect(t0(s).mp).toBe(50);
		setPower(s, 10);
		s = hit(s).state;
		expect(t0(s).mp).toBe(40 + 25);
	});
	it('one attack for 15 does nothing', () => {
		const s = hit(game(attacker(15), bull())).state;
		expect(t0(s).mp).toBe(45);
		expect(getPower(t0(s), s, 'player_2')).toBe(getPower(bull()));
	});
	it('fires once per turn, and again next turn', () => {
		let s = hit(game(attacker(20), bull())).state;
		expect(t0(s).mp).toBe(65);
		setPower(s, 20);
		s = hit(s).state;
		expect(t0(s).mp).toBe(45); // no second gain
		s.activePlayerId = 'player_1';
		expireThisTurnEffects(s);
		setPower(s, 20);
		s = hit(s).state;
		expect(t0(s).mp).toBe(45 - 20 + 25);
	});
	it('the +10 Power lasts through the rest of the turn and the owner next turn, then is gone', () => {
		let s = hit(game(attacker(20), bull())).state;
		const base = getPower(bull());
		s.activePlayerId = 'player_1';
		expireTimedEffects(s, 'turnEnd', 'player_1');
		expect(getPower(t0(s), s, 'player_2')).toBe(base + 10);
		s.activePlayerId = 'player_2';
		expect(getPower(t0(s), s, 'player_2')).toBe(base + 10);
		expireTimedEffects(s, 'turnEnd', 'player_2');
		expect(getPower(t0(s), s, 'player_2')).toBe(base);
	});
	it('MP lost to a card effect does not count', () => {
		let s = game(attacker(20), bull());
		s = loseMP(s, 'player_2', 0, 30, 'ABILITY', false, 'player_1');
		expect(t0(s).mp).toBe(30);
		setPower(s, 10);
		s = hit(s).state;
		expect(t0(s).mp).toBe(20); // 10 from the attack only: no trigger
	});
});

describe('Michelle, Iron Tuk (mosje_michelle)', () => {
	it('Level 1, Power 30: 30 - 10 - 5 Resilient = she loses 15', () => {
		const s = hit(game(attacker(30), mk('mosje_michelle', 50, 1))).state;
		expect(t0(s).mp).toBe(35);
	});
	it('Level 2, Power 30: 30 - 15 - 5 = she loses 10', () => {
		const s = hit(game(attacker(30), mk('mosje_michelle', 50, 2))).state;
		expect(t0(s).mp).toBe(40);
	});
	it('Power 10 at Level 1 is taken away whole: no 5 floor', () => {
		const s = hit(game(attacker(10), mk('mosje_michelle', 50, 1))).state;
		expect(t0(s).mp).toBe(50);
	});
	it('Power 15 at Level 1: 5 is left and Resilient leaves the floor of 5', () => {
		const s = hit(game(attacker(15), mk('mosje_michelle', 50, 1))).state;
		expect(t0(s).mp).toBe(45);
	});
	it('a card effect is not reduced', () => {
		const s = loseMP(game(attacker(10), mk('mosje_michelle', 50, 1)), 'player_2', 0, 30, 'ABILITY', false, 'player_1');
		expect(t0(s).mp).toBe(20);
	});
	it('a Quest win gives the Quest MP: no die, no Tough Gamble trigger', () => {
		expect(MOSJE_TRIGGERS.questWinAmount.some((t: any) => t.mosjeId === 'mosje_michelle')).toBe(false);
	});
	it('another Mosje is not reduced', () => {
		const s = hit(game(attacker(30), mk('mosje_jeffrey', 50, 1, 0))).state;
		expect(t0(s).mp).toBe(20);
	});
	it('Dikke Taks (hits both): only Michelle is reduced', () => {
		const s = game(attacker(30), mk('mosje_michelle', 50, 1, 0));
		s.players.player_2.activeSlots[1] = mk('mosje_jeffrey', 50, 1, 0);
		a0(s).hitBothOpponents = true;
		const r = hit(s).state;
		expect(r.players.player_2.activeSlots[0].mp).toBe(30); // 30 - 10 reduced = 20 lost
		expect(r.players.player_2.activeSlots[1].mp).toBe(20); // 30 lost
	});
});

// Chris, The BigStepper
const placed = (cardId: string, extra: any = {}) => ({ cardId, type: 'PIECIE', faceDown: true, activated: false, playedOnTurn: 1, canActivateOnTurn: 1, ...extra });
const DONER = 'piecie_broodje_doner';
const mosjeSlot = (cardId: string, mp = 30) => ({ cardId, name: cardId, mp, level: 1, isDefeated: false, traits: {}, statusEffects: [], abilityUsedThisTurn: false });
const chrisWorld = (slots: any[]) => makeEngineState({
	turnNumber: 3,
	players: {
		player_1: { energy: 6, activeSlots: [mosjeSlot('mosje_chris_ddr'), null], piecieSlots: slots },
		player_2: { activeSlots: [mosjeSlot('mosje_b', 80), null] },
	},
});
const settle = (res: any, pick = (o: any[]) => o[0]) => {
	while (res.state.pendingChoice) res = resolvePendingChoice(res.state, pick(res.state.pendingChoice.options));
	return res;
};
const rest = () => { const out: number[] = []; for (let d = shiftTestDie(); d !== null; d = shiftTestDie()) out.push(d); return out; };
const empties = (s: any) => s.players.player_1.piecieSlots.filter((x: any) => x === null).length;

describe('Chris, The BigStepper (mosje_chris_ddr)', () => {
	it('a paid activation with a 5 and a ready Piecie offers a free activation for 0 Energy', () => {
		pushTestDice([5]);
		const res = settle(activatePiecie(chrisWorld([placed(DONER), placed(DONER), null]), 'player_1', 0));
		const p = res.state.players.player_1;
		expect(p.energy).toBe(5); // only the paid Doner (1)
		expect(p.ddrChainsThisTurn).toBe(1);
		expect(empties(res.state)).toBe(3); // both Doners resolved
	});
	it('free activations roll too: dice 6, 6, 1 with three ready Piecies give two free ones and stop', () => {
		pushTestDice([6, 6, 1]);
		const res = settle(activatePiecie(chrisWorld([placed(DONER), placed(DONER), placed(DONER)]), 'player_1', 0));
		expect(res.state.players.player_1.ddrChainsThisTurn).toBe(2);
		expect(empties(res.state)).toBe(3);
		expect(res.state.players.player_1.energy).toBe(5);
		expect(rest()).toEqual([1]); // the cap is checked before the roll: no third die
	});
	it('a chain of sixes ends at the cap with no third free activation', () => {
		pushTestDice([6, 6, 6, 6, 6]);
		const res = settle(activatePiecie(chrisWorld([placed(DONER), placed(DONER), placed(DONER)]), 'player_1', 0));
		expect(res.state.players.player_1.ddrChainsThisTurn).toBe(2);
		expect(rest()).toEqual([6, 6, 6]);
	});
	it('after two free activations no die is rolled for the rest of the turn', () => {
		pushTestDice([6, 6, 3]);
		let res = settle(activatePiecie(chrisWorld([placed(DONER), placed(DONER), placed(DONER)]), 'player_1', 0));
		const s = res.state;
		s.players.player_1.piecieSlots[0] = placed(DONER);
		res = settle(activatePiecie(s, 'player_1', 0));
		expect(res.state.players.player_1.ddrChainsThisTurn).toBe(2);
		expect(rest()).toEqual([3]);
	});
	it('a 1-4 does nothing', () => {
		pushTestDice([4]);
		const res = activatePiecie(chrisWorld([placed(DONER), placed(DONER), null]), 'player_1', 0);
		expect(res.state.pendingChoice).toBeUndefined();
		expect(res.state.players.player_1.ddrChainsThisTurn || 0).toBe(0);
		expect(res.state.players.player_1.piecieSlots[1].activated).toBe(false);
	});
	it('a 6 with no ready Piecie: no activation, nothing counted', () => {
		pushTestDice([6]);
		const res = activatePiecie(chrisWorld([placed(DONER), null, null]), 'player_1', 0);
		expect(res.state.pendingChoice).toBeUndefined();
		expect(res.state.players.player_1.ddrChainsThisTurn || 0).toBe(0);
	});
	it('a 6 with only a Piecie whose Needs fail: no activation, nothing counted', () => {
		pushTestDice([6]);
		const res = activatePiecie(chrisWorld([placed(DONER), placed('piecie_keyboard'), null]), 'player_1', 0);
		expect(res.state.pendingChoice).toBeUndefined();
		expect(res.state.players.player_1.ddrChainsThisTurn || 0).toBe(0);
		expect(res.state.players.player_1.piecieSlots[1].activated).toBe(false);
	});
	it('the free Piecie pays no Energy but still pays an MP price (Te Hard Gaan takes 10 MP)', () => {
		pushTestDice([6]);
		const s = chrisWorld([placed(DONER), placed('piecie_te_hard_gaan'), null]);
		const res = settle(activatePiecie(s, 'player_1', 0));
		expect(res.state.players.player_1.energy).toBe(5);
		expect(res.state.players.player_1.piecieSlots[1]).toBeNull();
		expect(res.state.players.player_1.activeSlots[0].mp).toBe(20); // the 10 MP price; the Doner gives this Mosje nothing
	});
	it('it is optional: the pause has a "no" option and "no" counts nothing', () => {
		pushTestDice([6]);
		let res: any = activatePiecie(chrisWorld([placed(DONER), placed(DONER), null]), 'player_1', 0);
		const opts = res.state.pendingChoice.options;
		expect(opts[0].slotIndex).toBe(1);
		const no = opts[opts.length - 1];
		expect(no.slotIndex).toBe(-1);
		res = resolvePendingChoice(res.state, no);
		expect(res.state.pendingChoice).toBeUndefined();
		expect(res.state.players.player_1.ddrChainsThisTurn || 0).toBe(0);
		expect(res.state.players.player_1.piecieSlots[1].activated).toBe(false);
	});
});
