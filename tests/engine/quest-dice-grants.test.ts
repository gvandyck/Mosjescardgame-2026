// @ts-nocheck
// Phase 71-02: a die bonus or malus for a later Quest roll (per Mosje or per player, this turn or until used).
import { describe, it, expect } from 'vitest';
import { makeEngineState } from '../helpers/makeEngineState.js';
import { mkSlot } from '../helpers/quest56.js';
import { MOSJES } from '../../src/data/mosjes.js';
import { addQuestDiceGrant } from '../../src/engine/quests/addQuestDiceGrant.js';
import { questDiceGrantTotal } from '../../src/engine/quests/questDiceGrantTotal.js';
import { rollQuestAttempt } from '../../src/engine/quests/rollQuestAttempt.js';
import { rollPersonalQuestAttempt } from '../../src/engine/personalQuests/rollPersonalQuestAttempt.js';
import { endTurn } from '../../src/engine/turnManager.js';
import { runCardSteps } from '../../src/engine/steps/runCardSteps.js';
import { PIECIES } from '../../src/data/piecies.js';

const m = (id) => MOSJES.find((x) => x.id === id);
const phys = (id, over = {}) => mkSlot({ level: 3, mp: 60, subtype: 'PHYSICAL', levelAtTurnStart: 3, ...over }, m(id));
function world({ a = 'mosje_michelle', b = 'mosje_jeffrey', grants = [], extra = 0, hand = [] } = {}) {
	const stacks = {};
	for (const id of ['PHYSICAL', 'DIGITAL', 'CREATIVE']) stacks[id] = { deck: ['quest_x'], faceUp: 'quest_tough_it_out', tokens: 0, discard: [] };
	return makeEngineState({
		turnNumber: 5,
		questStacks: stacks,
		players: {
			player_1: { activeSlots: [phys(a), phys(b)], hand, deck: [], questDiceGrants: grants, questExtraDice: extra },
			player_2: { activeSlots: [mkSlot({ mp: 40 }), null] },
		},
	});
}
const roll = (s, slotIndex = 0, o = {}) => rollQuestAttempt(s, 'player_1', { slotIndex, stackId: 'PHYSICAL', rng: () => 0.7, skipReactions: true, ...o });
const grantsOf = (s) => s.players.player_1.questDiceGrants || [];

describe('grant total and use', () => {
	it('a thisTurn grant adds a die to the next roll only', () => {
		const s = world({ grants: [{ amount: 1, lasts: 'thisTurn' }] });
		const base = roll(world()).pending.diceCount;
		const r1 = roll(s);
		expect(r1.pending.diceCount).toBe(base + 1);
		expect(grantsOf(r1.state)).toHaveLength(0);
		const r2 = roll(r1.state, 1);
		expect(r2.pending.diceCount).toBe(base);
	});
	it('a bound grant is used only by its Mosje', () => {
		const s = world({ grants: [{ amount: 1, lasts: 'thisTurn', slotIndex: 1, cardId: 'mosje_jeffrey' }] });
		const base = roll(world(), 0).pending.diceCount;
		const r0 = roll(s, 0);
		expect(r0.pending.diceCount).toBe(base);
		expect(grantsOf(r0.state)).toHaveLength(1);
		const r1 = roll(r0.state, 1);
		expect(r1.pending.diceCount).toBe(roll(world(), 1).pending.diceCount + 1);
		expect(grantsOf(r1.state)).toHaveLength(0);
	});
	it('friendAmount: 2 dice for a Jeffrey, else 1', () => {
		const g = [{ amount: 1, lasts: 'thisTurn', friendAmount: { friends: ['Jeffrey'], amount: 2 } }];
		const s = world({ grants: g });
		const slotJ = s.players.player_1.activeSlots[1];
		const slotM = s.players.player_1.activeSlots[0];
		expect(questDiceGrantTotal(s, 'player_1', slotJ)).toBe(2);
		expect(questDiceGrantTotal(s, 'player_1', slotM)).toBe(1);
	});
	it('a malus bound to a Mosje survives turns, is used up by its roll, and never goes under 1 die', () => {
		const g = [{ amount: -1, lasts: 'untilUsed', slotIndex: 0, cardId: 'mosje_michelle' }];
		let s = world({ grants: g });
		s.players.player_1.activeSlots[0].traits = { strength: 1, technical: 1, social: 1, resilient: 1, creative: 1 };
		s = endTurn(s);
		expect(grantsOf(s)).toHaveLength(1);
		s.activePlayerId = 'player_1';
		const r = roll(s, 0);
		expect(r.pending.diceCount).toBe(1);
		expect(grantsOf(r.state)).toHaveLength(0);
	});
	it('thisTurn grants of the active player are gone after endTurn; untilUsed stay', () => {
		const s = endTurn(world({ grants: [{ amount: 1, lasts: 'thisTurn' }, { amount: 1, lasts: 'untilUsed' }] }));
		expect(grantsOf(s).map((g) => g.lasts)).toEqual(['untilUsed']);
	});
	it('a grant whose Mosje left the slot is dropped at the next roll and adds nothing', () => {
		const s = world({ grants: [{ amount: 1, lasts: 'untilUsed', slotIndex: 0, cardId: 'mosje_somebody_else' }] });
		const r = roll(s, 0);
		expect(r.pending.diceCount).toBe(roll(world(), 0).pending.diceCount);
		expect(grantsOf(r.state)).toHaveLength(0);
	});
	it('adds up with questExtraDice and never passes 6', () => {
		const s = world({ grants: [{ amount: 5, lasts: 'thisTurn' }], extra: 5 });
		expect(roll(s).pending.diceCount).toBe(6);
		const s2 = world({ grants: [{ amount: 1, lasts: 'thisTurn' }], extra: 1 });
		expect(roll(s2).pending.diceCount).toBe(roll(world()).pending.diceCount + 2);
	});
	it('a refused roll uses no grant', () => {
		const s = world({ grants: [{ amount: 1, lasts: 'thisTurn' }] });
		const r = roll(s, 0, { stackId: 'NOPE' });
		expect(r.ok).toBe(false);
		expect(grantsOf(r.state)).toHaveLength(1);
	});
	it('the dry run before a reaction window uses no grant', () => {
		const s = world({ grants: [{ amount: 1, lasts: 'thisTurn' }] });
		const r = rollQuestAttempt(s, 'player_1', { slotIndex: 0, stackId: 'PHYSICAL', rng: () => 0.7 });
		expect(grantsOf(s)).toHaveLength(1); // the given state is untouched
		expect(r.ok).toBe(true);
	});
});

describe('Personal Quest roll', () => {
	it('uses and uses up a grant too, inside the 6-dice cap', () => {
		const hand = [{ cardId: 'pq_charge', type: 'PERSONAL_QUEST' }];
		const mk = (grants) => world({ hand, grants });
		const base = rollPersonalQuestAttempt(mk([]), 'player_1', { cardId: 'pq_charge', slotIndex: 0, rng: () => 0.7, skipReactions: true });
		const s = mk([{ amount: 1, lasts: 'thisTurn' }]);
		const r = rollPersonalQuestAttempt(s, 'player_1', { cardId: 'pq_charge', slotIndex: 0, rng: () => 0.7, skipReactions: true });
		expect(base.ok, base.error).toBe(true);
		expect(r.pending.diceCount).toBe(Math.min(6, base.pending.diceCount + 1));
		expect(grantsOf(r.state)).toHaveLength(0);
	});
});

describe('questDie step', () => {
	const def = PIECIES.find((p) => p.id === 'piecie_kannetje_melk');
	it('adds a thisTurn grant for any Mosje; on picked binds it to the picked Mosje', () => {
		const s = world();
		s._pendingTargets = { own_slot_index: 1 };
		const any = runCardSteps(world(), 'player_1', def, {}, [{ do: 'questDie', amount: 1 }]);
		expect(grantsOf(any)).toEqual([expect.objectContaining({ amount: 1, lasts: 'thisTurn' })]);
		expect(grantsOf(any)[0].slotIndex).toBeUndefined();
		const bound = runCardSteps(s, 'player_1', def, {}, [{ do: 'questDie', amount: 1, on: 'picked', lasts: 'untilUsed' }]);
		expect(grantsOf(bound)[0]).toMatchObject({ amount: 1, lasts: 'untilUsed', slotIndex: 1, cardId: 'mosje_jeffrey' });
	});
});
