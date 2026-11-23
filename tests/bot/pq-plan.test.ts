// @ts-nocheck
// Phase 73-01 (CC-1, CC-4, CC-10): the bot's Personal Quest plan (keeper, phase, holds) and the best-chance attempt.
import { describe, it, expect, afterEach } from 'vitest';
import { makeEngineState } from '../helpers/makeEngineState.js';
import { mkSlot as baseSlot } from '../helpers/quest56.js';
import { MOSJES } from '../../src/data/mosjes.js';
import { startTurn } from '../../src/engine/turnManager.js';
import { clearTestDice } from '../../src/engine/dice/testDiceQueue.js';
import { getPersonalQuestPlan } from '../../src/bot/strategy/getPersonalQuestPlan.js';
import { personalQuestWinChance } from '../../src/bot/strategy/personalQuestWinChance.js';
import { choosePersonalQuest } from '../../src/bot/strategy/choosePersonalQuest.js';
import { PQ_VALUES } from '../../src/bot/strategy/pqValues.js';

afterEach(() => clearTestDice());

const JEFFREY = MOSJES.find((m) => m.id === 'mosje_jeffrey');
const mkSlot = (over = {}) => baseSlot(over, JEFFREY);
const pq = (id) => ({ cardId: id, type: 'PERSONAL_QUEST' });
const filler = (n = 8) => Array.from({ length: n }, (_, i) => ({ cardId: `filler_${i}`, type: 'PIECIE' }));

function table({ slots, hand, energy = 2 }) {
	return makeEngineState({
		turnNumber: 5,
		players: {
			player_1: { activeSlots: slots, hand, deck: filler(), energy },
			player_2: { activeSlots: [mkSlot({ level: 3, mp: 60, entryProtected: true }), null], deck: filler(), hand: [] },
		},
	});
}
const phys = (over = {}) => mkSlot({ subtype: 'PHYSICAL', ...over });
const digi = (over = {}) => mkSlot({ subtype: 'DIGITAL', ...over });

describe('pqValues', () => {
	it('holds the tuning numbers', () => {
		expect(PQ_VALUES.NEAR_L3_MP).toBe(60);
		expect(PQ_VALUES.GROW_WEIGHT).toBe(1.5);
	});
});

describe('getPersonalQuestPlan', () => {
	it('no Personal Quest in hand: null', () => {
		expect(getPersonalQuestPlan(table({ slots: [phys(), null], hand: [] }), 'player_1')).toBeNull();
	});
	it('no Mosje of the matching type: null', () => {
		expect(getPersonalQuestPlan(table({ slots: [digi(), null], hand: [pq('pq_charge')] }), 'player_1')).toBeNull();
	});
	it('a defeated matching Mosje is ignored', () => {
		expect(getPersonalQuestPlan(table({ slots: [phys({ isDefeated: true }), null], hand: [pq('pq_charge')] }), 'player_1')).toBeNull();
	});
	it('keeper: highest level, then MP, then lower slot', () => {
		const a = getPersonalQuestPlan(table({ slots: [phys({ level: 1, mp: 90 }), phys({ level: 2, mp: 30 })], hand: [pq('pq_charge')] }), 'player_1');
		expect(a.keeperIndex).toBe(1);
		const b = getPersonalQuestPlan(table({ slots: [phys({ level: 2, mp: 30 }), phys({ level: 2, mp: 50 })], hand: [pq('pq_charge')] }), 'player_1');
		expect(b.keeperIndex).toBe(1);
		const c = getPersonalQuestPlan(table({ slots: [phys({ level: 2, mp: 50 }), phys({ level: 2, mp: 50 })], hand: [pq('pq_charge')] }), 'player_1');
		expect(c.keeperIndex).toBe(0);
	});
	it('a sideways Mosje is still a candidate', () => {
		expect(getPersonalQuestPlan(table({ slots: [phys({ sideways: true }), null], hand: [pq('pq_charge')] }), 'player_1').keeperIndex).toBe(0);
	});
	it('phase grow below Level 3, ready at Level 3', () => {
		expect(getPersonalQuestPlan(table({ slots: [phys({ level: 2 }), null], hand: [pq('pq_charge')] }), 'player_1').phase).toBe('grow');
		expect(getPersonalQuestPlan(table({ slots: [phys({ level: 3 }), null], hand: [pq('pq_charge')] }), 'player_1').phase).toBe('ready');
	});
	it('cardIds lists only the matching Personal Quests', () => {
		const p = getPersonalQuestPlan(table({ slots: [phys(), null], hand: [pq('pq_charge'), pq('pq_vibe_coded'), pq('pq_sterke_jongen')] }), 'player_1');
		expect(p.cardIds.sort()).toEqual(['pq_charge', 'pq_sterke_jongen']);
	});
	it('holdActive: Level 3, or Level 2 with 60+ MP', () => {
		const h = (over) => getPersonalQuestPlan(table({ slots: [phys(over), null], hand: [pq('pq_charge')] }), 'player_1').holdActive;
		expect(h({ level: 3, mp: 30 })).toBe(true);
		expect(h({ level: 2, mp: 60 })).toBe(true);
		expect(h({ level: 2, mp: 55 })).toBe(false);
		expect(h({ level: 1, mp: 95 })).toBe(false);
	});
	it('keepPiecies: food Piecie by tag and Ronald Kip by name; gear and pets are not held', () => {
		const food = getPersonalQuestPlan(table({ slots: [phys(), null], hand: [pq('pq_knocked_down_not_out')] }), 'player_1');
		expect(food.keepPiecies).toEqual([{ tag: 'food', count: 1 }]);
		const ron = getPersonalQuestPlan(table({ slots: [phys(), null], hand: [pq('pq_michelinster')] }), 'player_1');
		expect(ron.keepPiecies).toEqual([{ name: 'piecie_ronald_kip', count: 1 }]);
		const gear = getPersonalQuestPlan(table({ slots: [phys(), null], hand: [pq('pq_sterke_jongen')] }), 'player_1');
		expect(gear.keepPiecies).toEqual([]);
	});
	it('keepPiecies is the union over all matching Personal Quests', () => {
		const p = getPersonalQuestPlan(table({ slots: [phys(), null], hand: [pq('pq_knocked_down_not_out'), pq('pq_michelinster'), pq('pq_sterke_jongen')] }), 'player_1');
		expect(p.keepPiecies).toHaveLength(2);
	});
	it('keepHand, handFloor, needPlaceIds, energyReserve, minMp', () => {
		const m = getPersonalQuestPlan(table({ slots: [phys(), null], hand: [pq('pq_michelinster'), pq('pq_sterke_jongen'), pq('pq_charge')] }), 'player_1');
		expect(m.keepHand).toEqual([{ tag: 'food', count: 1 }]);
		expect(m.needPlaceIds).toEqual(['place_the_gym']);
		expect(m.handFloor).toBe(0);
		expect(m.energyReserve).toBe(0);
		expect(m.minMp).toBe(35); // Charge!: needs 31, pays 30 + 5
		const d = getPersonalQuestPlan(table({ slots: [digi(), null], hand: [pq('pq_aloha_tech_support')] }), 'player_1');
		expect(d.handFloor).toBe(5);
		expect(d.energyReserve).toBe(2);
		const e = getPersonalQuestPlan(table({ slots: [digi(), null], hand: [pq('pq_world_record_run')] }), 'player_1');
		expect(e.keepHand).toEqual([{ tag: 'gear', count: 2 }]);
		const none = getPersonalQuestPlan(table({ slots: [digi(), null], hand: [pq('pq_headshot')] }), 'player_1');
		expect(none.minMp).toBe(0);
		expect(none.keepPiecies).toEqual([]);
	});
	it('does not mutate the state', () => {
		const s = table({ slots: [phys(), null], hand: [pq('pq_charge')] });
		const before = JSON.stringify(s);
		getPersonalQuestPlan(s, 'player_1');
		expect(JSON.stringify(s)).toBe(before);
	});
});

describe('personalQuestWinChance', () => {
	it('1x6 with 3 dice', () => {
		expect(personalQuestWinChance({ count: 1, face: 6, orHigher: false }, 3)).toBeCloseTo(1 - (5 / 6) ** 3, 6);
	});
	it('2x4+ with 2 dice is 0.25', () => {
		expect(personalQuestWinChance({ count: 2, face: 4, orHigher: true }, 2)).toBeCloseTo(0.25, 6);
	});
	it('any 2 the same with 2 dice is 1/6', () => {
		expect(personalQuestWinChance({ count: 2, face: null, orHigher: false, anySame: true }, 2)).toBeCloseTo(1 / 6, 6);
	});
	it('any 2 the same with 7+ dice is capped at 6 dice: 1 - 6!/6^6', () => {
		expect(personalQuestWinChance({ count: 2, face: null, orHigher: false, anySame: true }, 9)).toBeCloseTo(1 - 720 / 46656, 6);
	});
	it('fewer dice than count is 0', () => {
		expect(personalQuestWinChance({ count: 2, face: 4, orHigher: true }, 1)).toBe(0);
	});
});

describe('choosePersonalQuest picks the best legal attempt', () => {
	const withGear = (over) => digi({ level: 3, mp: 60, traits: { technical: 2 }, attachments: [{ cardId: 'piecie_dumbbells', type: 'PIECIE' }], ...over });

	it('2 dice: 1x6 (31%) beats any 2 the same (17%), though it comes second in the hand', () => {
		const s = startTurn(table({ slots: [withGear(), null], hand: [pq('pq_vibe_coded'), pq('pq_headshot')], energy: 4 }));
		expect(choosePersonalQuest(s, 'player_1').cardId).toBe('pq_headshot');
	});
	it('3 dice: any 2 the same (44%) beats 1x6 (42%), though it comes second in the hand', () => {
		const s = startTurn(table({ slots: [withGear({ traits: { technical: 3 } }), null], hand: [pq('pq_headshot'), pq('pq_vibe_coded')], energy: 4 }));
		expect(choosePersonalQuest(s, 'player_1').cardId).toBe('pq_vibe_coded');
	});
	it('the second slot holds the better Mosje (more dice): that slot is picked', () => {
		const weak = digi({ level: 3, mp: 60, traits: { technical: 1 }, attachments: [{ cardId: 'piecie_dumbbells', type: 'PIECIE' }] });
		const strong = digi({ level: 3, mp: 60, traits: { technical: 3 } });
		const s = startTurn(table({ slots: [weak, strong], hand: [pq('pq_world_record_run')], energy: 4 }));
		s.players.player_1.hand = [pq('pq_headshot')];
		s.players.player_1.activeSlots[1].attachments = [{ cardId: 'piecie_dumbbells', type: 'PIECIE' }];
		const pick = choosePersonalQuest(s, 'player_1');
		expect(pick.slotIndex).toBe(1);
		expect(pick.cardId).toBe('pq_headshot');
	});
	it('slotIndex given: only that slot is looked at', () => {
		const a = digi({ level: 3, mp: 60, traits: { technical: 1 }, attachments: [{ cardId: 'piecie_dumbbells', type: 'PIECIE' }] });
		const b = digi({ level: 3, mp: 60, traits: { technical: 3 }, attachments: [{ cardId: 'piecie_dumbbells', type: 'PIECIE' }] });
		const s = startTurn(table({ slots: [a, b], hand: [pq('pq_headshot')], energy: 4 }));
		expect(choosePersonalQuest(s, 'player_1', 0).slotIndex).toBe(0);
	});
	it('nothing legal: null', () => {
		const s = startTurn(table({ slots: [digi({ level: 1 }), null], hand: [pq('pq_headshot')] }));
		expect(choosePersonalQuest(s, 'player_1')).toBeNull();
	});
});
