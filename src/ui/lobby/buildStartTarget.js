// buildStartTarget.js — lobby choices -> the game url, the mosjes:offline payload and the replay record.
// Keeps today's contracts (D-04): Play vs Bot = ./game.html?offline=true&player=player_1 + mosjes:offline;
// Watch Bots = ./game.html?botvsbot=true&player=player_1&deck1&deck2(&fast=true). The url is always relative and
// built from normalized ids with URLSearchParams (T-64-02). player=player_1 keeps a stale V4 session off the player_2 path.
import { pickBotDeck } from '../../bot/pickBotDeck.js';
import { normalizeLobbyChoices } from './normalizeLobbyChoices.js';
import { resolveDeckChoice } from './resolveDeckChoice.js';

export function buildStartTarget(choices, decks, pick = pickBotDeck) {
	const replay = normalizeLobbyChoices(choices, decks);
	if (replay.mode === 'watchBots') {
		const params = new URLSearchParams();
		params.set('botvsbot', 'true');
		params.set('player', 'player_1');
		params.set('deck1', resolveDeckChoice(replay.bot1Choice, decks, pick));
		params.set('deck2', resolveDeckChoice(replay.bot2Choice, decks, pick));
		if (replay.fast) params.set('fast', 'true');
		return { url: `./game.html?${params.toString()}`, offlineSession: null, replay };
	}
	return {
		url: './game.html?offline=true&player=player_1',
		offlineSession: {
			name: replay.name,
			deckId: replay.deckChoice,
			botDeckId: resolveDeckChoice(replay.botChoice, decks, pick),
			playerId: 'player_1',
		},
		replay,
	};
}
