// getGameOverHeadline.js — the mode-aware headline of the game-over screen (D-21).
// Play vs Bot: Victory! / Defeat from the human's seat. Watch Bots: "<Deck> wins (Bot 1|2)", no Victory / Defeat.
// Online keeps the V4 wording (Phase 67 adds the two-human wording). Pure: strings in, strings out.
const WIN_ICON = '🏆';
const LOSS_ICON = '💀';

function playerOf(summary, playerId) {
	return summary.players.find(entry => entry.playerId === playerId);
}

function watchBotsHeadline(winnerId, summary) {
	const seat = winnerId === 'player_1' ? 1 : 2;
	const [first, second] = summary.players;
	return {
		icon: WIN_ICON,
		tone: 'neutral',
		title: `${playerOf(summary, winnerId)?.deckName || `Bot ${seat}`} wins (Bot ${seat})`,
		subtitle: `${first.deckName} (Bot 1) vs ${second.deckName} (Bot 2)`,
	};
}

export function getGameOverHeadline({ mode, winnerId, localPlayerId, summary }) {
	if (mode === 'watchBots') return watchBotsHeadline(winnerId, summary);
	const won = winnerId === localPlayerId;
	const winnerName = playerOf(summary, winnerId)?.name || 'Unknown';
	return {
		icon: won ? WIN_ICON : LOSS_ICON,
		tone: won ? 'win' : 'loss',
		title: won ? 'Victory!' : 'Defeat',
		subtitle: mode === 'online'
			? (won ? 'You won the match!' : `${winnerName} won the match.`)
			: `${winnerName} wins!`,
	};
}
