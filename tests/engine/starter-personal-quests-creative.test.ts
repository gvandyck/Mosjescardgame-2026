// @ts-nocheck
// Phase 71-19 (D-34): the four Creative starter Personal Quests, each on its own Needs, Pay and Roll against the real
// attempt. Expected values come from docs/obby-2.0/handover/card-list.md, not from the data file.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { pqWorld, attempt, expectWin, expectFail, card, FILLER, diceOf, names } from '../helpers/personalQuestKit.js';
import { mkSlot } from '../helpers/quest56.js';
import { rollPersonalQuestAttempt } from '../../src/engine/personalQuests/rollPersonalQuestAttempt.js';
import { resolvePersonalQuestAttempt } from '../../src/engine/personalQuests/resolvePersonalQuestAttempt.js';
import { resolveReaction } from '../../src/engine/reactions/resolveReaction.js';
import { pushTestDice, clearTestDice } from '../../src/engine/dice/testDiceQueue.js';

vi.mock('../../src/engine/deckEngine.js', async (importOriginal) => {
	const m = await importOriginal();
	return { ...m, shuffleDeck: vi.fn((cards) => [...cards].reverse()) };
});
afterEach(() => clearTestDice());

const copy = (s) => JSON.parse(JSON.stringify(s));
const refused = (s, id, re, choice = {}) => {
	const before = copy(s);
	const r = attempt(s, id, [], choice);
	expect(r.ok).toBe(false);
	if (re) expect(r.error).toMatch(re);
	expect(r.state).toEqual(before);
};

describe("Beginner's Luck (pq_beginners_luck)", () => {
	const ID = 'pq_beginners_luck';
	const w = (o = {}) => pqWorld({ cardId: ID, type: 'CREATIVE', stars: 2, energy: 3, ...o });
	it('no Needs; Pay 1 Energy, refused with 0', () => {
		refused(w({ energy: 0 }), ID, /Energy/i);
		const r = attempt(w(), ID, [6, 1]);
		expect(r.state.players.player_1.energy).toBe(2);
		expect(r.pending.diceCount).toBe(2);
	});
	it('Roll: exactly one 6 wins; no 6 fails and the Energy is not given back', () => {
		expectWin(attempt(w(), ID, [1, 6]), ID, expect);
		const lose = attempt(w(), ID, [5, 5]);
		expectFail(lose, ID, expect);
		expect(lose.state.players.player_1.energy).toBe(2);
	});
});

describe('Binti Brandt (pq_binti_brandt)', () => {
	const ID = 'pq_binti_brandt';
	const w = (o = {}) => pqWorld({ cardId: ID, type: 'CREATIVE', stars: 2, oppHand: 2, hand: [card('piecie_keyboard')], ...o });
	it('refused when the opponent has 3 cards in hand; legal at 2 and at 0', () => {
		refused(w({ oppHand: 3 }), ID, /Needs/);
		expect(attempt(w({ oppHand: 2 }), ID, [4, 4]).ok).toBe(true);
		expect(attempt(w({ oppHand: 0 }), ID, [4, 4]).ok).toBe(true);
	});
	it('Pay: 1 Piecie from the hand', () => {
		const r = attempt(w(), ID, [4, 4]);
		expect(names(r.state.players.player_1)).toEqual(['piecie_keyboard']);
		expect(r.state.players.player_1.hand).toHaveLength(0);
		expectWin(r, ID, expect);
	});
	it('a Snelle or a Place cannot be paid', () => {
		refused(w({ hand: [card('snelle_sleutelpuntje', 'SNELLE_PIECIE')] }), ID, /matching|Needs/i);
		refused(w({ hand: [card('place_skiffa', 'PLACE')] }), ID, /matching|Needs/i);
	});
	it('paying Kladje: its owner draws 2', () => {
		const deck = [card('piecie_affoe'), card('piecie_keyboard'), card('piecie_mouse')];
		const r = attempt(w({ hand: [card('piecie_energy_surge')], deck }), ID, [4, 4]);
		expect(names(r.state.players.player_1)).toEqual(['piecie_energy_surge']);
		expect(r.state.players.player_1.hand).toHaveLength(2);
	});
	it('Roll: two dice of 4+', () => {
		expectFail(attempt(w(), ID, [6, 3]), ID, expect);
		expectWin(attempt(w(), ID, [4, 6]), ID, expect);
	});
});

describe('High Roller (pq_high_roller)', () => {
	const ID = 'pq_high_roller';
	const w = (o = {}) => pqWorld({ cardId: ID, type: 'CREATIVE', stars: 3, energy: 6, ...o });
	const cases = [[0, 3], [2, 4], [4, 5], [6, 6], [3, 4]];
	for (const [paid, dice] of cases) {
		it(`${paid} Energy paid rolls ${dice} dice (3 Art stars)`, () => {
			const r = attempt(w(), ID, diceOf(dice, [5, 5]), { energy: paid });
			expect(r.ok).toBe(true);
			expect(r.pending.diceCount).toBe(dice);
			expect(r.state.players.player_1.energy).toBe(6 - paid);
		});
	}
	it('never more than 6 dice, also with another die bonus', () => {
		const r = attempt(w({ p1: { questExtraDice: 2 } }), ID, diceOf(6, [5, 5]), { energy: 4 });
		expect(r.pending.diceCount).toBe(6);
	});
	it('refused when more Energy is paid than the player has', () => refused(w({ energy: 2 }), ID, /Energy/i, { energy: 4 }));
	it('no Needs: attemptable paying 0 Energy', () => expect(attempt(w(), ID, diceOf(3, []), { energy: 0 }).ok).toBe(true));
	it('Roll: two dice of 5+ win; 4, 4, 6 does not', () => {
		expectWin(attempt(w(), ID, [5, 2, 6], { energy: 0 }), ID, expect);
		expectFail(attempt(w(), ID, [4, 4, 6], { energy: 0 }), ID, expect);
	});
});

describe('Lucky Crescendo (pq_lucky_crescendo)', () => {
	const ID = 'pq_lucky_crescendo';
	const w = (o = {}) => pqWorld({ cardId: ID, type: 'CREATIVE', stars: 2, place: 'place_skiffa', ...o });
	it('refused without Skiffa in play', () => refused(w({ place: null }), ID, /Needs/));
	it('no Pay is taken; Roll: two dice of 5+', () => {
		const r = attempt(w({ energy: 4 }), ID, [5, 6]);
		expect(r.state.players.player_1.energy).toBe(4);
		expectWin(r, ID, expect);
		expectFail(attempt(w(), ID, [5, 4]), ID, expect);
	});
	it('a Creative roller in Skiffa may reroll 1 die, and that turns a fail into a win', () => {
		clearTestDice();
		pushTestDice([5, 2]);
		const r = rollPersonalQuestAttempt(w(), 'player_1', { cardId: ID, slotIndex: 0 });
		expect(r.reactionPending).toBe(true);
		expect(r.state.pendingQuestRoll.win).toBe(false);
		expect(r.state.pendingReaction.eligible).toContain('piecieReroll:1');
		pushTestDice([6]);
		const re = resolveReaction(r.state, 'player_1', 'piecieReroll:1');
		expect(re.ok).toBe(true);
		expect(re.state.pendingQuestRoll.dice).toEqual([5, 6]);
		expect(re.state.pendingQuestRoll.win).toBe(true);
		expectWin({ ok: true, ...resolvePersonalQuestAttempt(re.state, null) }, ID, expect);
	});
});

describe('rerolls from outside work on these rolls', () => {
	it('DJ 80/20 rerolls his owner\'s Personal Quest roll (Beginner\'s Luck)', () => {
		const dj = mkSlot({ mp: 40, level: 1 });
		dj.cardId = 'mosje_dj_8020';
		clearTestDice();
		pushTestDice([2, 3]);
		const s = pqWorld({ cardId: 'pq_beginners_luck', type: 'CREATIVE', stars: 2, second: dj });
		const r = rollPersonalQuestAttempt(s, 'player_1', { cardId: 'pq_beginners_luck', slotIndex: 0 });
		expect(r.reactionPending).toBe(true);
		expect(r.state.pendingReaction.eligible).toContain('djReroll:0');
		pushTestDice([6]);
		const re = resolveReaction(r.state, 'player_1', 'djReroll:0');
		expect(re.state.pendingQuestRoll.dice).toEqual([6, 3]);
		expect(re.state.pendingQuestRoll.win).toBe(true);
	});
	it('Je Weet Niet: the opponent rerolls all the dice of a Personal Quest roll', () => {
		const s = pqWorld({ cardId: 'pq_beginners_luck', type: 'CREATIVE', stars: 2, p2: { hand: [card('snelle_jeweetniet', 'SNELLE_PIECIE')] } });
		clearTestDice();
		pushTestDice([6, 1]);
		const r = rollPersonalQuestAttempt(s, 'player_1', { cardId: 'pq_beginners_luck', slotIndex: 0 });
		expect(r.reactionPending).toBe(true);
		expect(r.state.pendingReaction.eligible).toContain('snelle_jeweetniet');
		expect(r.state.pendingQuestRoll.win).toBe(true);
		pushTestDice([3, 4]);
		const re = resolveReaction(r.state, 'player_2', 'snelle_jeweetniet');
		expect(re.ok).toBe(true);
		expect(re.state.pendingQuestRoll.dice).toEqual([3, 4]);
		expect(re.state.pendingQuestRoll.win).toBe(false);
	});
});
