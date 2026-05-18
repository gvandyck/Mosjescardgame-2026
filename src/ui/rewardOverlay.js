// rewardOverlay.js — Post-match reward screen.
// Shows outcome, Munten earned, and a "Back to Lobby" button.
// For guests or LOCAL games, shows a minimal match-finished screen.

console.log('[UI] rewardOverlay.js loaded');

/**
 * @param {object} opts
 * @param {'win'|'loss'} opts.outcome
 * @param {string}  opts.winnerName
 * @param {string}  opts.winReason
 * @param {number}  opts.muntenAwarded   0 for guests / LOCAL games
 * @param {boolean} opts.isOnline
 */
export function showRewardOverlay({ outcome, winnerName, winReason, muntenAwarded, isOnline }) {
	// Remove any existing overlay
	document.getElementById('reward-overlay')?.remove();

	const isWin = outcome === 'win';

	const overlay = document.createElement('div');
	overlay.id = 'reward-overlay';
	overlay.className = `reward-overlay ${isWin ? 'reward-overlay--win' : 'reward-overlay--loss'}`;

	const muntenSection = (isOnline && muntenAwarded > 0)
		? `<p class="reward-munten">+${muntenAwarded} Munten</p>`
		: '';

	const subtitle = isOnline
		? (isWin ? 'You won the match!' : `${winnerName} won the match.`)
		: `${winnerName} wins — ${winReason}.`;

	overlay.innerHTML = `
		<div class="reward-card">
			<div class="reward-icon">${isWin ? '🏆' : '💀'}</div>
			<h2 class="reward-title">${isWin ? 'Victory!' : 'Defeat'}</h2>
			<p class="reward-subtitle">${subtitle}</p>
			${muntenSection}
			<button class="reward-btn" id="reward-back-btn">Back to Lobby</button>
		</div>
	`;

	document.body.appendChild(overlay);

	document.getElementById('reward-back-btn').addEventListener('click', () => {
		window.location.href = './index.html';
	});

	// Animate in
	requestAnimationFrame(() => overlay.classList.add('reward-overlay--visible'));
}
