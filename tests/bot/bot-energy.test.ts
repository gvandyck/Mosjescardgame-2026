// @ts-nocheck
// BOT-02: the bot pays what the engine will really charge. Place discounts (Dierenasiel, Welloe Graveyard, Coert's
// Caravan) and the Delluft parking fee are in its Energy plan; it never asks the engine for a payment it can't cover.
import { describe, it, expect } from 'vitest';
import { MOSJES } from '../../src/data/mosjes.js';
import { createMosjeSlot } from '../../src/engine/mp/createMosjeSlot.js';
import { getBotPaymentCost } from '../../src/bot/strategy/getBotPaymentCost.js';
import { canBotAfford } from '../../src/bot/strategy/canBotAfford.js';
import { chooseSummon } from '../../src/bot/strategy/chooseSummon.js';
import { shouldUseAbility } from '../../src/bot/strategy/shouldUseAbility.js';
import { getBotProfile } from '../../src/bot/strategy/botProfiles.js';
import { makeEngineState } from '../helpers/makeEngineState.js';

const BOT = 'player_1';
const OPP = 'player_2';
const slotOf = (id, extra = {}) => ({ ...createMosjeSlot(MOSJES.find((m) => m.id === id)), entryProtected: false, ...extra });
const mosje = (cardId) => ({ cardId, type: 'MOSJE' });

// The bot is player_1 and it is its turn 3. `field` lists Mosje ids (a null stays an open slot).
function table({ energy = 3, place = null, field = ['mosje_gandoe_wizard', null], hand = [], active = BOT, turnNumber = 3, bot = {}, state = {}, oppField = ['mosje_jeffrey', null] } = {}) {
	return makeEngineState({
		turnNumber,
		activePlayerId: active,
		activePlace: place,
		activePlacePlayedBy: place ? OPP : null,
		...state,
		players: {
			[BOT]: { energy, hand, activeSlots: field.map((id) => (id ? slotOf(id) : null)), ...bot },
			[OPP]: { energy: 3, activeSlots: oppField.map((id) => (id ? slotOf(id) : null)) },
		},
	});
}

describe('getBotPaymentCost: Delluft parking fee', () => {
	it('a cost-2 Mosje costs 3 on the bot\'s first payment of its own turn', () => {
		expect(getBotPaymentCost(table({ place: 'place_delluft' }), BOT, 'mosje_alyssa_fissa', 'mosje')).toBe(3);
	});
	it('the fee is used up once it has been paid this turn', () => {
		const st = table({ place: 'place_delluft', bot: { delluftFeeTurn: 3 } });
		expect(getBotPaymentCost(st, BOT, 'mosje_alyssa_fissa', 'mosje')).toBe(2);
	});
	it('a Coert on the field waives the fee, a Cless (without Coert / Binti) doubles it', () => {
		expect(getBotPaymentCost(table({ place: 'place_delluft', field: ['mosje_coert_tech', null] }), BOT, 'mosje_alyssa_fissa', 'mosje')).toBe(2);
		expect(getBotPaymentCost(table({ place: 'place_delluft', field: ['mosje_binti', null] }), BOT, 'mosje_alyssa_fissa', 'mosje')).toBe(2);
		expect(getBotPaymentCost(table({ place: 'place_delluft', field: ['mosje_cless_teacher', null] }), BOT, 'mosje_alyssa_fissa', 'mosje')).toBe(4);
		expect(getBotPaymentCost(table({ place: 'place_delluft', field: ['mosje_cless_teacher', 'mosje_coert_tech'] }), BOT, 'mosje_alyssa_fissa', 'mosje')).toBe(2);
	});
	it('no fee when it is not the bot\'s turn, and no fee on a free payment', () => {
		expect(getBotPaymentCost(table({ place: 'place_delluft', active: OPP }), BOT, 'mosje_alyssa_fissa', 'mosje')).toBe(2);
		expect(getBotPaymentCost(table({ place: 'place_delluft' }), BOT, 'snelle_momentum_rush', 'snelle')).toBe(0);
	});
	it('adds the fee to Places, Snelles and abilities too', () => {
		const st = table({ place: 'place_delluft' });
		expect(getBotPaymentCost(st, BOT, 'place_the_gym', 'place')).toBe(4);
		expect(getBotPaymentCost(st, BOT, 'snelle_jensen', 'snelle')).toBe(2);
		expect(getBotPaymentCost(st, BOT, 'ability_ronald_chef_strategic_insight', 'ability')).toBe(3);
	});
});

describe('getBotPaymentCost: Place discounts', () => {
	it('Dierenasiel: a pet Piecie activates for 0, other Piecies pay the printed cost', () => {
		const st = table({ place: 'place_dierenasiel' });
		expect(getBotPaymentCost(st, BOT, 'piecie_bowie_stormey', 'piecie')).toBe(0);
		expect(getBotPaymentCost(table(), BOT, 'piecie_bowie_stormey', 'piecie')).toBe(1);
		expect(getBotPaymentCost(st, BOT, 'piecie_te_hard_gaan', 'piecie')).toBe(2);
	});
	it('Coert\'s Caravan with an own Coert: the first 1+ Piecie is free, and the helper does not use the Caravan up', () => {
		const st = table({ place: 'place_coerts_caravan', field: ['mosje_coert_tech', null] });
		const before = JSON.stringify(st);
		expect(getBotPaymentCost(st, BOT, 'piecie_te_hard_gaan', 'piecie')).toBe(0);
		expect(JSON.stringify(st)).toBe(before);
		expect(st.players[BOT].caravanUsedTurn).toBeUndefined();
	});
	it('the Caravan needs an own Coert and an unused turn', () => {
		expect(getBotPaymentCost(table({ place: 'place_coerts_caravan' }), BOT, 'piecie_te_hard_gaan', 'piecie')).toBe(2);
		const used = table({ place: 'place_coerts_caravan', field: ['mosje_coert_tech', null], bot: { caravanUsedTurn: 3 } });
		expect(getBotPaymentCost(used, BOT, 'piecie_te_hard_gaan', 'piecie')).toBe(2);
	});
	it('Welloe Graveyard: Harde Didde and Elimination Strike cost 1 less', () => {
		const st = table({ place: 'place_welloe_graveyard' });
		expect(getBotPaymentCost(table(), BOT, 'piecie_harde_didde', 'piecie')).toBe(4);
		expect(getBotPaymentCost(st, BOT, 'piecie_harde_didde', 'piecie')).toBe(3);
		expect(getBotPaymentCost(st, BOT, 'piecie_klaar_met_jou', 'piecie')).toBe(3);
		expect(getBotPaymentCost(table(), BOT, 'ability_gandoe_destroyer_elimination_strike', 'ability')).toBe(4);
		expect(getBotPaymentCost(st, BOT, 'ability_gandoe_destroyer_elimination_strike', 'ability')).toBe(3);
	});
	it('Blensen! costs 4, and 0 after a Jensen! this turn', () => {
		expect(getBotPaymentCost(table(), BOT, 'snelle_blensen', 'snelle')).toBe(4);
		expect(getBotPaymentCost(table({ state: { jensenPlayedTurn: 3 } }), BOT, 'snelle_blensen', 'snelle')).toBe(0);
	});
	it('a Chain Reaction offer makes the next Piecie activation free, fee included', () => {
		const st = table({ place: 'place_delluft', bot: { chainReactionOffer: 1 } });
		expect(getBotPaymentCost(st, BOT, 'piecie_te_hard_gaan', 'piecie')).toBe(0);
		expect(getBotPaymentCost(table({ place: 'place_delluft' }), BOT, 'piecie_te_hard_gaan', 'piecie')).toBe(3);
	});
});

describe('canBotAfford', () => {
	it('Delluft: Energy 3 pays a cost-2 Mosje, Energy 2 does not', () => {
		expect(canBotAfford(table({ energy: 3, place: 'place_delluft' }), BOT, 'mosje_alyssa_fissa', 'mosje')).toBe(true);
		expect(canBotAfford(table({ energy: 2, place: 'place_delluft' }), BOT, 'mosje_alyssa_fissa', 'mosje')).toBe(false);
	});
	it('keeps `reserve` Energy back, but a free payment is always affordable', () => {
		const st = table({ energy: 3 });
		expect(canBotAfford(st, BOT, 'mosje_alyssa_fissa', 'mosje', 1)).toBe(true);
		expect(canBotAfford(st, BOT, 'mosje_alyssa_fissa', 'mosje', 2)).toBe(false);
		expect(canBotAfford(table({ energy: 0 }), BOT, 'snelle_momentum_rush', 'snelle', 2)).toBe(true);
	});
});

describe('chooseSummon', () => {
	const fissa = mosje('mosje_alyssa_fissa'); // cost 2, start MP 20
	const wizard = mosje('mosje_gandoe_wizard'); // cost 3, start MP 10
	const jeffrey = mosje('mosje_jeffrey'); // cost 3, start MP 20
	const bulldozer = mosje('mosje_alyssa_bulldozer'); // cost 4, start MP 0

	it('picks the highest-cost affordable Mosje, ties by higher start MP', () => {
		expect(chooseSummon(table({ energy: 6, hand: [fissa, wizard, jeffrey] }), BOT).cardId).toBe('mosje_jeffrey');
		expect(chooseSummon(table({ energy: 6, hand: [fissa, wizard] }), BOT).cardId).toBe('mosje_gandoe_wizard');
		expect(chooseSummon(table({ energy: 2, hand: [wizard, jeffrey, fissa] }), BOT).cardId).toBe('mosje_alyssa_fissa');
	});
	it('a 0 MP Mosje only when nothing else is affordable', () => {
		expect(chooseSummon(table({ energy: 6, hand: [bulldozer, fissa] }), BOT).cardId).toBe('mosje_alyssa_fissa');
		expect(chooseSummon(table({ energy: 6, hand: [bulldozer] }), BOT).cardId).toBe('mosje_alyssa_bulldozer');
		expect(chooseSummon(table({ energy: 3, hand: [bulldozer] }), BOT)).toBeNull();
	});
	it('nothing on a cooldown turn, with two Mosjes on the field, or on the opponent\'s turn', () => {
		expect(chooseSummon(table({ energy: 6, hand: [fissa], bot: { cooldownTurn: true } }), BOT)).toBeNull();
		expect(chooseSummon(table({ energy: 6, hand: [fissa], field: ['mosje_gandoe_wizard', 'mosje_jeffrey'] }), BOT)).toBeNull();
		expect(chooseSummon(table({ energy: 6, hand: [fissa], active: OPP }), BOT)).toBeNull();
		expect(chooseSummon(table({ energy: 6, hand: [fissa] }), BOT).cardId).toBe('mosje_alyssa_fissa');
	});
	it('under Delluft, Energy 2 does not summon a cost-2 Mosje; Energy 3 does', () => {
		expect(chooseSummon(table({ energy: 2, place: 'place_delluft', hand: [fissa] }), BOT)).toBeNull();
		expect(chooseSummon(table({ energy: 3, place: 'place_delluft', hand: [fissa] }), BOT).cardId).toBe('mosje_alyssa_fissa');
	});
	it('ignores non-Mosje cards in hand', () => {
		expect(chooseSummon(table({ energy: 6, hand: [{ cardId: 'piecie_kannetje_melk', type: 'PIECIE' }] }), BOT)).toBeNull();
	});
});

describe('shouldUseAbility', () => {
	const profile = (st) => getBotProfile(st, BOT);
	const chef = ['mosje_ronald_chef', null]; // Strategic Insight: 2 Energy
	it('a printed cost that fits is not enough: cost + Delluft fee must fit', () => {
		const at = (energy, place) => { const st = table({ energy, place, field: chef }); return shouldUseAbility(st, BOT, 0, profile(st)); };
		expect(at(2, null)).toBe(true);
		expect(at(1, null)).toBe(false);
		expect(at(2, 'place_delluft')).toBe(false);
		expect(at(3, 'place_delluft')).toBe(true);
	});
	it('keeps `reserve` Energy back', () => {
		const st = table({ energy: 3, field: chef });
		expect(shouldUseAbility(st, BOT, 0, profile(st), 1)).toBe(true);
		expect(shouldUseAbility(st, BOT, 0, profile(st), 2)).toBe(false);
	});
	it('false for an empty slot or a Mosje without a button', () => {
		const st = table({ energy: 6, field: chef });
		expect(shouldUseAbility(st, BOT, 1, profile(st))).toBe(false);
	});
	it('Elimination Strike under Welloe Graveyard is usable with 3 Energy when its gate holds', () => {
		const field = ['mosje_gandoe_destroyer', null];
		const at = (energy, place, over = {}) => { const st = table({ energy, place, field, ...over }); return shouldUseAbility(st, BOT, 0, profile(st)); };
		expect(at(3, 'place_welloe_graveyard')).toBe(true); // one opposing Mosje: it sets up the knockout
		expect(at(3, null)).toBe(false); // 4 Energy without the discount
		expect(at(4, null)).toBe(true);
		expect(at(3, 'place_welloe_graveyard', { oppField: ['mosje_jeffrey', 'mosje_gandoe_wizard'] })).toBe(false); // two level-1 Mosjes: no knockout, no threat
	});
	it('Elimination Strike is not offered once used this game', () => {
		const st = table({ energy: 4, field: ['mosje_gandoe_destroyer', null] });
		st.players[BOT].activeSlots[0].abilityUsedThisGame = true;
		expect(shouldUseAbility(st, BOT, 0, profile(st))).toBe(false);
	});
});
