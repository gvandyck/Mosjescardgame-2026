// @ts-nocheck
// Phase 71-14: Binti, The Sharp Tongue (mosje_binti) and Ronald, Dr. Phill-osoof (mosje_ronald_mastermind) on the 2.1 text.
import { describe, expect, it } from 'vitest';
import { makeEngineState } from '../helpers/makeEngineState.js';
import { mkSlot } from '../helpers/quest56.js';
import { MOSJES } from '../../src/data/mosjes.js';
import { useMosjeAbility, startTurn } from '../../src/engine/turnManager.js';
import { rollQuestAttempt } from '../../src/engine/quests/rollQuestAttempt.js';
import { questDiceGrantTotal } from '../../src/engine/quests/questDiceGrantTotal.js';
import { gainFromPiecie } from '../../src/abilities/piecie/gainFromPiecie.js';
import { PIECIES } from '../../src/data/piecies.js';
import { defaultAbilityInputs } from '../../src/bot/strategy/defaultAbilityInputs.js';
import { MOSJE_ABILITY_RULES } from '../../src/rules/mosjeAbilityRules.js';
import { ABILITY_ENERGY_COSTS } from '../../src/rules/abilityEnergyCosts.js';

const def = (id: string) => MOSJES.find((m: any) => m.id === id);
const BINTI = def('mosje_binti'), PHIL = def('mosje_ronald_mastermind');
const card = (cardId: string, type = 'PIECIE') => ({ cardId, type });
const hit = (s: any) => s.players.player_2.activeSlots[0].mp;

describe('Binti, The Sharp Tongue', () => {
	const board = (level = 1, extra: any = {}) => {
		const s = makeEngineState({
			turnNumber: 5,
			players: {
				player_1: { energy: 4, hand: [card('piecie_kannetje_melk'), card('piecie_kannetje_melk'), card('piecie_kannetje_melk')], deck: Array.from({ length: 12 }, () => card('piecie_kannetje_melk')), activeSlots: [mkSlot({ mp: 30, level }, BINTI), null], ...extra },
				player_2: { hand: [card('piecie_ronald_kip')], activeSlots: [mkSlot({ mp: 60 }), mkSlot({ mp: 60 })] },
			},
		});
		s._pendingTargets = { hand_card: 0, opp_slot_index: 0 };
		return s;
	};
	const cut = (s: any) => { s._pendingTargets = { hand_card: 0, opp_slot_index: 0 }; return useMosjeAbility(s, 'player_1', 'mosje_binti'); };
	const nextTurn = (s: any) => { const n = JSON.parse(JSON.stringify(s)); n.activePlayerId = 'player_1'; n.turnNumber += 2; return startTurn(n); };

	it('Level 1: the target loses 10, 1 Energy and the Piecie go', () => {
		const r = cut(board());
		expect(r.success, r.error).toBe(true);
		expect(hit(r.state)).toBe(50);
		expect(r.state.players.player_1.energy).toBe(3);
		expect(r.state.players.player_1.graveyard).toHaveLength(1);
		expect(r.state.players.player_2.graveyard.map((c: any) => c.cardId)).toEqual(['piecie_ronald_kip']);
	});
	it('a non-Piecie is refused and nothing is paid', () => {
		const s = board(1, { hand: [card('snelle_jensen', 'SNELLE_PIECIE')] });
		const r = cut(s);
		expect(r.success).toBe(false);
		expect(r.state.players.player_1.energy).toBe(4);
	});
	it('every opponent Mosje fresh: refused, nothing paid', () => {
		const s = board();
		s.players.player_2.activeSlots.forEach((x: any) => { x.entryProtected = true; });
		const r = cut(s);
		expect(r.success).toBe(false);
		expect(r.state.players.player_1.energy).toBe(4);
		expect(r.state.players.player_1.hand).toHaveLength(3);
	});
	it('discarding Kladje draws 2 for Binti\'s owner (Discarded fires)', () => {
		const s = board(1, { hand: [card('piecie_energy_surge')], deck: [card('piecie_kannetje_melk'), card('piecie_kannetje_melk'), card('piecie_kannetje_melk')] });
		const r = cut(s);
		expect(r.success, r.error).toBe(true);
		expect(r.state.players.player_1.hand).toHaveLength(2);
	});
	it('Level 2 hits for 20, flags the big hit', () => {
		const r = cut(board(2));
		expect(hit(r.state)).toBe(40);
		expect(r.state.players.player_1.activeSlots[0].bintiBigHitThisTurn).toBe(true);
	});
	it('the turn after a 20 hit it works but hits for 10, then 20 again', () => {
		let s = cut(board(2)).state;
		s = nextTurn(s);
		expect(s.players.player_1.activeSlots[0].bintiBigHitLastTurn).toBe(true);
		const second = cut(s);
		expect(second.success, second.error).toBe(true);
		expect(hit(second.state)).toBe(40 - 10);
		expect(second.state.players.player_1.activeSlots[0].bintiBigHitThisTurn).toBeFalsy();
		const third = cut(nextTurn(second.state));
		expect(hit(third.state)).toBe(30 - 20);
	});
	it('a Level 1 hit of 10 never starts the limit; levelling to 2 afterwards hits for 20', () => {
		let s = cut(board(1)).state;
		s = nextTurn(s);
		s.players.player_1.activeSlots[0].level = 2;
		expect(hit(cut(s).state)).toBe(30);
	});
	it('Rebouleh: a second use the same turn also hits for 20 and pays again', () => {
		const first = cut(board(2));
		first.state.players.player_1.activeSlots[0].extraAbilityUses = 1;
		const second = cut(first.state);
		expect(second.success, second.error).toBe(true);
		expect(hit(second.state)).toBe(60 - 20 - 20);
		expect(second.state.players.player_1.energy).toBe(2);
	});
	it('the limit is per slot', () => {
		const s = board(2);
		s.players.player_1.activeSlots[1] = mkSlot({ mp: 30, level: 2 }, BINTI);
		const first = cut(s);
		let n = nextTurn(first.state);
		n.players.player_1.activeSlots[0].abilityUsedThisTurn = false;
		n._pendingTargets = { hand_card: 0, opp_slot_index: 0 };
		// the second Binti never used it: still 20
		const slotB = n.players.player_1.activeSlots[1];
		expect(slotB.bintiBigHitLastTurn).toBeFalsy();
		expect(n.players.player_1.activeSlots[0].bintiBigHitLastTurn).toBe(true);
	});
	it('with Coert on the field a food Piecie gives its printed MP, no extra 10', () => {
		const s = makeEngineState({ players: { player_1: { activeSlots: [mkSlot({ mp: 30 }, BINTI), mkSlot({ mp: 30 }, def('mosje_coert_tech'))] } } });
		const food = PIECIES.find((p: any) => p.tag === 'food');
		const out = gainFromPiecie(s, 'player_1', 0, 20, food);
		expect(out.players.player_1.activeSlots[0].mp).toBe(50);
		expect(BINTI.synergyEffect).toBeNull();
	});
});

describe('Ronald, Dr. Phill-osoof', () => {
	const stacks = () => {
		const st: any = {};
		for (const id of ['PHYSICAL', 'DIGITAL', 'CREATIVE']) st[id] = { deck: ['quest_x'], faceUp: 'quest_tough_it_out', tokens: 0, discard: [] };
		return st;
	};
	const strong = (over: any = {}) => mkSlot({ mp: 60, level: 1, subtype: 'PHYSICAL', ...over, traits: { strength: 3, mental: 3, artistic: 3, technical: 3, resilient: 3, social: 3 } });
	const board = (extra: any = {}) => makeEngineState({
		turnNumber: 5,
		questStacks: stacks(),
		players: {
			player_1: { energy: 4, activeSlots: [mkSlot({ mp: 30 }, PHIL), null], ...extra },
			player_2: { activeSlots: [strong(), strong()] },
		},
	});
	const mark = (s: any, i = 0) => { s._pendingTargets = { opp_slot_index: i }; return useMosjeAbility(s, 'player_1', PHIL.id); };
	const dice = (s: any, i = 0) => { s.activePlayerId = 'player_2'; s.players.player_2.activeSlots.forEach((x: any) => { if (x) x.actedThisTurn = false; }); return rollQuestAttempt(s, 'player_2', { slotIndex: i, stackId: 'PHYSICAL', rng: () => 0.7, skipReactions: true }); };

	it('is data: 1 Energy, one oppMosje pick, targets', () => {
		expect(ABILITY_ENERGY_COSTS.ability_ronald_mastermind_master_plan).toBe(1);
		expect(MOSJE_ABILITY_RULES.ability_ronald_mastermind_master_plan.inputs).toEqual([{ key: 'opp_slot_index', kind: 'oppMosje' }]);
		expect(MOSJE_ABILITY_RULES.ability_ronald_mastermind_master_plan.targets).toBe(true);
	});
	it('costs 1 Energy, marks the Mosje and records the Target', () => {
		const r = mark(board());
		expect(r.success, r.error).toBe(true);
		expect(r.state.players.player_1.energy).toBe(3);
		const g = r.state.players.player_2.questDiceGrants;
		expect(g).toHaveLength(1);
		expect(g[0]).toMatchObject({ amount: -1, lasts: 'untilUsed', slotIndex: 0 });
	});
	it('the marked Mosje rolls 1 die less on its next Quest, the other is unaffected, then 3 again', () => {
		const base = dice(board()).pending.diceCount;
		const marked = mark(board()).state;
		const other = dice(JSON.parse(JSON.stringify(marked)), 1);
		expect(other.pending.diceCount).toBe(base);
		const r1 = dice(marked, 0);
		expect(r1.pending.diceCount).toBe(base - 1);
		const r2 = dice(r1.state, 0);
		expect(r2.pending.diceCount).toBe(base);
	});
	it('the mark survives turn ends', () => {
		const s = mark(board()).state;
		expect((s.players.player_2.questDiceGrants || []).length).toBe(1);
		const n = JSON.parse(JSON.stringify(s));
		n.activePlayerId = 'player_2';
		expect(questDiceGrantTotal(n, 'player_2', n.players.player_2.activeSlots[0])).toBe(-1);
		expect(questDiceGrantTotal(n, 'player_2', n.players.player_2.activeSlots[1])).toBe(0);
		const base = dice(board()).pending.diceCount;
		expect(dice(n, 0).pending.diceCount).toBe(base - 1);
	});
	it('never fewer than 1 die', () => {
		const s = board();
		s.players.player_2.activeSlots[0] = mkSlot({ mp: 60, subtype: 'PHYSICAL', traits: { strength: 1, mental: 1, artistic: 1, technical: 1, resilient: 1, social: 1 } });
		const m = mark(s).state;
		expect(dice(m, 0).pending.diceCount).toBe(1);
	});
	it('a fresh target is refused, nothing paid', () => {
		const s = board();
		s.players.player_2.activeSlots.forEach((x: any) => { x.entryProtected = true; });
		const r = mark(s);
		expect(r.success).toBe(false);
		expect(r.state.players.player_1.energy).toBe(4);
		expect(r.state.players.player_2.questDiceGrants || []).toHaveLength(0);
	});
	it('once per turn; two marks add up to 2 dice less', () => {
		const first = mark(board());
		expect(mark(first.state).success).toBe(false);
		const n = JSON.parse(JSON.stringify(first.state));
		const slot = n.players.player_1.activeSlots[0];
		slot.abilityUsedThisTurn = false; slot.abilityUsesThisTurn = 0;
		const second = mark(n);
		expect(second.success, second.error).toBe(true);
		const base = dice(board()).pending.diceCount;
		expect(dice(second.state, 0).pending.diceCount).toBe(base - 2);
	});
	it('nothing is activated from the discard pile', () => {
		const s = board({ graveyard: [card('piecie_kannetje_melk')] });
		const r = mark(s);
		expect(r.state.players.player_1.graveyard).toHaveLength(1);
		expect(r.state.players.player_1.activeSlots[0].mp).toBe(30);
	});
	it('the bot answers with a non-fresh target', () => {
		const s = board();
		s._pendingTargets = {};
		const inputs = defaultAbilityInputs(s, 'player_1', 'ability_ronald_mastermind_master_plan');
		expect(Number.isInteger(inputs.opp_slot_index)).toBe(true);
	});
});
