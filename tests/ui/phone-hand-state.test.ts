// @ts-nocheck
// Phase 65-06 (D-10, MOB-03/04): the two pure modules behind the phone tap-raise: getHandCardState (can this hand card be played now
// and why not) and createHandRaise (the DOM-free raise state machine). The DOM side and the real taps are phone-hand-raise.spec.js.
import { describe, it, expect } from 'vitest';
import { getHandCardState } from '../../src/ui/phone/getHandCardState.js';
import { createHandRaise } from '../../src/ui/phone/createHandRaise.js';
import { COOLDOWN_TEXT } from '../../src/ui/board/cooldownText.js';
import { getCardEnergyCost } from '../../src/engine/energy/getCardEnergyCost.js';
import { makeEngineState } from '../helpers/makeEngineState.js';

const FISSA = { cardId: 'mosje_alyssa_fissa', type: 'MOSJE', name: 'Alyssa, Fissa Fissa!' };
const DONER = { cardId: 'piecie_broodje_doner', type: 'PIECIE', name: 'Broodje Doner' };
const JENSEN = { cardId: 'snelle_jensen', type: 'SNELLE_PIECIE', name: 'Jensen!' };
const JEWEETNIET = { cardId: 'snelle_jeweetniet', type: 'SNELLE_PIECIE', name: 'Jeweetniet' }; // no condition (2.1: Jensen! now reacts only to a Piecie or Snelle)
const BIJNA = { cardId: 'snelle_bijna_welloe', type: 'SNELLE_PIECIE', name: 'Bijna Welloe' };
const DRAIN = { cardId: 'place_drain_zone', type: 'PLACE', name: 'Drain Zone' };
const MOSJE_ON_FIELD = { cardId: 'mosje_gandoe_wizard', type: 'MOSJE', mp: 50, isDefeated: false };
const PIECIE_ON_FIELD = { cardId: 'piecie_affoe', type: 'PIECIE', faceDown: true, activated: false };

const FISSA_COST = getCardEnergyCost('mosje_alyssa_fissa');
const stateWith = (p1 = {}, top = {}) => makeEngineState({ ...top, players: { player_1: p1 } });
const infoOf = (state, card, isLocalTurn = true) => getHandCardState({ state, playerId: 'player_1', card, isLocalTurn });

describe('getHandCardState (pure)', () => {
	it('a payable Mosje on my turn is playable and marks Mosje slot 0', () => {
		const info = infoOf(stateWith({ hand: [FISSA] }), FISSA);
		expect(info).toEqual({ canPlay: true, reason: null, cost: FISSA_COST, kind: 'mosje', slotIndex: 0 });
	});

	it('the Mosje marks the first free slot when slot 0 is taken', () => {
		const info = infoOf(stateWith({ activeSlots: [MOSJE_ON_FIELD, null] }), FISSA);
		expect(info.canPlay).toBe(true);
		expect(info.slotIndex).toBe(1);
	});

	it('a full Mosje row refuses with "Both Mosje slots are full"', () => {
		const info = infoOf(stateWith({ activeSlots: [MOSJE_ON_FIELD, MOSJE_ON_FIELD] }), FISSA);
		expect(info.canPlay).toBe(false);
		expect(info.reason).toBe('Both Mosje slots are full');
		expect(info.slotIndex).toBe(-1);
	});

	it('a Mosje that costs more than the Energy pool says what it needs', () => {
		const energy = FISSA_COST - 1;
		const info = infoOf(stateWith({ energy }), FISSA);
		expect(info.canPlay).toBe(false);
		expect(info.reason).toBe(`Needs ${FISSA_COST} Energy, you have ${energy}`);
		expect(info.cost).toBe(FISSA_COST);
	});

	it('a Piecie from the hand is free and marks the first free of the 3 Piecie slots', () => {
		const info = infoOf(stateWith({ energy: 0, piecieSlots: [PIECIE_ON_FIELD, null, null] }), DONER);
		expect(info).toEqual({ canPlay: true, reason: null, cost: 0, kind: 'piecie', slotIndex: 1 });
	});

	it('all 3 Piecie slots full refuses with "All 3 Piecie slots are full"', () => {
		const info = infoOf(stateWith({ piecieSlots: [PIECIE_ON_FIELD, PIECIE_ON_FIELD, PIECIE_ON_FIELD] }), DONER);
		expect(info.canPlay).toBe(false);
		expect(info.reason).toBe('All 3 Piecie slots are full');
		expect(info.slotIndex).toBe(-1);
	});

	it('a Snelle is playable on the opponent turn and takes a Piecie slot', () => {
		const info = infoOf(stateWith({ piecieSlots: [PIECIE_ON_FIELD, null, null] }, { activePlayerId: 'player_2' }), JEWEETNIET, false);
		expect(info.canPlay).toBe(true);
		expect(info.kind).toBe('piecie');
		expect(info.slotIndex).toBe(1);
		expect(info.cost).toBe(1);
	});

	it('Those Eyelashes blocks the Snelle: "Blocked this turn"', () => {
		const info = infoOf(stateWith({}, { _snelleBlocked: 'player_1' }), JENSEN);
		expect(info.canPlay).toBe(false);
		expect(info.reason).toBe('Blocked this turn');
	});

	it('a Snelle whose "Only if" fails says its condition is not met, and plays once it holds', () => {
		const strong = { ...MOSJE_ON_FIELD, mp: 50 };
		const weak = { ...MOSJE_ON_FIELD, mp: 10 };
		const refused = infoOf(stateWith({ activeSlots: [strong, null] }), BIJNA);
		expect(refused.canPlay).toBe(false);
		expect(refused.reason).toBe('Its condition is not met right now');
		expect(infoOf(stateWith({ activeSlots: [weak, null] }), BIJNA).canPlay).toBe(true);
	});

	it('a Place has no slot kind; a Place already in play refuses it', () => {
		const free = infoOf(stateWith({ energy: 6 }), DRAIN);
		expect(free.canPlay).toBe(true);
		expect(free.kind).toBe(null);
		expect(free.slotIndex).toBe(-1);
		const busy = infoOf(stateWith({}, { activePlace: { id: 'place_other' } }), DRAIN);
		expect(busy.canPlay).toBe(false);
		expect(busy.reason).toBe('A Place is already in play');
	});

	it('not my turn: a Mosje and a Piecie say "Not your turn"', () => {
		expect(infoOf(stateWith({}, { activePlayerId: 'player_2' }), FISSA, false).reason).toBe('Not your turn');
		expect(infoOf(stateWith({}, { activePlayerId: 'player_2' }), DONER, false).reason).toBe('Not your turn');
	});

	it('a cooldown turn blocks a Mosje with the status-strip sentence, but not a Piecie', () => {
		const state = stateWith({ cooldownTurn: true });
		const mosje = infoOf(state, FISSA);
		expect(mosje.canPlay).toBe(false);
		expect(mosje.reason).toBe(COOLDOWN_TEXT);
		expect(infoOf(state, DONER).canPlay).toBe(true);
	});

	it('a Mosje returned to the hand this turn waits until next turn', () => {
		const info = infoOf(stateWith({}), { ...FISSA, returnedThisTurn: true });
		expect(info.canPlay).toBe(false);
		expect(info.reason).toBe('Returned this turn; can be replayed next turn');
	});

	it('an unknown or non-hand type cannot be played from the hand', () => {
		expect(infoOf(stateWith({}), { cardId: 'quest_x', type: 'QUEST' }).reason).toBe('Cannot be played from the hand');
		const odd = infoOf(stateWith({}), { cardId: 'mystery', type: 'UNKNOWN' });
		expect(odd.canPlay).toBe(false);
		expect(odd.reason).toBe('Cannot be played from the hand');
		expect(odd.kind).toBe(null);
	});

	it('never mutates the state or the card', () => {
		const state = stateWith({ activeSlots: [MOSJE_ON_FIELD, null], hand: [FISSA, DONER, JENSEN], cooldownTurn: true }, { _snelleBlocked: 'player_2' });
		const stateCopy = JSON.parse(JSON.stringify(state));
		const cardCopy = JSON.parse(JSON.stringify(FISSA));
		for (const card of [FISSA, DONER, JENSEN, BIJNA, DRAIN]) { infoOf(state, card); infoOf(state, card, false); }
		expect(state).toEqual(stateCopy);
		expect(FISSA).toEqual(cardCopy);
	});
});

describe('createHandRaise (state machine, no DOM)', () => {
	/** A raise on a fake context; every effect and callback is recorded in `log`. */
	function setup(playerOverrides = {}, topOverrides = {}) {
		const log = [];
		const ctx = {
			state: stateWith({ hand: [FISSA, DONER, JENSEN], ...playerOverrides }, topOverrides),
			localPlayerId: 'player_1',
			isLocalTurn: true,
			cards: [FISSA, DONER, JENSEN],
		};
		const raise = createHandRaise({
			effects: {
				onView: (view) => log.push(['view', view ? view.cardId : null, view ? view.info.canPlay : null]),
				onReject: (reason) => log.push(['reject', reason]),
			},
		});
		raise.configure({
			onPlay: (cardId, type) => log.push(['play', cardId, type]),
			onDetails: (card) => log.push(['details', card.cardId]),
			getContext: () => ctx,
		});
		return { raise, log, ctx };
	}

	it('toggle raises a card and toggling the same card again cancels it', () => {
		const { raise, log } = setup();
		raise.toggle(FISSA.cardId);
		expect(raise.current().cardId).toBe(FISSA.cardId);
		expect(log).toEqual([['view', FISSA.cardId, true]]);
		raise.toggle(FISSA.cardId);
		expect(raise.current()).toBe(null);
		expect(log[1]).toEqual(['view', null, null]);
	});

	it('only one card is raised at a time: toggling B replaces A', () => {
		const { raise, log } = setup();
		raise.toggle(FISSA.cardId);
		raise.toggle(DONER.cardId);
		expect(raise.current().cardId).toBe(DONER.cardId);
		expect(log.filter((e) => e[0] === 'view').map((e) => e[1])).toEqual([FISSA.cardId, DONER.cardId]);
	});

	it('an id that is not in the hand is ignored', () => {
		const { raise, log } = setup();
		raise.toggle('not_in_hand');
		raise.toggle(undefined); // a hand entry of an unknown card has no cardId
		raise.toggle(null);
		expect(raise.current()).toBe(null);
		expect(log).toEqual([]);
	});

	it('cancel drops the raise; with nothing raised it does nothing at all', () => {
		const { raise, log } = setup();
		raise.cancel();
		expect(log).toEqual([]);
		raise.toggle(FISSA.cardId);
		raise.cancel();
		expect(raise.current()).toBe(null);
		expect(log).toEqual([['view', FISSA.cardId, true], ['view', null, null]]);
	});

	it('play() on a playable card clears the view BEFORE onPlay and plays exactly once with (cardId, type)', () => {
		const { raise, log } = setup();
		raise.toggle(FISSA.cardId);
		log.length = 0;
		raise.play();
		expect(log).toEqual([['view', null, null], ['play', FISSA.cardId, 'MOSJE']]);
		expect(raise.current()).toBe(null);
		raise.play(); // nothing is raised any more
		expect(log.filter((e) => e[0] === 'play').length).toBe(1);
	});

	it('play() on an unplayable card rejects with the reason and never plays', () => {
		const { raise, log } = setup({ energy: 0 });
		raise.toggle(FISSA.cardId);
		log.length = 0;
		raise.play();
		expect(log).toEqual([['reject', `Needs ${FISSA_COST} Energy, you have 0`]]);
		expect(raise.current().cardId).toBe(FISSA.cardId);
	});

	it('details() hands the card to onDetails and keeps the raise', () => {
		const { raise, log } = setup();
		raise.toggle(DONER.cardId);
		log.length = 0;
		raise.details();
		expect(log).toEqual([['details', DONER.cardId]]);
		expect(raise.current().cardId).toBe(DONER.cardId);
	});

	it('refresh() drops a card that left the hand', () => {
		const { raise, log, ctx } = setup();
		raise.toggle(FISSA.cardId);
		ctx.cards = [DONER, JENSEN];
		log.length = 0;
		raise.refresh();
		expect(raise.current()).toBe(null);
		expect(log).toEqual([['view', null, null]]);
	});

	it('refresh() recomputes canPlay when the Energy changed', () => {
		const { raise, log, ctx } = setup();
		raise.toggle(FISSA.cardId);
		expect(raise.current().info.canPlay).toBe(true);
		ctx.state = stateWith({ hand: [FISSA, DONER, JENSEN], energy: 0 });
		log.length = 0;
		raise.refresh();
		expect(raise.current().info.canPlay).toBe(false);
		expect(log).toEqual([['view', FISSA.cardId, false]]);
	});

	it('refresh() with nothing raised does nothing (the desktop never sees an effect)', () => {
		const { raise, log } = setup();
		raise.refresh();
		expect(log).toEqual([]);
	});
});
