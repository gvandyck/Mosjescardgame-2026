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
import { shouldUseAbility } from '../../src/bot/strategy/shouldUseAbility.js';
import { defaultAbilityInputs } from '../../src/bot/strategy/defaultAbilityInputs.js';
import { chooseReaction } from '../../src/bot/strategy/chooseReaction.js';
import { getBotProfile } from '../../src/bot/strategy/botProfiles.js';
import { driveBotTurnSteps } from '../../src/bot/botDriver.js';
import { startTurn } from '../../src/engine/turnManager.js';
import { rollQuestAttempt } from '../../src/engine/quests/rollQuestAttempt.js';
import { resolveReaction } from '../../src/engine/reactions/resolveReaction.js';
import { pushTestDice, clearTestDice } from '../../src/engine/dice/testDiceQueue.js';
import { runSeededBotGame } from '../helpers/runSeededBotGame.js';
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
function table({ energy = 3, field = ['mosje_gandoe_wizard', null], oppField = ['mosje_ronald_chef', null], hand = [], oppHand = [], faceUp = {}, activePlace = null, bot = {}, state = {} } = {}) {
	return makeEngineState({
		turnNumber: 3,
		activePlayerId: BOT,
		activePlace,
		activePlacePlayedBy: activePlace ? OPP : null,
		questStacks: stacks(faceUp),
		...state,
		players: {
			[BOT]: { energy, hand, activeSlots: field.map(mosjeIn), ...bot },
			[OPP]: { energy: 3, hand: oppHand, activeSlots: oppField.map(mosjeIn) },
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
// engine-refused metrics, optionally only for the given driver calls.
const refusals = (metrics, ...calls) => metrics.filter((m) => m.ev === 'engine-refused' && (!calls.length || calls.includes(m.call)));
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
		expect(refusals(run.metrics)).toEqual([]);
	});

	it('under The Void a Snelle gain does nothing, so Momentum Rush stays in hand', () => {
		const st = table({ field: [mp40, null], hand: [snelle('snelle_momentum_rush')], activePlace: 'place_the_void' });
		expect(chooseProactiveSnelle(st, BOT)).toBeNull();
		const run = driveTurn(st);
		expect(run.played).toEqual([]);
		expect(run.end.players[BOT].hand).toHaveLength(1);
		expect(refusals(run.metrics)).toEqual([]);
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
			expect(refusals(run.metrics)).toEqual([]);
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
		expect(refusals(run.metrics)).toEqual([]);
		const high = driveTurn(table({ field: [mp40, null], hand }));
		expect(high.played).toEqual([]); // not tried either
		expect(refusals(high.metrics)).toEqual([]);
	});

	it('with two Mosjes the pick pauses and the bot answers it: exactly one gains 15 MP', () => {
		const st = table({ field: [mp40, { id: 'mosje_jeffrey', extra: { mp: 40, level: 1 } }], hand: [snelle('snelle_momentum_rush')] });
		const run = driveTurn(st);
		expect(run.played).toHaveLength(1);
		const after = run.played[0].state;
		expect(after.pendingChoice).toBeUndefined();
		expect(after.players[BOT].activeSlots.map((s) => s.mp).sort()).toEqual([40, 55]);
		expect(refusals(run.metrics)).toEqual([]);
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
		expect(refusals(run.metrics)).toEqual([]);
	});

	it('Ff Haaltje Nemen (2): not with Energy 2 and Jensen! (1) held, played with Energy 3, and only while the hand is nearly empty', () => {
		const jensen = snelle('snelle_jensen');
		const draw = snelle('snelle_ff_haaltje_nemen');
		const run = (energy, hand, deck = deckOf(5)) => driveTurn(table({ energy, hand, bot: { deck } }));
		const poor = run(2, [jensen, draw]);
		expect(poor.played).toEqual([]);
		expect(poor.end.players[BOT].energy).toBe(2);
		expect(refusals(poor.metrics)).toEqual([]);
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
		expect(refusals(run.metrics)).toEqual([]);
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

// ---------------------------------------------------------------------------------------------------------------
// The refusal sweep: the bot only makes engine calls the engine accepts
// ---------------------------------------------------------------------------------------------------------------
describe('shouldUseAbility: only a press the engine would accept', () => {
	const profile = (st) => getBotProfile(st, BOT);
	const use = (field, over = {}) => { const st = table({ energy: 6, field, ...over }); return shouldUseAbility(st, BOT, 0, profile(st)); };

	it('triggers, passives, the DJ reaction and the draw-step abilities have no button', () => {
		for (const id of ['mosje_alyssa_fissa', 'mosje_azn_cless', 'mosje_drainer', 'mosje_parkour_west', 'mosje_jisca', 'mosje_cless_teacher', 'mosje_jeffrey', 'mosje_gandoe_wizard']) {
			expect(use([id, null]), id).toBe(false); // trigger / passive
		}
		expect(use(['mosje_dj_8020', null])).toBe(false); // Lucky Beats: a reaction at the Quest pause
		expect(use(['mosje_coert_tech', null])).toBe(false); // Extra Resources: a draw-step option
		expect(use(['mosje_martin_historian', null])).toBe(false); // Time Control: a draw-step option
	});

	it('an activated ability: only on the own turn, not on a cooldown turn, and within its per-turn limit', () => {
		const id = 'mosje_jeffrey_gambler'; // High Stakes, once per turn
		expect(use([id, null])).toBe(true); // control
		expect(use([id, null], { state: { activePlayerId: OPP } })).toBe(false);
		expect(use([id, null], { bot: { cooldownTurn: true } })).toBe(false);
		const used = table({ energy: 6, field: [{ id, extra: { abilityUsedThisTurn: true, abilityUsesThisTurn: 1 } }, null] });
		expect(shouldUseAbility(used, BOT, 0, profile(used))).toBe(false);
	});

	it('Chris - Perfect Setup needs all 3 Piecie slots holding face-down Piecies', () => {
		const down = (cardId) => ({ cardId, type: 'PIECIE', faceDown: true, activated: false, playedOnTurn: 2, canActivateOnTurn: 3 });
		const three = [down('piecie_kannetje_melk'), down('piecie_kannetje_melk'), down('piecie_kannetje_melk')];
		expect(use(['mosje_chris', null], { bot: { piecieSlots: three } })).toBe(true);
		expect(use(['mosje_chris', null], { bot: { piecieSlots: [three[0], three[1], null] } })).toBe(false);
		expect(use(['mosje_chris', null])).toBe(false);
	});
});

describe('defaultAbilityInputs: a free activation passes the engine gate', () => {
	const down = (cardId) => ({ cardId, type: 'PIECIE', faceDown: true, activated: false, playedOnTurn: 2, canActivateOnTurn: 3 });
	const inputs = (slots) => defaultAbilityInputs(table({ field: ['mosje_chris', null], bot: { piecieSlots: slots } }), BOT, 'ability_chris_perfect_setup');

	it('skips a Piecie whose Level 2+ gate is not met (Chris used to pick slot 0 and get "Needs: one of your Mosjes at Level 2+")', () => {
		expect(inputs([down('piecie_dikke_taks'), down('piecie_kannetje_melk'), down('piecie_kannetje_melk')])).toEqual({ piecie_slot: 1 });
	});
	it('no Piecie it may activate: no answer, the ability is skipped', () => {
		expect(inputs([down('piecie_dikke_taks'), down('piecie_harde_didde'), down('piecie_klaar_met_jou')])).toBeNull();
	});
	it('and the driver does not try it (no refusal)', () => {
		const st = table({ field: ['mosje_chris', null], bot: { piecieSlots: [down('piecie_dikke_taks'), down('piecie_harde_didde'), down('piecie_klaar_met_jou')] } });
		expect(refusals(driveTurn(st).metrics)).toEqual([]);
	});
});

describe('driver: no call the engine rejects', () => {
	it('an empty deck at the draw step makes the turn a cooldown turn: nothing but face-down Piecies is tried', () => {
		const ready = { cardId: 'piecie_te_hard_gaan', type: 'PIECIE', faceDown: true, activated: false, playedOnTurn: 1, canActivateOnTurn: 2 };
		const gone = [{ cardId: 'piecie_kannetje_melk', type: 'PIECIE' }];
		// Coert Tech has a draw-step option, so startTurn pauses on the draw; the bot answers it, and THEN the deck-out cooldown starts.
		const opened = startTurn(table({ field: ['mosje_coert_tech', null], hand: [], bot: { deck: [], graveyard: gone, piecieSlots: [ready, null, null] } }));
		expect(opened.pendingDrawStep?.playerId).toBe(BOT);
		expect(opened.players[BOT].cooldownTurn).toBeFalsy();
		const run = driveTurn(opened);
		expect(run.steps[run.steps.length - 1].label).toBe('ends turn (cooldown)'); // the turn end clears the flag, so the label is the proof
		expect(run.steps.some((x) => x.action?.kind === 'activate')).toBe(false);
		expect(refusals(run.metrics)).toEqual([]);
	});

	it('a Piecie answered through a reaction window leaves no unanswered Mosje pause (Jisca chain pick) for the next activation', () => {
		clearTestDice();
		pushTestDice([5, 5, 5, 5]); // Jisca's Perfect Combo roll: 4-6 chains a free activation (the window's dry run uses up the first ones)
		const down = (cardId) => ({ cardId, type: 'PIECIE', faceDown: true, activated: false, playedOnTurn: 2, canActivateOnTurn: 3 });
		const mentalTwo = { id: 'mosje_ronald_chef', extra: { traits: { mental: 2 }, mp: 80 } };
		const st = table({
			energy: 6,
			field: ['mosje_jisca', null],
			oppField: [mentalTwo, { id: 'mosje_jeffrey', extra: { mp: 80 } }], // two targets: Jisca's target pick pauses
			bot: { piecieSlots: [down('piecie_kannetje_melk'), down('piecie_te_hard_gaan'), null] },
			oppHand: [snelle('snelle_jammertje_gepakt')], // an eligible window the bot passes (a cheap Piecie is not worth cancelling)
		});
		let run;
		try { run = driveTurn(st); } finally { clearTestDice(); }
		expect(run.steps.some((s) => s.action?.kind === 'activate')).toBe(true);
		for (const s of run.steps) expect(s.state.pendingChoice, `after "${s.label}"`).toBeUndefined();
		expect(refusals(run.metrics, 'resolveReaction', 'activatePiecie')).toEqual([]);
	});
});

describe('Sleutelpuntje under a held Quest cost', () => {
	// quest_cheat_code: "Discard 1 Snelle from your hand" - the cost names a hand INDEX, and playing Sleutelpuntje shifts the hand.
	const windowFor = (hand, costIndex) => {
		const st = table({
			energy: 3,
			hand,
			field: [{ id: 'mosje_ronald_chef', extra: { traits: { mental: 2 } } }, null],
			faceUp: { DIGITAL: 'quest_cheat_code' },
		});
		const r = rollQuestAttempt(st, BOT, { slotIndex: 0, stackId: 'DIGITAL', costChoice: { zone: 'hand', index: costIndex } });
		expect(r.reactionPending).toBe(true);
		expect(r.state.pendingReaction.moments).toEqual(['beforeOwnQuestRoll']);
		return r.state;
	};
	const sleutel = snelle('snelle_sleutelpuntje');
	const rush = snelle('snelle_momentum_rush');

	it('not played when it shifts the discarded card out of place (the engine would refuse the roll)', () => {
		const w = windowFor([sleutel, rush], 1); // the cost discards index 1 = Momentum Rush; without Sleutelpuntje index 1 is gone
		expect(resolveReaction(w, BOT, 'snelle_sleutelpuntje').ok).toBe(false);
		expect(chooseReaction(w, BOT)).toBeNull();
	});
	it('played when the cost still points at the same card afterwards', () => {
		const w = windowFor([rush, sleutel], 0);
		expect(chooseReaction(w, BOT)).toBe('snelle_sleutelpuntje');
		expect(resolveReaction(w, BOT, 'snelle_sleutelpuntje').ok).toBe(true);
	});
});

describe('seeded Example Deck bot-vs-bot games: 0 engine-refused', () => {
	const DECKS = ['EXAMPLE_TAKSEN', 'EXAMPLE_REGELAARS', 'EXAMPLE_CREATIEVELINGEN'];
	const PAIRS = DECKS.flatMap((a) => DECKS.filter((b) => b !== a).map((b) => [a, b])); // the 6 ordered pairings
	for (const seed of [0xB07A, 0xB07B]) {
		for (const [a, b] of PAIRS) {
			it(`${a} vs ${b}, seed 0x${seed.toString(16).toUpperCase()}`, () => {
				const realRandom = Math.random;
				const realLog = console.log;
				const game = runSeededBotGame({ p1DeckId: a, p2DeckId: b, seed });
				expect(Math.random).toBe(realRandom); // the runner puts both globals back
				expect(console.log).toBe(realLog);
				expect(game.turns).toBeGreaterThan(0);
				const refused = refusals(game.metrics);
				expect(refused.map((m) => `${m.call} | ${m.cardId} | ${m.error}`)).toEqual([]);
			}, 60000);
		}
	}
});
