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
	// questInfo — { name, description, requirementDescription, successMP, failMP }
	// threshold — minimum dice roll to succeed
	// onResolved(didSucceed) — callback
	// options.diceBonus — added to rolled value (Sleutelpuntje +1)
	// options.forceReroll — if true, shows "Reroll!" button after first roll (Je Weet Niet)
	function showDiceRoll(questInfo, threshold, onResolved, { diceBonus = 0, forceReroll = false } = {}) {
		container.classList.add('modal-root--open');

		const thresholdLabel = threshold >= 7
			? '<span class="modal-threshold--fail">Can\'t attempt — missing required trait</span>'
			: `${threshold}+ to succeed`;

		const bonusLabel = diceBonus > 0 ? ` (+${diceBonus} bonus)` : '';

		container.innerHTML = `
			<div class="modal-backdrop"></div>
			<section class="modal-card" role="dialog" aria-modal="true">
				<h3>🎯 ${escapeHtml(questInfo.name)}</h3>
				<p class="modal-quest-req">${escapeHtml(questInfo.requirementDescription)}</p>
				<p>${escapeHtml(questInfo.description)}</p>
				<p class="modal-threshold">Roll needed: ${thresholdLabel}${escapeHtml(bonusLabel)}</p>
				<div class="dice-display" id="dice-display" aria-live="polite">?</div>
				<button class="modal-btn" id="modal-roll" type="button">Roll Dice 🎲</button>
			</section>
		`;

		function doRoll(allowReroll) {
			const rollBtn = container.querySelector('#modal-roll');
			if (rollBtn) { rollBtn.disabled = true; rollBtn.textContent = 'Rolling...'; }
			const diceEl = container.querySelector('#dice-display');

			const rawRoll = Math.floor(Math.random() * 6) + 1;
			const result = rawRoll + diceBonus;
			const didSucceed = result >= threshold;

			let ticks = 0;
			const interval = setInterval(() => {
				if (diceEl) diceEl.textContent = Math.floor(Math.random() * 6) + 1;
				ticks++;
				if (ticks >= 10) {
					clearInterval(interval);
					if (diceEl) {
						diceEl.textContent = result;
						diceEl.className = `dice-display dice-display--${didSucceed ? 'success' : 'fail'}`;
					}

					const mpDelta = didSucceed ? questInfo.successMP : questInfo.failMP;
					const sign = mpDelta >= 0 ? '+' : '';
					const bonusTxt = diceBonus > 0 ? ` (rolled ${rawRoll}+${diceBonus})` : '';
					const resultLabel = didSucceed
						? `✅ Success! Rolled ${result}${bonusTxt} (needed ${threshold}+) → ${sign}${mpDelta} MP`
						: `❌ Failed! Rolled ${result}${bonusTxt} (needed ${threshold}+) → ${sign}${mpDelta} MP`;

					const section = container.querySelector('section');
					// Remove any previous result
					section.querySelectorAll('.modal-result, #modal-done, #modal-reroll').forEach(e => e.remove());
					section.insertAdjacentHTML('beforeend', `
						<p class="modal-result modal-result--${didSucceed ? 'success' : 'fail'}">${escapeHtml(resultLabel)}</p>
						${allowReroll ? '<button class="modal-btn modal-btn--ghost" id="modal-reroll" type="button">🎲 Je Weet Niet — Reroll!</button>' : ''}
						<button class="modal-btn" id="modal-done" type="button">Continue</button>
					`);

					container.querySelector('#modal-done')?.addEventListener('click', () => {
						close();
						onResolved(didSucceed);
					});

					// forceReroll: opponent's Je Weet Niet forces one reroll
					container.querySelector('#modal-reroll')?.addEventListener('click', () => {
						section.querySelectorAll('.modal-result, #modal-done, #modal-reroll').forEach(e => e.remove());
						if (rollBtn) { rollBtn.disabled = false; rollBtn.textContent = 'Roll Dice 🎲'; }
						doRoll(false); // only one reroll allowed
					});
				}
			}, 80);
		}

		container.querySelector('#modal-roll')?.addEventListener('click', () => doRoll(forceReroll));
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

	// Shows a free-text input prompt and resolves with the trimmed string.
	// Returns an empty string if the user cancels.
	async function showTextInput(title, placeholder = '') {
		return new Promise(resolve => {
			container.classList.add('modal-root--open');
			container.innerHTML = `
				<div class="modal-backdrop"></div>
				<section class="modal-card" role="dialog" aria-modal="true">
					<h3>${escapeHtml(title)}</h3>
					<input class="modal-input" id="modal-text-input" type="text"
						placeholder="${escapeHtml(placeholder)}" autocomplete="off" />
					<div class="modal-actions">
						<button class="modal-btn" id="modal-confirm">Confirm</button>
						<button class="modal-btn modal-btn--ghost" id="modal-cancel">Cancel</button>
					</div>
				</section>
			`;

			const input = container.querySelector('#modal-text-input');
			input?.focus();

			container.querySelector('#modal-confirm')?.addEventListener('click', () => {
				const value = input?.value?.trim() || '';
				close();
				resolve(value);
			});

			container.querySelector('#modal-cancel')?.addEventListener('click', () => {
				close();
				resolve('');
			});

			// Allow Enter to confirm
			input?.addEventListener('keydown', (e) => {
				if (e.key === 'Enter') {
					const value = input.value.trim() || '';
					close();
					resolve(value);
				}
			});
		});
	}

	// Shows a list of cards to pick from. Resolves with the chosen card object, or null if cancelled.
	// cards — array of { cardId, name, description, type? }
	async function showCardChoice(title, cards) {
		return new Promise(resolve => {
			container.classList.add('modal-root--open');

			const optionItems = cards.map((card, i) =>
				`<li>
					<button class="modal-card-option" data-index="${i}" type="button">
						<strong>${escapeHtml(card.name)}</strong>
						${card.description ? `<span class="modal-card-option__desc">${escapeHtml(card.description)}</span>` : ''}
					</button>
				</li>`
			).join('');

			container.innerHTML = `
				<div class="modal-backdrop"></div>
				<section class="modal-card" role="dialog" aria-modal="true">
					<h3>${escapeHtml(title)}</h3>
					<ul class="modal-card-list">${optionItems}</ul>
					<button class="modal-btn modal-btn--ghost" id="modal-cancel">Cancel</button>
				</section>
			`;

			container.querySelectorAll('.modal-card-option').forEach(btn => {
				btn.addEventListener('click', () => {
					const index = parseInt(btn.dataset.index, 10);
					close();
					resolve(cards[index] ?? null);
				});
			});

			container.querySelector('#modal-cancel')?.addEventListener('click', () => {
				close();
				resolve(null);
			});
		});
	}

	// Shows a target selection modal for card effects that require choosing a Mosje.
	// options — array of { id, label, mpValue, level, owner }
	// prompt — instruction shown to the player
	// Returns a Promise that resolves with the chosen option's id.
	// Note: always shows even with 1 option — no auto-targeting ever.
	async function showTargetSelector(options, prompt) {
		return new Promise(resolve => {
			container.classList.add('modal-root--open');

			const optionItems = options.map(opt =>
				`<button class="target-option" data-id="${escapeHtml(opt.id)}" type="button">
					<span class="target-name">${escapeHtml(opt.label)}</span>
					<span class="target-mp">${opt.mpValue} MP</span>
					<span class="target-level">LV.${opt.level}</span>
				</button>`
			).join('');

			container.innerHTML = `
				<div class="modal-backdrop"></div>
				<section class="modal-card" role="dialog" aria-modal="true">
					<h3>🎯 Select Target</h3>
					<p class="modal-quest-req">${escapeHtml(prompt)}</p>
					<div class="target-grid">${optionItems}</div>
				</section>
			`;

			container.querySelectorAll('.target-option').forEach(btn => {
				btn.addEventListener('click', () => {
					const id = btn.dataset.id;
					close();
					resolve(id);
				});
			});
		});
	}

	return { showInfo, showDiceRoll, showConfirm, showTextInput, showCardChoice, showTargetSelector, close };
}

function escapeHtml(text) {
	return String(text)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}
