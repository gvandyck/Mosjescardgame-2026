// @ts-nocheck
// Phase 70-09 (D-27): the bot's minimum - it attempts a Personal Quest whenever one is legal, never an illegal one, never
// discards one for a Quest cost, attaches to its first legal Mosje, and bot-vs-bot games run clean.
import { describe, it, expect, afterEach, vi } from 'vitest';
import { makeEngineState } from '../helpers/makeEngineState.js';
import { makePiecieState } from '../helpers/makePiecieState.js';
import { mkSlot } from '../helpers/quest56.js';
import { runSeededBotGame } from '../helpers/runSeededBotGame.js';
import { driveBotTurnSteps } from '../../src/bot/botDriver.js';
import { startTurn } from '../../src/engine/turnManager.js';
import { pushTestDice, clearTestDice } from '../../src/engine/dice/testDiceQueue.js';
import { chooseQuestCostChoice } from '../../src/bot/strategy/chooseQuestCostChoice.js';

afterEach(() => clearTestDice());

const pq = (id = 'pq_charge') => ({ cardId: id, type: 'PERSONAL_QUEST' });
const filler = (n = 8) => Array.from({ length: n }, (_, i) => ({ cardId: `filler_${i}`, type: 'PIECIE' }));
const l3 = (over = {}) => mkSlot({ level: 3, mp: 60, subtype: 'PHYSICAL', traits: { strength: 2 }, ...over });

function table({ slots = [l3(), null], hand = [pq()] } = {}) {
	const s = makeEngineState({
		turnNumber: 5,
		players: {
			player_1: { activeSlots: slots, hand, deck: filler(), energy: 2 },
			player_2: { activeSlots: [mkSlot({ level: 3, mp: 60, entryProtected: true }), null], deck: filler(), hand: [] },
		},
	});
	return startTurn(s);
}

function drive(state, dice = []) {
	pushTestDice(dice); // after the state is built: startTurn must not eat the scripted dice
	const metrics = [];
	const log = console.log;
	console.log = (...a) => { if (typeof a[0] === 'string' && a[0].startsWith('[BOT] METRIC ')) metrics.push(JSON.parse(a[0].slice(13))); };
	try { return { steps: driveBotTurnSteps(state, 'player_1', { humanIds: [] }), metrics }; } finally { console.log = log; }
}
const refusals = (metrics) => metrics.filter((m) => m.ev === 'engine-refused');
const last = (steps) => steps[steps.length - 1].state;

describe('the bot attempts a legal Personal Quest', () => {
	it('winning dice: the game ends in PERSONAL_QUEST and there is a step for the attempt', () => {
		const { steps, metrics } = drive(table(), [5, 6]);
		const s = last(steps);
		expect(s.status).toBe('FINISHED');
		expect(s.winnerId).toBe('player_1');
		expect(s.winReason).toBe('PERSONAL_QUEST');
		expect(steps.some((x) => x.action?.kind === 'personal-quest')).toBe(true);
		expect(refusals(metrics)).toEqual([]);
	});

	it('losing dice: the game goes on, the card is back in the deck, the turn ends', () => {
		const { steps, metrics } = drive(table(), [1, 2]);
		const s = last(steps);
		expect(s.status).toBe('PLAYING');
		expect(s.players.player_1.hand.some((c) => c.cardId === 'pq_charge')).toBe(false);
		expect(s.players.player_1.deck.some((c) => c.cardId === 'pq_charge')).toBe(true);
		expect(steps[steps.length - 1].action?.kind).toBe('end');
		expect(refusals(metrics)).toEqual([]);
	});

	it('legal for one Mosje only: the Level 3 Mosje attempts, the Level 2 one does not', () => {
		const l2 = mkSlot({ level: 2, mp: 60, subtype: 'PHYSICAL' });
		const { steps, metrics } = drive(table({ slots: [l2, l3()] }), [5, 6]);
		const attempt = steps.find((x) => x.action?.kind === 'personal-quest');
		expect(attempt.action.slotIndex).toBe(1);
		expect(last(steps).winReason).toBe('PERSONAL_QUEST');
		expect(refusals(metrics)).toEqual([]);
	});

	it('not legal (Needs false): no attempt call and no refusal', () => {
		const { steps, metrics } = drive(table({ slots: [l3({ mp: 30 }), null] }));
		expect(steps.some((x) => x.action?.kind === 'personal-quest')).toBe(false);
		expect(last(steps).players.player_1.hand.some((c) => c.cardId === 'pq_charge')).toBe(true);
		expect(refusals(metrics)).toEqual([]);
	});

	it('not legal (levelled up this turn): no attempt call and no refusal', () => {
		const s0 = table({ slots: [l3(), null] });
		s0.players.player_1.activeSlots[0].levelAtTurnStart = 2;
		const run = drive(s0);
		expect(run.steps.some((x) => x.action?.kind === 'personal-quest')).toBe(false);
		expect(refusals(run.metrics)).toEqual([]);
	});
});

describe('Quest cost discards', () => {
	it('the bot never offers a Personal Quest as the hand card it discards', () => {
		const s = table({ hand: [pq(), pq('pq_sterke_jongen')] });
		const quest = { costId: 'discard_card' };
		const out = chooseQuestCostChoice(s, 'player_1', 0, quest);
		if (out.choice?.zone === 'hand') expect(s.players.player_1.hand[out.choice.index].type).not.toBe('PERSONAL_QUEST');
		// a hand of only Personal Quests: nothing to discard
		const only = chooseQuestCostChoice(s, 'player_1', 0, quest);
		expect(only.choice?.zone === 'hand' ? s.players.player_1.hand[only.choice.index].type : null).not.toBe('PERSONAL_QUEST');
	});
});

describe('attaching (D-27, pins 70-04 in the bot path)', () => {
	it('with an Attach card ready and two Mosjes, the bot attaches to its first Mosje and the turn ends', () => {
		const s = makePiecieState({ piecieId: 'piecie_dumbbells' });
		s.players.player_1.energy = 6;
		s.players.player_1.activeSlots[1] = mkSlot({ level: 1, mp: 50 });
		s.players.player_1.deck = filler();
		s.players.player_2.deck = filler();
		const { steps, metrics } = drive(startTurn(s));
		const end = last(steps);
		expect(steps[steps.length - 1].action?.kind).toBe('end');
		expect(end.pendingChoice).toBeFalsy();
		expect(end.players.player_1.activeSlots[0].attachments.map((a) => a.cardId)).toContain('piecie_dumbbells');
		expect(refusals(metrics)).toEqual([]);
	});
});

describe('bot-vs-bot from each starter deck', () => {
	const DECKS = ['EXAMPLE_TAKSEN', 'EXAMPLE_REGELAARS', 'EXAMPLE_CREATIEVELINGEN'];
	for (let i = 0; i < DECKS.length; i++) {
		const a = DECKS[i], b = DECKS[(i + 1) % 3];
		it(`${a} vs ${b}: no throw, no refused call`, () => {
			const game = runSeededBotGame({ p1DeckId: a, p2DeckId: b, seed: 0x70A0 + i, maxTurns: 200 });
			const bad = game.metrics.filter((m) => m.ev === 'engine-refused');
			expect(bad).toEqual([]);
			console.info(`[70-09] ${a} vs ${b}: ${game.state.status} after ${game.turns} turns, ${game.state.winReason ?? 'no win'}`);
		}, 60000);
	}
});
