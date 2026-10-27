// buildGameSummary.js — engine state -> the 2.0 game-over numbers (D-19): rounds played, and per player the Quests
// won / attempted and the Mosjes lost. Pure; every number comes from engine data, nothing is tracked in the UI.
import { STARTER_DECKS } from '../../data/starterDecks.js';

const SEATS = ['player_1', 'player_2'];

function toPlayerSummary(state, playerId) {
	const player = state.players?.[playerId] || {};
	const stats = player.questStats || {};
	const deck = STARTER_DECKS.find(entry => entry.id === player.deckId);
	return {
		playerId,
		name: player.name || playerId,
		deckName: deck ? deck.name : (player.deckId || ''),
		questsWon: stats.won || 0,
		questsAttempted: stats.attempted || 0,
		mosjesLost: (player.welloePile || []).filter(card => card?.type === 'MOSJE').length,
	};
}

export function buildGameSummary(state) {
	return {
		rounds: state.turnNumber,
		players: SEATS.map(playerId => toPlayerSummary(state, playerId)),
	};
}
