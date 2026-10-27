// rewardOverlay.js — the 2.0 game-over screen (64-05: D-19 to D-22).
// Thin DOM shell: the markup comes from buildRewardOverlayHtml, the headline / numbers from main.js (pure builders).
// Hooks the sim and the specs read: #reward-overlay with data-win-reason / data-winner-id / data-mode.

console.log('[UI] rewardOverlay.js loaded');

import { buildRewardOverlayHtml } from './gameOver/buildRewardOverlayHtml.js';

/**
 * @param {object} opts
 * @param {{icon:string,title:string,subtitle:string,tone:'win'|'loss'|'neutral'}} opts.headline  from getGameOverHeadline
 * @param {string}  opts.winReason       Raw win-condition enum ('LEVEL_3' | 'KNOCKOUT'), machine-readable
 * @param {string}  opts.winnerId        'player_1' | 'player_2'
 * @param {'vsBot'|'watchBots'|'online'} opts.mode
 * @param {string}  opts.reasonText      Plain-language win line (describeWin)
 * @param {{rounds:number,players:object[]}} opts.summary   from buildGameSummary
 * @param {boolean} opts.showMunten      FEATURES.muntenRewards
 * @param {number}  opts.muntenAwarded
 * @param {Array<{type:string,text:string}>} [opts.logEntries]  Battle-log entries (newest-first)
 * @param {(() => void)|null} [opts.onPlayAgain]  Play again handler; no button when null
 */
export function showRewardOverlay({ headline, winReason, winnerId, mode, reasonText, summary, showMunten, muntenAwarded, logEntries = [], onPlayAgain = null }) {
	document.getElementById('reward-overlay')?.remove();

	const overlay = document.createElement('div');
	overlay.id = 'reward-overlay';
	overlay.className = `reward-overlay ${headline.tone === 'loss' ? 'reward-overlay--loss' : 'reward-overlay--win'}`;
	// Machine-readable values — tools / sims read these instead of parsing prose.
	if (winReason) overlay.dataset.winReason = winReason;
	if (winnerId) overlay.dataset.winnerId = winnerId;
	if (mode) overlay.dataset.mode = mode;

	const canPlayAgain = typeof onPlayAgain === 'function';
	overlay.innerHTML = buildRewardOverlayHtml({ headline, reasonText, summary, showMunten, muntenAwarded, logEntries, canPlayAgain });
	document.body.appendChild(overlay);

	document.getElementById('reward-back-btn').addEventListener('click', () => {
		window.location.href = './index.html';
	});

	const againBtn = document.getElementById('reward-again-btn');
	if (againBtn && canPlayAgain) {
		againBtn.addEventListener('click', () => {
			againBtn.disabled = true; // one restart per game over, a second click must not launch twice
			onPlayAgain();
		});
	}

	// Copy the recap in chronological order (oldest -> newest) for easy sharing.
	const copyBtn = document.getElementById('reward-copy-btn');
	if (copyBtn && logEntries.length) {
		const chronological = [...logEntries].reverse().map(entry => entry.text).join('\n');
		copyBtn.addEventListener('click', async () => {
			try {
				await navigator.clipboard.writeText(chronological);
				copyBtn.textContent = 'Copied ✓';
			} catch {
				copyBtn.textContent = 'Copy failed';
			}
			setTimeout(() => { copyBtn.textContent = 'Copy Log'; }, 1500);
		});
	}

	requestAnimationFrame(() => overlay.classList.add('reward-overlay--visible'));
}
