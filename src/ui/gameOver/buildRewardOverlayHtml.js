// buildRewardOverlayHtml.js — the markup of the 2.0 game-over card (D-19, D-20, D-22). Pure: data in, an HTML string out.
// Every interpolated value goes through escapeHtml (T-64-22): names come from the lobby, and online names arrive in Phase 67.
// Stable hooks other specs and the sim rely on: .reward-title / -subtitle / -reason / -log-summary / .log-row,
// #reward-copy-btn, #reward-back-btn; the new ones: [data-stat], #reward-again-btn.
import { escapeHtml as esc } from '../cardV1/escapeHtml.js';

function statsHtml(summary) {
	const rows = summary.players.map(player => `
		<div class="go-player" data-player-id="${esc(player.playerId)}">
			<div class="go-player__who">
				<span class="go-player__name">${esc(player.name)}</span>
				<span class="go-player__deck">${esc(player.deckName)}</span>
			</div>
			<div class="go-stat">
				<span class="go-stat__value" data-stat="quests" data-player-id="${esc(player.playerId)}">${esc(player.questsWon)}/${esc(player.questsAttempted)}</span>
				<span class="go-stat__label">Quests won</span>
			</div>
			<div class="go-stat">
				<span class="go-stat__value" data-stat="mosjes-lost" data-player-id="${esc(player.playerId)}">${esc(player.mosjesLost)}</span>
				<span class="go-stat__label">Mosjes lost</span>
			</div>
		</div>`).join('');
	return `
		<div class="reward-stats">
			<div class="reward-stats__divider"><span>Game Summary</span></div>
			<div class="go-stat go-stat--rounds">
				<span class="go-stat__value" data-stat="rounds">${esc(summary.rounds)}</span>
				<span class="go-stat__label">Rounds</span>
			</div>
			<div class="go-players">${rows}</div>
		</div>`;
}

function logHtml(logEntries) {
	if (!logEntries.length) return '';
	return `
		<details class="reward-log-details">
			<summary class="reward-log-summary">Battle Log <span class="reward-log-count">${logEntries.length}</span></summary>
			<div class="reward-log" id="reward-log">
				${logEntries.map(entry => `<div class="log-row ${esc(entry.type)}">${esc(entry.text)}</div>`).join('')}
			</div>
		</details>`;
}

export function buildRewardOverlayHtml({ headline, reasonText, summary, showMunten, muntenAwarded, logEntries = [], canPlayAgain }) {
	const munten = showMunten && muntenAwarded > 0 ? `<p class="reward-munten">+${esc(muntenAwarded)} Munten</p>` : '';
	const reason = reasonText ? `<p class="reward-reason">${esc(reasonText)}</p>` : '';
	return `
		<div class="reward-card">
			<div class="reward-icon">${esc(headline.icon)}</div>
			<h2 class="reward-title">${esc(headline.title)}</h2>
			<p class="reward-subtitle">${esc(headline.subtitle)}</p>
			${reason}
			${munten}
			${statsHtml(summary)}
			${logHtml(logEntries)}
			<div class="reward-actions">
				${logEntries.length ? '<button class="reward-btn reward-btn--ghost" id="reward-copy-btn" type="button">Copy Log</button>' : ''}
				${canPlayAgain ? '<button class="reward-btn" id="reward-again-btn" type="button">Play again</button>' : ''}
				<button class="reward-btn${canPlayAgain ? ' reward-btn--ghost' : ''}" id="reward-back-btn" type="button">Back to Lobby</button>
			</div>
		</div>`;
}
