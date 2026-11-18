// @ts-nocheck
// Phase 71-19 (D-34): the four Physical starter Personal Quests, each on its own Needs, Pay and Roll against the real
// attempt. Expected values come from docs/obby-2.0/handover/card-list.md, not from the data file.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { pqWorld, attempt, expectWin, expectFail, card, placed, names } from '../helpers/personalQuestKit.js';
import { mkSlot, build as buildQuest, finish } from '../helpers/quest56.js';
import { canAttemptPersonalQuest } from '../../src/engine/personalQuests/canAttemptPersonalQuest.js';
import { applyMpLossToSlot } from '../../src/engine/mp/applyMpLossToSlot.js';
import { payMpCost } from '../../src/engine/costs/payMpCost.js';
import { startTurn } from '../../src/engine/turnManager.js';
import { clearTestDice } from '../../src/engine/dice/testDiceQueue.js';

vi.mock('../../src/engine/deckEngine.js', async (importOriginal) => {
	const m = await importOriginal();
	return { ...m, shuffleDeck: vi.fn((cards) => [...cards].reverse()) };
});
afterEach(() => clearTestDice());

const copy = (s) => JSON.parse(JSON.stringify(s));
const can = (s, id, choice = {}) => canAttemptPersonalQuest(s, 'player_1', { cardId: id, slotIndex: 0, choice });
const refused = (s, id, re) => {
	const before = copy(s);
	const r = attempt(s, id, [], {});
	expect(r.ok).toBe(false);
	if (re) expect(r.error).toMatch(re);
	expect(r.state).toEqual(before);
};

describe('Charge! (pq_charge)', () => {
	const w = (mp, extra = {}) => pqWorld({ cardId: 'pq_charge', type: 'PHYSICAL', stars: 3, mp, ...extra });
	it('Needs 31+ MP: refused at 30', () => refused(w(30), 'pq_charge', /Needs/));
	// MP is always a multiple of 5 (rules), so "31+" means 35 in play: the lowest MP that can pay 30 and stay above 0.
	it('Pay 30 MP: at 35 MP the Mosje is left on 5; one die per Str star (3)', () => {
		const r = attempt(w(35), 'pq_charge', [4, 4, 1]);
		expect(r.pending.diceCount).toBe(3);
		expect(r.state.players.player_1.activeSlots[0].mp).toBe(5);
		expectWin(r, 'pq_charge', expect);
	});
	it('Roll: two dice of 4+ win, one does not; a fail leaves the Mosje at 5 MP and the card back in the deck', () => {
		const one = attempt(w(35), 'pq_charge', [6, 3, 3]);
		expectFail(one, 'pq_charge', expect);
		expect(one.state.players.player_1.activeSlots[0].mp).toBe(5);
		expectWin(attempt(w(35), 'pq_charge', [3, 4, 5]), 'pq_charge', expect);
	});
	it('a Digital Mosje cannot attempt it', () => {
		refused(pqWorld({ cardId: 'pq_charge', type: 'DIGITAL', mp: 60 }), 'pq_charge', /physical/i);
	});
});

describe('Knocked Down, Not Out (pq_knocked_down_not_out)', () => {
	const ID = 'pq_knocked_down_not_out';
	const w = (mp, o = {}) => pqWorld({ cardId: ID, type: 'PHYSICAL', stars: 1, mp, ready: ['piecie_kannetje_melk'], ...o });
	const lost = (s, how) => {
		const st = copy(s);
		const slot = st.players.player_1.activeSlots[0];
		if (how === 'attack') applyMpLossToSlot({ state: st, playerId: 'player_1', slot, amount: 5, source: 'ATTACK', byPlayerId: 'player_2' });
		if (how === 'pay') payMpCost(slot, 10); // Te Hard Gaan's MP price
		return st;
	};
	it('refused at 50+ MP when no MP was lost', () => refused(w(60), ID, /Needs/));
	it('refused at 45 MP even after a loss', () => refused(lost(w(45), 'attack'), ID, /Needs/));
	it('legal after an attack hit it (the same window and the owner\'s next turn)', () => {
		const hit = lost(w(60), 'attack');
		expect(can(hit, ID).ok).toBe(true);
		const turn = (st) => { const n = copy(st); n.activePlayerId = 'player_1'; return startTurn(n); };
		const next = turn(hit); // the owner's next turn: the window moves to "previous", still open
		expect(next.players.player_1.activeSlots[0].mpLostWindowPrev).toBe(true);
		expect(can(next, ID).ok).toBe(true);
		const later = turn(next); // one turn later the window has closed
		expect(later.players.player_1.activeSlots[0].mpLostWindowPrev).toBe(false);
		expect(can(later, ID).ok).toBe(false);
	});
	it('legal after the Mosje failed a Quest on the owner\'s last turn', () => {
		const { s, q } = buildQuest('tough_it_out', { me: mkSlot({ level: 3, mp: 80, subtype: 'PHYSICAL', levelAtTurnStart: 3 }) });
		const after = finish(s, q, false);
		const slot = after.players.player_1.activeSlots[0];
		expect(slot.mp).toBeLessThan(80);
		after.players.player_1.hand = [card(ID, 'PERSONAL_QUEST')];
		after.players.player_1.piecieSlots = [placed('piecie_kannetje_melk'), null, null];
		after.turnNumber = 5;
		expect(slot.mpLostWindowNow).toBe(true);
		expect(can(after, ID).ok).toBe(true);
	});
	it('legal after it paid an MP price (rules 13)', () => {
		expect(can(lost(w(60), 'pay'), ID).ok).toBe(true);
	});
	it('Pay: 1 ready food Piecie is discarded; with two the player picks which', () => {
		const s = lost(w(60, { ready: ['piecie_kannetje_melk', 'piecie_ronald_kip'] }), 'attack');
		const pick = { readyPiecies: [{ zone: 'slot', slotIndex: 1, cardId: 'piecie_ronald_kip' }] };
		const r = attempt(s, ID, [5], pick);
		expect(names(r.state.players.player_1)).toEqual(['piecie_ronald_kip']);
		expect(r.state.players.player_1.piecieSlots[0].cardId).toBe('piecie_kannetje_melk');
		expectWin(r, ID, expect);
	});
	it('Roll: one die of 5+ wins; a 4 does not', () => {
		expectFail(attempt(lost(w(60), 'attack'), ID, [4]), ID, expect);
		expectWin(attempt(lost(w(60), 'attack'), ID, [6]), ID, expect);
	});
	it('cannot be paid without a ready food Piecie', () => {
		refused(lost(w(60, { ready: [] }), 'attack'), ID, /food|ready/i);
	});
});

describe('Michelinster (pq_michelinster)', () => {
	const ID = 'pq_michelinster';
	const two = () => mkSlot({ mp: 40 });
	const w = (o = {}) => pqWorld({ cardId: ID, type: 'PHYSICAL', stars: 2, ready: ['piecie_ronald_kip'], hand: [card('piecie_kannetje_melk')], second: two(), ...o });
	it('refused with Ronald Kip only in the hand', () => {
		refused(w({ ready: [], hand: [card('piecie_ronald_kip'), card('piecie_kannetje_melk')] }), ID, /Needs/);
	});
	it('refused with another ready food Piecie instead of Ronald Kip', () => refused(w({ ready: ['piecie_kannetje_melk'] }), ID, /Needs/));
	it('refused with 1 Mosje on the field', () => refused(w({ second: null }), ID, /Needs/));
	it('Pay: 1 food Piecie from the hand is discarded (the player picks which)', () => {
		const hand = [card('piecie_kannetje_melk'), card('piecie_varkenspootjes')];
		const r = attempt(w({ hand }), ID, [4, 4], { handCardIds: ['piecie_varkenspootjes'] });
		expect(names(r.state.players.player_1)).toEqual(['piecie_varkenspootjes']);
		expect(r.state.players.player_1.hand.map(c => c.cardId)).toEqual(['piecie_kannetje_melk']);
		expectWin(r, ID, expect);
	});
	it('refused with no food Piecie in the hand to pay', () => refused(w({ hand: [card('piecie_keyboard')] }), ID, /Needs|matching/i));
	it('Roll: two dice of 4+; on a fail the ready Ronald Kip is discarded as well', () => {
		const lose = attempt(w(), ID, [4, 3]);
		expectFail(lose, ID, expect);
		const p1 = lose.state.players.player_1;
		expect(names(p1).sort()).toEqual(['piecie_kannetje_melk', 'piecie_ronald_kip']);
		expect(p1.piecieSlots[0]).toBeNull();
		expect(p1.activeSlots[1]).toBeTruthy();
		const win = attempt(w(), ID, [5, 4]);
		expectWin(win, ID, expect);
		expect(win.state.players.player_1.piecieSlots[0].cardId).toBe('piecie_ronald_kip');
	});
});

describe('Sterke Jongen (pq_sterke_jongen)', () => {
	const ID = 'pq_sterke_jongen';
	const w = (o = {}) => pqWorld({ cardId: ID, type: 'PHYSICAL', stars: 2, place: 'place_the_gym', ready: ['piecie_keyboard'], ...o });
	it('refused without the Gym in play (De Box is not enough)', () => {
		refused(w({ place: null }), ID, /Needs/);
		refused(w({ place: 'place_de_box' }), ID, /Needs/);
	});
	it('Pay: 1 ready gear Piecie; attached Dumbbells count and can be the one paid', () => {
		const s = w({ ready: [], attached: ['piecie_dumbbells'] });
		const r = attempt(s, ID, [4, 4, 1]);
		expect(r.state.players.player_1.activeSlots[0].attachments).toEqual([]);
		expect(names(r.state.players.player_1)).toEqual(['piecie_dumbbells']);
		expectWin(r, ID, expect);
	});
	it('refused without any ready gear Piecie to pay', () => refused(w({ ready: [] }), ID, /gear|ready/i));
	it('Roll: two dice of 4+, with the Gym\'s extra die (2 Str stars + 1 = 3 dice)', () => {
		const lose = attempt(w(), ID, [6, 3, 2]);
		expect(lose.pending.diceCount).toBe(3);
		expectFail(lose, ID, expect);
		expect(lose.state.activePlace).toBe('place_the_gym');
		expectWin(attempt(w(), ID, [4, 1, 5]), ID, expect);
	});
});
