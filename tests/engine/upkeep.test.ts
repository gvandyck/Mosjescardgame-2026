// @ts-nocheck
// Phase 70-07 (D-21): Upkeep = at the start of the owner's turn pay 1 Energy or discard the card.
import { describe, it, expect, afterEach } from 'vitest';
import { startTurn, endTurn } from '../../src/engine/turnManager.js';
import { createMosjeSlot } from '../../src/engine/mp/createMosjeSlot.js';
import { resolvePendingChoice } from '../../src/engine/mosje/resolvePendingChoice.js';
import { attachToMosje } from '../../src/engine/attachments/attachToMosje.js';
import { PIECIES } from '../../src/data/piecies.js';
import { MOSJES } from '../../src/data/mosjes.js';
import { runUpkeep } from '../../src/engine/durations/runUpkeep.js';
import { getPileCards } from '../../src/engine/pile/getPileCards.js';
import { makeEngineState } from '../helpers/makeEngineState.js';

const m = MOSJES.find(x => x.id === 'mosje_alyssa_bulldozer'); // no random turn-start roll (MOSJES[0] has a Chaos Roll)
const [A, B] = PIECIES.slice(0, 2).map(p => p.id);
const flagged = [];
const flag = (id) => { const d = PIECIES.find(p => p.id === id); d.upkeep = true; flagged.push(d); };
afterEach(() => { while (flagged.length) delete flagged.pop().upkeep; });

const filler = { cardId: 'piecie_x', type: 'PIECIE' };
const slotCard = (cardId) => ({ cardId, type: 'PIECIE', faceDown: false, activated: true, playedOnTurn: 1, stays: true });
const mk = (energy = 3) => {
	const st = makeEngineState({ turnNumber: 4 });
	st.players.player_1.activeSlots[0] = createMosjeSlot(m);
	st.players.player_2.activeSlots[0] = createMosjeSlot(m);
	st.players.player_1.deck = [filler, filler, filler];
	st.players.player_1.energy = energy;
	return st;
};
const pay = { label: 'Pay 1 Energy', pay: true };
const drop = { label: 'Discard', pay: false };

describe('Upkeep', () => {
	it('asks the owner: pay 1 Energy or discard; paying keeps the card', () => {
		flag(A);
		const st = mk(3);
		st.players.player_1.piecieSlots[0] = slotCard(A);
		const out = startTurn(st); // +1 Energy -> 4
		expect(out.pendingChoice.hook).toBe('upkeep');
		expect(out.pendingChoice.playerId).toBe('player_1');
		expect(out.pendingChoice.options).toEqual([pay, drop]);
		const r = resolvePendingChoice(out, pay);
		expect(r.ok).toBe(true);
		expect(r.state.pendingChoice).toBeUndefined();
		expect(r.state.players.player_1.energy).toBe(3);
		expect(r.state.players.player_1.piecieSlots[0].cardId).toBe(A);
	});

	it('discard sends it to the pile and costs nothing', () => {
		flag(A);
		const st = mk(3);
		st.players.player_1.piecieSlots[0] = slotCard(A);
		const out = startTurn(st);
		const r = resolvePendingChoice(out, drop);
		expect(r.state.players.player_1.energy).toBe(4);
		expect(r.state.players.player_1.piecieSlots[0]).toBeNull();
		expect(getPileCards(r.state.players.player_1).some(c => c.cardId === A)).toBe(true);
	});

	it('0 Energy: no pause, the card is discarded', () => {
		flag(A);
		const st = mk(0);
		st.players.player_1.piecieSlots[0] = slotCard(A);
		const out = runUpkeep(st, 'player_1'); // called as the last turn-start step, after the +1 Energy
		expect(out.pendingChoice).toBeUndefined();
		expect(out.players.player_1.piecieSlots[0]).toBeNull();
		expect(getPileCards(out.players.player_1).some(c => c.cardId === A)).toBe(true);
	});

	it('an attachment with Upkeep is asked too, and discarding drops it from the Mosje', () => {
		flag(B);
		const st = mk(3);
		attachToMosje(st, 'player_1', 0, B);
		const out = startTurn(st);
		expect(out.pendingChoice.hook).toBe('upkeep');
		const r = resolvePendingChoice(out, drop);
		expect(r.state.players.player_1.activeSlots[0].attachments.length).toBe(0);
		expect(getPileCards(r.state.players.player_1).some(c => c.cardId === B)).toBe(true);
	});

	it('two Upkeep cards are asked one after the other, Energy is checked again', () => {
		flag(A); flag(B);
		const st = mk(0); // +1 at turn start -> exactly 1 Energy
		st.players.player_1.piecieSlots[0] = slotCard(A);
		st.players.player_1.piecieSlots[1] = slotCard(B);
		const first = startTurn(st);
		expect(first.players.player_1.energy).toBe(1);
		expect(first.pendingChoice.hook).toBe('upkeep');
		const second = resolvePendingChoice(first, pay);
		expect(second.state.players.player_1.energy).toBe(0);
		expect(second.state.pendingChoice).toBeUndefined(); // no Energy left: the second is discarded without a question
		expect(second.state.players.player_1.piecieSlots[0].cardId).toBe(A);
		expect(second.state.players.player_1.piecieSlots[1]).toBeNull();
	});

	it('two Upkeep cards with Energy to spare: a second question follows', () => {
		flag(A); flag(B);
		const st = mk(3);
		st.players.player_1.piecieSlots[0] = slotCard(A);
		st.players.player_1.piecieSlots[1] = slotCard(B);
		const first = startTurn(st);
		const second = resolvePendingChoice(first, pay);
		expect(second.state.pendingChoice.hook).toBe('upkeep');
		const done = resolvePendingChoice(second.state, pay);
		expect(done.state.pendingChoice).toBeUndefined();
		expect(done.state.players.player_1.energy).toBe(2);
	});

	it("the opponent's turn start asks nothing; the bot default (first option) pays", () => {
		flag(A);
		const st = mk(3);
		st.players.player_1.piecieSlots[0] = slotCard(A);
		st.players.player_2.deck = [filler, filler];
		const opp = endTurn(st);
		expect(opp.activePlayerId).toBe('player_2');
		const s2 = startTurn(opp);
		expect(s2.pendingChoice).toBeUndefined();
		const mine = startTurn(endTurn(s2));
		const r = resolvePendingChoice(mine, mine.pendingChoice.options[0]);
		expect(r.state.players.player_1.piecieSlots[0].cardId).toBe(A);
	});

	it('after the answers the turn start is complete: one draw, fresh flag cleared, Energy gained once', () => {
		flag(A);
		const st = mk(2);
		st.players.player_1.piecieSlots[0] = slotCard(A);
		st.players.player_1.activeSlots[0].entryProtected = true;
		const out = startTurn(st);
		const r = resolvePendingChoice(out, pay);
		const p = r.state.players.player_1;
		expect(p.hand.length).toBe(1);
		expect(p.deck.length).toBe(2);
		expect(p.activeSlots[0].entryProtected).toBeUndefined();
		expect(p.energy).toBe(2); // 2 + 1 gained - 1 paid
	});
});
