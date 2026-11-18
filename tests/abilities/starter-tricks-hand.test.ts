// @ts-nocheck
// Phase 71-08: the hand and draw tricks on the 2.1 text: Kladje (piecie_energy_surge), Stookerino, Those Eyelashes Tho...,
// Boosterpackkie, Larry / Zegeltje, Bagga of Greed, Zie je die Dingetjes, TemPiecie. Real engine through activatePiecie.
import { describe, it, expect, afterEach } from 'vitest';
import { activatePiecie } from '../../src/engine/turnManager.js';
import { resolvePendingChoice } from '../../src/engine/mosje/resolvePendingChoice.js';
import { createMosjeSlot } from '../../src/engine/mp/createMosjeSlot.js';
import { pushTestDice, clearTestDice, shiftTestDie } from '../../src/engine/dice/testDiceQueue.js';
import { discardFromHand } from '../../src/engine/hand/discardFromHand.js';
import { MOSJES } from '../../src/data/mosjes.js';
import { PIECIES } from '../../src/data/piecies.js';
import { makePiecieState } from '../helpers/makePiecieState.js';

afterEach(() => clearTestDice());

const slotOf = (id: string, mp = 50) => {
	const s = createMosjeSlot(MOSJES.find((m: any) => m.id === id), { level: 1, mp });
	s.entryProtected = false;
	return s;
};
const c = (cardId: string, type = 'PIECIE') => ({ cardId, type, faceDown: false });
const KLADJE = 'piecie_energy_surge';
const PQ = { cardId: 'personal_quest_x', type: 'PERSONAL_QUEST', faceDown: false };

function board(piecieId: string, mut: any = () => {}) {
	const s: any = makePiecieState({ piecieId });
	s.players.player_1.energy = 6;
	s.players.player_1.deck = [c('piecie_a'), c('piecie_b'), c('piecie_c'), c('piecie_d')];
	s.players.player_2.deck = [c('piecie_e'), c('piecie_f'), c('piecie_g')];
	mut(s);
	return s;
}
const act = (s: any) => { const r = activatePiecie(s, 'player_1', 0); expect(r.success, r.error).toBe(true); return r; };
const answer = (r: any, pick: string) => {
	expect(r.paused).toBe(true);
	const opt = r.state.pendingChoice.options.find((o: any) => JSON.stringify(o).includes(pick));
	expect(opt, JSON.stringify(r.state.pendingChoice.options)).toBeTruthy();
	return resolvePendingChoice(r.state, opt).state;
};
const mps = (s: any) => [0, 1].map(i => s.players.player_1.activeSlots[i]?.mp ?? null);
const ids = (xs: any[]) => xs.map((x: any) => x.cardId);

describe('Kladje', () => {
	it('draws 1 when activated, with any MP, no MP for anyone', () => {
		const s = board(KLADJE);
		const before = mps(s);
		const out = act(s).state;
		expect(out.players.player_1.hand).toHaveLength(1);
		expect(mps(out)).toEqual(before);
		expect(PIECIES.find((p: any) => p.id === KLADJE).needs).toBeUndefined();
	});
	it('draws 2 for its owner when discarded from the hand by Bagga of Greed', () => {
		const s = board('piecie_bagga_of_greed', (x: any) => { x.players.player_1.hand = [c(KLADJE)]; });
		const out = answer(act(s), KLADJE);
		expect(ids(out.players.player_1.graveyard)).toContain(KLADJE);
		expect(out.players.player_1.hand).toHaveLength(2 + 2);
	});
	it('draws 2 for its owner when the opponent discards it with Stookerino', () => {
		const s = board('piecie_stookerino', (x: any) => { x.players.player_2.hand = [c(KLADJE), c('piecie_foo')]; });
		const out = answer(act(s), KLADJE);
		expect(ids(out.players.player_2.graveyard)).toEqual([KLADJE]);
		expect(out.players.player_2.hand).toHaveLength(1 + 2);
		expect(out.players.player_1.hand).toHaveLength(0);
	});
	it('draws 2 when discarded by the owner outside any effect (a Pay or a cost)', () => {
		const s = board('piecie_stookerino', (x: any) => { x.players.player_1.hand = [c(KLADJE)]; });
		expect(discardFromHand(s, 'player_1', 0)).toBeTruthy();
		expect(s.players.player_1.hand).toHaveLength(2);
	});
	it('an empty deck draws nothing and is no error', () => {
		const s = board('piecie_stookerino', (x: any) => { x.players.player_1.deck = []; x.players.player_1.hand = [c(KLADJE)]; });
		expect(() => discardFromHand(s, 'player_1', 0)).not.toThrow();
		expect(s.players.player_1.hand).toHaveLength(0);
	});
});

describe('Stookerino', () => {
	const hand2 = (x: any) => { x.players.player_2.hand = [c('piecie_foo'), c('piecie_bar'), PQ]; };
	it('the opponent picks, no MP, nothing revealed without a Binti, Personal Quest not offered', () => {
		const s = board('piecie_stookerino', hand2);
		const before = mps(s);
		const r = act(s);
		expect(r.state.pendingChoice.playerId).toBe('player_2');
		expect(JSON.stringify(r.state.pendingChoice.options)).not.toContain('personal_quest_x');
		expect(r.state.revealed?.player_1 || []).toHaveLength(0);
		const out = answer(r, 'piecie_bar');
		expect(ids(out.players.player_2.graveyard)).toEqual(['piecie_bar']);
		expect(ids(out.players.player_2.hand)).toEqual(['piecie_foo', 'personal_quest_x']);
		expect(mps(out)).toEqual(before);
	});
	it('with a Binti on the field the activator sees the hand first, and the opponent still picks', () => {
		const s = board('piecie_stookerino', (x: any) => { hand2(x); x.players.player_1.activeSlots[1] = slotOf('mosje_binti'); });
		const r = act(s);
		expect(r.state.pendingChoice.playerId).toBe('player_2');
		expect(r.state.revealed.player_1[0].cardIds).toEqual(expect.arrayContaining(['piecie_foo', 'piecie_bar']));
	});
	it('a hand of only Personal Quests or an empty hand: nothing is discarded', () => {
		for (const hand of [[PQ], []]) {
			const s = board('piecie_stookerino', (x: any) => { x.players.player_2.hand = hand; });
			const r = act(s);
			expect(r.paused).toBeFalsy();
			expect(r.state.players.player_2.hand).toHaveLength(hand.length);
			expect(r.state.players.player_2.graveyard).toHaveLength(0);
		}
	});
});

describe('Those Eyelashes Tho...', () => {
	const withWest = (x: any) => { x.players.player_1.activeSlots[1] = slotOf('mosje_fps_west'); x.players.player_2.hand = [c('piecie_foo'), c('piecie_bar'), PQ]; };
	it('is refused without a Martin or a West, with the Need as the reason', () => {
		const r = activatePiecie(board('piecie_those_eyelashes'), 'player_1', 0);
		expect(r.success).toBe(false);
		expect(r.error).toMatch(/Martin|West/);
	});
	it('the opponent picks and discards 1 card (never a Personal Quest), no MP, no Snelle this turn', () => {
		const s = board('piecie_those_eyelashes', withWest);
		const before = mps(s);
		const r = act(s);
		expect(r.state.pendingChoice.playerId).toBe('player_2');
		expect(JSON.stringify(r.state.pendingChoice.options)).not.toContain('personal_quest_x');
		const out = answer(r, 'piecie_foo');
		expect(ids(out.players.player_2.graveyard)).toEqual(['piecie_foo']);
		expect(mps(out)).toEqual(before);
		expect(out._snelleBlocked).toBe('player_2');
	});
	it('a hand of only Personal Quests loses nothing', () => {
		const s = board('piecie_those_eyelashes', (x: any) => { withWest(x); x.players.player_2.hand = [PQ]; });
		const out = act(s).state;
		expect(out.players.player_2.hand).toHaveLength(1);
		expect(out._snelleBlocked).toBe('player_2');
	});
});

describe('Boosterpackkie', () => {
	const coert = (x: any) => { x.players.player_1.activeSlots[1] = slotOf('mosje_fps_coert'); };
	it('draws 1, no MP, and rolls no die without a Coert', () => {
		pushTestDice([6]);
		const s = board('piecie_boosterpackkie');
		const before = mps(s);
		const out = act(s).state;
		expect(out.players.player_1.hand).toHaveLength(1);
		expect(mps(out)).toEqual(before);
		expect(shiftTestDie()).toBe(6); // the queued die was never rolled
	});
	it('with a Coert (FPS Coert counts): a 5 or 6 draws 1 more, a 1-4 does not; still no MP', () => {
		for (const [die, drawn] of [[5, 2], [6, 2], [4, 1], [1, 1]]) {
			pushTestDice([die]);
			const s = board('piecie_boosterpackkie', coert);
			const before = mps(s);
			const out = act(s).state;
			expect(out.players.player_1.hand, `die ${die}`).toHaveLength(drawn);
			expect(mps(out)).toEqual(before);
		}
	});
});
describe('Larry / Zegeltje', () => {
	const run = (die: number) => {
		pushTestDice([die]);
		const s = board('piecie_larry_zegeltje', (x: any) => { x.players.player_1.hand = [c('piecie_h')]; });
		const r = act(s);
		return r.paused ? resolvePendingChoice(r.state, r.state.pendingChoice.options[0]).state : r.state;
	};
	it('1-2 loses 25 and discards nothing', () => {
		const out = run(2);
		expect(mps(out)[0]).toBe(25);
		expect(out.players.player_1.hand).toHaveLength(1);
		expect(ids(out.players.player_1.graveyard)).not.toContain('piecie_h');
	});
	it('3-4 gains 20; 5-6 gains 40 and draws 2', () => {
		expect(mps(run(3))[0]).toBe(70);
		const out = run(6);
		expect(mps(out)[0]).toBe(90);
		expect(out.players.player_1.hand).toHaveLength(3);
	});
});

describe('Bagga of Greed, Zie je die Dingetjes, TemPiecie (right as they are)', () => {
	it("Bagga draws 2, then discards 1 of the player's choice", () => {
		const s = board('piecie_bagga_of_greed', (x: any) => { x.players.player_1.hand = [c('piecie_h')]; });
		const out = answer(act(s), 'piecie_a');
		expect(out.players.player_1.hand).toHaveLength(2);
		expect(ids(out.players.player_1.graveyard)).toContain('piecie_a');
	});
	it('Zie je die Dingetjes: 1 of the top 3 to the hand, the rest back on top', () => {
		const s = board('piecie_zie_je_die_dingetjes');
		let st = answer(act(s), 'piecie_b');
		if (st.pendingChoice) st = resolvePendingChoice(st, st.pendingChoice.options.find((o: any) => JSON.stringify(o).includes('piecie_c'))).state;
		expect(ids(st.players.player_1.hand)).toEqual(['piecie_b']);
		expect(ids(st.players.player_1.deck)).toEqual(['piecie_c', 'piecie_a', 'piecie_d']);
	});
	it('TemPiecie: a discarded Piecie comes back locked this turn; a fallen Mosje is not offered', () => {
		const s = board('piecie_tempiecie', (x: any) => {
			x.players.player_1.graveyard = [
				{ cardId: 'mosje_jeffrey', type: 'MOSJE', name: 'Jeffrey', source: 'welloe' },
				{ cardId: 'piecie_h', type: 'PIECIE', name: 'H', source: 'discarded' },
				{ cardId: 'piecie_i', type: 'PIECIE', name: 'I', source: 'discarded' },
			];
		});
		const r = act(s);
		expect(JSON.stringify(r.state.pendingChoice.options)).not.toContain('mosje_jeffrey');
		const out = answer(r, 'piecie_h');
		expect(out.players.player_1.hand[0].cardId).toBe('piecie_h');
		expect(out.players.player_1.hand[0].lockedTurn).toBeTruthy();
	});
});
