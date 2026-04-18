// modalManager.js — Shows and hides popup overlays:
// dice roll animations, card zoom view, yes/no confirmations.
// Filled in Phase 5.

console.log('[UI] modalManager.js loaded');

export function initModalManager(container) {
	if (!container) {
		return {
			showInfo: () => {},
			showDiceRoll: (_info, _threshold, onResolved) => onResolved(false),
			showConfirm: async () => false,
			close: () => {},
		};
	}

	container.innerHTML = '';

	function close() {
		container.innerHTML = '';
		container.classList.remove('modal-root--open');
	}

	function showInfo(title, message) {
		container.classList.add('modal-root--open');
		container.innerHTML = `
			<div class="modal-backdrop"></div>
			<section class="modal-card" role="dialog" aria-modal="true">
				<h3>${escapeHtml(title)}</h3>
				<p>${escapeHtml(message)}</p>
				<button class="modal-btn" id="modal-ok">OK</button>
			</section>
		`;

		container.querySelector('#modal-ok')?.addEventListener('click', close);
	}

	// Shows a quest dice-roll popup.
	// questInfo — { name, requirementDescription, description, successMP, failMP }
	// threshold — minimum die result to succeed (7 = impossible)
	// onResolved(didSucceed) — called after the player clicks Continue
	function showDiceRoll(questInfo, threshold, onResolved) {
		container.classList.add('modal-root--open');

		const thresholdLabel = threshold >= 7
			? '<span class="modal-threshold--fail">Can\'t attempt — missing required trait</span>'
			: `${threshold}+ to succeed`;

		container.innerHTML = `
			<div class="modal-backdrop"></div>
			<section class="modal-card" role="dialog" aria-modal="true">
				<h3>🎯 ${escapeHtml(questInfo.name)}</h3>
				<p class="modal-quest-req">${escapeHtml(questInfo.requirementDescription)}</p>
				<p>${escapeHtml(questInfo.description)}</p>
				<p class="modal-threshold">Roll needed: ${thresholdLabel}</p>
				<div class="dice-display" id="dice-display" aria-live="polite">?</div>
				<button class="modal-btn" id="modal-roll" type="button">Roll Dice 🎲</button>
			</section>
		`;

		container.querySelector('#modal-roll')?.addEventListener('click', () => {
			const rollBtn = container.querySelector('#modal-roll');
			rollBtn.disabled = true;
			rollBtn.textContent = 'Rolling...';
			const diceEl = container.querySelector('#dice-display');

			const result = Math.floor(Math.random() * 6) + 1;
			const didSucceed = result >= threshold;

			let ticks = 0;
			const interval = setInterval(() => {
				diceEl.textContent = Math.floor(Math.random() * 6) + 1;
				ticks++;
				if (ticks >= 10) {
					clearInterval(interval);
					diceEl.textContent = result;
					diceEl.className = `dice-display dice-display--${didSucceed ? 'success' : 'fail'}`;

					const mpDelta = didSucceed ? questInfo.successMP : questInfo.failMP;
					const sign = mpDelta >= 0 ? '+' : '';
					const resultLabel = didSucceed
						? `✅ Success! Rolled ${result} (needed ${threshold}+) → ${sign}${mpDelta} MP`
						: `❌ Failed! Rolled ${result} (needed ${threshold}+) → ${sign}${mpDelta} MP`;

					const section = container.querySelector('section');
					section.insertAdjacentHTML('beforeend', `
						<p class="modal-result modal-result--${didSucceed ? 'success' : 'fail'}">${escapeHtml(resultLabel)}</p>
						<button class="modal-btn" id="modal-done" type="button">Continue</button>
					`);

					container.querySelector('#modal-done')?.addEventListener('click', () => {
						close();
						onResolved(didSucceed);
					});
				}
			}, 80);
		});
	}

	async function showConfirm(title, message) {
		return new Promise(resolve => {
			container.classList.add('modal-root--open');
			container.innerHTML = `
				<div class="modal-backdrop"></div>
				<section class="modal-card" role="dialog" aria-modal="true">
					<h3>${escapeHtml(title)}</h3>
					<p>${escapeHtml(message)}</p>
					<div class="modal-actions">
						<button class="modal-btn" id="modal-yes">Yes</button>
						<button class="modal-btn modal-btn--ghost" id="modal-no">No</button>
					</div>
				</section>
			`;

			container.querySelector('#modal-yes')?.addEventListener('click', () => {
				close();
				resolve(true);
			});

			container.querySelector('#modal-no')?.addEventListener('click', () => {
				close();
				resolve(false);
			});
		});
	}

	return { showInfo, showDiceRoll, showConfirm, close };
}

function escapeHtml(text) {
	return String(text)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}
