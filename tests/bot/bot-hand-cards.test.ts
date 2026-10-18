// @ts-nocheck
// BOT-02 / BOT-01 (61-08): cards from hand on the bot's own turn. Places are chosen by how well they fit the board
// (placeFit); non-reaction Snelle are played proactively when legal and worth something; the seeded Example Deck
// games make no engine call the engine refuses.
import { describe, it, expect, vi } from 'vitest';
import { MOSJES } from '../../src/data/mosjes.js';
import { createMosjeSlot } from '../../src/engine/mp/createMosjeSlot.js';
import { placeFit } from '../../src/bot/strategy/placeFit.js';
import { choosePlaceToPlay } from '../../src/bot/strategy/choosePlaceToPlay.js';
import { chooseProactiveSnelle } from '../../src/bot/strategy/chooseProactiveSnelle.js';
import { driveBotTurnSteps } from '../../src/bot/botDriver.js';
import { makeEngineState } from '../helpers/makeEngineState.js';

const BOT = 'player_1';
const OPP = 'player_2';
const slotOf = (id, extra = {}) => ({ ...createMosjeSlot(MOSJES.find((m) => m.id === id)), entryProtected: false, ...extra });
const place = (cardId) => ({ cardId, type: 'PLACE' });
const snelle = (cardId) => ({ cardId, type: 'SNELLE_PIECIE' });
const deckOf = (n) => Array.from({ length: n }, () => ({ cardId: 'piecie_kannetje_melk', type: 'PIECIE' }));
const mosjeIn = (f) => (!f ? null : typeof f === 'string' ? slotOf(f) : slotOf(f.id, f.extra));

// Three stacks; `faceUp` names the face-up Quest per stack (a stack without one has no Quest up).
const stacks = (faceUp = {}) => ['FIGHTING', 'DIGITAL', 'ARTISTIC'].reduce((o, id) => ({ ...o, [id]: { deck: [], faceUp: faceUp[id] ?? null, tokens: 0, discard: [] } }), {});

// The bot is player_1 and it is its turn 3. A null in `field` / `oppField` is an open slot; an entry is a Mosje id or { id, extra }.
function table({ energy = 3, field = ['mosje_gandoe_wizard', null], oppField = ['mosje_ronald_chef', null], hand = [], faceUp = {}, activePlace = null, bot = {}, state = {} } = {}) {
	return makeEngineState({
		turnNumber: 3,
		activePlayerId: BOT,
		activePlace,
		activePlacePlayedBy: activePlace ? OPP : null,
		questStacks: stacks(faceUp),
		...state,
		players: {
			[BOT]: { energy, hand, activeSlots: field.map(mosjeIn), ...bot },
			[OPP]: { energy: 3, activeSlots: oppField.map(mosjeIn) },
		},
	});
}

describe('placeFit and choosePlaceToPlay: Places are chosen by fit', () => {
	it('own Fighting Mosje vs a Digital opponent: The Gym fits (> 0) and is played with Energy 3', () => {
		const st = table({ hand: [place('place_the_gym')] });
		expect(placeFit(st, BOT, 'place_the_gym')).toBeGreaterThan(0);
		expect(choosePlaceToPlay(st, BOT)?.cardId).toBe('place_the_gym');
	});

	it('own Digital Mosje vs a Fighting opponent: The Gym is a minus and stays in hand; Arcade with a Technical Quest up fits', () => {
		const field = ['mosje_ronald_chef', null];
		const oppField = ['mosje_gandoe_wizard', null];
		const gymOnly = table({ field, oppField, hand: [place('place_the_gym')] });
		expect(placeFit(gymOnly, BOT, 'place_the_gym')).toBeLessThan(0);
		expect(choosePlaceToPlay(gymOnly, BOT)).toBeNull();
		const both = table({ field, oppField, hand: [place('place_the_gym'), place('place_arcade')], faceUp: { DIGITAL: 'quest_build_gadget' } });
		expect(placeFit(both, BOT, 'place_arcade')).toBeGreaterThan(0);
		expect(choosePlaceToPlay(both, BOT)?.cardId).toBe('place_arcade');
	});

	it('two Places in hand: the one with the higher fit is played, whatever the hand order', () => {
		const hand = [place('place_arcade'), place('place_the_gym'), place('place_boxing_ring')];
		const st = table({ hand }); // Gandoe (Fighting) vs a Digital Ronald: Boxing Ring (+20 for a Gandoe, -10 for the Digital) beats The Gym
		expect(placeFit(st, BOT, 'place_boxing_ring')).toBeGreaterThan(placeFit(st, BOT, 'place_the_gym'));
		expect(placeFit(st, BOT, 'place_the_gym')).toBeGreaterThan(placeFit(st, BOT, 'place_arcade'));
		expect(choosePlaceToPlay(st, BOT)?.cardId).toBe('place_boxing_ring');
		expect(choosePlaceToPlay(table({ hand: [place('place_arcade'), place('place_the_gym')] }), BOT)?.cardId).toBe('place_the_gym');
	});

	it('a Place that helps both sides the same is not played (fit 0)', () => {
		const st = table({ field: ['mosje_gandoe_wizard', null], oppField: ['mosje_jeffrey', null], hand: [place('place_bank_chilling')] });
		expect(placeFit(st, BOT, 'place_bank_chilling')).toBe(0); // -10 Power each, no word matches
		expect(choosePlaceToPlay(st, BOT)).toBeNull();
	});

	it('fresh Mosjes ignore a Place: a fresh Fighting Mosje gets no Power from The Gym, so only the words count', () => {
		const fresh = table({ hand: [place('place_the_gym')], field: ['mosje_gandoe_wizard', null], oppField: ['mosje_jeffrey', null], bot: { activeSlots: [slotOf('mosje_gandoe_wizard', { entryProtected: true }), null] } });
		const settled = table({ hand: [place('place_the_gym')], field: ['mosje_gandoe_wizard', null], oppField: ['mosje_jeffrey', null] });
		// settled: +10 Power each side (0 net) + the Fighting word; fresh own Mosje: the opponent's +10 is not matched
		expect(placeFit(fresh, BOT, 'place_the_gym')).toBe(placeFit(settled, BOT, 'place_the_gym') - 10);
	});

	it('Tesla is never chosen without a Coert; with one on the field it fits', () => {
		expect(choosePlaceToPlay(table({ energy: 6, hand: [place('place_tesla')] }), BOT)).toBeNull();
		const withCoert = table({ energy: 6, field: ['mosje_coert_tech', null], hand: [place('place_tesla')], faceUp: { DIGITAL: 'quest_build_gadget' } });
		expect(placeFit(withCoert, BOT, 'place_tesla')).toBeGreaterThan(0);
		expect(choosePlaceToPlay(withCoert, BOT)?.cardId).toBe('place_tesla');
	});

	it('nothing is played while a Place is in play, off its own turn, or when the cost eats the kept Energy', () => {
		const hand = [place('place_the_gym')];
		expect(choosePlaceToPlay(table({ hand, activePlace: 'place_boxing_ring' }), BOT)).toBeNull();
		expect(choosePlaceToPlay(table({ hand, state: { activePlayerId: OPP } }), BOT)).toBeNull();
		expect(choosePlaceToPlay(table({ hand, energy: 3 }), BOT, 1)).toBeNull(); // The Gym costs 3, 1 is kept back
		expect(choosePlaceToPlay(table({ hand, energy: 4 }), BOT, 1)?.cardId).toBe('place_the_gym');
	});

	it('unknown Place id: fit 0', () => {
		expect(placeFit(table(), BOT, 'place_does_not_exist')).toBe(0);
	});

	it('the driver plays the best Place and not a minus one', () => {
		const run = (hand) => {
			const steps = driveBotTurnSteps(table({ hand, state: { questStacks: stacks() } }), BOT);
			return steps[steps.length - 1].state;
		};
		expect(run([place('place_arcade'), place('place_the_gym')]).activePlace).toBe('place_the_gym');
		expect(run([place('place_arcade')]).activePlace).toBeNull();
	});
});

// Runs `run` and returns every '[BOT] METRIC {...}' line it printed, parsed.
function captureMetrics(run) {
	const metrics = [];
	const spy = vi.spyOn(console, 'log').mockImplementation((...args) => {
		if (typeof args[0] === 'string' && args[0].startsWith('[BOT] METRIC ')) metrics.push(JSON.parse(args[0].slice('[BOT] METRIC '.length)));
	});
	try { run(); } finally { spy.mockRestore(); }
	return metrics;
}
// engine-refused metrics, optionally only for the given driver calls (the Mosje-ability refusals are swept in the seeded games below).
const refusals = (metrics, ...calls) => metrics.filter((m) => m.ev === 'engine-refused' && (!calls.length || calls.includes(m.call)));
const snelleRefusals = (metrics) => refusals(metrics, 'playSnellie', 'resolveReaction');
function driveTurn(st) {
	let steps;
	const metrics = captureMetrics(() => { steps = driveBotTurnSteps(st, BOT); });
	return { steps, metrics, end: steps[steps.length - 1].state, played: steps.filter((s) => s.action?.kind === 'snelle') };
}
const mp40 = { id: 'mosje_gandoe_wizard', extra: { mp: 40, level: 1 } };

describe('chooseProactiveSnelle and the driver Snelle phase', () => {
	it('Momentum Rush on its own turn: played, the Mosje goes 40 -> 55 MP, the Piecie slot is free again, no refusal', () => {
		const st = table({ field: [mp40, null], hand: [snelle('snelle_momentum_rush')] });
		expect(chooseProactiveSnelle(st, BOT)).toEqual({ cardId: 'snelle_momentum_rush' });
		const run = driveTurn(st);
		expect(run.played.map((s) => s.action)).toEqual([{ kind: 'snelle', cardId: 'snelle_momentum_rush' }]); // recorded as a step
		expect(run.played[0].label).toBe('plays Momentum Rush');
		expect(run.played[0].state.players[BOT].activeSlots[0].mp).toBe(55);
		expect(run.played[0].state.players[BOT].piecieSlots.every((s) => !s)).toBe(true);
		expect(run.end.players[BOT].hand).toEqual([]);
		expect(run.end.players[BOT].graveyard.some((c) => c.cardId === 'snelle_momentum_rush')).toBe(true);
		expect(snelleRefusals(run.metrics)).toEqual([]);
	});

	it('under The Void a Snelle gain does nothing, so Momentum Rush stays in hand', () => {
		const st = table({ field: [mp40, null], hand: [snelle('snelle_momentum_rush')], activePlace: 'place_the_void' });
		expect(chooseProactiveSnelle(st, BOT)).toBeNull();
		const run = driveTurn(st);
		expect(run.played).toEqual([]);
		expect(run.end.players[BOT].hand).toHaveLength(1);
		expect(snelleRefusals(run.metrics)).toEqual([]);
	});

	it('never on a cooldown turn, with 3 full Piecie slots, off its own turn, or while Those Eyelashes blocks it', () => {
		const hand = [snelle('snelle_momentum_rush')];
		const down = { cardId: 'piecie_te_hard_gaan', type: 'PIECIE', faceDown: true, activated: false, playedOnTurn: 3, canActivateOnTurn: 4 };
		const cooldown = table({ field: [mp40, null], hand, bot: { cooldownTurn: true } });
		const blocked = table({ field: [mp40, null], hand, state: { _snelleBlocked: BOT } });
		expect(chooseProactiveSnelle(cooldown, BOT)).toBeNull();
		expect(chooseProactiveSnelle(table({ field: [mp40, null], hand, bot: { piecieSlots: [down, down, down] } }), BOT)).toBeNull();
		expect(chooseProactiveSnelle(table({ field: [mp40, null], hand, state: { activePlayerId: OPP } }), BOT)).toBeNull();
		expect(chooseProactiveSnelle(blocked, BOT)).toBeNull();
		for (const st of [blocked, cooldown]) {
			const run = driveTurn(st);
			expect(run.played).toEqual([]);
			expect(snelleRefusals(run.metrics)).toEqual([]);
		}
		expect(chooseProactiveSnelle(table({ field: [mp40, null], hand, bot: { piecieSlots: [down, down, null] } }), BOT)).toEqual({ cardId: 'snelle_momentum_rush' }); // control: one free slot is enough
	});

	it('a reaction Snelle (Jensen!, The Protector) is not a proactive card', () => {
		expect(chooseProactiveSnelle(table({ field: [mp40, null], hand: [snelle('snelle_jensen'), snelle('snelle_the_protector')] }), BOT)).toBeNull();
	});

	it('Bijna Welloe only while an own Mosje has 10 MP or less (its Only if); then that Mosje gains 20', () => {
		const hand = [snelle('snelle_bijna_welloe')];
		expect(chooseProactiveSnelle(table({ field: [mp40, null], hand }), BOT)).toBeNull();
		const low = table({ field: [{ id: 'mosje_gandoe_wizard', extra: { mp: 10, level: 1 } }, null], hand });
		expect(chooseProactiveSnelle(low, BOT)).toEqual({ cardId: 'snelle_bijna_welloe' });
		const run = driveTurn(low);
		expect(run.played[0].state.players[BOT].activeSlots[0].mp).toBe(30);
		expect(snelleRefusals(run.metrics)).toEqual([]);
		const high = driveTurn(table({ field: [mp40, null], hand }));
		expect(high.played).toEqual([]); // not tried either
		expect(snelleRefusals(high.metrics)).toEqual([]);
	});

	it('with two Mosjes the pick pauses and the bot answers it: exactly one gains 15 MP', () => {
		const st = table({ field: [mp40, { id: 'mosje_jeffrey', extra: { mp: 40, level: 1 } }], hand: [snelle('snelle_momentum_rush')] });
		const run = driveTurn(st);
		expect(run.played).toHaveLength(1);
		const after = run.played[0].state;
		expect(after.pendingChoice).toBeUndefined();
		expect(after.players[BOT].activeSlots.map((s) => s.mp).sort()).toEqual([40, 55]);
		expect(snelleRefusals(run.metrics)).toEqual([]);
	});

	it('Jantje Jantje... Jantje? only while Bank Chilling is the Place and a non-fresh opponent Mosje exists', () => {
		const hand = [snelle('snelle_jantje_jantje_jantje')];
		const chilling = table({ field: [mp40, null], hand, activePlace: 'place_bank_chilling' });
		expect(chooseProactiveSnelle(table({ field: [mp40, null], hand }), BOT)).toBeNull(); // no Place
		expect(chooseProactiveSnelle(table({ field: [mp40, null], hand, activePlace: 'place_the_gym' }), BOT)).toBeNull();
		expect(chooseProactiveSnelle(chilling, BOT)).toEqual({ cardId: 'snelle_jantje_jantje_jantje' });
		const fresh = table({ field: [mp40, null], hand, activePlace: 'place_bank_chilling', oppField: [{ id: 'mosje_ronald_chef', extra: { entryProtected: true } }, null] });
		expect(chooseProactiveSnelle(fresh, BOT)).toEqual({ cardId: 'snelle_jantje_jantje_jantje' }); // the own gain alone is still worth it
		const run = driveTurn(chilling);
		expect(run.played).toHaveLength(1);
		expect(run.played[0].state.players[BOT].activeSlots[0].mp).toBe(55);
		expect(run.played[0].state.players[OPP].activeSlots[0].mp).toBe(Math.max(0, slotOf('mosje_ronald_chef').mp - 15));
		expect(snelleRefusals(run.metrics)).toEqual([]);
	});

	it('Ff Haaltje Nemen (2): not with Energy 2 and Jensen! (1) held, played with Energy 3, and only while the hand is nearly empty', () => {
		const jensen = snelle('snelle_jensen');
		const draw = snelle('snelle_ff_haaltje_nemen');
		const run = (energy, hand, deck = deckOf(5)) => driveTurn(table({ energy, hand, bot: { deck } }));
		const poor = run(2, [jensen, draw]);
		expect(poor.played).toEqual([]);
		expect(poor.end.players[BOT].energy).toBe(2);
		expect(snelleRefusals(poor.metrics)).toEqual([]);
		const rich = run(3, [jensen, draw]);
		expect(rich.played.map((s) => s.action.cardId)).toEqual(['snelle_ff_haaltje_nemen']);
		expect(rich.end.players[BOT].energy).toBe(1);
		expect(rich.end.players[BOT].hand.length).toBe(3); // Jensen! + the 2 cards drawn
		const filler = (n) => Array.from({ length: n }, () => place('place_the_gym'));
		expect(chooseProactiveSnelle(table({ energy: 6, hand: [draw, ...filler(3)], bot: { deck: deckOf(5) } }), BOT)).toEqual({ cardId: 'snelle_ff_haaltje_nemen' });
		expect(chooseProactiveSnelle(table({ energy: 6, hand: [draw, ...filler(4)], bot: { deck: deckOf(5) } }), BOT)).toBeNull();
		expect(chooseProactiveSnelle(table({ energy: 6, hand: [draw], bot: { deck: [] } }), BOT)).toBeNull(); // nothing to draw
	});

	it('Chillingsvoorbij! needs a Place in the own discard pile and no Place in play', () => {
		const hand = [snelle('snelle_chillingsvoorbij')];
		const gone = [place('place_the_gym')];
		expect(chooseProactiveSnelle(table({ hand, bot: { graveyard: gone } }), BOT)).toEqual({ cardId: 'snelle_chillingsvoorbij' });
		expect(chooseProactiveSnelle(table({ hand }), BOT)).toBeNull(); // its Only if: a Place in the discard pile
		expect(chooseProactiveSnelle(table({ hand, bot: { graveyard: gone }, activePlace: 'place_boxing_ring' }), BOT)).toBeNull();
		const run = driveTurn(table({ hand, bot: { graveyard: gone } }));
		expect(run.played.map((s) => s.action.cardId)).toEqual(['snelle_chillingsvoorbij']);
		expect(snelleRefusals(run.metrics)).toEqual([]);
	});

	it('the most valuable card goes first, a cast frees its slot for the next, and the Energy reserve is kept', () => {
		const rush = snelle('snelle_momentum_rush');
		const welloe = snelle('snelle_bijna_welloe');
		const low = { id: 'mosje_gandoe_wizard', extra: { mp: 5, level: 1 } };
		const st = table({ field: [low, null], hand: [rush, welloe] });
		expect(chooseProactiveSnelle(st, BOT)).toEqual({ cardId: 'snelle_bijna_welloe' }); // +20 beats +15
		const run = driveTurn(st);
		expect(run.played.map((s) => s.action.cardId)).toEqual(['snelle_bijna_welloe', 'snelle_momentum_rush']);
		expect(run.end.players[BOT].activeSlots[0].mp).toBe(40);
		expect(run.end.players[BOT].piecieSlots.every((s) => !s)).toBe(true);
		const draw = snelle('snelle_ff_haaltje_nemen');
		expect(chooseProactiveSnelle(table({ energy: 2, hand: [draw], bot: { deck: deckOf(3) } }), BOT, 1)).toBeNull(); // 2 Energy, 1 kept back
		expect(chooseProactiveSnelle(table({ energy: 2, hand: [draw], bot: { deck: deckOf(3) } }), BOT, 0)).toEqual({ cardId: 'snelle_ff_haaltje_nemen' });
	});
});
