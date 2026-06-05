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
 * @param {object}  [opts.stats]         Optional gameStats from main.js accumulator
 */
export function showRewardOverlay({ outcome, winnerName, winReason, muntenAwarded, isOnline, stats }) {
	// Remove any existing overlay
	document.getElementById('reward-overlay')?.remove();

	const isWin = outcome === 'win';

	const overlay = document.createElement('div');
	overlay.id = 'reward-overlay';
	overlay.className = `reward-overlay ${isWin ? 'reward-overlay--win' : 'reward-overlay--loss'}`;

	const muntenSection = (isOnline && muntenAwarded > 0)
		? `<p class="reward-munten">+${muntenAwarded} Munten</p>`
		: '';

	const successRate = stats
		? (stats.questsAttempted > 0 ? Math.round((stats.questsSucceeded / stats.questsAttempted) * 100) : 0)
		: 0;

	const statsSection = stats ? `
		<div class="reward-stats">
			<div class="reward-stats__divider"><span>Game Summary</span></div>
			<div class="reward-stats__grid">
				<div class="stat-tile stat-tile--quest">
					<span class="stat-tile__icon">⚔️</span>
					<span class="stat-tile__value">${stats.questsSucceeded}<span class="stat-tile__denom">/${stats.questsAttempted}</span></span>
					<span class="stat-tile__label">Quests won</span>
				</div>
				<div class="stat-tile stat-tile--rate">
					<span class="stat-tile__icon">🎯</span>
					<span class="stat-tile__value">${successRate}<span class="stat-tile__denom">%</span></span>
					<span class="stat-tile__label">Success rate</span>
				</div>
				<div class="stat-tile stat-tile--peak">
					<span class="stat-tile__icon">⚡</span>
					<span class="stat-tile__value">${stats.peakMP}<span class="stat-tile__denom"> MP</span></span>
					<span class="stat-tile__label">Peak momentum</span>
				</div>
				<div class="stat-tile stat-tile--gain">
					<span class="stat-tile__icon">📈</span>
					<span class="stat-tile__value">+${stats.biggestSingleGain}<span class="stat-tile__denom"> MP</span></span>
					<span class="stat-tile__label">Biggest gain</span>
				</div>
				${stats.mosjesLost > 0 ? `
				<div class="stat-tile stat-tile--loss stat-tile--full">
					<span class="stat-tile__icon">💀</span>
					<span class="stat-tile__value">${stats.mosjesLost}</span>
					<span class="stat-tile__label">Mosje${stats.mosjesLost !== 1 ? 's' : ''} lost</span>
				</div>` : ''}
			</div>
		</div>
	` : '';

	const subtitle = isOnline
		? (isWin ? 'You won the match!' : `${winnerName} won the match.`)
		: `${winnerName} wins — ${winReason}.`;

	overlay.innerHTML = `
		<div class="reward-card">
			<div class="reward-icon">${isWin ? '🏆' : '💀'}</div>
			<h2 class="reward-title">${isWin ? 'Victory!' : 'Defeat'}</h2>
			<p class="reward-subtitle">${subtitle}</p>
			${muntenSection}
			${statsSection}
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
