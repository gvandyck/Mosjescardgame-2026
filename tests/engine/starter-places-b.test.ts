// @ts-nocheck
// Phase 71-18 (D-32, D-04): the last two starter Places on the real engine: Youri's Woonkamer (place_youris_woonkamer)
// and Punto Banco (place_punto_banco). After this plan no starter effect is pending.
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { makeEngineState } from '../helpers/makeEngineState.js';
import { mkSlot } from '../helpers/quest56.js';
import { MOSJES } from '../../src/data/mosjes.js';
import { PIECIES } from '../../src/data/piecies.js';
import { rollQuestAttempt } from '../../src/engine/quests/rollQuestAttempt.js';
import { rollPersonalQuestAttempt } from '../../src/engine/personalQuests/rollPersonalQuestAttempt.js';
import { resolveReaction } from '../../src/engine/reactions/resolveReaction.js';
import { activatePiecie, resolvePiecieActivation, startTurn } from '../../src/engine/turnManager.js';
import { applyPuntoBanco } from '../../src/abilities/place/applyPuntoBanco.js';
import { PENDING_STARTER_EFFECTS } from '../../src/data/pendingStarterEffects.js';

beforeEach(() => { vi.spyOn(Math, 'random').mockReturnValue(0.5); });
afterEach(() => vi.restoreAllMocks());

const m = (id) => MOSJES.find((x) => x.id === id);
const YOURI = 'mosje_youri', CHRIS = 'mosje_chris', MICHELLE = 'mosje_michelle', JEFFREY = 'mosje_jeffrey';
const slotOf = (id, over = {}) => mkSlot({ level: 3, levelAtTurnStart: 3, mp: 60, subtype: m(id).subtype, entryProtected: false, ...over }, m(id));
const withStars = (s, traits) => { s.traits = { strength: 2, technical: 2, artistic: 2, mental: 2, resilient: 2, social: 2, ...traits }; return s; };
const world = (place, slots = [null, null], extra = {}) => {
	const stacks = {};
	for (const id of ['PHYSICAL', 'DIGITAL', 'CREATIVE']) stacks[id] = { deck: ['quest_x'], faceUp: 'quest_arm_wrestling', tokens: 0, discard: [] };
	return makeEngineState({
		turnNumber: 5, activePlayerId: 'player_1', activePlace: place, activePlacePlayedBy: 'player_1', questStacks: stacks,
		players: { player_1: { activeSlots: slots, energy: 6, hand: [], deck: [{ cardId: 'piecie_kannetje_melk', type: 'PIECIE' }, { cardId: 'piecie_kannetje_melk', type: 'PIECIE' }], ...extra }, player_2: { activeSlots: [mkSlot({ mp: 40 }), null], energy: 6 } },
	});
};
// a die face d as the rng value that rolls it
const face = (d) => (d - 0.5) / 6;
const seq = (...dice) => { const q = dice.map(face); return () => (q.length ? q.shift() : 0.7); };

describe('the pending list is empty', () => {
	it('no starter effect is pending', () => {
		expect(PENDING_STARTER_EFFECTS).toEqual([]);
	});
});

describe("Youri's Woonkamer (place_youris_woonkamer)", () => {
	const pie = (turn, ready = turn) => ({ cardId: 'piecie_momentum_diefje', type: 'PIECIE', faceDown: true, activated: false, playedOnTurn: turn, canActivateOnTurn: ready });
	const board = (slots, pieces, place = 'place_youris_woonkamer', extra = {}) => world(place, slots, { piecieSlots: [...pieces, null, null, null].slice(0, 4), ...extra });
	const handAfter = (st, slotIndex = 0, playerId = 'player_1') => {
		const r = activatePiecie(st, playerId, slotIndex, { skipReactions: true });
		expect(r.success, r.error).toBe(true);
		return r.state.players[playerId].hand.length;
	};
	const gain = (slots, pieces, extra = {}) => handAfter(board(slots, pieces, 'place_youris_woonkamer', extra)) - handAfter(board(slots, pieces, null, extra));

	it('a Piecie activated on the turn it was placed, with a Youri on the field: draw 1', () => {
		expect(gain([slotOf(YOURI), null], [pie(5)])).toBe(1);
	});
	it('once per turn: the second Piecie that turn draws nothing, next turn it works again', () => {
		const st = board([slotOf(YOURI), null], [pie(5), pie(5)]);
		const a = activatePiecie(st, 'player_1', 0, { skipReactions: true });
		const b = activatePiecie(a.state, 'player_1', 1, { skipReactions: true });
		const noPlace = (() => {
			const s = board([slotOf(YOURI), null], [pie(5), pie(5)], null);
			return activatePiecie(activatePiecie(s, 'player_1', 0, { skipReactions: true }).state, 'player_1', 1, { skipReactions: true }).state.players.player_1.hand.length;
		})();
		expect(b.state.players.player_1.hand.length - noPlace).toBe(1);
		const next = JSON.parse(JSON.stringify(b.state));
		next.turnNumber = 6;
		next.players.player_1.piecieSlots[2] = pie(6);
		const c = activatePiecie(next, 'player_1', 2, { skipReactions: true });
		const cWithout = JSON.parse(JSON.stringify(next));
		cWithout.activePlace = null;
		const d = activatePiecie(cWithout, 'player_1', 2, { skipReactions: true });
		expect(c.state.players.player_1.hand.length - d.state.players.player_1.hand.length).toBe(1);
	});
	it('a Piecie placed on an earlier turn draws nothing', () => {
		expect(gain([slotOf(YOURI), null], [pie(4, 5)])).toBe(0);
	});
	it('a Piecie activated straight from the hand (not placed) draws nothing', () => {
		const def = PIECIES.find((p) => p.id === 'piecie_momentum_diefje');
		const draw = (place) => resolvePiecieActivation(world(place, [slotOf(YOURI), null]), 'player_1', -1, def, { free: true }).state.players.player_1.hand.length;
		expect(draw('place_youris_woonkamer') - draw(null)).toBe(0);
	});
	it('no Youri on the activator field: no draw, also when the opponent has one', () => {
		expect(gain([slotOf(CHRIS), null], [pie(5)])).toBe(0);
		const st = board([slotOf(CHRIS), null], [pie(5)]);
		st.players.player_2.activeSlots = [slotOf(YOURI), null];
		expect(handAfter(st)).toBe(handAfter(board([slotOf(CHRIS), null], [pie(5)], null)));
	});
	it('the opponent with a Youri gets the draw on their own turn', () => {
		const mk = (place) => {
			const st = world(place, [slotOf(CHRIS), null]);
			st.activePlayerId = 'player_2';
			st.players.player_2.activeSlots = [slotOf(YOURI), null];
			st.players.player_2.piecieSlots = [pie(5), null, null, null];
			st.players.player_2.deck = [{ cardId: 'piecie_kannetje_melk', type: 'PIECIE' }, { cardId: 'piecie_kannetje_melk', type: 'PIECIE' }];
			st.players.player_2.hand = [];
			return st;
		};
		expect(handAfter(mk('place_youris_woonkamer'), 0, 'player_2') - handAfter(mk(null), 0, 'player_2')).toBe(1);
	});
	it('an empty deck: no draw, no error', () => {
		const st = board([slotOf(YOURI), null], [pie(5)], 'place_youris_woonkamer', { deck: [] });
		expect(handAfter(st)).toBe(0);
	});
});

describe('Punto Banco (place_punto_banco)', () => {
	const phys = () => [withStars(slotOf(MICHELLE), { strength: 2 }), withStars(slotOf(JEFFREY), { strength: 2 })];
	const Q = (puntoBanco, rng, slotIndex = 0, extra = {}) => ({ slotIndex, stackId: 'PHYSICAL', rng, skipReactions: true, puntoBanco, ...extra });
	const base = () => rollQuestAttempt(world(null, phys()), 'player_1', Q(undefined, () => 0.7));
	const energyOf = (res) => res.state.players.player_1.energy;

	it('call Punto, Punto wins (5 vs 2): 1 Energy paid, 2 dice more', () => {
		const b = base();
		const r = rollQuestAttempt(world('place_punto_banco', phys()), 'player_1', Q('punto', seq(5, 2)));
		expect(r.ok).toBe(true);
		expect(r.pending.diceCount).toBe(b.pending.diceCount + 2);
		expect(energyOf(r)).toBe(energyOf(b) - 1);
		expect(r.pending.puntoBanco).toEqual({ call: 'punto', punto: 5, banco: 2, result: 'won' });
	});
	it('call Banco with 5 vs 2: lost, 1 Energy spent, no extra dice', () => {
		const b = base();
		const r = rollQuestAttempt(world('place_punto_banco', phys()), 'player_1', Q('banco', seq(5, 2)));
		expect(r.pending.diceCount).toBe(b.pending.diceCount);
		expect(energyOf(r)).toBe(energyOf(b) - 1);
		expect(r.pending.puntoBanco.result).toBe('lost');
	});
	it('call Banco with Banco higher (2 vs 5): won', () => {
		const b = base();
		const r = rollQuestAttempt(world('place_punto_banco', phys()), 'player_1', Q('banco', seq(2, 5)));
		expect(r.pending.diceCount).toBe(b.pending.diceCount + 2);
		expect(r.pending.puntoBanco.result).toBe('won');
	});
	it('a tie (4 vs 4): the Energy is back, no extra dice', () => {
		const b = base();
		const r = rollQuestAttempt(world('place_punto_banco', phys()), 'player_1', Q('punto', seq(4, 4)));
		expect(r.pending.diceCount).toBe(b.pending.diceCount);
		expect(energyOf(r)).toBe(energyOf(b));
		expect(r.pending.puntoBanco.result).toBe('tie');
	});
	it('the gamble dice come before the Quest dice', () => {
		const r = rollQuestAttempt(world('place_punto_banco', phys()), 'player_1', Q('punto', seq(5, 2, 1, 1, 1, 1, 1, 1)));
		expect(r.pending.dice.every((d) => d === 1)).toBe(true);
	});
	it('once per turn per player; next turn it works again', () => {
		const first = rollQuestAttempt(world('place_punto_banco', phys()), 'player_1', Q('punto', seq(5, 2)));
		const b = base();
		const second = rollQuestAttempt(first.state, 'player_1', Q('punto', seq(5, 2), 1));
		expect(second.pending.diceCount).toBe(b.pending.diceCount);
		expect(second.pending.puntoBanco).toBeUndefined();
		expect(energyOf(second)).toBe(energyOf(first)); // arm wrestling costs nothing
		const next = JSON.parse(JSON.stringify(first.state));
		next.turnNumber += 1;
		next.players.player_1.activeSlots.forEach((s) => { if (s) s.actedThisTurn = false; });
		const again = rollQuestAttempt(next, 'player_1', Q('punto', seq(5, 2), 1));
		expect(again.pending.puntoBanco.result).toBe('won');
	});
	it('the opponent can use it on their own turn', () => {
		const st = world('place_punto_banco', [null, null]);
		st.activePlayerId = 'player_2';
		st.players.player_2.activeSlots = phys();
		const r = rollQuestAttempt(st, 'player_2', Q('punto', seq(6, 1)));
		expect(r.pending.puntoBanco.result).toBe('won');
		expect(r.state.players.player_2.energy).toBe(5);
		expect(r.state.players.player_1.energy).toBe(6);
	});
	it('with 0 Energy, with another Place, or with a forged call the option is ignored', () => {
		const b = base();
		const poor = world('place_punto_banco', phys());
		poor.players.player_1.energy = 0;
		const r0 = rollQuestAttempt(poor, 'player_1', Q('punto', seq(5, 2)));
		expect(r0.pending.puntoBanco).toBeUndefined();
		expect(r0.pending.diceCount).toBe(b.pending.diceCount);
		const other = rollQuestAttempt(world('place_the_gym', phys()), 'player_1', Q('punto', seq(5, 2)));
		expect(other.pending.puntoBanco).toBeUndefined();
		for (const bad of ['both', 'PUNTO', 1, true, {}, null]) {
			const r = rollQuestAttempt(world('place_punto_banco', phys()), 'player_1', Q(bad, seq(5, 2)));
			expect(r.pending.puntoBanco).toBeUndefined();
			expect(energyOf(r)).toBe(energyOf(b));
		}
	});
	it('a roll without the option uses no die for the gamble', () => {
		const used = [];
		const rng = () => { used.push(1); return 0.7; };
		const r = rollQuestAttempt(world('place_punto_banco', phys()), 'player_1', Q(undefined, rng));
		expect(used).toHaveLength(r.pending.diceCount);
	});
	it('the extra dice stay within the 6-dice cap', () => {
		const slots = phys();
		slots[0].traits.strength = 6;
		const r = rollQuestAttempt(world('place_punto_banco', slots), 'player_1', Q('punto', seq(5, 2)));
		expect(r.pending.diceCount).toBe(6);
	});
	it('works on a Personal Quest roll the same way', () => {
		const PQC = { cardId: 'pq_charge', type: 'PERSONAL_QUEST' };
		const opts = (pb, rng) => ({ cardId: 'pq_charge', slotIndex: 0, skipReactions: true, puntoBanco: pb, rng });
		const b = rollPersonalQuestAttempt(world(null, phys(), { hand: [PQC] }), 'player_1', opts(undefined, () => 0.7));
		const r = rollPersonalQuestAttempt(world('place_punto_banco', phys(), { hand: [PQC] }), 'player_1', opts('punto', seq(5, 2)));
		expect(r.ok, r.error).toBe(true);
		expect(r.pending.diceCount).toBe(Math.min(6, b.pending.diceCount + 2));
		expect(r.state.players.player_1.energy).toBe(b.state.players.player_1.energy - 1);
		expect(r.pending.puntoBanco.result).toBe('won');
	});
	it('a refused attempt pays nothing and uses nothing up', () => {
		const st = world('place_punto_banco', phys());
		const refused = rollQuestAttempt(st, 'player_1', Q('punto', seq(5, 2), 2)); // no such slot
		expect(refused.ok).toBe(false);
		expect(st.players.player_1.energy).toBe(6);
		expect(st.players.player_1.puntoBancoTurn).toBeUndefined();
		const ok = rollQuestAttempt(refused.state, 'player_1', Q('punto', seq(5, 2), 0));
		expect(ok.pending.puntoBanco.result).toBe('won');
	});
	it('T-71-26: a held roll (before-roll window) and its replay run the gamble once', () => {
		const b = base();
		const st = world('place_punto_banco', phys());
		st.players.player_2.hand = [{ cardId: 'snelle_emergency_healings', type: 'SNELLE_PIECIE' }];
		Math.random.mockReset();
		Math.random.mockReturnValueOnce(face(5)).mockReturnValueOnce(face(2)).mockReturnValue(0.7);
		const held = rollQuestAttempt(st, 'player_1', Q('punto', () => 0.5, 0, { skipReactions: false }));
		expect(held.state.pendingReaction).toBeTruthy();
		expect(held.state.players.player_1.energy).toBe(6);
		expect(held.state.players.player_1.puntoBancoTurn).toBeUndefined();
		const done = resolveReaction(held.state, 'player_2', null);
		expect(done.pending.diceCount).toBe(b.pending.diceCount + 2);
		expect(done.state.players.player_1.energy).toBe(energyOf(b) - 1);
		expect(done.pending.puntoBanco).toMatchObject({ call: 'punto', punto: 5, banco: 2, result: 'won' });
	});
});

describe('applyPuntoBanco', () => {
	it('returns no extra dice and changes nothing for another Place', () => {
		const st = world('place_the_gym', [null, null]);
		expect(applyPuntoBanco(st, 'player_1', 'punto', () => 0.9)).toEqual({ extraDice: 0 });
		expect(st.players.player_1.energy).toBe(6);
	});
});
