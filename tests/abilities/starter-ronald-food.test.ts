// @ts-nocheck
// Phase 71-04: Ronald, The Master Chef's first-food bonus and Ronnie's Kitchen, on the real engine through activatePiecie.
import { describe, it, expect } from 'vitest';
import { activatePiecie, endTurn, startTurn } from '../../src/engine/turnManager.js';
import { afterPiecieEffect } from '../../src/engine/piecies/afterPiecieEffect.js';
import { getFoodBonus } from '../../src/engine/mp/getFoodBonus.js';
import { createMosjeSlot } from '../../src/engine/mp/createMosjeSlot.js';
import { MOSJES } from '../../src/data/mosjes.js';
import { PIECIES } from '../../src/data/piecies.js';
import { makePiecieState } from '../helpers/makePiecieState.js';

const KITCHEN = 'place_ronnies_kitchen';
const CHEF = 'mosje_ronald_chef';
const slotOf = (id: string, mp = 20, level = 1, fresh = false) => {
	const s = createMosjeSlot(MOSJES.find((m: any) => m.id === id), { level, mp });
	s.entryProtected = fresh;
	return s;
};
const card = (i: number) => ({ cardId: 'piecie_pot_of_weed', type: 'PIECIE', i });
const readyPiecie = (cardId: string) => ({ cardId, type: 'PIECIE', faceDown: true, activated: false, playedOnTurn: 1, canActivateOnTurn: 2 });
const def = (id: string) => PIECIES.find((p: any) => p.id === id);

// player_1: slot 0 = `first`, slot 1 = `second`; piecie slots hold `piecies` (ready); energy 6.
function board(piecies: string[], first = 'mosje_coert_tech', second: string | null = null, opts: any = {}) {
	const s: any = makePiecieState({ piecieId: piecies[0] });
	s.players.player_1.activeSlots = [slotOf(first, opts.mp ?? 20, 1, opts.fresh), second ? slotOf(second, 50) : null];
	s.players.player_1.piecieSlots = [0, 1, 2, 3].map(i => (piecies[i] ? readyPiecie(piecies[i]) : null));
	s.players.player_1.energy = 6;
	s.players.player_1.deck = Array.from({ length: 5 }, (_, i) => card(i));
	s.players.player_1.hand = [];
	s._pendingTargets = {};
	if (opts.kitchen) s.activePlace = KITCHEN;
	return s;
}
const run = (s: any, slot = 0) => {
	const r = activatePiecie(s, 'player_1', slot);
	expect(r.success, r.error).toBe(true);
	return r.state;
};
const mp = (s: any, i = 0) => s.players.player_1.activeSlots[i].mp;
const ctx = (s: any, playerId: string, cardId: string) => ({ state: s, playerId, cardDef: def(cardId), targetPlayerId: playerId, slotIndex: 0 });

describe('Ronald, The Master Chef: first food Piecie each turn', () => {
	it('first Kannetje Melk gives 35, the second the same turn 25', () => {
		let s = board(['piecie_kannetje_melk', 'piecie_kannetje_melk'], 'mosje_coert_tech', CHEF);
		s = run(s, 0);
		expect(mp(s)).toBe(55);
		s = run(s, 1);
		expect(mp(s)).toBe(80);
	});
	it('next turn the first one gives 35 again', () => {
		let s = board(['piecie_kannetje_melk'], 'mosje_coert_tech', CHEF);
		s = run(s, 0);
		s = startTurn(endTurn(endTurn(s)));
		s.players.player_1.piecieSlots[1] = readyPiecie('piecie_kannetje_melk');
		const before = mp(s);
		s = run(s, 1);
		expect(mp(s)).toBe(before + 35);
	});
	it('the gain may go to the Chef himself too (any own Mosje)', () => {
		const s = run(board(['piecie_kannetje_melk'], CHEF));
		expect(mp(s)).toBe(55);
	});
	it('a first food Piecie that gives no MP (Late Night Doner) uses the bonus up', () => {
		let s = board(['piecie_broodje_doner', 'piecie_kannetje_melk'], 'mosje_coert_tech', CHEF);
		s = run(s, 0);
		expect(mp(s)).toBe(20);
		s = run(s, 1);
		expect(mp(s)).toBe(45);
	});
	it('Varkenspootjes on a non-Binti loses 15, adds nothing, and uses the bonus up', () => {
		let s = board(['piecie_varkenspootjes', 'piecie_kannetje_melk'], 'mosje_coert_tech', CHEF);
		s._pendingTargets = { any_target: { playerId: 'player_1', slotIndex: 0 } };
		s = run(s, 0);
		expect(mp(s)).toBe(5);
		s = run(s, 1);
		expect(mp(s)).toBe(30);
	});
	it('Ronald, Dr. Phill-osoof gives no such bonus', () => {
		const s = run(board(['piecie_kannetje_melk'], 'mosje_coert_tech', 'mosje_ronald_mastermind'));
		expect(mp(s)).toBe(45);
	});
	it('a non-food Piecie that gives MP gets nothing and does not use the bonus up', () => {
		const keyboard = PIECIES.find((p: any) => p.tag !== 'food' && /keyboard/i.test(p.id));
		let s = board([keyboard.id, 'piecie_kannetje_melk'], 'mosje_coert_tech', CHEF);
		s = run(s, 0);
		expect(s.players.player_1.foodActivatedThisTurn || 0).toBe(0);
		const before = mp(s);
		s = run(s, 1);
		expect(mp(s)).toBe(before + 35);
	});
	it('a free activation counts as the first food Piecie (one counter, T-71-05)', () => {
		const s = board(['piecie_kannetje_melk'], 'mosje_coert_tech', CHEF);
		const out = afterPiecieEffect(s, 'player_1', -1, def('piecie_kannetje_melk'), {}, { free: true }).state;
		expect(out.players.player_1.foodActivatedThisTurn).toBe(1);
		expect(getFoodBonus(ctx(out, 'player_1', 'piecie_kannetje_melk'))).toBe(0);
	});
});

describe("Ronnie's Kitchen", () => {
	it('every food Piecie gives 10 more, also the second in a turn', () => {
		let s = board(['piecie_kannetje_melk', 'piecie_kannetje_melk'], 'mosje_coert_tech', null, { kitchen: true });
		s = run(s, 0);
		expect(mp(s)).toBe(55);
		s = run(s, 1);
		expect(mp(s)).toBe(90);
	});
	it('gives the bonus to the opponent as well', () => {
		const s = board(['piecie_kannetje_melk'], 'mosje_coert_tech', null, { kitchen: true });
		expect(getFoodBonus(ctx(s, 'player_2', 'piecie_kannetje_melk'))).toBe(10);
	});
	it('a fresh Mosje gets no bonus', () => {
		const s = run(board(['piecie_kannetje_melk'], 'mosje_coert_tech', null, { kitchen: true, fresh: true }));
		expect(mp(s)).toBe(45);
	});
	it('Varkenspootjes on a Binti gives 50', () => {
		const s0 = board(['piecie_varkenspootjes'], 'mosje_binti', null, { kitchen: true, mp: 10 });
		s0._pendingTargets = { any_target: { playerId: 'player_1', slotIndex: 0 } };
		expect(mp(run(s0))).toBe(60);
	});
	it('a non-food Piecie gets no bonus', () => {
		const s = board(['piecie_kannetje_melk'], 'mosje_coert_tech', null, { kitchen: true });
		const nonFood = PIECIES.find((p: any) => p.tag !== 'food');
		expect(getFoodBonus({ ...ctx(s, 'player_1', 'piecie_kannetje_melk'), cardDef: nonFood })).toBe(0);
	});
	it('with a Ronald on your field the first food Piecie draws 1, the second does not', () => {
		let s = board(['piecie_kannetje_melk', 'piecie_kannetje_melk'], 'mosje_coert_tech', 'mosje_ronald_mastermind', { kitchen: true });
		s = run(s, 0);
		expect(s.players.player_1.hand).toHaveLength(1);
		s = run(s, 1);
		expect(s.players.player_1.hand).toHaveLength(1);
	});
	it('without a Ronald there is no draw', () => {
		const s = run(board(['piecie_kannetje_melk'], 'mosje_coert_tech', null, { kitchen: true }));
		expect(s.players.player_1.hand).toHaveLength(0);
	});
	it('without the Kitchen a Ronald does not draw', () => {
		const s = run(board(['piecie_kannetje_melk'], 'mosje_coert_tech', 'mosje_ronald_mastermind'));
		expect(s.players.player_1.hand).toHaveLength(0);
	});
	it('the opponent with a Ronald draws on their own turn', () => {
		const s: any = board(['piecie_kannetje_melk'], 'mosje_coert_tech', null, { kitchen: true });
		s.players.player_2.activeSlots = [slotOf(CHEF), null];
		s.players.player_2.deck = Array.from({ length: 3 }, (_, i) => card(i));
		s.players.player_2.hand = [];
		const out = afterPiecieEffect(s, 'player_2', -1, def('piecie_kannetje_melk'), {}, { free: false }).state;
		expect(out.players.player_2.hand).toHaveLength(1);
		expect(out.players.player_1.hand).toHaveLength(0);
	});
	it('Chef and Kitchen together: Ronald Kip gives 60 and draws 2', () => {
		const s = run(board(['piecie_ronald_kip'], 'mosje_coert_tech', CHEF, { kitchen: true }));
		expect(mp(s)).toBe(80);
		expect(s.players.player_1.hand).toHaveLength(2);
	});
});
