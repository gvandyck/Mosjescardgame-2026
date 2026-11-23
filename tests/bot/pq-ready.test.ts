// @ts-nocheck
// Phase 73-04 (CC-5): near or at Level 3 the bot holds what its Personal Quest names (ready Piecies, hand cards,
// Energy, the Place) and plays the needed Place before the attempt.
import { describe, it, expect, afterEach } from 'vitest';
import { makeEngineState } from '../helpers/makeEngineState.js';
import { mkSlot as baseSlot } from '../helpers/quest56.js';
import { MOSJES } from '../../src/data/mosjes.js';
import { driveBotTurnSteps } from '../../src/bot/botDriver.js';
import { startTurn } from '../../src/engine/turnManager.js';
import { pushTestDice, clearTestDice } from '../../src/engine/dice/testDiceQueue.js';
import { getPersonalQuestPlan } from '../../src/bot/strategy/getPersonalQuestPlan.js';
import { piecieHoldSlots } from '../../src/bot/strategy/piecieHoldSlots.js';
import { pieciesHeldInHand } from '../../src/bot/strategy/pieciesHeldInHand.js';
import { planPiecieActivations } from '../../src/bot/strategy/planPiecieActivations.js';
import { choosePieciesToPlace } from '../../src/bot/strategy/choosePieciesToPlace.js';
import { choosePlaceToPlay } from '../../src/bot/strategy/choosePlaceToPlay.js';
import { defaultAbilityInputs } from '../../src/bot/strategy/defaultAbilityInputs.js';

afterEach(() => clearTestDice());

const JEFFREY = MOSJES.find((m) => m.id === 'mosje_jeffrey');
const mkSlot = (over = {}) => baseSlot(over, JEFFREY);
const pq = (id) => ({ cardId: id, type: 'PERSONAL_QUEST' });
const card = (cardId, type = 'PIECIE') => ({ cardId, type });
const filler = (n = 8) => Array.from({ length: n }, (_, i) => ({ cardId: `filler_${i}`, type: 'PIECIE' }));
const ready = (cardId) => ({ cardId, type: 'PIECIE', faceDown: true, activated: false, playedOnTurn: 1, canActivateOnTurn: 2 });
const keeper = (subtype, over = {}) => mkSlot({ level: 3, mp: 60, subtype, traits: { strength: 2, tech: 2, art: 2 }, ...over });
const foe = () => mkSlot({ level: 3, mp: 60, entryProtected: false });

function table({ slots, hand, piecies = [], energy = 3 }) {
	return makeEngineState({
		turnNumber: 5,
		players: {
			player_1: { activeSlots: slots, hand, deck: filler(), energy, piecieSlots: [...piecies, null, null, null, null].slice(0, 4) },
			player_2: { activeSlots: [foe(), null], deck: filler(), hand: [] },
		},
	});
}
const planOf = (s) => getPersonalQuestPlan(s, 'player_1');

describe('piecieHoldSlots', () => {
	it('Michelinster: the ready Ronald Kip is held', () => {
		const s = table({ slots: [keeper('PHYSICAL'), mkSlot({ subtype: 'DIGITAL' })], hand: [pq('pq_michelinster')], piecies: [ready('piecie_keyboard'), ready('piecie_ronald_kip')] });
		expect([...piecieHoldSlots(s, 'player_1', planOf(s))]).toEqual([1]);
	});
	it('Knocked Down: the first ready food Piecie by tag, one slot never twice', () => {
		const s = table({ slots: [keeper('PHYSICAL', { mp: 70 }), null], hand: [pq('pq_knocked_down_not_out')], piecies: [ready('piecie_keyboard'), ready('piecie_kannetje_melk'), ready('piecie_ronald_kip')] });
		expect([...piecieHoldSlots(s, 'player_1', planOf(s))]).toEqual([1]);
	});
	it('a used (face-up) Piecie is not held', () => {
		const used = { ...ready('piecie_ronald_kip'), faceDown: false, activated: true };
		const s = table({ slots: [keeper('PHYSICAL'), mkSlot()], hand: [pq('pq_michelinster')], piecies: [used] });
		expect(piecieHoldSlots(s, 'player_1', planOf(s)).size).toBe(0);
	});
	it('Level 2 keeper at 70 MP holds, at 40 MP does not', () => {
		const mk = (mp) => table({ slots: [keeper('PHYSICAL', { level: 2, mp }), mkSlot()], hand: [pq('pq_michelinster')], piecies: [ready('piecie_ronald_kip')] });
		expect(piecieHoldSlots(mk(70), 'player_1', planOf(mk(70))).size).toBe(1);
		expect(piecieHoldSlots(mk(40), 'player_1', planOf(mk(40))).size).toBe(0);
	});
	it('no Personal Quest: nothing held', () => {
		const s = table({ slots: [keeper('PHYSICAL'), null], hand: [], piecies: [ready('piecie_ronald_kip')] });
		expect(piecieHoldSlots(s, 'player_1', planOf(s)).size).toBe(0);
	});
});

describe('pieciesHeldInHand', () => {
	it('Michelinster: the first food Piecie in the hand is kept', () => {
		const s = table({ slots: [keeper('PHYSICAL'), mkSlot()], hand: [pq('pq_michelinster'), card('piecie_keyboard'), card('piecie_kannetje_melk')] });
		const r = pieciesHeldInHand(s, 'player_1', planOf(s));
		expect([...r.keep]).toEqual([2]);
		expect(r.maxTake).toBe(Infinity);
	});
	it('World Record Run: 2 of 3 gear Piecies are kept, one is placed', () => {
		const s = table({ slots: [keeper('DIGITAL'), null], hand: [pq('pq_world_record_run'), card('piecie_keyboard'), card('piecie_mouse'), card('piecie_controller')] });
		expect([...pieciesHeldInHand(s, 'player_1', planOf(s)).keep]).toEqual([1, 2]);
		expect(choosePieciesToPlace(s, 'player_1').map((c) => c.cardId)).toEqual(['piecie_controller']);
	});
	it('Aloha: a hand of 7 may give up only 1 Piecie (7 - 1 - 5)', () => {
		const hand = [pq('pq_aloha_tech_support'), ...Array.from({ length: 6 }, () => card('piecie_kannetje_melk'))];
		const s = table({ slots: [keeper('DIGITAL'), null], hand });
		expect(pieciesHeldInHand(s, 'player_1', planOf(s)).maxTake).toBe(1);
		expect(choosePieciesToPlace(s, 'player_1')).toHaveLength(1);
	});
	it('Binti Brandt: a Piecie of the hand stays (type match)', () => {
		const s = table({ slots: [keeper('CREATIVE'), null], hand: [pq('pq_binti_brandt'), card('piecie_keyboard')] });
		expect([...pieciesHeldInHand(s, 'player_1', planOf(s)).keep]).toEqual([1]);
		expect(choosePieciesToPlace(s, 'player_1')).toEqual([]);
	});
	it('no Personal Quest: nothing kept, everything is placed as today', () => {
		const s = table({ slots: [keeper('PHYSICAL'), null], hand: [card('piecie_keyboard'), card('piecie_mouse')] });
		const r = pieciesHeldInHand(s, 'player_1', planOf(s));
		expect(r.keep.size).toBe(0);
		expect(r.maxTake).toBe(Infinity);
		expect(choosePieciesToPlace(s, 'player_1')).toHaveLength(2);
	});
});

describe('the choosers', () => {
	it('planPiecieActivations skips the held Ronald Kip, but plans it without the Personal Quest', () => {
		const withPq = table({ slots: [keeper('PHYSICAL', { mp: 40 }), mkSlot({ subtype: 'DIGITAL' })], hand: [pq('pq_michelinster')], piecies: [ready('piecie_ronald_kip')], energy: 5 });
		const without = table({ slots: [keeper('PHYSICAL', { mp: 40 }), mkSlot({ subtype: 'DIGITAL' })], hand: [], piecies: [ready('piecie_ronald_kip')], energy: 5 });
		expect(planPiecieActivations(without, 'player_1', {}, { willQuest: true }).map((e) => e.cardId)).toContain('piecie_ronald_kip');
		expect(planPiecieActivations(withPq, 'player_1', {}, { willQuest: true }).map((e) => e.cardId)).not.toContain('piecie_ronald_kip');
	});
	it('defaultAbilityInputs never discards the kept Piecie (Binti), and still works with a spare one', () => {
		const mk = (hand) => table({ slots: [keeper('CREATIVE'), null], hand });
		expect(defaultAbilityInputs(mk([pq('pq_binti_brandt'), card('piecie_keyboard')]), 'player_1', 'ability_binti_cutting_words')).toBeNull();
		const two = defaultAbilityInputs(mk([pq('pq_binti_brandt'), card('piecie_keyboard'), card('piecie_mouse')]), 'player_1', 'ability_binti_cutting_words');
		expect(two.hand_card).toBe(2);
	});
	it('choosePlaceToPlay plays the Gym the held Personal Quest needs', () => {
		const s = startTurn(table({ slots: [keeper('PHYSICAL'), null], hand: [pq('pq_sterke_jongen'), card('place_the_gym', 'PLACE')], energy: 3 }));
		s.players.player_1.energy = 3;
		expect(choosePlaceToPlay(s, 'player_1', 0)?.cardId).toBe('place_the_gym');
	});
	it('choosePlaceToPlay never plays Tesla without a Coert, even when named', () => {
		const s = startTurn(table({ slots: [keeper('PHYSICAL'), null], hand: [pq('pq_sterke_jongen'), card('place_tesla', 'PLACE')], energy: 6 }));
		s.players.player_1.energy = 6;
		expect(choosePlaceToPlay(s, 'player_1', 0)).toBeNull();
	});
});

function drive(state, dice) {
	pushTestDice(dice); // after the state is built: startTurn must not eat the scripted dice
	const metrics = [];
	const log = console.log;
	console.log = (...a) => { if (typeof a[0] === 'string' && a[0].startsWith('[BOT] METRIC ')) metrics.push(JSON.parse(a[0].slice(13))); };
	try { return { steps: driveBotTurnSteps(state, 'player_1', { humanIds: [] }), metrics }; } finally { console.log = log; }
}
const labels = (steps) => steps.map((s) => s.label);
const last = (steps) => steps[steps.length - 1].state;
// startTurn draws a card and tops up Energy: the scenario is set AFTER it.
function turn(opts, tweak) {
	const s = startTurn(table(opts));
	s.players.player_1.hand = opts.hand;
	s.players.player_1.energy = opts.energy;
	for (const m of s.players.player_1.activeSlots) if (m) m.levelAtTurnStart = m.level;
	tweak?.(s);
	return s;
}

describe('driver scenarios', () => {
	it('Sterke Jongen: the Gym is played first, then the attempt wins', () => {
		const s = turn({ slots: [keeper('PHYSICAL', { attachments: [{ cardId: 'piecie_dumbbells', attachedTurn: 1 }] }), null], hand: [pq('pq_sterke_jongen'), card('place_the_gym', 'PLACE')], energy: 4 });
		const { steps, metrics } = drive(s, [5, 5, 5]);
		const l = labels(steps);
		const place = l.findIndex((x) => x.startsWith('plays Place'));
		const attempt = l.findIndex((x) => x.includes('Personal Quest'));
		expect(place).toBeGreaterThanOrEqual(0);
		expect(attempt).toBeGreaterThan(place);
		expect(last(steps).status).toBe('FINISHED');
		expect(last(steps).winReason).toBe('PERSONAL_QUEST');
		expect(metrics.filter((m) => m.ev === 'engine-refused')).toEqual([]);
	});

	it('Michelinster: Ronald Kip stays ready, the food Piecie stays in hand, the attempt wins', () => {
		const s = turn({ slots: [keeper('PHYSICAL'), mkSlot({ subtype: 'DIGITAL', level: 1, mp: 40 })], hand: [pq('pq_michelinster'), card('piecie_kannetje_melk')], piecies: [ready('piecie_ronald_kip')], energy: 5 });
		const { steps, metrics } = drive(s, [4, 4, 6]);
		expect(labels(steps).some((x) => x.startsWith('activates ronald kip'))).toBe(false);
		expect(labels(steps).some((x) => x.includes('Personal Quest'))).toBe(true);
		expect(last(steps).winReason).toBe('PERSONAL_QUEST');
		expect(metrics.filter((m) => m.ev === 'engine-refused')).toEqual([]);
	});

	it('Aloha (Pay 2 Energy): an energy-costing Piecie is not activated, the attempt still happens', () => {
		const hand = [pq('pq_aloha_tech_support'), ...Array.from({ length: 5 }, () => card('piecie_keyboard'))];
		const s = turn({ slots: [keeper('DIGITAL', { attachments: [{ cardId: 'piecie_dumbbells', attachedTurn: 1 }] }), null], hand, piecies: [ready('piecie_ronald_kip')], energy: 3 });
		const { steps, metrics } = drive(s, [4, 4]);
		expect(labels(steps).some((x) => x.startsWith('activates ronald kip'))).toBe(false);
		expect(labels(steps).some((x) => x.includes('Personal Quest'))).toBe(true);
		expect(metrics.filter((m) => m.ev === 'engine-refused')).toEqual([]);
	});
});
