// @ts-nocheck
// Phase 71-17 (D-32, D-33, D-05): six starter Places on the 2.1 text, on the real engine: De Box (place_de_box), the Gym
// (place_the_gym), Coert's Caravan (place_coerts_caravan), Skiffa (place_skiffa), Woonkamer (Discord)
// (place_woonkamer_discord) and Nieuwe Gimma (place_nieuwe_gimma).
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { makeEngineState } from '../helpers/makeEngineState.js';
import { mkSlot } from '../helpers/quest56.js';
import { MOSJES } from '../../src/data/mosjes.js';
import { getPower } from '../../src/engine/mp/getPower.js';
import { QUEST_DICE_SOURCES } from '../../src/engine/quests/questDiceSources.js';
import { getPersonalQuestDice } from '../../src/engine/personalQuests/getPersonalQuestDice.js';
import { getPersonalQuestDef } from '../../src/engine/personalQuests/getPersonalQuestDef.js';
import { getEffectiveCost } from '../../src/engine/energy/getEffectiveCost.js';
import { placeSkiffaGrant } from '../../src/abilities/place/placeTurnQuestEffects.js';
import { rollQuestAttempt } from '../../src/engine/quests/rollQuestAttempt.js';
import { rollPersonalQuestAttempt } from '../../src/engine/personalQuests/rollPersonalQuestAttempt.js';
import { resolveReaction } from '../../src/engine/reactions/resolveReaction.js';
import { activatePiecie, startTurn } from '../../src/engine/turnManager.js';

beforeEach(() => { vi.spyOn(Math, 'random').mockReturnValue(0.5); });
afterEach(() => vi.restoreAllMocks());

const m = (id) => MOSJES.find((x) => x.id === id);
const GANDOE = 'mosje_gandoe_wizard', DJ = 'mosje_dj_8020', MICHELLE = 'mosje_michelle', TUK = 'mosje_tuk_healer', CHRIS = 'mosje_chris';
const slotOf = (id, over = {}) => mkSlot({ level: 2, mp: 60, subtype: m(id).subtype, entryProtected: false, ...over }, m(id));
const withStars = (s, traits) => { s.traits = { strength: 2, technical: 2, artistic: 2, mental: 2, resilient: 2, social: 2, ...traits }; return s; };
const world = (place, slots = [null, null], extra = {}) => {
	const stacks = {};
	for (const id of ['PHYSICAL', 'DIGITAL', 'CREATIVE']) stacks[id] = { deck: ['quest_x'], faceUp: 'quest_arm_wrestling', tokens: 0, discard: [] };
	stacks.DIGITAL.faceUp = 'quest_late_night_questing';
	return makeEngineState({
		turnNumber: 5, activePlayerId: 'player_1', activePlace: place, activePlacePlayedBy: 'player_1', questStacks: stacks,
		players: { player_1: { activeSlots: slots, energy: 6, deck: [{ cardId: 'piecie_kannetje_melk', type: 'PIECIE' }], ...extra }, player_2: { activeSlots: [mkSlot({ mp: 40 }), null], energy: 6 } },
	});
};
const diceBonus = (st, slot, trait) => QUEST_DICE_SOURCES.reduce((n, f) => n + f({ state: st, playerId: 'player_1', slot, quest: { rollTrait: trait } }), 0);
const powerGain = (place, slot) => getPower(slot, world(place, [slot, null]), 'player_1') - getPower(slot, world(null, [slot, null]), 'player_1');

describe('De Box (place_de_box)', () => {
	for (const id of [GANDOE, DJ, MICHELLE, TUK]) {
		it(`${id}: +10 Power and +1 die on a Quest that rolls Str`, () => {
			const s = slotOf(id);
			expect(powerGain('place_de_box', s)).toBe(10);
			expect(diceBonus(world('place_de_box', [s, null]), s, 'strength')).toBe(1);
		});
	}
	it('Chris gets neither', () => {
		const s = slotOf(CHRIS);
		expect(powerGain('place_de_box', s)).toBe(0);
		expect(diceBonus(world('place_de_box', [s, null]), s, 'strength')).toBe(0);
	});
	it('a Tech Quest has no extra die', () => {
		const s = slotOf(GANDOE);
		expect(diceBonus(world('place_de_box', [s, null]), s, 'technical')).toBe(0);
	});
	it('a fresh Mosje gets neither', () => {
		const s = slotOf(DJ, { entryProtected: true });
		expect(powerGain('place_de_box', s)).toBe(0);
		expect(diceBonus(world('place_de_box', [s, null]), s, 'strength')).toBe(0);
	});
	it('works for the other player too', () => {
		const s = slotOf(MICHELLE);
		const st = world('place_de_box', [null, null]);
		st.players.player_2.activeSlots = [s, null];
		expect(getPower(s, st, 'player_2')).toBe(getPower(s, world(null), 'player_2') + 10);
		expect(QUEST_DICE_SOURCES.reduce((n, f) => n + f({ state: st, playerId: 'player_2', slot: s, quest: { rollTrait: 'strength' } }), 0)).toBe(1);
	});
});

describe('The Gym (place_the_gym)', () => {
	it('Physical +10 Power, Digital +0', () => {
		expect(powerGain('place_the_gym', slotOf(MICHELLE))).toBe(10);
		expect(powerGain('place_the_gym', slotOf(GANDOE))).toBe(0);
	});
	it('every Mosje rolls 1 die more on a Str Quest and on a Str Personal Quest', () => {
		for (const id of [MICHELLE, GANDOE]) {
			const s = slotOf(id);
			const st = world('place_the_gym', [s, null]);
			expect(diceBonus(st, s, 'strength')).toBe(1);
			const def = getPersonalQuestDef('pq_charge');
			const base = getPersonalQuestDice(world(null, [s, null]), 'player_1', s, def);
			expect(getPersonalQuestDice(st, 'player_1', s, def)).toBe(base + 1);
		}
	});
	it('nobody loses MP at the start of a turn', () => {
		const dig = slotOf(GANDOE), phys = slotOf(MICHELLE);
		const mp = (place) => {
			const st = startTurn(world(place, [slotOf(GANDOE), slotOf(MICHELLE)]));
			return st.players.player_1.activeSlots.map((s) => s.mp);
		};
		expect(mp('place_the_gym')).toEqual(mp(null));
		expect(dig.mp).toBe(60); expect(phys.mp).toBe(60);
	});
});

describe("Coert's Caravan (place_coerts_caravan): 2 Energy less, once per turn", () => {
	const COERT = 'mosje_coert_tech', FPS = 'mosje_fps_coert';
	const cost = (st, id, commit = true) => getEffectiveCost(st, 'player_1', id, 'piecie', { caravan: true, commit });
	const board = (mosjeId, place = 'place_coerts_caravan') => world(place, [slotOf(mosjeId), null]);
	it('the first Piecie costing 1+ costs 2 less, never below 0 (cost 3: 1, cost 1: 0, cost 2: 0)', () => {
		expect(cost(board(COERT), 'piecie_super_saiyan_mos')).toBe(1);
		expect(cost(board(COERT), 'piecie_broodje_doner')).toBe(0);
		expect(cost(board(COERT), 'piecie_ronald_kip')).toBe(0);
	});
	it('the next Piecie that turn costs its full price', () => {
		const st = board(COERT);
		expect(cost(st, 'piecie_super_saiyan_mos')).toBe(1);
		expect(cost(st, 'piecie_super_saiyan_mos')).toBe(3);
	});
	it('a 0-cost Piecie does not use it up', () => {
		const st = board(COERT);
		expect(cost(st, 'piecie_kannetje_melk')).toBe(0);
		expect(cost(st, 'piecie_super_saiyan_mos')).toBe(1);
	});
	it('FPS Coert counts as a Coert; without a Coert or without the Place the price is full', () => {
		expect(cost(board(FPS), 'piecie_super_saiyan_mos')).toBe(1);
		expect(cost(board(CHRIS), 'piecie_super_saiyan_mos')).toBe(3);
		expect(cost(board(COERT, null), 'piecie_super_saiyan_mos')).toBe(3);
	});
	it('the opponent with a Coert gets it on their own turn', () => {
		const st = board(CHRIS);
		st.players.player_2.activeSlots = [slotOf(COERT), null];
		expect(getEffectiveCost(st, 'player_2', 'piecie_super_saiyan_mos', 'piecie', { caravan: true, commit: true })).toBe(1);
	});
	it('together with Hawaiishirt a 3-cost Piecie is free', () => {
		const st = board(COERT);
		st.players.player_1.activeSlots[0].attachments = [{ cardId: 'piecie_hawaiishirt', attachedTurn: 1 }];
		expect(cost(st, 'piecie_super_saiyan_mos')).toBe(0);
	});
	it('activating on the real engine: Döner (1) is free, the next Piecie pays in full', () => {
		const pie = (cardId) => ({ cardId, type: 'PIECIE', faceDown: true, activated: false, playedOnTurn: 1, canActivateOnTurn: 1 });
		const st = world('place_coerts_caravan', [slotOf(COERT), null]);
		st.players.player_1.piecieSlots = [pie('piecie_broodje_doner'), pie('piecie_ronald_kip'), null, null];
		const first = activatePiecie(st, 'player_1', 0);
		expect(first.success).toBe(true);
		expect(first.state.players.player_1.energy).toBe(6);
		const second = activatePiecie(first.state, 'player_1', 1);
		expect(second.success).toBe(true);
		expect(second.state.players.player_1.energy).toBe(4);
	});
});

describe('Skiffa (place_skiffa)', () => {
	it('a Creative roller may reroll 1 die once; a Digital roller can not', () => {
		const grant = (id) => {
			const st = world('place_skiffa', [slotOf(id), null]);
			placeSkiffaGrant(st, st.players.player_1, st.players.player_1.activeSlots[0]);
			return st.players.player_1.rerollGrants || [];
		};
		const g = grant(DJ);
		expect(g).toHaveLength(1);
		expect(g[0].uses).toBe(1);
		expect(grant(GANDOE)).toHaveLength(0);
	});
	it('the Creative reroll reaches a real Quest roll', () => {
		const st = world('place_skiffa', [slotOf(DJ), null]);
		const res = rollQuestAttempt(st, 'player_1', { slotIndex: 0, stackId: 'PHYSICAL', rng: () => 0.7, skipReactions: true });
		expect(res.ok).toBe(true);
		expect((res.state.players.player_1.rerollGrants || []).some((g) => g.source === 'place_skiffa')).toBe(true);
	});
	it('Digital Mosjes get -10 Power (never below 0), others 0', () => {
		expect(powerGain('place_skiffa', slotOf(GANDOE))).toBeLessThanOrEqual(0);
		const s = slotOf(GANDOE);
		expect(getPower(s, world('place_skiffa', [s, null]), 'player_1')).toBe(Math.max(0, getPower(s, world(null, [s, null]), 'player_1') - 10));
		expect(powerGain('place_skiffa', slotOf(MICHELLE))).toBe(0);
	});
});

describe('Woonkamer (Discord) (place_woonkamer_discord)', () => {
	const two = (a, b) => world('place_woonkamer_discord', [slotOf(a), slotOf(b)]);
	it('2 Digital Mosjes: +1 die on a Tech Quest, nothing on a Str Quest', () => {
		const st = two(GANDOE, CHRIS);
		expect(diceBonus(st, st.players.player_1.activeSlots[0], 'technical')).toBe(1);
		expect(diceBonus(st, st.players.player_1.activeSlots[1], 'technical')).toBe(1);
		expect(diceBonus(st, st.players.player_1.activeSlots[0], 'strength')).toBe(0);
	});
	it('1 Digital and 1 Physical Mosje: nothing', () => {
		const st = two(GANDOE, MICHELLE);
		expect(diceBonus(st, st.players.player_1.activeSlots[0], 'technical')).toBe(0);
	});
	it('also on a Tech Personal Quest', () => {
		const st = two(GANDOE, CHRIS);
		const s = st.players.player_1.activeSlots[0];
		const def = getPersonalQuestDef('pq_vibe_coded');
		expect(getPersonalQuestDice(st, 'player_1', s, def)).toBe(getPersonalQuestDice(world(null, st.players.player_1.activeSlots), 'player_1', s, def) + 1);
	});
	it('a fresh roller gets nothing', () => {
		const st = world('place_woonkamer_discord', [slotOf(GANDOE, { entryProtected: true }), slotOf(CHRIS)]);
		expect(diceBonus(st, st.players.player_1.activeSlots[0], 'technical')).toBe(0);
	});
	it('works for the other player', () => {
		const st = world('place_woonkamer_discord', [null, null]);
		st.players.player_2.activeSlots = [slotOf(GANDOE), slotOf(CHRIS)];
		const n = QUEST_DICE_SOURCES.reduce((x, f) => x + f({ state: st, playerId: 'player_2', slot: st.players.player_2.activeSlots[0], quest: { rollTrait: 'technical' } }), 0);
		expect(n).toBe(1);
	});
	it('on a real Tech Quest roll the dice count goes up by 1', () => {
		const roll = (place) => {
			const st = world(place, [withStars(slotOf(GANDOE), { technical: 2 }), withStars(slotOf(CHRIS), {})]);
			return rollQuestAttempt(st, 'player_1', { slotIndex: 0, stackId: 'DIGITAL', rng: () => 0.7, skipReactions: true }).pending.diceCount;
		};
		expect(roll('place_woonkamer_discord')).toBe(roll(null) + 1);
	});
});

describe('Nieuwe Gimma (place_nieuwe_gimma)', () => {
	const phys = () => [withStars(slotOf(MICHELLE, { level: 3, levelAtTurnStart: 3 }), { strength: 2 }), withStars(slotOf('mosje_jeffrey', { level: 3, levelAtTurnStart: 3 }), { strength: 2 })];
	const Q = (slotIndex = 0, extra = {}) => ({ slotIndex, stackId: 'PHYSICAL', rng: () => 0.7, skipReactions: true, ...extra });
	const base = () => rollQuestAttempt(world(null, phys()), 'player_1', Q()).pending.diceCount;
	it('the first Quest roll of a turn has +1 die, the second has none', () => {
		const first = rollQuestAttempt(world('place_nieuwe_gimma', phys()), 'player_1', Q(0));
		expect(first.pending.diceCount).toBe(base() + 1);
		const second = rollQuestAttempt(first.state, 'player_1', Q(1));
		expect(second.pending.diceCount).toBe(base());
	});
	it('next turn the first roll has it again', () => {
		const first = rollQuestAttempt(world('place_nieuwe_gimma', phys()), 'player_1', Q(0));
		const next = startTurn(first.state);
		expect(next.questRollsThisTurn).toBe(0);
		const again = rollQuestAttempt(next, 'player_1', Q(1)); // slot 0 acted (startTurn does not clear it)
		expect(again.pending.diceCount).toBe(base() + 1);
	});
	it('a Personal Quest roll counts as the first roll, and as a later one', () => {
		const PQC = { cardId: 'pq_charge', type: 'PERSONAL_QUEST' };
		const opts = (i = 0) => ({ cardId: 'pq_charge', slotIndex: i, skipReactions: true });
		const basePq = rollPersonalQuestAttempt(world(null, phys(), { hand: [PQC] }), 'player_1', opts()).pending.diceCount;
		const pq = rollPersonalQuestAttempt(world('place_nieuwe_gimma', phys(), { hand: [PQC] }), 'player_1', opts());
		expect(pq.ok).toBe(true);
		expect(pq.pending.diceCount).toBe(basePq + 1);
		const q = rollQuestAttempt(pq.state, 'player_1', Q(1));
		expect(q.pending.diceCount).toBe(base());
		// and the other way round
		const first = rollQuestAttempt(world('place_nieuwe_gimma', phys()), 'player_1', Q(0));
		first.state.players.player_1.hand = [PQC];
		const later = rollPersonalQuestAttempt(first.state, 'player_1', opts(1));
		expect(later.pending.diceCount).toBe(basePq);
	});
	it('a refused attempt does not use it up', () => {
		const st = world('place_nieuwe_gimma', phys());
		const refused = rollQuestAttempt(st, 'player_1', Q(1 + 1)); // no such slot
		expect(refused.ok).toBe(false);
		expect(st.questRollsThisTurn || 0).toBe(0);
		expect(rollQuestAttempt(refused.state, 'player_1', Q(0)).pending.diceCount).toBe(base() + 1);
	});
	it('a fresh roller gets nothing, and its roll still counts as the first', () => {
		const slots = phys();
		slots[0].entryProtected = true;
		const first = rollQuestAttempt(world('place_nieuwe_gimma', slots), 'player_1', Q(0));
		expect(first.pending.diceCount).toBe(base());
		expect(rollQuestAttempt(first.state, 'player_1', Q(1)).pending.diceCount).toBe(base());
	});
	it('stays within the 6-dice cap', () => {
		const slots = phys();
		slots[0].traits.strength = 6;
		const res = rollQuestAttempt(world('place_nieuwe_gimma', slots), 'player_1', Q(0));
		expect(res.pending.diceCount).toBe(6);
	});
	it('T-71-25: the die is given once; a held roll (before-roll window) and its replay do not count twice', () => {
		const st = world('place_nieuwe_gimma', phys());
		st.players.player_2.hand = [{ cardId: 'snelle_emergency_healings', type: 'SNELLE_PIECIE' }];
		const held = rollQuestAttempt(st, 'player_1', { slotIndex: 0, stackId: 'PHYSICAL', rng: () => 0.7 });
		expect(held.state.pendingReaction).toBeTruthy();
		expect(held.state.questRollsThisTurn || 0).toBe(0);
		const done = resolveReaction(held.state, 'player_2', null);
		expect(done.pending.diceCount).toBe(base() + 1);
		expect(done.state.questRollsThisTurn).toBe(1);
	});
});
