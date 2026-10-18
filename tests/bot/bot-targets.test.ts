// @ts-nocheck
// BOT-01 / BOT-02 (61-05): which Mosje the bot aims a Piecie at. pickBotOwnTarget picks among its own Mosjes by what the
// card does (MP gain, Power boost, self-loss, pet); pickMosjeOption answers a 'mosje' pause (opponent: the hit that hurts
// most; own: the self-loss or the gain rule); chooseTriggerChoice hands 'mosje' pauses to it.
import { describe, it, expect } from 'vitest';
import { makeEngineState } from '../helpers/makeEngineState.js';
import { opponentThreat } from '../../src/bot/strategy/opponentThreat.js';
import { pickBotOwnTarget } from '../../src/bot/strategy/pickBotOwnTarget.js';
import { pickMosjeOption } from '../../src/bot/strategy/pickMosjeOption.js';
import { chooseTriggerChoice } from '../../src/bot/strategy/chooseTriggerChoice.js';

const BOT = 'player_1';
const OPP = 'player_2';
// Gandoe, The Unpredictable Wizard: Power 10 / 20 / 30 at Level 1 / 2 / 3.
const mosje = (level, mp, extra = {}) => ({ cardId: 'mosje_gandoe_wizard', name: 'Gandoe Wizard', level, mp, isDefeated: false, ...extra });
const board = (mine, theirs = [mosje(1, 50)], extra = {}) =>
	makeEngineState({ ...extra, players: { [BOT]: { activeSlots: mine }, [OPP]: { activeSlots: theirs } } });
const pick = (effectId, mine, theirs, extra) => pickBotOwnTarget(board(mine, theirs, extra), BOT, effectId);

describe('pickBotOwnTarget: MP gains (Kannetje Melk)', () => {
	it('protects a Level 3 whose MP is at or below the opponent threat', () => {
		const s = board([mosje(3, 30), mosje(1, 60)], [mosje(3, 50)]);
		expect(opponentThreat(s, BOT)).toBe(30);
		expect(pickBotOwnTarget(s, BOT, 'effect_kannetje_melk')).toBe(0);
	});
	it('a Level 3 above the threat is not special: the gain goes where it is worth the most, ties to the higher MP', () => {
		expect(pick('effect_kannetje_melk', [mosje(3, 35), mosje(1, 60)], [mosje(3, 50)])).toBe(1);
	});
	it('a Level 3 at 95 cannot gain: the Level 1', () => {
		expect(pick('effect_kannetje_melk', [mosje(3, 95), mosje(1, 60)], [mosje(3, 50)])).toBe(1);
	});
	it('of two threatened Level 3 the one with the lowest MP comes first', () => {
		expect(pick('effect_kannetje_melk', [mosje(3, 30), mosje(3, 20)], [mosje(3, 50), mosje(3, 50)])).toBe(1);
	});
	it('two Level 1 at 90 and 40: the 90 one (the gain levels it up)', () => {
		expect(pick('effect_kannetje_melk', [mosje(1, 40), mosje(1, 90)])).toBe(1);
		expect(pick('effect_kannetje_melk', [mosje(1, 90), mosje(1, 40)])).toBe(0);
	});
	it('ties go to the higher MP, then the lower slot', () => {
		expect(pick('effect_kannetje_melk', [mosje(1, 20), mosje(1, 60)])).toBe(1);
		expect(pick('effect_kannetje_melk', [mosje(1, 40), mosje(1, 40)])).toBe(0);
	});
	it('a sideways Mosje comes last, a defeated one never', () => {
		expect(pick('effect_kannetje_melk', [mosje(1, 90, { sideways: true }), mosje(1, 20)])).toBe(1);
		expect(pick('effect_kannetje_melk', [mosje(1, 99, { isDefeated: true }), mosje(1, 5)])).toBe(1);
		expect(pick('effect_kannetje_melk', [null, null])).toBe(-1);
	});
	it('under The Void a gain only works on a fresh Mosje: the fresh one is picked', () => {
		const fresh = mosje(1, 40, { entryProtected: true });
		expect(pick('effect_kannetje_melk', [fresh, mosje(1, 90)], undefined, { activePlace: 'place_the_void' })).toBe(0);
		expect(pick('effect_kannetje_melk', [fresh, mosje(1, 90)])).toBe(1);
	});
});

describe('pickBotOwnTarget: Power boosts (Te Hard Gaan)', () => {
	it('a fresh Mosje (Power 20) loses to a non-fresh unacted one (Power 10): only that one can attack', () => {
		expect(pick('effect_te_hard_gaan', [mosje(2, 50, { entryProtected: true }), mosje(1, 50)])).toBe(1);
	});
	it('a Mosje that already acted is not the attacker either', () => {
		expect(pick('effect_te_hard_gaan', [mosje(3, 50, { actedThisTurn: true }), mosje(1, 50)])).toBe(1);
	});
	it('among attackers the highest Power wins, ties to the lower slot', () => {
		expect(pick('effect_te_hard_gaan', [mosje(1, 50), mosje(2, 50)])).toBe(1);
		expect(pick('effect_te_hard_gaan', [mosje(2, 50), mosje(2, 80)])).toBe(0);
	});
	it('reads the real Power (boosts count), not the printed level row', () => {
		expect(pick('effect_te_hard_gaan', [mosje(1, 50, { powerBoostThisTurn: 30 }), mosje(2, 50)])).toBe(0);
	});
	it('with nobody able to attack it falls back to the highest Power overall', () => {
		expect(pick('effect_te_hard_gaan', [mosje(1, 50, { entryProtected: true }), mosje(2, 50, { entryProtected: true })])).toBe(1);
	});
});

describe('pickBotOwnTarget: self-loss (Warm Kannetje Melk, Stripje Bennies, Straffoe)', () => {
	it('Warm Kannetje Melk (10): Level 1 at 10 would be getemt, the one at 60 absorbs it', () => {
		expect(pick('effect_warm_kannetje_melk', [mosje(1, 10), mosje(1, 60)])).toBe(1);
	});
	it('Stripje Bennies (20): never the Level 3 at 10 that would drop a level', () => {
		expect(pick('effect_stripje_bennies', [mosje(1, 90), mosje(3, 10)])).toBe(0);
	});
	it('Straffoe own 5 MP: the Mosje at 5 would be getemt, the one at 40 is not', () => {
		expect(pick('effect_straffoe', [mosje(1, 5), mosje(1, 40)])).toBe(1);
	});
});

describe('pickBotOwnTarget: pets (Bowie & Stormey)', () => {
	it('an own Level 3 first', () => {
		expect(pick('effect_bowie_stormey', [mosje(1, 90), mosje(3, 40)])).toBe(1);
	});
	it('else the Mosje worth the most', () => {
		expect(pick('effect_bowie_stormey', [mosje(1, 80), mosje(2, 10)])).toBe(1);
		expect(pick('effect_bowie_stormey', [mosje(2, 10), mosje(1, 80)])).toBe(0);
	});
});

describe('pickMosjeOption', () => {
	const opt = (playerId, slotIndex) => ({ playerId, slotIndex, label: `${playerId}:${slotIndex}` });
	const choice = (options, extra = {}) => ({ hook: 'piecie', playerId: BOT, choiceKind: 'mosje', options, ...extra });
	const run = (mine, theirs, options, extra) => pickMosjeOption(board(mine, theirs), BOT, choice(options, extra));

	it('opponent Mosjes: the one the hit hurts most (Level 1 at 10 goes sideways, at 50 it just loses 10)', () => {
		const options = [opt(OPP, 0), opt(OPP, 1)];
		expect(run([mosje(1, 50)], [mosje(1, 50), mosje(1, 10)], options)).toBe(options[1]);
		expect(run([mosje(1, 50)], [mosje(1, 10), mosje(1, 50)], options)).toBe(options[0]);
	});
	it('opponent Level 3 at 60 and Level 1 at 60: equal hurt, so the higher slot worth (the Level 3)', () => {
		const options = [opt(OPP, 0), opt(OPP, 1)];
		expect(run([mosje(1, 50)], [mosje(1, 60), mosje(3, 60)], options)).toBe(options[1]);
	});
	it('opponent getemt beats everything: a Level 2 at 10 drops a level', () => {
		const options = [opt(OPP, 0), opt(OPP, 1)];
		expect(run([mosje(1, 50)], [mosje(1, 60), mosje(2, 10)], options)).toBe(options[1]);
	});
	it('own Mosjes of a self-loss Piecie: the one that absorbs the loss', () => {
		const options = [opt(BOT, 0), opt(BOT, 1)];
		const piecie = { cardDef: { id: 'piecie_warm_kannetje_melk' } };
		expect(run([mosje(1, 10), mosje(1, 60)], undefined, options, { piecie })).toBe(options[1]);
	});
	it('own Mosjes otherwise: the gain rule (a Level 3 at the threat first)', () => {
		const options = [opt(BOT, 0), opt(BOT, 1)];
		expect(run([mosje(1, 60), mosje(3, 30)], [mosje(3, 50)], options)).toBe(options[1]);
		expect(run([mosje(1, 90), mosje(1, 40)], undefined, options, { piecie: { cardDef: { id: 'piecie_kannetje_melk' } } })).toBe(options[0]);
	});
	it('mixed own and opponent options, no options or malformed options: no answer', () => {
		expect(run([mosje(1, 50)], [mosje(1, 50)], [opt(BOT, 0), opt(OPP, 0)])).toBeUndefined();
		expect(run([mosje(1, 50)], [mosje(1, 50)], [])).toBeUndefined();
		expect(run([mosje(1, 50)], [mosje(1, 50)], [{ label: 'x' }, { label: 'y' }])).toBeUndefined();
		expect(run([mosje(1, 50)], [mosje(1, 50)], [opt(OPP, 7)])).toBeUndefined();
		expect(pickMosjeOption(board([mosje(1, 50)]), BOT, undefined)).toBeUndefined();
	});
});

describe('chooseTriggerChoice: Mosje pauses', () => {
	it("a 'mosje' pause is answered by pickMosjeOption", () => {
		const options = [{ playerId: OPP, slotIndex: 0, label: 'a' }, { playerId: OPP, slotIndex: 1, label: 'b' }];
		const s = { ...board([mosje(1, 50)], [mosje(1, 50), mosje(1, 10)]), pendingChoice: { hook: 'piecie', playerId: BOT, choiceKind: 'mosje', options } };
		expect(chooseTriggerChoice(s, BOT)).toEqual(options[1]);
	});
	it("a 'mosje' pause pickMosjeOption has no answer for still takes the first option", () => {
		const options = [{ playerId: BOT, slotIndex: 0, label: 'a' }, { playerId: OPP, slotIndex: 0, label: 'b' }];
		const s = { ...board([mosje(1, 50)], [mosje(1, 50)]), pendingChoice: { hook: 'piecie', playerId: BOT, choiceKind: 'mosje', options } };
		expect(chooseTriggerChoice(s, BOT)).toEqual(options[0]);
	});
	it('another pause kind still answers the first option; a pause that is not the bot is undefined', () => {
		const options = [{ a: 1 }, { a: 2 }];
		const s = { ...board([mosje(1, 50)]), pendingChoice: { hook: 'trigger', playerId: BOT, options } };
		expect(chooseTriggerChoice(s, BOT)).toEqual({ a: 1 });
		expect(chooseTriggerChoice({ ...s, pendingChoice: { ...s.pendingChoice, playerId: OPP, choiceKind: 'mosje' } }, BOT)).toBeUndefined();
	});
});
