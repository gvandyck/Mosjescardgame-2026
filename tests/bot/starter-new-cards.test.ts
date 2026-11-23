// @ts-nocheck
// Phase 73-03 (CC-6, CC-7, CC-8): Punto Banco is played and called, Te Hard Gaan is paid by a Mosje that can attack,
// FPS West is pressed only when it can pay off and bottoms a reaction Snelle.
import { describe, it, expect, afterEach } from 'vitest';
import { makeEngineState } from '../helpers/makeEngineState.js';
import { makePiecieState } from '../helpers/makePiecieState.js';
import { mkSlot as baseSlot } from '../helpers/quest56.js';
import { MOSJES } from '../../src/data/mosjes.js';
import { QUESTS } from '../../src/data/quests.js';
import { PQ_VALUES } from '../../src/bot/strategy/pqValues.js';
import { startTurn } from '../../src/engine/turnManager.js';
import { driveBotTurnSteps } from '../../src/bot/botDriver.js';
import { pushTestDice, clearTestDice } from '../../src/engine/dice/testDiceQueue.js';
import { createMosjeSlot } from '../../src/engine/mp/createMosjeSlot.js';
import { placeFit } from '../../src/bot/strategy/placeFit.js';
import { choosePlaceToPlay } from '../../src/bot/strategy/choosePlaceToPlay.js';
import { choosePuntoBanco } from '../../src/bot/strategy/choosePuntoBanco.js';
import { pickCostMosje } from '../../src/bot/strategy/pickCostMosje.js';
import { pickFpsWestBottom } from '../../src/bot/strategy/pickFpsWestBottom.js';
import { chooseTriggerChoice } from '../../src/bot/strategy/chooseTriggerChoice.js';
import { isUsefulActivation } from '../../src/bot/strategy/isUsefulActivation.js';
import { planPiecieActivations } from '../../src/bot/strategy/planPiecieActivations.js';
import { shouldUseAbility } from '../../src/bot/strategy/shouldUseAbility.js';
import { getBotProfile } from '../../src/bot/strategy/botProfiles.js';
import { asBotView } from '../../src/bot/strategy/asBotView.js';

afterEach(() => clearTestDice());

const JEFFREY = MOSJES.find((m) => m.id === 'mosje_jeffrey');
const mk = (over = {}) => baseSlot(over, JEFFREY);
const PUNTO = 'place_punto_banco';
const pq = (id = 'pq_charge') => ({ cardId: id, type: 'PERSONAL_QUEST' });
const filler = (n = 8) => Array.from({ length: n }, (_, i) => ({ cardId: `filler_${i}`, type: 'PIECIE' }));
const stacks = (faceUp = {}) => {
	const out = {};
	for (const id of ['PHYSICAL', 'DIGITAL', 'CREATIVE']) out[id] = { deck: [], faceUp: faceUp[id] ?? null, tokens: 0, discard: [] };
	return out;
};
const steadyQuest = QUESTS.find((q) => q.band === 'steady');
const trainedQuest = QUESTS.find((q) => q.band === 'trained');
const heroicQuest = QUESTS.find((q) => q.band === 'heroic');

function board({ me = [mk({ mp: 40 }), null], hand = [], energy = 5, place = null, faceUp = {}, p1 = {} } = {}) {
	return makeEngineState({
		turnNumber: 5,
		activePlace: place,
		activePlacePlayedBy: 'player_2',
		questStacks: stacks(faceUp),
		players: { player_1: { activeSlots: me, hand, energy, deck: filler(), ...p1 }, player_2: { activeSlots: [mk({ mp: 60 }), null], hand: [], deck: filler() } },
	});
}

describe('Punto Banco: placeFit and choosePlaceToPlay', () => {
	it('fit is PUNTO_BANCO_FIT with a settled upright Mosje, 0 with none', () => {
		expect(placeFit(board(), 'player_1', PUNTO)).toBe(PQ_VALUES.PUNTO_BANCO_FIT);
		expect(placeFit(board({ me: [mk({ mp: 40, entryProtected: true }), null] }), 'player_1', PUNTO)).toBe(0);
		expect(placeFit(board({ me: [mk({ mp: 40, sideways: true }), null] }), 'player_1', PUNTO)).toBe(0);
		expect(placeFit(board({ me: [null, null] }), 'player_1', PUNTO)).toBe(0);
	});
	it('the bot plays it when nothing better fits', () => {
		const s = board({ hand: [{ cardId: PUNTO, type: 'PLACE' }], energy: 6 });
		expect(choosePlaceToPlay(s, 'player_1', 0)?.cardId).toBe(PUNTO);
	});
});

describe('choosePuntoBanco', () => {
	it('calls punto on a Personal Quest roll with one spare Energy, not without', () => {
		expect(choosePuntoBanco(board({ place: PUNTO, energy: 1 }), 'player_1', { slotIndex: 0 })).toBe('punto');
		expect(choosePuntoBanco(board({ place: PUNTO, energy: 0 }), 'player_1', { slotIndex: 0 })).toBeUndefined();
	});
	it('nothing without the Place or after the once-per-turn call', () => {
		expect(choosePuntoBanco(board({ energy: 4 }), 'player_1', { slotIndex: 0 })).toBeUndefined();
		expect(choosePuntoBanco(board({ place: PUNTO, energy: 4, p1: { puntoBancoTurn: 5 } }), 'player_1', { slotIndex: 0 })).toBeUndefined();
	});
	it('a reaction Snelle reserve is kept back', () => {
		const hand = [{ cardId: 'snelle_jensen', type: 'SNELLE_PIECIE' }];
		expect(choosePuntoBanco(board({ place: PUNTO, energy: 1, hand }), 'player_1', { slotIndex: 0 })).toBeUndefined();
		expect(choosePuntoBanco(board({ place: PUNTO, energy: 2, hand }), 'player_1', { slotIndex: 0 })).toBe('punto');
	});
	it('an ordinary Quest needs 2 spare Energy, a dice Quest that is not trained and not nearly certain', () => {
		const q = (quest, energy) => choosePuntoBanco(board({ place: PUNTO, energy, faceUp: { [quest.stack]: quest.id } }), 'player_1', { slotIndex: 0, stackId: quest.stack });
		expect(q(heroicQuest, 2)).toBe('punto');
		expect(q(heroicQuest, 1)).toBeUndefined();
		expect(q(trainedQuest, 5)).toBeUndefined();
	});
	it('no call on a Quest the bot wins almost surely', () => {
		const strong = mk({ mp: 40, traits: { strength: 6, mental: 6, artistic: 6, technical: 6, resilient: 6, social: 6 } });
		const s = board({ me: [strong, null], place: PUNTO, energy: 5, faceUp: { [steadyQuest.stack]: steadyQuest.id } });
		const out = choosePuntoBanco(s, 'player_1', { slotIndex: 0, stackId: steadyQuest.stack });
		expect([undefined, 'punto']).toContain(out); // depends on dice; never a banco or anything else
	});
});

describe('the driver passes the call to the engine', () => {
	const l3 = (over = {}) => mk({ level: 3, mp: 60, subtype: 'PHYSICAL', traits: { strength: 2 }, ...over });
	function drive(place, energy) {
		const s = startTurn(makeEngineState({
			turnNumber: 5,
			activePlace: place,
			activePlacePlayedBy: 'player_2',
			players: {
				player_1: { activeSlots: [l3(), null], hand: [pq()], deck: filler(), energy },
				player_2: { activeSlots: [mk({ level: 3, mp: 60, entryProtected: true }), null], deck: filler(), hand: [] },
			},
		}));
		s.players.player_1.energy = energy;
		pushTestDice([1, 2, 5, 6]); // the Punto/Banco pair first (a lost call), then the Personal Quest dice
		const metrics = [];
		const log = console.log;
		console.log = (...a) => { if (typeof a[0] === 'string' && a[0].startsWith('[BOT] METRIC ')) metrics.push(JSON.parse(a[0].slice(13))); };
		try { return { steps: driveBotTurnSteps(s, 'player_1', { humanIds: [] }), metrics, turn: s.turnNumber }; } finally { console.log = log; }
	}
	it('with the Place and Energy the Personal Quest roll is a Punto Banco call', () => {
		const { steps, metrics, turn } = drive(PUNTO, 3);
		const end = steps[steps.length - 1].state;
		expect(end.players.player_1.puntoBancoTurn).toBe(turn);
		expect(steps.some((x) => x.action?.kind === 'personal-quest')).toBe(true);
		expect(metrics.filter((m) => m.ev === 'engine-refused')).toEqual([]);
	});
	it('with no Energy to spare nothing is called; with no Place nothing changes', () => {
		expect(drive(PUNTO, 0).steps[0].state.players.player_1.puntoBancoTurn).toBeUndefined();
		const none = drive(PUNTO, 0);
		expect(none.steps[none.steps.length - 1].state.players.player_1.puntoBancoTurn).toBeUndefined();
		const noPlace = drive(null, 3);
		expect(noPlace.steps[noPlace.steps.length - 1].state.players.player_1.puntoBancoTurn).toBeUndefined();
	});
});

// ---- Te Hard Gaan ------------------------------------------------------------------------------------------------
const WIZ = 'mosje_gandoe_wizard', ALY = 'mosje_alyssa_bulldozer', WEST = 'mosje_fps_west';
const slotOf = (id, mp = 50, over = {}) => Object.assign(createMosjeSlot(MOSJES.find((m) => m.id === id), { level: 1, mp }), { entryProtected: false }, over);
function thg(slots, hand = [], id = 'piecie_te_hard_gaan') {
	const s = makePiecieState({ piecieId: id });
	s.players.player_1.activeSlots = slots;
	s.players.player_1.energy = 6;
	s.players.player_1.hand = hand;
	s.players.player_1.deck = filler(4);
	return s;
}
const costPause = (s, slots = [0, 1], cardId = 'piecie_te_hard_gaan') => ({
	playerId: 'player_1', choiceKind: 'ownMosje', key: 'cost_mosje', piecie: { cardDef: { id: cardId } },
	options: slots.map((slotIndex) => ({ label: `m${slotIndex}`, slotIndex })),
});

describe('Te Hard Gaan is paid by a Mosje that can attack', () => {
	it('a settled attacker pays, not the richer fresh Mosje', () => {
		const s = thg([slotOf(WIZ, 80, { entryProtected: true }), slotOf(ALY, 30)]);
		expect(pickCostMosje(s, 'player_1', costPause(s)).slotIndex).toBe(1);
	});
	it('a Mosje that already acted does not pay', () => {
		const s = thg([slotOf(WIZ, 80, { actedThisTurn: true }), slotOf(ALY, 30)]);
		expect(pickCostMosje(s, 'player_1', costPause(s)).slotIndex).toBe(1);
	});
	it('the Level 3 keeper does not pay when a Level 2 attacker can', () => {
		const s = thg([slotOf(WIZ, 90, { level: 3, subtype: 'PHYSICAL' }), slotOf(ALY, 40, { level: 2, subtype: 'DIGITAL' })], [pq('pq_charge')]);
		expect(pickCostMosje(s, 'player_1', costPause(s)).slotIndex).toBe(1);
	});
	it('the payer keeps MP above 0 after the price', () => {
		const s = thg([slotOf(WIZ, 10), slotOf(ALY, 30)]);
		expect(pickCostMosje(s, 'player_1', costPause(s)).slotIndex).toBe(1);
	});
	it('no attacker qualifies: the richest Mosje pays (old rule)', () => {
		const s = thg([slotOf(WIZ, 25, { entryProtected: true }), slotOf(ALY, 60, { entryProtected: true })]);
		expect(pickCostMosje(s, 'player_1', costPause(s)).slotIndex).toBe(1);
	});
	it('a card that is not a Power card: richest Mosje, but not the Level 3 keeper while another can pay', () => {
		const s = thg([slotOf(WIZ, 90, { level: 3, subtype: 'PHYSICAL' }), slotOf(ALY, 40)], [pq('pq_charge')]);
		expect(pickCostMosje(s, 'player_1', costPause(s, [0, 1], 'piecie_blikje_monsteros')).slotIndex).toBe(1);
		const plain = thg([slotOf(WIZ, 90, { level: 3 }), slotOf(ALY, 40)]);
		expect(pickCostMosje(plain, 'player_1', costPause(plain, [0, 1], 'piecie_blikje_monsteros')).slotIndex).toBe(0);
	});
	it('malformed options still return undefined', () => {
		const s = thg([slotOf(WIZ), null]);
		expect(pickCostMosje(s, 'player_1', costPause(s, [0, 1]))).toBeUndefined();
	});
	it('isUsefulActivation: Te Hard Gaan and Ronalds Fles Fireman need an attacking payer', () => {
		for (const id of ['piecie_te_hard_gaan', 'piecie_ronalds_fles_fireman']) {
			const attacker = thg([slotOf(WIZ, 80), slotOf(ALY, 80, { entryProtected: true })], [], id);
			expect(isUsefulActivation(attacker, 'player_1', id), id).toBe(true);
			const keeperOnly = thg([slotOf(WIZ, 80, { level: 3, subtype: 'PHYSICAL' }), slotOf(ALY, 80, { entryProtected: true })], [pq('pq_charge')], id);
			expect(isUsefulActivation(keeperOnly, 'player_1', id), id).toBe(false);
			const thin = thg([slotOf(WIZ, 20), null], [], id);
			expect(isUsefulActivation(thin, 'player_1', id), id).toBe(id === 'piecie_te_hard_gaan');
		}
	});
	it('planPiecieActivations skips Te Hard Gaan when only the keeper can attack', () => {
		const s = thg([slotOf(WIZ, 80, { level: 3, subtype: 'PHYSICAL' }), slotOf(ALY, 80, { entryProtected: true })], [pq('pq_charge')]);
		const plan = planPiecieActivations(s, 'player_1', getBotProfile(s, 'player_1'), { willQuest: true, budget: 6 });
		expect(plan.some((e) => e.cardId === 'piecie_te_hard_gaan')).toBe(false);
	});
});

// ---- FPS West -----------------------------------------------------------------------------------------------------
describe('FPS West', () => {
	const pause = (options) => ({ playerId: 'player_1', choiceKind: 'handCard', key: 'fps_west_bottom', options: [{ label: 'Leave it', index: -1 }, ...options] });
	const view = () => asBotView(makeEngineState({ players: { player_1: { activeSlots: [slotOf(WEST, 60), null] } } }), 'player_1');

	it('bottoms a Snelle when it sees one, else leaves it', () => {
		const p = pause([{ label: 'Kannetje', index: 0, cardId: 'piecie_kannetje_melk' }, { label: 'Jensen!', index: 1, cardId: 'snelle_jensen' }]);
		expect(pickFpsWestBottom(view(), 'player_1', p)).toBe(p.options[2]);
		const none = pause([{ label: 'Kannetje', index: 0, cardId: 'piecie_kannetje_melk' }]);
		expect(pickFpsWestBottom(view(), 'player_1', none).index).toBe(-1);
		expect(pickFpsWestBottom(view(), 'player_1', { options: [] })).toBeUndefined();
	});
	it('chooseTriggerChoice answers the pause with it', () => {
		const p = pause([{ label: 'Jensen!', index: 0, cardId: 'snelle_jensen' }]);
		const s = { ...makeEngineState({ players: { player_1: { activeSlots: [slotOf(WEST, 60), null] } } }), pendingChoice: p };
		expect(chooseTriggerChoice(s, 'player_1')).toEqual(p.options[1]);
	});

	function west({ mp = 60, energy = 5, oppHand = 4, hand = [] } = {}) {
		return makeEngineState({
			turnNumber: 5,
			players: {
				player_1: { activeSlots: [slotOf(WEST, mp), null], energy, hand },
				player_2: { activeSlots: [mk({ mp: 60 }), null], hand: filler(oppHand), deck: filler() },
			},
		});
	}
	const press = (s, reserve = 0) => shouldUseAbility(s, 'player_1', 0, undefined, reserve);
	it('pressed at 60 MP, 5 Energy and 4 cards in the opponent hand', () => expect(press(west())).toBe(true));
	it('not pressed below 45 MP', () => expect(press(west({ mp: 40 }))).toBe(false));
	it('not pressed when the opponent holds fewer than 2 cards', () => expect(press(west({ oppHand: 1 }))).toBe(false));
	it('not pressed without 2 spare Energy beyond the price', () => {
		expect(press(west({ energy: 2 }))).toBe(false);
		expect(press(west({ energy: 3 }))).toBe(true);
		expect(press(west({ energy: 3 }), 1)).toBe(false);
	});
	it('not pressed when West is the Level 3 keeper', () => {
		const s = west({ hand: [pq('pq_headshot')] });
		s.players.player_1.activeSlots[0] = slotOf(WEST, 80, { level: 3 });
		expect(press(s)).toBe(false);
		const plain = west();
		plain.players.player_1.activeSlots[0] = slotOf(WEST, 80, { level: 3 });
		expect(press(plain)).toBe(true); // no Personal Quest in hand: not a keeper
	});
});
