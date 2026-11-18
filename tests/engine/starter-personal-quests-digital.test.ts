// @ts-nocheck
// Phase 71-19 (D-34): the four Digital starter Personal Quests, each on its own Needs, Pay and Roll against the real
// attempt. Expected values come from docs/obby-2.0/handover/card-list.md, not from the data file.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { pqWorld, attempt, expectWin, expectFail, card, FILLER, names } from '../helpers/personalQuestKit.js';
import { clearTestDice } from '../../src/engine/dice/testDiceQueue.js';

vi.mock('../../src/engine/deckEngine.js', async (importOriginal) => {
	const m = await importOriginal();
	return { ...m, shuffleDeck: vi.fn((cards) => [...cards].reverse()) };
});
afterEach(() => clearTestDice());

const copy = (s) => JSON.parse(JSON.stringify(s));
const refused = (s, id, re) => {
	const before = copy(s);
	const r = attempt(s, id, [], {});
	expect(r.ok).toBe(false);
	if (re) expect(r.error).toMatch(re);
	expect(r.state).toEqual(before);
};

describe('Headshot (pq_headshot)', () => {
	const ID = 'pq_headshot';
	const w = (o = {}) => pqWorld({ cardId: ID, type: 'DIGITAL', stars: 3, ready: ['piecie_keyboard'], ...o });
	it('refused without a ready gear Piecie', () => refused(w({ ready: [] }), ID, /Needs/));
	it('attached gear counts as ready gear, and nothing is paid', () => {
		const r = attempt(w({ ready: [], attached: ['piecie_keyboard'], energy: 3 }), ID, [6, 1, 1]);
		expect(r.state.players.player_1.energy).toBe(3);
		expect(r.pending.diceCount).toBe(3);
		expectWin(r, ID, expect);
	});
	it('Roll: one die showing exactly 6 wins; 5, 5, 5 does not', () => {
		expectWin(attempt(w(), ID, [2, 6, 3]), ID, expect);
		expectFail(attempt(w(), ID, [5, 5, 5]), ID, expect);
	});
	it('a fail discards the gear named under Needs', () => {
		const lose = attempt(w(), ID, [5, 5, 5]);
		expect(names(lose.state.players.player_1)).toEqual(['piecie_keyboard']);
		expect(lose.state.players.player_1.piecieSlots[0]).toBeNull();
	});
	it('a Physical Mosje cannot attempt it', () => refused(pqWorld({ cardId: ID, type: 'PHYSICAL', ready: ['piecie_keyboard'] }), ID, /digital/i));
});

describe('Vibe Coded (pq_vibe_coded)', () => {
	const ID = 'pq_vibe_coded';
	const w = (o = {}) => pqWorld({ cardId: ID, type: 'DIGITAL', stars: 3, ready: ['piecie_mouse'], ...o });
	it('refused without a ready gear Piecie', () => refused(w({ ready: [] }), ID, /Needs/));
	it('attached gear counts', () => {
		expectWin(attempt(w({ ready: [], attached: ['piecie_mouse'] }), ID, [3, 3, 1]), ID, expect);
	});
	it('Roll: any two dice the same win (2, 2, 5); 1, 3, 6 does not', () => {
		expectWin(attempt(w(), ID, [2, 2, 5]), ID, expect);
		expectWin(attempt(w(), ID, [5, 1, 5]), ID, expect);
		expectFail(attempt(w(), ID, [1, 3, 6]), ID, expect);
	});
	it('a fail discards the ready gear; no Pay is taken', () => {
		const lose = attempt(w({ energy: 4 }), ID, [1, 3, 6]);
		expect(names(lose.state.players.player_1)).toEqual(['piecie_mouse']);
		expect(lose.state.players.player_1.energy).toBe(4);
	});
});

describe('World Record Run (pq_world_record_run)', () => {
	const ID = 'pq_world_record_run';
	const w = (hand) => pqWorld({ cardId: ID, type: 'DIGITAL', stars: 2, hand });
	it('no Needs: attemptable with nothing on the field', () => {
		const r = attempt(w([card('piecie_keyboard'), card('piecie_mouse')]), ID, [4, 4]);
		expect(r.ok).toBe(true);
	});
	it('Pay: 2 gear Piecies from the hand are discarded', () => {
		const r = attempt(w([card('piecie_keyboard'), FILLER, card('piecie_mouse')]), ID, [4, 4]);
		expect(names(r.state.players.player_1)).toEqual(['piecie_keyboard', 'piecie_mouse']);
		expect(r.state.players.player_1.hand.map(c => c.cardId)).toEqual(['piecie_affoe']);
		expectWin(r, ID, expect);
	});
	it('refused with 1 gear Piecie in the hand', () => refused(w([card('piecie_keyboard'), FILLER]), ID, /matching|Needs/i));
	it('a non-gear card cannot be paid, even when named', () => {
		const s = w([card('piecie_keyboard'), card('piecie_kannetje_melk')]);
		refused(s, ID, /matching|Needs/i);
		const named = attempt(w([card('piecie_keyboard'), card('piecie_mouse'), card('piecie_kannetje_melk')]), ID, [], { handCardIds: ['piecie_keyboard', 'piecie_kannetje_melk'] });
		expect(named.ok).toBe(false);
	});
	it('Roll: two dice of 4+', () => {
		expectFail(attempt(w([card('piecie_keyboard'), card('piecie_mouse')]), ID, [6, 3]), ID, expect);
		expectWin(attempt(w([card('piecie_keyboard'), card('piecie_mouse')]), ID, [5, 6]), ID, expect);
	});
});

describe('Aloha Tech Support (pq_aloha_tech_support)', () => {
	const ID = 'pq_aloha_tech_support';
	const five = Array.from({ length: 5 }, () => FILLER);
	const w = (o = {}) => pqWorld({ cardId: ID, type: 'DIGITAL', stars: 2, ready: ['piecie_keyboard'], hand: five, energy: 4, ...o });
	it('refused with only 4 other cards in hand (the Personal Quest itself does not count)', () => {
		refused(w({ hand: five.slice(0, 4) }), ID, /Needs/);
	});
	it('refused with 5 others and no ready gear', () => refused(w({ ready: [] }), ID, /Needs/));
	it('refused with 1 Energy', () => refused(w({ energy: 1 }), ID, /Energy/i));
	it('Pay: 2 Energy', () => {
		const r = attempt(w(), ID, [4, 4]);
		expect(r.state.players.player_1.energy).toBe(2);
		expectWin(r, ID, expect);
	});
	it('Roll: two dice of 4+; a fail discards the gear and keeps the Energy spent', () => {
		const lose = attempt(w(), ID, [6, 3]);
		expectFail(lose, ID, expect);
		expect(lose.state.players.player_1.energy).toBe(2);
		expect(names(lose.state.players.player_1)).toEqual(['piecie_keyboard']);
	});
});
