// @ts-nocheck
// Phase 71-02 (D-03): the step handler - a template card is a list of steps as data, run by one handler.
import { describe, it, expect } from 'vitest';
import { runCardSteps } from '../../src/engine/steps/runCardSteps.js';
import { endTurn, startTurn } from '../../src/engine/turnManager.js';
import { getPower } from '../../src/engine/mp/getPower.js';
import { createMosjeSlot } from '../../src/engine/mp/createMosjeSlot.js';
import { MOSJES } from '../../src/data/mosjes.js';
import { PIECIES } from '../../src/data/piecies.js';
import { makeEngineState } from '../helpers/makeEngineState.js';

const def = PIECIES.find((p) => p.id === 'piecie_kannetje_melk'); // has an own_slot_index target entry
const slotOf = (id, mp = 20) => {
	const s = createMosjeSlot(MOSJES.find((m) => m.id === id), { level: 1, mp });
	s.entryProtected = false;
	return s;
};
const card = (i) => ({ cardId: 'piecie_pot_of_weed', type: 'PIECIE', i });
function world({ slots = ['mosje_alyssa_bulldozer', null], deck = 3, pick } = {}) {
	const st = makeEngineState({
		activePlace: null,
		players: {
			player_1: { activeSlots: slots.map((id) => (id ? slotOf(id) : null)), deck: Array.from({ length: deck }, (_, i) => card(i)), hand: [] },
			player_2: { activeSlots: [slotOf('mosje_michelle'), null], deck: [card(1), card(2)] },
		},
	});
	if (pick !== undefined) st._pendingTargets = { own_slot_index: pick };
	return st;
}
const run = (st, steps, ctx = {}) => runCardSteps(st, 'player_1', def, ctx, steps);
const mp = (st, i = 0) => st.players.player_1.activeSlots[i].mp;
const hand = (st) => st.players.player_1.hand.length;
const pow = (st, i = 0) => getPower(st.players.player_1.activeSlots[i], st, 'player_1');

describe('runCardSteps: gainMp', () => {
	it('the picked Mosje gains', () => {
		const st = world({ slots: ['mosje_alyssa_bulldozer', 'mosje_michelle'], pick: 1 });
		const out = run(st, [{ do: 'gainMp', amount: 25 }]);
		expect(mp(out, 1)).toBe(45);
		expect(mp(out, 0)).toBe(20);
	});
	it('no pick: the first eligible Mosje gains', () => {
		expect(mp(run(world(), [{ do: 'gainMp', amount: 25 }]))).toBe(45);
	});
	it('no Mosje: nothing happens, nothing throws', () => {
		const st = world({ slots: [null, null] });
		expect(() => run(st, [{ do: 'gainMp', amount: 25 }])).not.toThrow();
	});
	it('friendAmount: a Ronald gains 30, any other Mosje 20', () => {
		const steps = [{ do: 'gainMp', amount: 20, friendAmount: { friends: ['Ronald'], amount: 30 } }];
		expect(mp(run(world({ slots: ['mosje_ronald_mastermind', null], pick: 0 }), steps))).toBe(50);
		expect(mp(run(world({ slots: ['mosje_michelle', null], pick: 0 }), steps))).toBe(40);
	});
	it('ctx.costPaidBy is the picked Mosje and no own-Mosje pick is read', () => {
		const st = world({ slots: ['mosje_alyssa_bulldozer', 'mosje_michelle'], pick: 0 });
		const out = run(st, [{ do: 'gainMp', amount: 10 }], { costPaidBy: 1 });
		expect(mp(out, 1)).toBe(30);
		expect(mp(out, 0)).toBe(20);
		expect(out._pendingTargets.own_slot_index).toBe(0); // not consumed
	});
});

describe('runCardSteps: drawCards', () => {
	const steps = [{ do: 'gainMp', amount: 30 }, { do: 'drawCards', count: 1, onlyIf: { friendOnField: ['Coert'] } }];
	it('draws with a Coert on the field (also when the gain went elsewhere)', () => {
		const out = run(world({ slots: ['mosje_alyssa_bulldozer', 'mosje_coert_tech'], pick: 0 }), steps);
		expect(hand(out)).toBe(1);
		expect(mp(out, 0)).toBe(50);
	});
	it('does not draw without a Coert', () => {
		expect(hand(run(world({ pick: 0 }), steps))).toBe(0);
	});
	it('an empty deck draws nothing', () => {
		expect(hand(run(world({ slots: ['mosje_coert_tech', null], deck: 0 }), steps))).toBe(0);
	});
	it('pickedFriend: draws only when the picked Mosje is a Chris', () => {
		const s2 = [{ do: 'gainMp', amount: 10 }, { do: 'drawCards', count: 1, onlyIf: { pickedFriend: ['Chris'] } }];
		expect(hand(run(world({ slots: ['mosje_chris', null], pick: 0 }), s2))).toBe(1);
		expect(hand(run(world({ slots: ['mosje_michelle', null], pick: 0 }), s2))).toBe(0);
	});
	it('a card with only drawCards never asks for or resolves a Mosje', () => {
		const st = world({ slots: [null, null], pick: 0 });
		const out = run(st, [{ do: 'drawCards', count: 2 }]);
		expect(hand(out)).toBe(2);
		expect(out._pendingTargets.own_slot_index).toBe(0);
		expect(out.targetedThisAction).toBeUndefined();
	});
	it('combo onlyIf follows ctx.combo', () => {
		const s2 = [{ do: 'drawCards', count: 1, onlyIf: { combo: true } }];
		expect(hand(run(world(), s2, { combo: false }))).toBe(0);
		expect(hand(run(world(), s2, { combo: true }))).toBe(1);
	});
});

describe('runCardSteps: power', () => {
	it('thisTurn: +30 now, gone after endTurn', () => {
		let st = run(world({ pick: 0 }), [{ do: 'power', amount: 30, duration: 'thisTurn' }]);
		const base = pow(world());
		expect(pow(st)).toBe(base + 30);
		st = endTurn(st);
		expect(pow(st)).toBe(base);
	});
	it('untilEndOfYourNextTurn: stays through the opponent turn and the next own turn, gone after it', () => {
		const base = pow(world());
		let st = run(world({ pick: 0 }), [{ do: 'power', amount: 30, duration: 'untilEndOfYourNextTurn' }]);
		expect(pow(st)).toBe(base + 30);
		st = endTurn(st);
		st = startTurn(st);
		expect(pow(st)).toBe(base + 30); // opponent turn
		st = endTurn(st);
		st = startTurn(st);
		expect(pow(st)).toBe(base + 30); // own next turn
		st = endTurn(st);
		expect(pow(st)).toBe(base);
	});
	it('comboAmount: +10 without Combo, +20 with', () => {
		const steps = [{ do: 'power', amount: 10, comboAmount: 20, duration: 'thisTurn' }];
		const base = pow(world());
		expect(pow(run(world({ pick: 0 }), steps, { combo: false }))).toBe(base + 10);
		expect(pow(run(world({ pick: 0 }), steps, { combo: true }))).toBe(base + 20);
	});
});

describe('runCardSteps: errors and purity', () => {
	it('an unknown step kind throws', () => {
		expect(() => run(world(), [{ do: 'gainMpp', amount: 5 }])).toThrow(/gainMpp/);
	});
	it('does not mutate the state it is given', () => {
		const st = world({ pick: 0 });
		const before = JSON.stringify(st);
		run(st, [{ do: 'gainMp', amount: 25 }]);
		expect(JSON.stringify(st)).toBe(before);
	});
});
