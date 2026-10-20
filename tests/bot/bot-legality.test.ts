// @ts-nocheck
// BOT-01..BOT-03 legality and coverage: the bot is treated as untrusted and checked with the engine's own rules.
// 15 seeded bot-vs-bot games on the 3 Example Decks (6 ordered pairings x 2 seeds, plus 3 Delluft games). Engine level on
// purpose: the old deck-matrix simulation still uses pre-2.0 deck ids (Phase 64), so it is not part of this proof.
// Per game: it finishes, the bot never makes an engine call that is refused, and every step obeys the rules below.
// A failure here is a bot defect - fix it in src/bot/, never loosen an assertion.
import { describe, it, expect } from 'vitest';
import { runSeededBotGame } from '../helpers/runSeededBotGame.js';
import { canMosjeTakeAction } from '../../src/engine/actions/canMosjeTakeAction.js';
import { isValidAttackTarget } from '../../src/engine/actions/isValidAttackTarget.js';
import { isFresh } from '../../src/engine/fresh/isFresh.js';
import { isCooldownBlocked } from '../../src/engine/turn/isCooldownBlocked.js';
import { PIECIE_SLOT_COUNT } from '../../src/engine/table/tableRules.js';
import { getCardEnergyCost } from '../../src/engine/energy/getCardEnergyCost.js';
import { REACTION_MOMENTS } from '../../src/engine/reactions/reactionMoments.js';
import { SNELLE_PIECIES } from '../../src/data/snellePiecies.js';

const DECKS = ['EXAMPLE_TAKSEN', 'EXAMPLE_REGELAARS', 'EXAMPLE_CREATIEVELINGEN'];
const ORDERED = DECKS.flatMap((a) => DECKS.filter((b) => b !== a).map((b) => [a, b])); // the 6 ordered pairings
const UNORDERED = [[DECKS[0], DECKS[1]], [DECKS[0], DECKS[2]], [DECKS[1], DECKS[2]]];
const DELLUFT = (state) => { state.activePlace = 'place_delluft'; state.activePlacePlayedBy = 'player_2'; };
const GAMES = [
	...[0xB07A, 0xB07B].flatMap((seed) => ORDERED.map(([a, b]) => ({ a, b, seed, delluft: false }))),
	...UNORDERED.map(([a, b]) => ({ a, b, seed: 0xDE1F, delluft: true })),
];

// A Snelle the bot would hold for the opponent's turn: it has a reaction moment that is not an own-turn one.
const OWN_TURN = [REACTION_MOMENTS.BEFORE_OWN_QUEST_ROLL, REACTION_MOMENTS.AFTER_OWN_QUEST_ROLL, REACTION_MOMENTS.AFTER_OWN_PIECIE_ACTIVATION];
const HELD_FOR_OPPONENT = new Set(SNELLE_PIECIES.filter((s) => (s.reactionMoments || []).some((m) => !OWN_TURN.includes(m))).map((s) => s.id));
const KINDS = ['summon', 'place-piecie', 'activate', 'place', 'snelle', 'attack', 'quest'];

const energyOk = (e) => Number.isInteger(e) && e >= 0 && e <= 6;
const targetOf = (state, a) => state.players[a.targetPlayerId]?.activeSlots?.[a.targetSlotIndex];

// Walks every step of one game; returns the rule violations and what the game covered.
function analyse(game) {
	const problems = [];
	const flag = (step, text) => { if (problems.length < 10) problems.push(`turn ${step.turnNumber} ${step.playerId} [${step.label}]: ${text}`); };
	const seen = Object.fromEntries(KINDS.map((k) => [k, 0]));
	const cooldownTurns = new Set(); // `${playerId}:${turnNumber}` of every turn that was a cooldown turn at some step
	const cover = { costlyActivate: 0, sidewaysOrLowerOrGone: 0, getemt: 0, feeChanged: 0 };

	for (const step of game.steps) {
		const { before, after, action, playerId } = step;
		const kind = action?.kind;
		if (kind in seen) seen[kind]++;

		// (3) Energy is an integer 0-6 for both players at every step.
		for (const pid of Object.keys(after.players)) {
			if (!energyOk(after.players[pid].energy)) flag(step, `${pid} energy=${after.players[pid].energy}`);
		}

		// (4) Every attack: the attacker may act and is not fresh, the target is neither fresh nor level-up protected.
		if (kind === 'attack') {
			const attacker = before.players[playerId].activeSlots[action.attackerSlotIndex];
			const can = canMosjeTakeAction(before, playerId, action.attackerSlotIndex);
			if (!can.ok) flag(step, `attacker slot ${action.attackerSlotIndex} cannot act: ${can.error}`);
			if (!attacker || isFresh(attacker)) flag(step, `attacker slot ${action.attackerSlotIndex} is fresh or missing`);
			if (!isValidAttackTarget(before, playerId, action.targetPlayerId, action.targetSlotIndex)) {
				const t = targetOf(before, action);
				flag(step, `invalid target ${action.targetPlayerId}#${action.targetSlotIndex} (${t?.cardId}, fresh=${t?.entryProtected}, levelUpProtected=${t?.levelUpProtected})`);
			}
			const b = targetOf(before, action);
			const a = targetOf(after, action);
			if (b && (!a || a.isDefeated || a.cardId !== b.cardId || (a.sideways === true && b.sideways !== true) || a.level < b.level)) cover.sidewaysOrLowerOrGone++;
			if (b && b.sideways !== true && (!a || a.isDefeated || a.cardId !== b.cardId || a.sideways === true)) cover.getemt++; // the attack finished the target (getemt)
		}

		// A cooldown turn is read from the flag before and after the step: the deck-out draw that sets it is not a step of its own.
		if (isCooldownBlocked(before, playerId) || isCooldownBlocked(after, playerId)) cooldownTurns.add(`${playerId}:${step.turnNumber}`);

		// (6) A face-down Piecie never takes the last free slot while a reaction Snelle for the opponent's turn is in hand.
		if (kind === 'place-piecie') {
			const holds = (before.players[playerId].hand || []).some((c) => HELD_FOR_OPPONENT.has(c.cardId));
			const filled = (before.players[playerId].piecieSlots || []).filter(Boolean).length;
			if (holds && filled > PIECIE_SLOT_COUNT - 2) flag(step, `placed ${action.cardId} with ${filled} of ${PIECIE_SLOT_COUNT} slots filled while holding a reaction Snelle`);
		}

		if (kind === 'activate' && getCardEnergyCost(action.cardId) >= 1) cover.costlyActivate++;
		for (const pid of Object.keys(after.players)) {
			if (before.players[pid]?.delluftFeeTurn !== after.players[pid]?.delluftFeeTurn) cover.feeChanged++;
		}
	}

	// (5) On a cooldown turn the bot only places face-down Piecies (or ends the turn).
	for (const step of game.steps) {
		const kind = step.action?.kind;
		if (cooldownTurns.has(`${step.playerId}:${step.turnNumber}`) && kind !== 'place-piecie' && kind !== 'end' && step.action) {
			flag(step, `${kind} on a cooldown turn`);
		}
	}
	return { problems, seen, cover };
}

const totals = []; // one summary per game; the aggregate test at the end reads them

describe('seeded bot-vs-bot legality (15 games: 3 Example Decks)', () => {
	for (const g of GAMES) {
		const name = `${g.a} vs ${g.b}, seed 0x${g.seed.toString(16).toUpperCase()}${g.delluft ? ', Delluft in play' : ''}`;
		it(name, () => {
			const game = runSeededBotGame({ p1DeckId: g.a, p2DeckId: g.b, seed: g.seed, preset: g.delluft ? DELLUFT : undefined });
			const found = analyse(game);
			const reactionsPlayed = game.metrics.filter((m) => m.ev === 'reaction-played').length;
			totals.push({ ...g, seen: found.seen, cover: found.cover, reactionsPlayed });
			console.info(`[LEGALITY] ${g.a} vs ${g.b} seed 0x${g.seed.toString(16).toUpperCase()}${g.delluft ? ' +Delluft' : ''}: winner=${game.state.winnerId} (${game.state.winReason}), ${game.turns} turns, ${game.steps.length} steps`);

			// (1) The game finishes within 200 turns without throwing (the runner would have thrown).
			expect(game.state.status).toBe('FINISHED');
			expect(game.turns).toBeLessThanOrEqual(200);
			// (2) No engine call of the bot is refused.
			const refused = game.metrics.filter((m) => m.ev === 'engine-refused');
			expect(refused.slice(0, 5).map((m) => `${m.call} | ${m.cardId} | ${m.error}`), `${refused.length} engine-refused`).toEqual([]);
			expect(refused).toHaveLength(0);
			// (2b) 61.1 D-03c: no single-target hostile effect aimed at a fresh Mosje (the engine fizzles it silently); only an all-targets card (Straffoe) explains a fizzle.
			console.info(`[LEGALITY] ${g.a} vs ${g.b} seed 0x${g.seed.toString(16).toUpperCase()}${g.delluft ? ' +Delluft' : ''}: ${game.fizzles.explained} fresh-Mosje fizzles explained by an all-targets card, ${game.fizzles.unexplained.length} unexplained`);
			expect(game.fizzles.unexplained, 'single-target hostile effect aimed at a fresh Mosje').toEqual([]);
			// (3)-(6) Energy range, attack targets, cooldown turns, the held reaction slot.
			expect(found.problems).toEqual([]);
		}, 60000);
	}

	it('the 15 games together cover the bot\'s whole 2.0 toolbox', () => {
		expect(totals).toHaveLength(GAMES.length);
		const sum = (pick) => totals.reduce((n, t) => n + pick(t), 0);
		for (const kind of KINDS) expect(sum((t) => t.seen[kind]), `no '${kind}' step in any game`).toBeGreaterThan(0);
		expect(sum((t) => t.cover.costlyActivate), 'no Piecie activation that costs Energy').toBeGreaterThan(0);
		expect(sum((t) => t.reactionsPlayed), 'no reaction Snelle played').toBeGreaterThan(0);
		expect(sum((t) => t.cover.sidewaysOrLowerOrGone), 'no attack that sent a target sideways, a level lower or away').toBeGreaterThan(0);
		expect(sum((t) => t.cover.getemt), 'no getemt finished by an attack').toBeGreaterThan(0);
		const delluft = totals.filter((t) => t.delluft);
		expect(delluft).toHaveLength(3);
		expect(delluft.reduce((n, t) => n + t.cover.feeChanged, 0), 'no Delluft parking fee paid').toBeGreaterThan(0);
		console.info('[LEGALITY] coverage', JSON.stringify(Object.fromEntries(KINDS.map((k) => [k, sum((t) => t.seen[k])]))), 'costly activations', sum((t) => t.cover.costlyActivate), 'reactions', sum((t) => t.reactionsPlayed), 'attack outcomes', sum((t) => t.cover.sidewaysOrLowerOrGone), 'getemt', sum((t) => t.cover.getemt), 'fee payments', delluft.reduce((n, t) => n + t.cover.feeChanged, 0));
	});
});
