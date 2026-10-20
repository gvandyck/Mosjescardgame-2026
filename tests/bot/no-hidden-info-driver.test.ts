// @ts-nocheck
// BOT-04 guard, part 2: the bot DRIVER files (src/bot/*.js). Part 1 is no-hidden-info.test.ts and stops at src/bot/strategy;
// Phase 61 mutation D3 showed that a hidden read added to botDriver.js passed every bot test. Two layers, both inside `npm test`:
//  1. A source scan of src/bot/*.js: any read of a hidden zone that is not the bot's own seat (or an allowlisted own-write) fails.
//     The scan is a tripwire for OBVIOUS reads (a destructuring, a computed key or an alias dodges it); layer 2 is the semantic backstop.
//  2. Full-turn invariance: swap the opponent's hand with its deck top and the bot must do the same things in the same order.
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { driveBotTurnSteps } from '../../src/bot/botDriver.js';
import { mulberry32, runSeededBotGame } from '../helpers/runSeededBotGame.js';

const DRIVER_FILES = ['botDriver.js', 'settleReactions.js', 'settleMosjePauses.js', 'pickBotDeck.js'];

// Extending the allowlist: add the EXACT substring of a line that writes (not reads) the bot's own input, with a comment why.
// Only that substring is exempt; any other hidden read on the same line is still flagged.
const OWN_WRITES = [
	// botDriver.js useAbilitiesFor: merges the bot's own ability inputs (chosen from its own view) into the clone it hands to the engine.
	'stateForAbility._pendingTargets = { ...(stateForAbility._pendingTargets || {}), ...inputs }',
	// botDriver.js Phase C: hands the engine the bot's own Piecie target slot (pickBotOwnTarget) before activatePiecie.
	'_pendingTargets: { ...(state._pendingTargets || {}), own_slot_index: own }',
];

const HIDDEN = '(?:hand|deck|piecieSlots|revealed|_pendingTargets)';
// `.hand` / `?.hand` / `['hand']` - the word boundary keeps `.deckId` (a public id, not the deck zone) out.
const READ = new RegExp(`\\.(${HIDDEN})\\b|\\[\\s*['"\`]${HIDDEN}['"\`]\\s*\\]`, 'g');
const OWN_SEAT = /players\[botPlayerId\](?:\?\.|\?)?$/;

// -> [{ line, text }] for every hidden-zone read in the non-comment code of `source`.
function scanHiddenReads(source) {
	const code = source.replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/[^\n]/g, ' ')); // keep the line numbers
	const hits = [];
	code.split('\n').forEach((raw, n) => {
		let line = raw.replace(/\/\/.*$/, '');
		for (const own of OWN_WRITES) line = line.split(own).join('');
		for (const m of line.matchAll(READ)) {
			if (OWN_SEAT.test(line.slice(0, m.index))) continue;
			hits.push({ line: n + 1, text: raw.trim() });
		}
	});
	return hits;
}

describe('BOT-04 driver guard: source scan of src/bot/*.js', () => {
	const dir = fileURLToPath(new URL('../../src/bot/', import.meta.url));
	const files = readdirSync(dir).filter((f) => f.endsWith('.js'));

	it('finds the four driver files (a move or rename must fail loudly)', () => {
		expect(files).toEqual(expect.arrayContaining(DRIVER_FILES));
	});
	for (const file of files) {
		it(`${file} reads no hidden zone except the bot's own seat`, () => {
			const hits = scanHiddenReads(readFileSync(dir + file, 'utf8')).map((h) => `${file}:${h.line}: ${h.text}`);
			expect(hits, `${file}: hidden read (hand, deck, piecieSlots, revealed, _pendingTargets) of a seat that is not botPlayerId`).toEqual([]);
		});
	}

	it('self-test: a read of another seat is flagged', () => {
		expect(scanHiddenReads('const h = state.players[oppId].hand;\nconst d = state.players[oppId]?.deck;')).toEqual([
			{ line: 1, text: 'const h = state.players[oppId].hand;' },
			{ line: 2, text: 'const d = state.players[oppId]?.deck;' },
		]);
	});
	it('self-test: the bot\'s own seat and public ids are not flagged', () => {
		expect(scanHiddenReads('const h = state.players[botPlayerId]?.hand || [];\nconst s = state.players[botPlayerId].piecieSlots;\nemit({ deck: profile.deckId });')).toEqual([]);
	});
	it('self-test: the same text inside a line comment or a block comment is not flagged', () => {
		expect(scanHiddenReads('const x = 1; // state.players[oppId].hand\n/* state.players[oppId].deck\n   state.players[oppId].piecieSlots */\nconst y = 2;')).toEqual([]);
	});
	it('self-test: a bracket read is flagged, and a hidden read next to an allowlisted own-write is still flagged', () => {
		expect(scanHiddenReads("const h = state.players[oppId]['hand'];")).toHaveLength(1);
		expect(scanHiddenReads(`${OWN_WRITES[1]}; const h = state.players[oppId].hand;`)).toHaveLength(1);
		expect(scanHiddenReads(`state = { ...state, ${OWN_WRITES[1]} };`)).toEqual([]);
	});
});

const SAMPLE_GAMES = [
	['EXAMPLE_TAKSEN', 'EXAMPLE_REGELAARS', 0xB04A],
	['EXAMPLE_REGELAARS', 'EXAMPLE_CREATIEVELINGEN', 0xB04B],
	['EXAMPLE_CREATIEVELINGEN', 'EXAMPLE_TAKSEN', 0xB04C],
];
const clone = (x) => JSON.parse(JSON.stringify(x));
const idsOf = (cards) => cards.map((c) => c.cardId).sort().join('|');

// The turn-start state of every bot turn of a game: `before` of the first step of each (playerId, turnNumber).
function turnStarts(game) {
	const seen = new Set();
	const out = [];
	for (const step of game.steps) {
		const key = `${step.playerId}#${step.turnNumber}`;
		if (seen.has(key)) continue;
		seen.add(key);
		out.push(step.before);
	}
	return out;
}

// The opponent's first k hand cards and first k deck cards trade places (same counts, other cards in hand).
function swapOpponentHandWithDeckTop(state, oppId) {
	const out = clone(state);
	const opp = out.players[oppId];
	const k = Math.min(opp.hand.length, opp.deck.length);
	const fromHand = opp.hand.slice(0, k);
	const fromDeck = opp.deck.slice(0, k);
	opp.hand.splice(0, k, ...fromDeck);
	opp.deck.splice(0, k, ...fromHand);
	return { out, k };
}

// What the bot did, step by step, up to (not including) the first wait for a human: the opponent's own hand legitimately
// decides whether a reaction window exists, and a wait step is the point where the two runs may part.
function runTurn(state, botId, oppId, seed) {
	const realRandom = Math.random;
	const realLog = console.log;
	try {
		Math.random = mulberry32(seed);
		console.log = () => {};
		return driveBotTurnSteps(clone(state), botId, { humanIds: [oppId] });
	} finally {
		Math.random = realRandom;
		console.log = realLog;
	}
}
const beforeFirstWait = (steps) => {
	const i = steps.findIndex((s) => s.label.startsWith('waits for'));
	return i < 0 ? steps.length : i;
};

describe('BOT-04 driver guard: full-turn invariance', () => {
	it('the opponent hand swapped with its deck top changes no bot action (3 seeded games, every turn start)', () => {
		const diffs = [];
		let compared = 0;
		let handsDiffer = 0;
		let comparedSteps = 0;
		let sample = 0;
		for (const [p1DeckId, p2DeckId, seed] of SAMPLE_GAMES) {
			const game = runSeededBotGame({ p1DeckId, p2DeckId, seed });
			for (const start of turnStarts(game)) {
				const botId = start.activePlayerId;
				const oppId = botId === 'player_1' ? 'player_2' : 'player_1';
				const { out: swapped, k } = swapOpponentHandWithDeckTop(start, oppId);
				const index = sample++;
				if (k === 0 || JSON.stringify(swapped.players[oppId].hand) === JSON.stringify(start.players[oppId].hand)) continue;
				const a = runTurn(start, botId, oppId, 0x5EED + index);
				const b = runTurn(swapped, botId, oppId, 0x5EED + index);
				const cut = Math.min(beforeFirstWait(a), beforeFirstWait(b));
				const seqA = a.slice(0, cut).map((s) => JSON.stringify(s.action ?? null));
				const seqB = b.slice(0, cut).map((s) => JSON.stringify(s.action ?? null));
				compared++;
				comparedSteps += cut;
				if (idsOf(start.players[oppId].hand) !== idsOf(swapped.players[oppId].hand)) handsDiffer++;
				if (JSON.stringify(seqA) !== JSON.stringify(seqB)) diffs.push({ seed: seed.toString(16), turn: start.turnNumber, bot: botId, a: seqA, b: seqB });
			}
		}
		console.info(`BOT-04 driver invariance: ${compared} turn starts compared (${comparedSteps} bot steps), ${handsDiffer} with a different opponent hand content`);
		expect(diffs, 'swapping only the opponent hand with its deck top changed the bot actions - a hidden read in src/bot').toEqual([]);
		expect(compared).toBeGreaterThanOrEqual(30);
		expect(handsDiffer).toBeGreaterThanOrEqual(20);
	}, 240000);
});
