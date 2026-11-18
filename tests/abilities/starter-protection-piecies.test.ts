// @ts-nocheck
// Phase 71-10: Ctrl+S (piecie_momentum_boost), Bowie & Stormey (piecie_bowie_stormey), Afblijven! (piecie_afblijven)
// and Rebouleh (piecie_redbull) on the 2.1 text and rules section 13.
import { describe, it, expect } from 'vitest';
import { activatePiecie, endTurn, useMosjeAbility } from '../../src/engine/turnManager.js';
import { loseMP, gainMP } from '../../src/engine/mpManager.js';
import { makePiecieState } from '../helpers/makePiecieState.js';
import { createMosjeSlot } from '../../src/engine/mp/createMosjeSlot.js';
import { MOSJES } from '../../src/data/mosjes.js';
import { CARD_STEPS } from '../../src/rules/cardSteps.js';
import { sweepStaysSlots } from '../../src/engine/table/sweepStaysSlots.js';
import { expireTimedEffects } from '../../src/engine/durations/expireTimedEffects.js';

const slotOf = (id: string, mp = 50, level = 1) => {
	const s = createMosjeSlot(MOSJES.find((m: any) => m.id === id), { level, mp });
	s.entryProtected = false;
	return s;
};
const filler = (n: number) => Array.from({ length: n }, () => ({ cardId: 'piecie_pot_of_weed', type: 'PIECIE' }));
function board(piecieId: string, o: any = {}) {
	const s: any = makePiecieState({ piecieId, own: o.own });
	const me = s.players.player_1;
	me.energy = o.energy ?? 6;
	me.deck = filler(6);
	me.hand = o.hand ?? [];
	s.players.player_2.deck = filler(4);
	if (o.ownSlot) me.activeSlots[0] = o.ownSlot;
	if (o.second) me.activeSlots[1] = o.second;
	s._pendingTargets = o.pick || {};
	return s;
}
const run = (s: any) => {
	const r = activatePiecie(s, 'player_1', 0);
	expect(r.success, r.error).toBe(true);
	return r.state;
};
const slot = (s: any, i = 0) => s.players.player_1.activeSlots[i];
const hit = (s: any, n: number, i = 0, source = 'ABILITY') => loseMP(s, 'player_1', i, n, source, false, 'player_2');
// move the clock: the owner's turn ends, the opponent's turn runs, the owner's next turn runs
const asTurnOf = (s: any, pid: string) => ({ ...s, activePlayerId: pid });

describe('Ctrl+S (piecie_momentum_boost)', () => {
	const lvl2 = () => board('piecie_momentum_boost', { ownSlot: slotOf('mosje_chris', 20, 2) });
	it('is a no-gain card in the step/data sense: no MP and no Quest flag', () => {
		const s = run(lvl2());
		expect(slot(s).mp).toBe(20);
		expect(slot(s).momentumBoostWin).toBeUndefined();
	});
	it('a Level 2 Mosje at 20 MP hit for 30 stays Level 2 at 0 MP, upright, twice', () => {
		let s = run(lvl2());
		s = hit(s, 30);
		expect(slot(s).level).toBe(2);
		expect(slot(s).mp).toBe(0);
		expect(slot(s).sideways).toBeFalsy();
		s = hit(s, 30);
		expect(slot(s).level).toBe(2);
		expect(slot(s).mp).toBe(0);
	});
	it('fires no Level Down hook while protected', () => {
		let s = run(lvl2());
		s.levelDownSeen = 0;
		s = hit(s, 30);
		expect(slot(s).level).toBe(2);
		expect(s.pendingChoice ?? null).toBeNull();
	});
	it('holds through the opponent turn and the owner next turn, then the next loss drops the level', () => {
		let s = run(lvl2());
		s = hit(s, 30);
		// the activation turn ends (owner's turn does not count), opponent's turn, owner's next turn
		expireTimedEffects(s, 'turnEnd', 'player_1');
		expect(slot(hit(s, 10)).level).toBe(2);
		expireTimedEffects(s, 'turnEnd', 'player_2');
		expect(slot(hit(s, 10)).level).toBe(2);
		expireTimedEffects(s, 'turnEnd', 'player_1');
		expect(s.timedEffects.some((e: any) => e.kind === 'noLevelDrop')).toBe(false);
		// still at 0 MP and Level 2 until it loses MP again
		expect(slot(s).level).toBe(2);
		expect(slot(s).mp).toBe(0);
		const after = hit(s, 10);
		expect(slot(after).level).toBe(1);
		expect(slot(after).mp).toBe(10);
	});
	it('a Level 3 Mosje at 0 MP stays Level 3', () => {
		let s = run(board('piecie_momentum_boost', { ownSlot: slotOf('mosje_chris', 20, 3) }));
		s = hit(s, 30);
		expect(slot(s).level).toBe(3);
		expect(slot(s).mp).toBe(0);
	});
	it('a Level 1 Mosje still goes sideways at 0 MP', () => {
		let s = run(board('piecie_momentum_boost', { ownSlot: slotOf('mosje_chris', 20, 1) }));
		s = hit(s, 30);
		expect(slot(s).level).toBe(1);
		expect(slot(s).sideways).toBe(true);
	});
	it('an MP gain on a protected Mosje at 0 MP works as usual', () => {
		let s = run(lvl2());
		s = hit(s, 30);
		s = gainMP(s, 'player_1', 0, 10);
		expect(slot(s).mp).toBe(10);
		expect(slot(s).level).toBe(2);
	});
	it('an unprotected Level 2 Mosje still drops to Level 1 at 10 MP', () => {
		const s = hit(board('piecie_pot_of_weed', { ownSlot: slotOf('mosje_chris', 20, 2) }), 30);
		expect(slot(s).level).toBe(1);
		expect(slot(s).mp).toBe(10);
	});
});

describe('Bowie & Stormey (piecie_bowie_stormey)', () => {
	it('is one shield step of 10, 20 for a Gandoe, Michelle or Tuk', () => {
		expect(CARD_STEPS.piecie_bowie_stormey).toEqual([{ do: 'shield', amount: 10, friendAmount: { friends: ['Gandoe', 'Michelle', 'Tuk'], amount: 20 } }]);
	});
	it('Chris: an attack for 30 takes 20 and a card effect for 15 takes 5', () => {
		const s = run(board('piecie_bowie_stormey', { ownSlot: slotOf('mosje_chris') }));
		expect(slot(hit(s, 30, 0, 'ATTACK')).mp).toBe(30);
		expect(slot(hit(s, 15)).mp).toBe(45);
	});
	it.each(['mosje_gandoe_wizard', 'mosje_dj_8020', 'mosje_michelle', 'mosje_tuk_healer'])('%s: 20 less', (id) => {
		const s = run(board('piecie_bowie_stormey', { ownSlot: slotOf(id) }));
		expect(slot(hit(s, 30)).mp).toBe(40);
	});
	it('with a Gandoe and Michelle: only the picked Michelle is covered and nobody gains MP at the next turn start', () => {
		const s = run(board('piecie_bowie_stormey', { second: slotOf('mosje_michelle'), pick: { own_slot_index: 1 } }));
		expect(slot(hit(s, 30, 0)).mp).toBe(20); // Gandoe not covered
		expect(slot(hit(s, 30, 1), 1).mp).toBe(40);
		const start = sweepStaysSlots({ ...s, turnNumber: s.turnNumber + 1 }, 'player_1', 'start');
		expect(slot(start, 0).mp).toBe(50);
		expect(slot(start, 1).mp).toBe(50);
	});
	it('lasts through the opponent turn and the owner next turn, in the pile after it', () => {
		const s = run(board('piecie_bowie_stormey', { ownSlot: slotOf('mosje_chris') }));
		expect(sweepStaysSlots(s, 'player_1', 'end').players.player_1.piecieSlots[0]).not.toBeNull();
		const later = { ...s, turnNumber: s.turnNumber + 2 };
		const gone = sweepStaysSlots(later, 'player_1', 'end');
		expect(gone.players.player_1.piecieSlots[0]).toBeNull();
		expect(gone.players.player_1.graveyard.some((g: any) => g.cardId === 'piecie_bowie_stormey')).toBe(true);
	});
});

describe('Afblijven! (piecie_afblijven)', () => {
	it('is one shield step of 20, opponent turn only', () => {
		expect(CARD_STEPS.piecie_afblijven).toEqual([{ do: 'shield', amount: 20, onlyOppTurn: true }]);
	});
	it('does nothing on the owner own turn', () => {
		const s = asTurnOf(run(board('piecie_afblijven', { ownSlot: slotOf('mosje_chris') })), 'player_1');
		expect(slot(hit(s, 30)).mp).toBe(20);
	});
	it('during the opponent turn each loss is 20 less; a loss of 15 takes 0, also an attack', () => {
		const s = asTurnOf(run(board('piecie_afblijven', { ownSlot: slotOf('mosje_chris') })), 'player_2');
		expect(slot(hit(s, 30, 0, 'ATTACK')).mp).toBe(40);
		expect(slot(hit(s, 15)).mp).toBe(50);
		expect(slot(hit(s, 15, 0, 'ATTACK')).mp).toBe(50);
		expect(slot(hit(hit(s, 30), 30)).mp).toBe(30);
	});
	it('is in the pile at the start of the owner next turn', () => {
		const s = run(board('piecie_afblijven', { ownSlot: slotOf('mosje_chris') }));
		const gone = sweepStaysSlots({ ...s, turnNumber: s.turnNumber + 1 }, 'player_1', 'start');
		expect(gone.players.player_1.piecieSlots[0]).toBeNull();
		expect(gone.players.player_1.graveyard.some((g: any) => g.cardId === 'piecie_afblijven')).toBe(true);
	});
});

describe('Rebouleh (piecie_redbull)', () => {
	const binti = () => board('piecie_redbull', {
		ownSlot: slotOf('mosje_binti', 50, 1), hand: [{ cardId: 'piecie_pot_of_weed', type: 'PIECIE' }, { cardId: 'piecie_pot_of_weed', type: 'PIECIE' }],
	});
	const cut = (s: any) => { s._pendingTargets = { hand_card: 0, opp_slot_index: 0 }; return useMosjeAbility(s, 'player_1', 'mosje_binti'); };
	it('Binti who used Cutting Words can use it again, paying 1 Energy and a Piecie again', () => {
		const first = cut(binti());
		expect(first.success, first.error).toBe(true);
		const r = activatePiecie(first.state, 'player_1', 0);
		expect(r.success, r.error).toBe(true);
		const e0 = r.state.players.player_1.energy;
		const h0 = r.state.players.player_1.hand.length;
		const second = cut(r.state);
		expect(second.success, second.error).toBe(true);
		expect(second.state.players.player_1.energy).toBe(e0 - 1);
		expect(second.state.players.player_1.hand.length).toBe(h0 - 1);
	});
	it('with no Energy the second use is refused', () => {
		const first = cut(binti());
		const r = activatePiecie(first.state, 'player_1', 0);
		r.state.players.player_1.energy = 0;
		const second = cut(r.state);
		expect(second.success).toBe(false);
		expect(second.error).toBe('Not enough Energy');
	});
});
