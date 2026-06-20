// rewardOverlay.js — Post-match reward screen.
// Shows outcome, Munten earned, and a "Back to Lobby" button.
// For guests or LOCAL games, shows a minimal match-finished screen.

console.log('[UI] rewardOverlay.js loaded');

/**
 * @param {object} opts
 * @param {'win'|'loss'} opts.outcome
 * @param {string}  opts.winnerName
 * @param {string}  opts.winReason       Raw win-condition enum (e.g. 'KNOCKOUT')
 * @param {string}  [opts.winDetail]     Plain-language explanation of how the game was won
 * @param {number}  opts.muntenAwarded   0 for guests / LOCAL games
 * @param {boolean} opts.isOnline
 * @param {object}  [opts.stats]         Optional gameStats from main.js accumulator
 * @param {Array<{type:string,text:string}>} [opts.logEntries]  Battle-log entries (newest-first)
 */
export function showRewardOverlay({ outcome, winnerName, winReason, winDetail, muntenAwarded, isOnline, stats, logEntries = [] }) {
	// Remove any existing overlay
	document.getElementById('reward-overlay')?.remove();

	const isWin = outcome === 'win';

	const overlay = document.createElement('div');
	overlay.id = 'reward-overlay';
	overlay.className = `reward-overlay ${isWin ? 'reward-overlay--win' : 'reward-overlay--loss'}`;
	// Machine-readable win reason — tools/sims read this instead of parsing prose.
	if (winReason) overlay.dataset.winReason = winReason;

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

	// HTML-escape every value that reaches innerHTML below. Player/Mosje names are
	// not pre-sanitised (the in-game log uses textContent), so an online opponent's
	// display name could otherwise inject markup into this overlay.
	const esc = (s) => String(s).replace(/[&<>"']/g, c => (
		{ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
	));

	const subtitle = isOnline
		? (isWin ? 'You won the match!' : `${esc(winnerName)} won the match.`)
		: `${esc(winnerName)} wins!`;

	// Plain-language explanation of how the game was won. Falls back to the raw
	// enum if main.js didn't supply a description. Escaped at render time below.
	const reasonText = winDetail || (winReason ? `Won by ${winReason}.` : '');

	// Battle log recap — the same colour-coded entries from the in-game log, so
	// the player can review exactly what happened before leaving for the lobby.
	const hasLog = Array.isArray(logEntries) && logEntries.length > 0;
	const logSection = hasLog ? `
		<div class="reward-log-section">
			<div class="reward-stats__divider"><span>Battle Log</span></div>
			<div class="reward-log" id="reward-log">
				${logEntries.map(e => `<div class="log-row ${esc(e.type)}">${esc(e.text)}</div>`).join('')}
			</div>
		</div>
	` : '';

	overlay.innerHTML = `
		<div class="reward-card">
			<div class="reward-icon">${isWin ? '🏆' : '💀'}</div>
			<h2 class="reward-title">${isWin ? 'Victory!' : 'Defeat'}</h2>
			<p class="reward-subtitle">${subtitle}</p>
			${reasonText ? `<p class="reward-reason">${esc(reasonText)}</p>` : ''}
			${muntenSection}
			${statsSection}
			${logSection}
			<div class="reward-actions">
				${hasLog ? '<button class="reward-btn reward-btn--ghost" id="reward-copy-btn" type="button">Copy Log</button>' : ''}
				<button class="reward-btn" id="reward-back-btn">Back to Lobby</button>
			</div>
		</div>
	`;

	document.body.appendChild(overlay);

	document.getElementById('reward-back-btn').addEventListener('click', () => {
		window.location.href = './index.html';
	});

	// Copy the recap in chronological order (oldest → newest) for easy sharing.
	const copyBtn = document.getElementById('reward-copy-btn');
	if (copyBtn && hasLog) {
		const chronological = [...logEntries].reverse().map(e => e.text).join('\n');
		copyBtn.addEventListener('click', async () => {
			try {
				await navigator.clipboard.writeText(chronological);
				copyBtn.textContent = 'Copied ✓';
				setTimeout(() => { copyBtn.textContent = 'Copy Log'; }, 1500);
			} catch {
				copyBtn.textContent = 'Copy failed';
				setTimeout(() => { copyBtn.textContent = 'Copy Log'; }, 1500);
			}
		});
	}

	// Animate in
	requestAnimationFrame(() => overlay.classList.add('reward-overlay--visible'));
}
