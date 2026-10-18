// @ts-nocheck
// BOT-03 (handoff 5): a bot that holds a reaction Snelle for the opponent's turn keeps one Piecie slot free and that
// Snelle's Energy back. Summons are exempt. Own-turn Snelle (Sleutelpuntje ...) and proactive ones (Momentum Rush ...)
// reserve nothing: they are played on the bot's own turn.
import { describe, it, expect } from 'vitest';
import { MOSJES } from '../../src/data/mosjes.js';
import { createMosjeSlot } from '../../src/engine/mp/createMosjeSlot.js';
import { reactionReserve } from '../../src/bot/strategy/reactionReserve.js';
import { choosePieciesToPlace } from '../../src/bot/strategy/choosePieciesToPlace.js';
import { driveBotTurnSteps } from '../../src/bot/botDriver.js';
import { makeEngineState } from '../helpers/makeEngineState.js';

const BOT = 'player_1';
const OPP = 'player_2';
const slotOf = (id, extra = {}) => ({ ...createMosjeSlot(MOSJES.find((m) => m.id === id)), entryProtected: false, ...extra });
const snelle = (cardId) => ({ cardId, type: 'SNELLE_PIECIE' });
const piecie = (cardId) => ({ cardId, type: 'PIECIE' });
const readyPiecie = (cardId) => ({ cardId, type: 'PIECIE', faceDown: true, activated: false, playedOnTurn: 2, canActivateOnTurn: 3 });
const filled = (st) => st.players[BOT].piecieSlots.filter(Boolean).length;
const noQuests = { questStacks: ['FIGHTING', 'DIGITAL', 'ARTISTIC'].reduce((o, id) => ({ ...o, [id]: { deck: [], faceUp: null, tokens: 0, discard: [] } }), {}) };

// The bot is player_1 and it is its turn 3, 3 empty Piecie slots.
function table({ energy = 3, place = null, field = ['mosje_gandoe_wizard', null], hand = [], bot = {}, oppHand = [], active = BOT } = {}) {
	return makeEngineState({
		turnNumber: 3,
		activePlayerId: active,
		activePlace: place,
		activePlacePlayedBy: place ? OPP : null,
		...noQuests,
		players: {
			[BOT]: { energy, hand, activeSlots: field.map((id) => (id ? slotOf(id) : null)), ...bot },
			[OPP]: { energy: 3, hand: oppHand, activeSlots: [slotOf('mosje_jeffrey'), null] },
		},
	});
}
const drive = (st) => { const steps = driveBotTurnSteps(st, BOT); return { end: steps[steps.length - 1].state, labels: steps.map((s) => s.label) }; };

describe('reactionReserve', () => {
	it('no Snelle in hand: nothing is kept', () => {
		expect(reactionReserve(table({ hand: [piecie('piecie_kannetje_melk')] }), BOT)).toEqual({ keepSlot: false, energy: 0, cardIds: [] });
	});
	it('Jensen! (a defender Snelle, 1 Energy) keeps a slot and 1 Energy', () => {
		expect(reactionReserve(table({ hand: [snelle('snelle_jensen')] }), BOT)).toEqual({ keepSlot: true, energy: 1, cardIds: ['snelle_jensen'] });
	});
	it('the cheapest held Snelle sets the Energy: The Protector (0) with Not Today! (2) keeps 0, Jensen! (1) with Not Today! (2) keeps 1', () => {
		const free = reactionReserve(table({ hand: [snelle('snelle_negate_elimination'), snelle('snelle_the_protector')] }), BOT);
		expect(free.keepSlot).toBe(true);
		expect(free.energy).toBe(0);
		expect([...free.cardIds].sort()).toEqual(['snelle_negate_elimination', 'snelle_the_protector']);
		expect(reactionReserve(table({ hand: [snelle('snelle_negate_elimination'), snelle('snelle_jensen')] }), BOT).energy).toBe(1);
	});
	it('Blensen! alone keeps 4 Energy (its price without a Jensen! this turn)', () => {
		expect(reactionReserve(table({ hand: [snelle('snelle_blensen')] }), BOT)).toMatchObject({ keepSlot: true, energy: 4 });
	});
	it('a reaction held for the opponent\'s turn counts at every defender moment (attacked, toWelloe, afterPiecieActivation, jensenPlayed, afterQuestRoll)', () => {
		for (const id of ['snelle_perfect_dodge', 'snelle_negate_elimination', 'snelle_jammertje_gepakt', 'snelle_frenssen', 'snelle_jeweetniet', 'snelle_drain_reversal', 'snelle_emergency_healings']) {
			expect(reactionReserve(table({ hand: [snelle(id)] }), BOT).keepSlot, id).toBe(true);
		}
	});
	it('own-turn Snelle (Sleutelpuntje, Dubbele Temminks) and proactive ones (Momentum Rush, Ff Haaltje Nemen, Bijna Welloe) keep nothing', () => {
		for (const id of ['snelle_sleutelpuntje', 'snelle_dubbele_temminks', 'snelle_momentum_rush', 'snelle_ff_haaltje_nemen', 'snelle_bijna_welloe', 'snelle_chillingsvoorbij']) {
			expect(reactionReserve(table({ hand: [snelle(id)] }), BOT), id).toEqual({ keepSlot: false, energy: 0, cardIds: [] });
		}
	});
	it('on a cooldown turn the reserve still holds (the slot matters on the opponent\'s turn)', () => {
		expect(reactionReserve(table({ hand: [snelle('snelle_jensen')], bot: { cooldownTurn: true } }), BOT)).toMatchObject({ keepSlot: true, energy: 1 });
	});
	it('no Delluft parking fee: the reserve is spent on the opponent\'s turn', () => {
		expect(reactionReserve(table({ hand: [snelle('snelle_jensen')], place: 'place_delluft' }), BOT).energy).toBe(1);
	});
	it('does not change the state', () => {
		const st = table({ hand: [snelle('snelle_jensen'), piecie('piecie_kannetje_melk')] });
		const before = JSON.stringify(st);
		reactionReserve(st, BOT);
		expect(JSON.stringify(st)).toBe(before);
	});
});

describe('choosePieciesToPlace', () => {
	const trio = [piecie('piecie_pot_of_weed'), piecie('piecie_kannetje_melk'), piecie('piecie_mp_amplifier')]; // draw, mp-gain, multiplier
	it('hand Piecies in role order (multiplier, MP gain, ..., draw); other card types are skipped', () => {
		const out = choosePieciesToPlace(table({ hand: [snelle('snelle_momentum_rush'), ...trio, { cardId: 'place_the_gym', type: 'PLACE' }] }), BOT);
		expect(out.map((c) => c.cardId)).toEqual(['piecie_mp_amplifier', 'piecie_kannetje_melk', 'piecie_pot_of_weed']);
	});
	it('a reaction Snelle in hand keeps one slot: 3 free slots place 2', () => {
		const out = choosePieciesToPlace(table({ hand: [snelle('snelle_jensen'), ...trio] }), BOT);
		expect(out.map((c) => c.cardId)).toEqual(['piecie_mp_amplifier', 'piecie_kannetje_melk']);
	});
	it('the count is slots - filled - kept, never negative', () => {
		const down = (cardId) => readyPiecie(cardId);
		const slots = (n) => Array.from({ length: 3 }, (_, i) => (i < n ? down('piecie_te_hard_gaan') : null));
		const place = (n, extra) => choosePieciesToPlace(table({ hand: [...extra, ...trio], bot: { piecieSlots: slots(n) } }), BOT).length;
		expect(place(1, [])).toBe(2);
		expect(place(1, [snelle('snelle_jensen')])).toBe(1);
		expect(place(2, [snelle('snelle_jensen')])).toBe(0);
		expect(place(3, [snelle('snelle_jensen')])).toBe(0);
		expect(place(3, [])).toBe(0);
	});
	it('does not reorder or change the hand in the state', () => {
		const st = table({ hand: [snelle('snelle_jensen'), ...trio] });
		const before = JSON.stringify(st);
		choosePieciesToPlace(st, BOT);
		expect(JSON.stringify(st)).toBe(before);
	});
});

describe('driveBotTurn keeps a slot for a reaction Snelle', () => {
	const trio = [piecie('piecie_pot_of_weed'), piecie('piecie_kannetje_melk'), piecie('piecie_mp_amplifier')];
	it('Jensen! + 3 Piecies: 2 placed, 1 slot free at the end of the turn', () => {
		const { end } = drive(table({ hand: [snelle('snelle_jensen'), ...trio] }));
		expect(filled(end)).toBe(2);
		expect(end.players[BOT].hand.filter((c) => c.type === 'PIECIE').map((c) => c.cardId)).toEqual(['piecie_pot_of_weed']);
		expect(end.players[BOT].hand.some((c) => c.cardId === 'snelle_jensen')).toBe(true);
	});
	it('Momentum Rush (no reaction moment) + 3 Piecies: 3 placed', () => {
		expect(filled(drive(table({ hand: [snelle('snelle_momentum_rush'), ...trio] })).end)).toBe(3);
	});
	it('Sleutelpuntje (own-turn moment only) + 3 Piecies: 3 placed', () => {
		expect(filled(drive(table({ hand: [snelle('snelle_sleutelpuntje'), ...trio] })).end)).toBe(3);
	});
	it('no Snelle at all: 3 placed', () => {
		expect(filled(drive(table({ hand: trio })).end)).toBe(3);
	});
	it('on a cooldown turn (only face-down placing) the slot is kept too', () => {
		const { end } = drive(table({ hand: [snelle('snelle_jensen'), ...trio], bot: { cooldownTurn: true } }));
		expect(filled(end)).toBe(2);
	});
});

describe('driveBotTurn keeps the Energy for a reaction Snelle', () => {
	const jensen = snelle('snelle_jensen'); // 1 Energy
	const withReady = (cardId, extra = {}) => table({ energy: 3, bot: { piecieSlots: [readyPiecie(cardId), null, null] }, ...extra });

	it('Energy 3, Jensen! held: a ready cost-3 Piecie is not activated; without Jensen! it is', () => {
		const held = drive(withReady('piecie_super_saiyan_mos', { hand: [jensen] }));
		expect(held.end.players[BOT].piecieSlots[0].activated).toBeFalsy();
		expect(held.end.players[BOT].energy).toBe(3);
		const free = drive(withReady('piecie_super_saiyan_mos'));
		expect(free.labels.some((l) => /activates super saiyan mos/.test(l))).toBe(true);
		expect(free.end.players[BOT].energy).toBe(0);
	});
	it('Energy 3, Jensen! held: a ready cost-2 Piecie is activated, 1 Energy is left', () => {
		const run = drive(withReady('piecie_momentum_diefje', { hand: [jensen] }));
		expect(run.labels.some((l) => /activates momentum diefje/.test(l))).toBe(true);
		expect(run.end.players[BOT].energy).toBe(1);
	});
	it('Energy 3, Jensen! held, a cost-3 Mosje in hand and a free field slot: still summoned (summons are exempt)', () => {
		const run = drive(table({ energy: 3, hand: [jensen, { cardId: 'mosje_jeffrey', type: 'MOSJE' }] }));
		expect(run.labels.some((l) => /to the field/.test(l))).toBe(true);
		expect(run.end.players[BOT].activeSlots[1]?.cardId).toBe('mosje_jeffrey');
		expect(run.end.players[BOT].energy).toBe(0);
	});
	it('a Place that would eat the reserved Energy is not played; one that leaves it is', () => {
		const gym = { cardId: 'place_the_gym', type: 'PLACE' }; // 3 Energy
		const held = drive(table({ energy: 3, hand: [jensen, gym] }));
		expect(held.end.activePlace).toBeNull();
		expect(held.end.players[BOT].energy).toBe(3);
		const free = drive(table({ energy: 3, hand: [gym] }));
		expect(free.end.activePlace).toBe('place_the_gym');
		const rich = drive(table({ energy: 4, hand: [jensen, gym] }));
		expect(rich.end.activePlace).toBe('place_the_gym');
		expect(rich.end.players[BOT].energy).toBe(1);
	});
	it('a Mosje ability that would eat the reserved Energy is not used; one that leaves it is', () => {
		const field = ['mosje_ronald_chef', null]; // Strategic Insight: 2 Energy, needs a card in the opponent hand
		const oppHand = [piecie('piecie_kannetje_melk')];
		const free = drive(table({ energy: 2, field, hand: [], oppHand }));
		expect(free.labels.some((l) => /ability/.test(l))).toBe(true); // control: the ability is used at all
		expect(free.end.players[BOT].energy).toBe(0);
		const held = drive(table({ energy: 2, field, hand: [jensen], oppHand }));
		expect(held.labels.some((l) => /ability/.test(l))).toBe(false);
		expect(held.end.players[BOT].energy).toBe(2);
		const rich = drive(table({ energy: 3, field, hand: [jensen], oppHand }));
		expect(rich.labels.some((l) => /ability/.test(l))).toBe(true);
		expect(rich.end.players[BOT].energy).toBe(1);
	});
});
