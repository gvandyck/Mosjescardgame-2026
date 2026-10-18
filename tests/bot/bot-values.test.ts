// @ts-nocheck
// BOT-01 groundwork: the bot's value model. slotWorth / valueOfGain / valueOfLoss price one Mosje under the 2.0
// level and getemt rules; opponentThreat is the Power the opponent can hit with next turn. Bot valuation, never a rule.
import { describe, it, expect } from 'vitest';
import { makeEngineState } from '../helpers/makeEngineState.js';
import { BOT_VALUES } from '../../src/bot/strategy/botValues.js';
import { slotWorth } from '../../src/bot/strategy/slotWorth.js';
import { valueOfGain } from '../../src/bot/strategy/valueOfGain.js';
import { valueOfLoss } from '../../src/bot/strategy/valueOfLoss.js';
import { opponentThreat } from '../../src/bot/strategy/opponentThreat.js';

const BOT = 'player_1';
const OPP = 'player_2';
const slot = (level, mp, extra = {}) => ({ cardId: 'mosje_gandoe_wizard', name: 'Gandoe Wizard', level, mp, ...extra });
const clone = (x) => JSON.parse(JSON.stringify(x));

describe('BOT_VALUES: data only', () => {
	it('holds the valuation constants', () => {
		expect(BOT_VALUES).toEqual({ LEVEL_BONUS: [0, 25, 200], SIDEWAYS_PENALTY: 25, WELLOE_WORTH: -145, L3_MP_CAP: 95 });
	});
});

describe('slotWorth: one Mosje by level, MP and status', () => {
	it.each([
		['Level 1, 40 MP', slot(1, 40), 40],
		['Level 2, 20 MP', slot(2, 20), 145],
		['Level 3, 30 MP', slot(3, 30), 430],
		['Level 1 sideways, 20 MP', slot(1, 20, { sideways: true }), -5],
		['an empty slot', null, -145],
		['a defeated Mosje', slot(2, 50, { isDefeated: true }), -145],
	])('%s -> %d', (_name, s, worth) => {
		expect(slotWorth(s)).toBe(worth);
	});

	it('a higher Level is always worth more than a lower one, whatever the MP', () => {
		expect(slotWorth(slot(2, 0))).toBeGreaterThan(slotWorth(slot(1, 95)));
		expect(slotWorth(slot(3, 0))).toBeGreaterThan(slotWorth(slot(2, 95)));
	});

	it('sideways is worth less than upright, the Welloe pile is worth the least', () => {
		expect(slotWorth(slot(1, 0, { sideways: true }))).toBeLessThan(slotWorth(slot(1, 0)));
		expect(slotWorth(null)).toBeLessThan(slotWorth(slot(1, 0, { sideways: true })));
	});
});

describe('valueOfGain: a hypothetical gain under the 2.0 level rule', () => {
	it.each([
		['plain gain on Level 1', slot(1, 40), 25, 25],
		['100 MP reached: next level at 0 MP', slot(1, 90), 25, 35],
		['Level 2 -> Level 3 at 0 MP', slot(2, 90), 25, 185],
		['Level 3 stops at 95', slot(3, 80), 25, 15],
		['Level 3 already at 95', slot(3, 95), 25, 0],
		['a zero gain', slot(1, 40), 0, 0],
		['a gain off the 5-grid rounds to 10', slot(1, 40), 12, 10],
		['a negative gain is nothing', slot(1, 40), -10, 0],
		['a sideways Mosje gains the same MP', slot(1, 20, { sideways: true }), 25, 25],
		['a sideways Mosje that levels up stays sideways', slot(1, 90, { sideways: true }), 25, 35],
	])('%s', (_name, s, amount, value) => {
		expect(valueOfGain(s, amount)).toBe(value);
	});

	it('an empty or defeated slot gains nothing', () => {
		expect(valueOfGain(null, 25)).toBe(0);
		expect(valueOfGain(slot(1, 40, { isDefeated: true }), 25)).toBe(0);
	});

	it('never touches the slot it was given', () => {
		const s = slot(1, 90);
		const before = clone(s);
		valueOfGain(s, 25);
		expect(s).toEqual(before);
	});
});

describe('valueOfLoss: a hypothetical loss under the getemt rule', () => {
	it.each([
		['loss that leaves MP above 0', slot(1, 50), 30, 30],
		['loss past 0 on Level 1: sideways at 0 MP', slot(1, 20), 30, 45],
		['loss to exactly 0 is getemt', slot(1, 15), 15, 40],
		['loss past 0 on a sideways Level 1: Welloe pile', slot(1, 20, { sideways: true }), 30, 140],
		['Level 2 drops one level at 50 MP', slot(2, 20), 30, 95],
		['Level 3 drops one level at 50 MP', slot(3, 30), 40, 255],
		['a zero loss', slot(1, 30), 0, 0],
		['a negative loss is nothing', slot(1, 30), -5, 0],
		['a loss off the 5-grid rounds to 30', slot(1, 50), 28, 30],
	])('%s', (_name, s, amount, value) => {
		expect(valueOfLoss(s, amount)).toBe(value);
	});

	it('an empty or defeated slot loses nothing', () => {
		expect(valueOfLoss(null, 30)).toBe(0);
		expect(valueOfLoss(slot(1, 40, { isDefeated: true }), 30)).toBe(0);
	});

	it('a Level 2 sideways Mosje keeps its sideways flag when it drops', () => {
		// Level 2 sideways 20 MP: worth 100 + 20 + 25 - 25 = 120; after getemt Level 1 sideways 50 MP: 50 - 25 = 25.
		expect(valueOfLoss(slot(2, 20, { sideways: true }), 30)).toBe(95);
	});

	it('never touches the slot it was given', () => {
		const s = slot(3, 30);
		const before = clone(s);
		valueOfLoss(s, 40);
		expect(s).toEqual(before);
	});
});

describe('opponentThreat: the Power the opponent can hit with on their next turn', () => {
	const wizard = (extra = {}) => slot(1, 40, { cardId: 'mosje_gandoe_wizard', ...extra }); // Power 10 at Level 1
	const bulldozer = (extra = {}) => slot(1, 40, { cardId: 'mosje_alyssa_bulldozer', name: 'Alyssa Bulldozer', ...extra }); // Power 20 at Level 1
	const table = (oppSlots) => makeEngineState({ players: { [OPP]: { activeSlots: oppSlots } } });

	it('adds up the Power of both upright opponent Mosjes', () => {
		expect(opponentThreat(table([wizard(), bulldozer()]), BOT)).toBe(30);
	});

	it('a sideways Mosje cannot hit: only the other counts', () => {
		expect(opponentThreat(table([wizard({ sideways: true }), bulldozer()]), BOT)).toBe(20);
		expect(opponentThreat(table([wizard(), bulldozer({ sideways: true })]), BOT)).toBe(10);
	});

	it('a fresh Mosje still counts: it can attack on its owner\'s next turn', () => {
		expect(opponentThreat(table([wizard({ entryProtected: true }), bulldozer()]), BOT)).toBe(30);
	});

	it('a defeated Mosje does not count', () => {
		expect(opponentThreat(table([wizard({ isDefeated: true }), bulldozer()]), BOT)).toBe(20);
	});

	it('no Mosjes on the opponent field is no threat', () => {
		expect(opponentThreat(table([null, null]), BOT)).toBe(0);
		expect(opponentThreat(table([null, bulldozer()]), BOT)).toBe(20);
	});

	it('uses the opponent of the seat it is asked for', () => {
		const st = makeEngineState({ players: { [BOT]: { activeSlots: [bulldozer(), null] }, [OPP]: { activeSlots: [wizard(), null] } } });
		expect(opponentThreat(st, BOT)).toBe(10);
		expect(opponentThreat(st, OPP)).toBe(20);
	});

	it('follows the level row: a Level 2 Mosje hits harder', () => {
		expect(opponentThreat(table([wizard({ level: 2, mp: 10 }), null]), BOT)).toBe(20);
	});

	it('follows the Power boosts the engine counts', () => {
		expect(opponentThreat(table([wizard({ powerBoost: 10 }), null]), BOT)).toBe(20);
	});

	it('follows the active Place the engine counts (The Gym: +10 for a Fighting Mosje that is not fresh)', () => {
		const st = { ...table([bulldozer({ subtype: 'FIGHTING' }), null]), activePlace: 'place_the_gym' };
		expect(opponentThreat(st, BOT)).toBe(30);
		const fresh = { ...table([bulldozer({ subtype: 'FIGHTING', entryProtected: true }), null]), activePlace: 'place_the_gym' };
		expect(opponentThreat(fresh, BOT)).toBe(20);
	});

	it('never touches the state it was given', () => {
		const st = table([wizard(), bulldozer()]);
		const before = clone(st);
		opponentThreat(st, BOT);
		expect(st).toEqual(before);
	});
});
