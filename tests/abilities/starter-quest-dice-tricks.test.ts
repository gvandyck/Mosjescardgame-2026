// @ts-nocheck
// Phase 71-09: the Piecies that change a Quest roll on the 2.1 text: Dubbele Dosis (piecie_quest_prep), Gekke Dobbel
// (piecie_loaded_dice), Dikke Plaat (piecie_dikke_plaat), Zwoele Ming Power (piecie_zwoele_ming_power) and In De Groove
// (piecie_perfect_rhythm). Real engine: activatePiecie, rollQuestAttempt, the reroll grant and endTurn.
import { describe, it, expect } from 'vitest';
import { makeEngineState } from '../helpers/makeEngineState.js';
import { mkSlot } from '../helpers/quest56.js';
import { MOSJES } from '../../src/data/mosjes.js';
import { activatePiecie, endTurn } from '../../src/engine/turnManager.js';
import { rollQuestAttempt } from '../../src/engine/quests/rollQuestAttempt.js';
import { rollPersonalQuestAttempt } from '../../src/engine/personalQuests/rollPersonalQuestAttempt.js';
import { useRerollGrant } from '../../src/engine/quests/useRerollGrant.js';
import { isBandWin } from '../../src/engine/quests/isBandWin.js';

const m = (id) => MOSJES.find((x) => x.id === id);
const phys = (id, over = {}) => mkSlot({ level: 3, mp: 60, subtype: 'PHYSICAL', levelAtTurnStart: 3, ...over }, m(id));
const ready = (cardId) => ({ cardId, type: 'PIECIE', faceDown: true, activated: false, playedOnTurn: 1, canActivateOnTurn: 2 });

function world({ a = 'mosje_michelle', b = 'mosje_jeffrey', piecies = [], faceUp = 'quest_tough_it_out', hand = [], deck = [] } = {}) {
	const stacks = {};
	for (const id of ['PHYSICAL', 'DIGITAL', 'CREATIVE']) stacks[id] = { deck: ['quest_x'], faceUp: 'quest_tough_it_out', tokens: 0, discard: [] };
	stacks.PHYSICAL.faceUp = faceUp;
	const slots = [ready, ready, ready, ready].map((_, i) => (piecies[i] ? ready(piecies[i]) : null));
	return makeEngineState({
		turnNumber: 5,
		questStacks: stacks,
		players: {
			player_1: { activeSlots: [phys(a), phys(b)], piecieSlots: slots, energy: 6, hand, deck },
			player_2: { activeSlots: [mkSlot({ mp: 40 }), null] },
		},
	});
}
const act = (s, i = 0) => {
	const r = activatePiecie(s, 'player_1', i);
	expect(r.success, r.error).toBe(true);
	return r.state;
};
const roll = (s, slotIndex = 0, rng = () => 0.7) => rollQuestAttempt(s, 'player_1', { slotIndex, stackId: 'PHYSICAL', rng, skipReactions: true });
// first die 5, every other die 2 (one success on a 4+ band)
const oneSuccess = () => { let n = 0; return () => (n++ === 0 ? 0.75 : 0.2); };
const threes = () => 0.45; // every die 3

describe('Dubbele Dosis (piecie_quest_prep)', () => {
	it('+2 dice on the next Quest roll, none on the one after, no reroll granted', () => {
		const base0 = roll(world(), 0).pending.diceCount;
		const base1 = roll(world(), 1).pending.diceCount;
		const s = act(world({ piecies: ['piecie_quest_prep'] }));
		expect(s.players.player_1.rerollGrants || []).toHaveLength(0);
		const r0 = roll(s, 0);
		expect(r0.pending.diceCount).toBe(Math.min(6, base0 + 2));
		const r1 = roll(r0.state, 1);
		expect(r1.pending.diceCount).toBe(base1);
	});
	it('unused at the end of the turn it is gone', () => {
		const s = endTurn(act(world({ piecies: ['piecie_quest_prep'] })));
		expect((s.players.player_1.questDiceGrants || []).length).toBe(0);
		expect(s.players.player_1.questExtraDice || 0).toBe(0);
	});
	it('also works on a Personal Quest roll, never past 6 dice', () => {
		const hand = [{ cardId: 'pq_charge', type: 'PERSONAL_QUEST' }];
		const args = { cardId: 'pq_charge', slotIndex: 0, rng: () => 0.7, skipReactions: true };
		const base = rollPersonalQuestAttempt(world({ hand }), 'player_1', args);
		const r = rollPersonalQuestAttempt(act(world({ hand, piecies: ['piecie_quest_prep'] })), 'player_1', args);
		expect(base.ok, base.error).toBe(true);
		expect(r.pending.diceCount).toBe(Math.min(6, base.pending.diceCount + 2));
	});
});

describe('Gekke Dobbel (piecie_loaded_dice)', () => {
	it('+1 die when Michelle rolls, +2 when Jeffrey, The Strongman rolls; no reroll', () => {
		const m0 = roll(world(), 0).pending.diceCount;
		const j1 = roll(world(), 1).pending.diceCount;
		const w = () => act(world({ piecies: ['piecie_loaded_dice'] }));
		expect(w().players.player_1.rerollGrants || []).toHaveLength(0);
		expect(roll(w(), 0).pending.diceCount).toBe(Math.min(6, m0 + 1));
		expect(roll(w(), 1).pending.diceCount).toBe(Math.min(6, j1 + 2));
	});
	it('a Jeffrey on the field who does not roll changes nothing', () => {
		const m0 = roll(world(), 0).pending.diceCount;
		const s = act(world({ piecies: ['piecie_loaded_dice'] }));
		expect(roll(s, 0).pending.diceCount).toBe(Math.min(6, m0 + 1));
	});
});

describe('Dikke Plaat (piecie_dikke_plaat)', () => {
	it('+1 die; a reroll only with DJ 80/20 (or Alyssa, Fissa Fissa!) on the field', () => {
		const base = roll(world(), 0).pending.diceCount;
		const plain = act(world({ piecies: ['piecie_dikke_plaat'] }));
		expect(plain.players.player_1.rerollGrants || []).toHaveLength(0);
		expect(roll(plain, 0).pending.diceCount).toBe(Math.min(6, base + 1));
		const dj = act(world({ b: 'mosje_dj_8020', piecies: ['piecie_dikke_plaat'] }));
		expect(dj.players.player_1.rerollGrants).toHaveLength(1);
	});
});

describe('Zwoele Ming Power (piecie_zwoele_ming_power)', () => {
	const ZWOELE = 'piecie_zwoele_ming_power';
	const base = () => world({ b: 'mosje_ming_natural', faceUp: 'quest_arm_wrestling' }); // skilled: two 4+
	it('without the card two dice of 4+ are needed: 5 and 2 fails', () => {
		expect(roll(base(), 0, oneSuccess()).pending.win).toBe(false);
	});
	it('with the card 5 and 2 wins; the Quest after it needs two again', () => {
		const s = act(world({ b: 'mosje_ming_natural', faceUp: 'quest_arm_wrestling', piecies: [ZWOELE] }));
		const r = roll(s, 0, oneSuccess());
		expect(r.pending.win).toBe(true);
		expect(r.pending.ease).toBe(1);
		expect(r.state.players.player_1.questEaseThisTurn || 0).toBe(0);
		const r2 = roll(r.state, 1, oneSuccess());
		expect(r2.pending.win).toBe(false);
	});
	it('never fewer than 1 success: a steady Quest with 3 and 3 still fails', () => {
		const s = act(world({ b: 'mosje_ming_natural', piecies: [ZWOELE] })); // tough_it_out is steady
		expect(roll(s, 0, threes).pending.win).toBe(false);
		expect(isBandWin('steady', [3, 3], 1)).toBe(false);
		expect(isBandWin('steady', [4, 3], 1)).toBe(true);
		expect(isBandWin('heroic', [5, 2], 1)).toBe(true);
		expect(isBandWin('skilled', [5, 2], 2)).toBe(true); // two copies: 2 - 2 floors at 1
		expect(isBandWin('skilled', [3, 2], 2)).toBe(false);
	});
	it('a reroll at the after-roll pause re-checks with the eased need', () => {
		const s = act(act(world({ b: 'mosje_dj_8020', faceUp: 'quest_arm_wrestling', piecies: [ZWOELE, 'piecie_dikke_plaat'] }), 0), 1);
		const r = roll(s, 0, oneSuccess());
		expect(r.pending.win).toBe(true);
		const held = JSON.parse(JSON.stringify(r.state));
		held.pendingQuestRoll = { ...r.pending, dice: [2, 2], win: false };
		expect(held.players.player_1.rerollGrants).toHaveLength(1);
		const real = Math.random;
		Math.random = () => 0.9; // the rerolled die shows 6
		try {
			expect(useRerollGrant(held, 'player_1', 0)).toBe(true);
		} finally {
			Math.random = real;
		}
		expect(held.pendingQuestRoll.dice).toEqual([6, 2]);
		expect(held.pendingQuestRoll.win).toBe(true); // one 4+ is enough under the ease
	});
	it('a Personal Quest roll is not eased and the card stays for the next general Quest', () => {
		const hand = [{ cardId: 'pq_charge', type: 'PERSONAL_QUEST' }];
		const s = act(world({ hand, b: 'mosje_ming_natural', faceUp: 'quest_arm_wrestling', piecies: [ZWOELE] }));
		const pq = rollPersonalQuestAttempt(s, 'player_1', { cardId: 'pq_charge', slotIndex: 0, rng: () => 0.7, skipReactions: true });
		expect(pq.ok, pq.error).toBe(true);
		expect(pq.pending.ease || 0).toBe(0);
		expect(pq.state.players.player_1.questEaseThisTurn).toBe(1);
	});
	it('unused at the end of the turn it is gone', () => {
		const s = endTurn(act(world({ piecies: [ZWOELE] })));
		expect(s.players.player_1.questEaseThisTurn || 0).toBe(0);
	});
	it('two copies ease by 2, still never fewer than 1', () => {
		const s = act(act(world({ b: 'mosje_ming_natural', faceUp: 'quest_arm_wrestling', piecies: [ZWOELE, ZWOELE] }), 0), 1);
		const r = roll(s, 0, oneSuccess());
		expect(r.pending.ease).toBe(2);
		expect(r.pending.win).toBe(true);
	});
	it('with a Ming on the field he gains 10 MP; without a Ming nobody does', () => {
		const withMing = act(world({ b: 'mosje_ming_natural', piecies: [ZWOELE] }));
		expect(withMing.players.player_1.activeSlots[1].mp).toBe(70);
		expect(withMing.players.player_1.activeSlots[0].mp).toBe(60);
		const without = act(world({ piecies: [ZWOELE] }));
		expect(without.players.player_1.activeSlots.map((x) => x.mp)).toEqual([60, 60]);
	});
});

describe('In De Groove (piecie_perfect_rhythm)', () => {
	const RHYTHM = 'piecie_perfect_rhythm';
	const deck = () => ['a', 'b', 'c', 'd', 'e'].map((x) => ({ cardId: 'piecie_' + x, type: 'PIECIE' }));
	const play = (b) => {
		let s = world({ b, piecies: [RHYTHM, 'piecie_tweede_kans', 'piecie_tweede_kans'], deck: deck() });
		s.players.player_1.hand = [];
		const steps = [];
		s = act(s, 0);
		steps.push(s.players.player_1.hand.length);
		for (const i of [1, 2]) {
			s = act(s, i);
			steps.push(s.players.player_1.hand.length);
		}
		s.players.player_1.piecieSlots[0] = ready('piecie_tweede_kans'); // a third Piecie after the two draws
		s = act(s, 0);
		steps.push(s.players.player_1.hand.length);
		return { s, steps };
	};
	it('the next two Piecies draw 1 each, the third does not; the card does not draw for itself', () => {
		expect(play('mosje_jeffrey').steps).toEqual([0, 1, 2, 2]);
	});
	it('with a Chris on the field he gains 10 MP each of the two times', () => {
		const { s } = play('mosje_chris');
		expect(s.players.player_1.activeSlots[1].mp).toBe(80);
	});
	it('without a Chris only the draws happen', () => {
		const { s } = play('mosje_jeffrey');
		expect(s.players.player_1.activeSlots.map((x) => x.mp)).toEqual([60, 60]);
	});
});
