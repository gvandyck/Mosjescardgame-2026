// @ts-nocheck
// BOT-02 / BOT-01 (61-08): cards from hand on the bot's own turn. Places are chosen by how well they fit the board
// (placeFit); non-reaction Snelle are played proactively when legal and worth something; the seeded Example Deck
// games make no engine call the engine refuses.
import { describe, it, expect, vi } from 'vitest';
import { MOSJES } from '../../src/data/mosjes.js';
import { createMosjeSlot } from '../../src/engine/mp/createMosjeSlot.js';
import { placeFit } from '../../src/bot/strategy/placeFit.js';
import { choosePlaceToPlay } from '../../src/bot/strategy/choosePlaceToPlay.js';
import { driveBotTurnSteps } from '../../src/bot/botDriver.js';
import { makeEngineState } from '../helpers/makeEngineState.js';

const BOT = 'player_1';
const OPP = 'player_2';
const slotOf = (id, extra = {}) => ({ ...createMosjeSlot(MOSJES.find((m) => m.id === id)), entryProtected: false, ...extra });
const place = (cardId) => ({ cardId, type: 'PLACE' });

// Three stacks; `faceUp` names the face-up Quest per stack (a stack without one has no Quest up).
const stacks = (faceUp = {}) => ['FIGHTING', 'DIGITAL', 'ARTISTIC'].reduce((o, id) => ({ ...o, [id]: { deck: [], faceUp: faceUp[id] ?? null, tokens: 0, discard: [] } }), {});

// The bot is player_1 and it is its turn 3. A null in `field` / `oppField` is an open slot.
function table({ energy = 3, field = ['mosje_gandoe_wizard', null], oppField = ['mosje_ronald_chef', null], hand = [], faceUp = {}, activePlace = null, bot = {}, state = {} } = {}) {
	return makeEngineState({
		turnNumber: 3,
		activePlayerId: BOT,
		activePlace,
		activePlacePlayedBy: activePlace ? OPP : null,
		questStacks: stacks(faceUp),
		...state,
		players: {
			[BOT]: { energy, hand, activeSlots: field.map((id) => (id ? slotOf(id) : null)), ...bot },
			[OPP]: { energy: 3, activeSlots: oppField.map((id) => (id ? slotOf(id) : null)) },
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
