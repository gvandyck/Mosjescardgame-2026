// @ts-nocheck
// Phase 64-05: the 2.0 game-over screen, pure parts (D-17, D-19, D-20, D-21, D-22) plus the engine Quest counter.
import { describe, it, expect } from 'vitest';
import { makeEngineState } from '../helpers/makeEngineState.js';
import { build, finish } from '../helpers/quest56.js';
import { countQuestAttempt } from '../../src/engine/quests/countQuestAttempt.js';
import { buildGameSummary } from '../../src/ui/gameOver/buildGameSummary.js';
import { getGameOverHeadline } from '../../src/ui/gameOver/getGameOverHeadline.js';
import { getReplayChoices } from '../../src/ui/gameOver/getReplayChoices.js';
import { buildRewardOverlayHtml } from '../../src/ui/gameOver/buildRewardOverlayHtml.js';
import { sanitizeGameParams } from '../../src/ui/game/sanitizeGameParams.js';
import { getPlayerFacingDecks } from '../../src/data/playerFacingDecks.js';
import { STARTER_DECKS } from '../../src/data/starterDecks.js';

const decks = getPlayerFacingDecks();
const knownIds = STARTER_DECKS.map(deck => deck.id);

// A finished engine state: 7 rounds, player_1 (Taksen) vs player_2 (Regelaars), one Mosje + one Piecie in player_2's Welloe pile.
function finishedState(over = {}) {
	return makeEngineState({
		status: 'FINISHED',
		turnNumber: 7,
		winnerId: 'player_2',
		winReason: 'LEVEL_3',
		players: {
			player_1: { name: 'Gandoe', deckId: 'EXAMPLE_TAKSEN', welloePile: [{ type: 'MOSJE', name: 'A' }, { type: 'MOSJE', name: 'B' }, { type: 'PIECIE', name: 'P' }], questStats: { attempted: 4, won: 3 } },
			player_2: { name: 'Bot', deckId: 'EXAMPLE_REGELAARS', welloePile: [{ type: 'MOSJE', name: 'C' }] },
		},
		...over,
	});
}

describe('engine Quest counter (display-only, T-64-25)', () => {
	it('countQuestAttempt counts attempted and won per player, starting from zero', () => {
		const state = makeEngineState();
		countQuestAttempt(state, 'player_1', true);
		countQuestAttempt(state, 'player_1', false);
		expect(state.players.player_1.questStats).toEqual({ attempted: 2, won: 1 });
		expect(state.players.player_2.questStats).toBeUndefined();
	});

	it('a real Quest win resolved through resolveQuestAttempt counts for the roller only', () => {
		const { s, q } = build('tough_it_out');
		const out = finish(s, q, true);
		expect(out.players.player_1.questStats).toEqual({ attempted: 1, won: 1 });
		expect(out.players.player_2.questStats).toBeUndefined();
	});

	it('a real Quest fail counts as attempted, not won', () => {
		const { s, q } = build('tough_it_out');
		const out = finish(s, q, false);
		expect(out.players.player_1.questStats).toEqual({ attempted: 1, won: 0 });
	});

	it('the counter changes no MP: a Steady win is still +25, a Steady fail still -15', () => {
		const { s, q } = build('tough_it_out');
		expect(finish(s, q, true).players.player_1.activeSlots[0].mp).toBe(55);
		expect(finish(s, q, false).players.player_1.activeSlots[0].mp).toBe(15);
	});
});

describe('buildGameSummary (D-19: 2.0 numbers from engine data)', () => {
	it('returns rounds and, per player, name, deck name, Quests won / attempted and Mosjes lost', () => {
		const summary = buildGameSummary(finishedState());
		expect(summary.rounds).toBe(7);
		expect(summary.players).toHaveLength(2);
		expect(summary.players[0]).toMatchObject({ playerId: 'player_1', name: 'Gandoe', deckName: 'Taksen', questsWon: 3, questsAttempted: 4, mosjesLost: 2 });
		expect(summary.players[1]).toMatchObject({ playerId: 'player_2', name: 'Bot', deckName: 'Regelaars', questsWon: 0, questsAttempted: 0, mosjesLost: 1 });
	});

	it('uses the deck id for an unknown deck and counts only MOSJE cards as lost', () => {
		const state = finishedState({ players: { player_1: { deckId: 'NOT_A_DECK', welloePile: [{ type: 'PIECIE' }, { type: 'PLACE' }] } } });
		const first = buildGameSummary(state).players[0];
		expect(first.deckName).toBe('NOT_A_DECK');
		expect(first.mosjesLost).toBe(0);
	});
});

describe('getGameOverHeadline (D-21)', () => {
	const summary = buildGameSummary(finishedState());

	it('Play vs Bot: Victory! from the human seat, Defeat otherwise', () => {
		const win = getGameOverHeadline({ mode: 'vsBot', winnerId: 'player_1', localPlayerId: 'player_1', summary });
		expect(win).toMatchObject({ title: 'Victory!', subtitle: 'Gandoe wins!', tone: 'win' });
		const loss = getGameOverHeadline({ mode: 'vsBot', winnerId: 'player_2', localPlayerId: 'player_1', summary });
		expect(loss).toMatchObject({ title: 'Defeat', subtitle: 'Bot wins!', tone: 'loss' });
	});

	it('Watch Bots: "<Deck> wins (Bot N)" with neither Victory nor Defeat', () => {
		const second = getGameOverHeadline({ mode: 'watchBots', winnerId: 'player_2', localPlayerId: 'player_1', summary });
		expect(second).toMatchObject({ title: 'Regelaars wins (Bot 2)', subtitle: 'Taksen (Bot 1) vs Regelaars (Bot 2)', tone: 'neutral' });
		const first = getGameOverHeadline({ mode: 'watchBots', winnerId: 'player_1', localPlayerId: 'player_1', summary });
		expect(first.title).toBe('Taksen wins (Bot 1)');
		expect(`${first.title} ${second.title}`).not.toMatch(/Victory|Defeat/);
	});

	it('online keeps the V4 wording', () => {
		const win = getGameOverHeadline({ mode: 'online', winnerId: 'player_1', localPlayerId: 'player_1', summary });
		expect(win).toMatchObject({ title: 'Victory!', subtitle: 'You won the match!', tone: 'win' });
		const loss = getGameOverHeadline({ mode: 'online', winnerId: 'player_2', localPlayerId: 'player_1', summary });
		expect(loss).toMatchObject({ title: 'Defeat', subtitle: 'Bot won the match.', tone: 'loss' });
	});
});

describe('getReplayChoices (D-20, T-64-23)', () => {
	const stored = { mode: 'vsBot', name: 'Gandoe', deckChoice: 'EXAMPLE_REGELAARS', botChoice: 'RANDOM', bot1Choice: 'RANDOM', bot2Choice: 'RANDOM', fast: false };

	it('returns the normalized stored choices for the same mode and keeps a Random bot deck Random', () => {
		const choices = getReplayChoices({ replayRaw: JSON.stringify(stored), offlineData: {}, urlParams: new URLSearchParams(''), mode: 'vsBot', decks });
		expect(choices).toEqual(stored);
		expect(choices.botChoice).toBe('RANDOM');
	});

	it('falls back to the offline data (vsBot) on broken JSON or another mode', () => {
		const offlineData = { name: 'Eva', deckId: 'EXAMPLE_CREATIEVELINGEN', botDeckId: 'EXAMPLE_TAKSEN' };
		for (const replayRaw of ['{broken', JSON.stringify({ ...stored, mode: 'watchBots' }), null]) {
			const choices = getReplayChoices({ replayRaw, offlineData, urlParams: new URLSearchParams(''), mode: 'vsBot', decks });
			expect(choices).toMatchObject({ mode: 'vsBot', name: 'Eva', deckChoice: 'EXAMPLE_CREATIEVELINGEN', botChoice: 'EXAMPLE_TAKSEN' });
		}
	});

	it('falls back to the deck1 / deck2 / fast URL params for Watch Bots', () => {
		const urlParams = new URLSearchParams('botvsbot=true&deck1=EXAMPLE_REGELAARS&deck2=EXAMPLE_TAKSEN&fast=true');
		const choices = getReplayChoices({ replayRaw: '{broken', offlineData: {}, urlParams, mode: 'watchBots', decks });
		expect(choices).toMatchObject({ mode: 'watchBots', bot1Choice: 'EXAMPLE_REGELAARS', bot2Choice: 'EXAMPLE_TAKSEN', fast: true });
	});

	it('sends an unknown stored deck through the whitelist, and online has no replay', () => {
		const evil = JSON.stringify({ ...stored, deckChoice: '<img src=x>', botChoice: 'NOPE' });
		const choices = getReplayChoices({ replayRaw: evil, offlineData: {}, urlParams: new URLSearchParams(''), mode: 'vsBot', decks });
		expect(choices.deckChoice).toBe('EXAMPLE_TAKSEN');
		expect(choices.botChoice).toBe('RANDOM');
		expect(getReplayChoices({ replayRaw: JSON.stringify(stored), offlineData: {}, urlParams: new URLSearchParams(''), mode: 'online', decks })).toBeNull();
	});
});

describe('sanitizeGameParams (D-17, T-64-21)', () => {
	it('accepts player_1 / player_2 and known deck ids, drops everything else', () => {
		const bad = sanitizeGameParams(new URLSearchParams('player=player_9&deck1=EXAMPLE_TAKSEN&deck2=<script>'), knownIds);
		expect(bad).toEqual({ player: null, deck1: 'EXAMPLE_TAKSEN', deck2: null });
		const ok = sanitizeGameParams(new URLSearchParams('player=player_2&deck1=EXAMPLE_REGELAARS&deck2=PHYSICAL_FORCE'), knownIds);
		expect(ok).toEqual({ player: 'player_2', deck1: 'EXAMPLE_REGELAARS', deck2: 'PHYSICAL_FORCE' });
		expect(sanitizeGameParams(new URLSearchParams(''), knownIds)).toEqual({ player: null, deck1: null, deck2: null });
	});
});

describe('buildRewardOverlayHtml (D-19, D-20, D-22, T-64-22)', () => {
	const summary = buildGameSummary(finishedState());
	const headline = getGameOverHeadline({ mode: 'vsBot', winnerId: 'player_1', localPlayerId: 'player_1', summary });
	const base = { headline, reasonText: 'A held Level 3 until their turn - victory!', summary, mode: 'vsBot', showMunten: false, muntenAwarded: 0, logEntries: [{ type: 'win', text: 'One' }, { type: 'info', text: 'Two' }], canPlayAgain: true };

	it('keeps the stable selectors and adds the 2.0 stats', () => {
		const html = buildRewardOverlayHtml(base);
		for (const needle of ['reward-title', 'reward-subtitle', 'reward-reason', 'reward-log-summary', 'log-row', 'id="reward-copy-btn"', 'id="reward-back-btn"', 'id="reward-again-btn"',
			'data-stat="rounds"', 'data-stat="quests"', 'data-stat="mosjes-lost"', 'data-player-id="player_1"', 'data-player-id="player_2"']) {
			expect(html, needle).toContain(needle);
		}
		expect(html).toContain('Victory!');
		expect(html).toContain('3/4');
	});

	it('has no V4 tiles, no Munten line while the flag is off, and no Play again when it cannot restart', () => {
		const html = buildRewardOverlayHtml({ ...base, canPlayAgain: false, muntenAwarded: 12 });
		expect(html).not.toMatch(/Peak momentum|Biggest gain|Success rate/);
		expect(html).not.toContain('reward-munten');
		expect(html).not.toContain('reward-again-btn');
		expect(buildRewardOverlayHtml({ ...base, showMunten: true, muntenAwarded: 12 })).toContain('reward-munten');
		expect(buildRewardOverlayHtml({ ...base, showMunten: true, muntenAwarded: 0 })).not.toContain('reward-munten');
	});

	it('escapes a player name with markup', () => {
		const hostile = buildGameSummary(finishedState({ players: { player_1: { name: '<b>x</b>' } } }));
		const html = buildRewardOverlayHtml({ ...base, summary: hostile, logEntries: [{ type: 'info', text: '<i>row</i>' }] });
		expect(html).toContain('&lt;b&gt;x&lt;/b&gt;');
		expect(html).not.toContain('<b>x</b>');
		expect(html).not.toContain('<i>row</i>');
	});
});
