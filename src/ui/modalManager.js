// modalManager.js — Shows and hides popup overlays:
// dice roll animations, card zoom view, yes/no confirmations.
// Filled in Phase 5.

import { renderCard } from './cardRenderer.js';

console.log('[UI] modalManager.js loaded');

export function initModalManager(container) {
	if (!container) {
		return {
			showInfo: () => {},
			showDiceRoll: (_info, _threshold, onResolved) => onResolved(false),
			showConfirm: async () => false,
			showPlaceDetailModal: () => {},
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
	// options.skiffaRerolls — number of rerolls granted by active Place/traits
	function showDiceRoll(questInfo, threshold, onResolved, { diceBonus = 0, forceReroll = false, skiffaRerolls = 0 } = {}) {
		container.classList.add('modal-root--open');
		let forceRerollAvailable = Boolean(forceReroll);
		let placeRerollsLeft = Math.max(0, Number(skiffaRerolls) || 0);

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
					const rerollText = allowReroll
						? '🎲 Je Weet Niet — Reroll!'
						: `🎲 Skiffa Reroll (${placeRerollsLeft} left)`;

					section.insertAdjacentHTML('beforeend', `
						<p class="modal-result modal-result--${didSucceed ? 'success' : 'fail'}">${escapeHtml(resultLabel)}</p>
						${(allowReroll || placeRerollsLeft > 0) ? `<button class="modal-btn modal-btn--ghost" id="modal-reroll" type="button">${rerollText}</button>` : ''}
						<button class="modal-btn" id="modal-done" type="button">Continue</button>
					`);

					container.querySelector('#modal-done')?.addEventListener('click', () => {
						close();
						onResolved(didSucceed);
					});

					// forceReroll: opponent's Je Weet Niet forces one reroll
					container.querySelector('#modal-reroll')?.addEventListener('click', () => {
						if (!allowReroll && placeRerollsLeft > 0) {
							placeRerollsLeft -= 1;
						}
						section.querySelectorAll('.modal-result, #modal-done, #modal-reroll').forEach(e => e.remove());
						if (rollBtn) { rollBtn.disabled = false; rollBtn.textContent = 'Roll Dice 🎲'; }
						doRoll(false);
					});
				}
			}, 80);
		}

		container.querySelector('#modal-roll')?.addEventListener('click', () => {
			const allowForced = forceRerollAvailable;
			forceRerollAvailable = false;
			doRoll(allowForced);
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
					<span class="target-level">LV.${Number(opt.level || 0) + 1}</span>
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

	function showMosjeDetailModal(mosje) {
		if (!mosje) return;
		const previewEl = renderCard(mosje, { compact: true });
		previewEl.classList.add('modal-mosje-preview-card');
		const traitRows = Object.entries(mosje.traits || {})
			.filter(([, value]) => Number(value) > 0)
			.map(([name, value]) => `<li><strong>${escapeHtml(name)}</strong>: ${Number(value)}</li>`)
			.join('');

		container.classList.add('modal-root--open');
		container.innerHTML = `
			<div class="modal-backdrop"></div>
			<section class="modal-card modal-card--mosje-detail" role="dialog" aria-modal="true">
				<div class="modal-mosje-preview">${previewEl.outerHTML}</div>
				<div class="modal-mosje-copy">
					<h3>${escapeHtml(mosje.name || 'Mosje')}</h3>
					<p>${escapeHtml(mosje.flavourText || mosje.description || '')}</p>
					<p><strong>Ability:</strong> ${escapeHtml(mosje.abilityDescription || 'No ability description')}</p>
					<p><strong>Synergy:</strong> ${escapeHtml(mosje.synergyEffect || 'None')}</p>
					<p><strong>Pet synergy:</strong> ${escapeHtml(mosje.petSynergy || 'None')}</p>
					<ul class="modal-card-list">${traitRows || '<li>No active traits</li>'}</ul>
					<button class="modal-btn" id="modal-close-mosje">Close</button>
				</div>
			</section>
		`;

		container.querySelector('#modal-close-mosje')?.addEventListener('click', close);
	}

	function showPlaceDetailModal(place) {
		if (!place) return;
		const previewEl = renderCard(place, { compact: true });
		previewEl.classList.add('modal-place-preview-card');
		const tags = Array.isArray(place.tags) && place.tags.length > 0 ? place.tags.join(', ') : 'None';
		const goodFor = Array.isArray(place.goodFor) && place.goodFor.length > 0 ? place.goodFor.join(', ') : 'None';
		const badFor = Array.isArray(place.badFor) && place.badFor.length > 0 ? place.badFor.join(', ') : 'None';

		container.classList.add('modal-root--open');
		container.innerHTML = `
			<div class="modal-backdrop"></div>
			<section class="modal-card modal-card--mosje-detail modal-card--place-detail" role="dialog" aria-modal="true">
				<div class="modal-place-preview">${previewEl.outerHTML}</div>
				<div class="modal-place-copy">
					<h3>${escapeHtml(place.name || 'Place')}</h3>
					<p><strong>Description:</strong> ${escapeHtml(place.description || 'No description available.')}</p>
					<p><strong>Flavour text:</strong> ${escapeHtml(place.flavourText || 'None')}</p>
					<p><strong>Trigger:</strong> ${escapeHtml(place.trigger || 'None')}</p>
					<p><strong>Tags:</strong> ${escapeHtml(tags)}</p>
					<p><strong>Good for:</strong> ${escapeHtml(goodFor)}</p>
					<p><strong>Bad for:</strong> ${escapeHtml(badFor)}</p>
					<p><strong>Rarity:</strong> ${escapeHtml(place.rarity || 'Unknown')}</p>
					<button class="modal-btn" id="modal-close-place">Close</button>
				</div>
			</section>
		`;

		container.querySelector('#modal-close-place')?.addEventListener('click', close);
	}

	function showOpponentHandRevealModal(cardNames = []) {
		container.classList.add('modal-root--open');
		const rows = cardNames.length
			? cardNames.map(name => `<li>${escapeHtml(name)}</li>`).join('')
			: '<li>Opponent hand is empty.</li>';

		container.innerHTML = `
			<div class="modal-backdrop"></div>
			<section class="modal-card" role="dialog" aria-modal="true">
				<h3>Perfect Sync: Opponent Hand Revealed</h3>
				<p>Memorize these cards before ending your turn.</p>
				<ul class="modal-card-list">${rows}</ul>
				<button class="modal-btn" id="modal-close-reveal">Close</button>
			</section>
		`;

		container.querySelector('#modal-close-reveal')?.addEventListener('click', close);
	}

	return {
		showInfo,
		showDiceRoll,
		showConfirm,
		showTextInput,
		showCardChoice,
		showTargetSelector,
		showMosjeDetailModal,
		showPlaceDetailModal,
		showOpponentHandRevealModal,
		close,
	};
}

function escapeHtml(text) {
	return String(text)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}
