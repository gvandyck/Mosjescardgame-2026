// @ts-nocheck
// Phase 70-07 (D-21): one shared mechanism for timed effects, driven by the real endTurn / startTurn.
import { describe, it, expect } from 'vitest';
import { startTurn, endTurn } from '../../src/engine/turnManager.js';
import { createMosjeSlot } from '../../src/engine/mp/createMosjeSlot.js';
import { getPower } from '../../src/engine/mp/getPower.js';
import { MOSJES } from '../../src/data/mosjes.js';
import { addTimedEffect } from '../../src/engine/durations/addTimedEffect.js';
import { dropTiedEffects } from '../../src/engine/durations/dropTiedEffects.js';
import { DURATIONS } from '../../src/engine/durations/durationKinds.js';
import { attachToMosje } from '../../src/engine/attachments/attachToMosje.js';
import { destroyActivePlace } from '../../src/engine/gameState.js';
import { makeEngineState } from '../helpers/makeEngineState.js';

const m = MOSJES.find(x => x.id === 'mosje_alyssa_bulldozer'); // no random turn-start roll (MOSJES[0] has a Chaos Roll)
const other = MOSJES.find(x => x.id !== m.id);
const filler = { cardId: 'piecie_x', type: 'PIECIE' };

const mk = () => {
	const st = makeEngineState({ activePlace: null });
	st.players.player_1.activeSlots[0] = createMosjeSlot(m);
	st.players.player_2.activeSlots[0] = createMosjeSlot(m);
	st.players.player_1.deck = [filler, filler, filler];
	st.players.player_2.deck = [filler, filler, filler];
	return st;
};
const pow = (st, pid = 'player_1', i = 0) => getPower(st.players[pid].activeSlots[i], st, pid);
const add = (st, duration, extra = {}) => addTimedEffect(st, {
	target: { playerId: 'player_1', slotIndex: 0, cardId: m.id }, kind: 'power', amount: 10, duration, ownerId: 'player_1', ...extra,
});

describe('durations', () => {
	it('instant is refused and nothing is stored', () => {
		const st = mk();
		const r = add(st, DURATIONS.INSTANT);
		expect(r.ok).toBe(false);
		expect((st.timedEffects || []).length).toBe(0);
	});

	it('this turn: counts now, gone after this endTurn', () => {
		let st = mk();
		const base = pow(st);
		expect(add(st, DURATIONS.THIS_TURN).ok).toBe(true);
		expect(pow(st)).toBe(base + 10);
		st = endTurn(st);
		expect(pow(st)).toBe(base);
		expect(st.timedEffects.length).toBe(0);
	});

	it('until the end of your next turn, added on my own turn: survives my end, opponent turn, gone after my next end', () => {
		let st = mk();
		const base = pow(st);
		add(st, DURATIONS.UNTIL_END_OF_NEXT_TURN);
		st = endTurn(st); // my end: this is not my NEXT turn
		expect(pow(st)).toBe(base + 10);
		st = startTurn(st);
		expect(pow(st)).toBe(base + 10);
		st = endTurn(st); // opponent end
		expect(pow(st)).toBe(base + 10);
		st = startTurn(st);
		expect(pow(st)).toBe(base + 10);
		st = endTurn(st); // my next end
		expect(pow(st)).toBe(base);
	});

	it('until the end of your next turn, added by me on the opponent turn: gone after my next end', () => {
		let st = mk();
		st.activePlayerId = 'player_2';
		const base = pow(st);
		add(st, DURATIONS.UNTIL_END_OF_NEXT_TURN);
		expect(pow(st)).toBe(base + 10);
		st = endTurn(st); // opponent end
		expect(pow(st)).toBe(base + 10);
		st = startTurn(st);
		st = endTurn(st); // my end
		expect(pow(st)).toBe(base);
	});

	it("during your opponent's next turn: not on my turn, counts from their start, gone after their end", () => {
		let st = mk();
		const base = pow(st);
		add(st, DURATIONS.OPPONENT_NEXT_TURN);
		expect(pow(st)).toBe(base);
		st = endTurn(st);
		expect(pow(st)).toBe(base);
		st = startTurn(st);
		expect(pow(st)).toBe(base + 10);
		st = endTurn(st);
		expect(pow(st)).toBe(base);
		expect(st.timedEffects.length).toBe(0);
	});

	it('while attached: counts while the attachment is on the Mosje, gone when replaced or when the Mosje leaves', () => {
		const st = mk();
		const base = pow(st);
		attachToMosje(st, 'player_1', 0, 'gear_a');
		attachToMosje(st, 'player_1', 0, 'gear_b');
		add(st, DURATIONS.WHILE_ATTACHED, { tie: 'gear_a' });
		expect(pow(st)).toBe(base + 10);
		attachToMosje(st, 'player_1', 0, 'gear_c', { replaceIndex: 0 }); // gear_a replaced
		dropTiedEffects(st, { playerId: 'player_1', slotIndex: 0, attachmentCardId: 'gear_a' });
		expect(pow(st)).toBe(base);
		expect(st.timedEffects.length).toBe(0);

		const st2 = mk();
		attachToMosje(st2, 'player_1', 0, 'gear_a');
		add(st2, DURATIONS.WHILE_ATTACHED, { tie: 'gear_a' });
		st2.players.player_1.activeSlots[0] = null; // the Mosje left
		st2.players.player_1.activeSlots[0] = createMosjeSlot(other);
		expect(pow(st2)).toBe(getPower(createMosjeSlot(other), st2, 'player_1'));
		const out = endTurn(st2);
		expect(out.timedEffects.length).toBe(0);
	});

	it('while the Place stays: counts while it is the active Place, gone when destroyed', () => {
		let st = mk();
		st.activePlace = 'place_the_gym';
		st.activePlacePlayedBy = 'player_1';
		const base = pow(st);
		add(st, DURATIONS.WHILE_PLACE_STAYS, { tie: 'place_the_gym' });
		expect(pow(st)).toBe(base + 10);
		st = destroyActivePlace(st);
		expect(st.timedEffects.length).toBe(0);
		expect(pow(st)).toBe(getPower(st.players.player_1.activeSlots[0], st, 'player_1'));
	});

	it('two effects add up', () => {
		const st = mk();
		const base = pow(st);
		add(st, DURATIONS.THIS_TURN);
		add(st, DURATIONS.UNTIL_END_OF_NEXT_TURN, { amount: 5 });
		expect(pow(st)).toBe(base + 15);
	});

	it('an effect on a Mosje that left never applies to a new Mosje in the same slot, and is removed at the next expiry', () => {
		let st = mk();
		add(st, DURATIONS.UNTIL_END_OF_NEXT_TURN);
		st.players.player_1.activeSlots[0] = createMosjeSlot(other);
		const fresh = getPower(createMosjeSlot(other), st, 'player_1');
		expect(pow(st)).toBe(fresh);
		st = endTurn(st);
		expect(st.timedEffects.length).toBe(0);
	});

	it('the old boost fields still give the same Power', () => {
		const st = mk();
		const base = pow(st);
		st.players.player_1.activeSlots[0].powerBoostThisTurn = 10;
		expect(pow(st)).toBe(base + 10);
		st.players.player_1.activeSlots[0].powerBoostUntilOwnerTurnEnd = { amount: 5, ownerId: 'player_1' };
		expect(pow(st)).toBe(base + 15);
	});
});
