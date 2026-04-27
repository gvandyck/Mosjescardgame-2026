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
			showOptionSelect: async (config = {}) => {
				const options = Array.isArray(config.options) ? config.options : [];
				return options[0]?.id ?? null;
			},
			showCardTypeSelect: async ({ allowedTypes = [] } = {}) => {
				const list = Array.isArray(allowedTypes) ? allowedTypes : [];
				return list[0] ?? null;
			},
			showOpponentHandCardSelect: async ({ handSize = 0 } = {}) => {
				return Number(handSize) > 0 ? 0 : null;
			},
			showMosjeSelect: (_slots, onSelected, _questDef) => onSelected(0),
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

	function showQuestAttemptPreview(mosje, questDef, threshold, onConfirm) {
		if (!mosje || !questDef) return;
		const previewEl = renderCard(mosje, { compact: true });
		previewEl.classList.add('modal-mosje-preview-card');
		const traitRows = Object.entries(mosje.traits || {})
			.filter(([, value]) => Number(value) > 0)
			.map(([name, value]) => `<li><strong>${escapeHtml(name)}</strong>: ${Number(value)}</li>`)
			.join('');

		const thresholdLabel = threshold >= 7
			? '<span class="modal-threshold--fail">Missing required trait</span>'
			: `${threshold}+ to succeed`;

		container.classList.add('modal-root--open');
		container.innerHTML = `
			<div class="modal-backdrop"></div>
			<section class="modal-card modal-card--mosje-detail" role="dialog" aria-modal="true">
				<div class="modal-mosje-preview">${previewEl.outerHTML}</div>
				<div class="modal-mosje-copy">
					<h3>🎯 ${escapeHtml(questDef.name || 'Quest')}</h3>
					<p><strong>Current MP:</strong> ${Number(mosje.mp || 0)}</p>
					<p><strong>Requirement:</strong> ${escapeHtml(questDef.requirementDescription || 'Roll dice')}</p>
					<p><strong>Roll needed:</strong> ${thresholdLabel}</p>
					<p><strong>On success:</strong> <span style="color: #4ade80;">+${Number(questDef.successMP || 0)} MP</span></p>
					<p><strong>On failure:</strong> <span style="color: #f87171;">${Number(questDef.failMP || 0)} MP</span></p>
					<div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.1);">
						<p><strong>Mosje traits:</strong></p>
						<ul class="modal-card-list">${traitRows || '<li>No active traits</li>'}</ul>
					</div>
					<div style="display: flex; gap: 8px; margin-top: 16px;">
						<button class="modal-btn" id="modal-attempt" type="button">Attempt Quest</button>
						<button class="modal-btn modal-btn--ghost" id="modal-cancel-quest" type="button">Cancel</button>
					</div>
				</div>
			</section>
		`;

		container.querySelector('#modal-attempt')?.addEventListener('click', () => {
			close();
			onConfirm();
		});

		container.querySelector('#modal-cancel-quest')?.addEventListener('click', close);

		// Initialize drag-to-scroll for ability section (after modal is rendered)
		setTimeout(() => {
			const abilitySection = container.querySelector('.mosje-ability-section-v2');
			if (abilitySection) {
				initDragScroll(abilitySection);
			}
		}, 0);
	}

	function initDragScroll(element) {
		let isDown = false;
		let startY = 0;
		let scrollTop = 0;

		element.addEventListener('mousedown', (e) => {
			isDown = true;
			startY = e.pageY - element.offsetTop;
			scrollTop = element.scrollTop;
			element.style.cursor = 'grabbing';
		});

		element.addEventListener('mouseleave', () => {
			isDown = false;
			element.style.cursor = 'grab';
		});

		element.addEventListener('mouseup', () => {
			isDown = false;
			element.style.cursor = 'grab';
		});

		element.addEventListener('mousemove', (e) => {
			if (!isDown) return;
			e.preventDefault();
			const y = e.pageY - element.offsetTop;
			const walk = (y - startY) * 1.5;
			element.scrollTop = scrollTop - walk;
		});
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

	// Generic option picker — the single reusable selector for all "choose one" flows.
	// options: [{ id, label, metaLabel? }]
	// Resolves with the chosen id string, or null if cancelled / empty.
	async function showOptionSelect({
		title = 'Choose',
		prompt = '',
		options = [],
		allowCancel = false,
		autoSelectSingle = false,
	} = {}) {
		const safeOptions = Array.isArray(options) ? options.filter(Boolean) : [];
		if (autoSelectSingle && safeOptions.length === 1) return safeOptions[0]?.id ?? null;

		return new Promise(resolve => {
			container.classList.add('modal-root--open');

			const rows = safeOptions.map(opt => {
				const id = opt?.id ?? '';
				const label = opt?.label ?? String(id);
				const meta = opt?.metaLabel ?? '';
				const isDisabled = Boolean(opt?.disabled);
				const disabledAttr = isDisabled ? 'disabled' : '';
				const disabledClass = isDisabled ? 'modal-mosje-select-btn--disabled' : '';
				return `<button class="modal-mosje-select-btn ${disabledClass}" data-id="${escapeHtml(String(id))}" type="button" ${disabledAttr}>
					<span class="mosje-select-name">${escapeHtml(String(label))}</span>
					${meta ? `<span class="mosje-select-mp">${meta}</span>` : ''}
				</button>`;
			}).join('');

			container.innerHTML = `
				<div class="modal-backdrop"></div>
				<section class="modal-card" role="dialog" aria-modal="true">
					<h3>${escapeHtml(title)}</h3>
					${prompt ? `<p>${escapeHtml(prompt)}</p>` : ''}
					<div class="modal-mosje-select-list">${rows}</div>
					${allowCancel ? '<button class="modal-btn modal-btn--ghost" id="modal-option-cancel" type="button">Cancel</button>' : ''}
				</section>
			`;

			container.querySelectorAll('.modal-mosje-select-btn:not(:disabled)').forEach(btn => {
				btn.addEventListener('click', () => { close(); resolve(btn.dataset.id ?? null); });
			});
			container.querySelector('#modal-option-cancel')?.addEventListener('click', () => { close(); resolve(null); });
		});
	}

	// Card-type picker — uses showOptionSelect.
	// Resolves with 'MOSJE'|'PIECIE'|'SNELLE_PIECIE'|'PLACE'|'QUEST', or null if cancelled.
	async function showCardTypeSelect({
		title = 'Choose Card Type',
		prompt = 'Pick the card type.',
		allowCancel = true,
		autoSelectSingle = false,
	} = {}) {
		const options = [
			{ id: 'MOSJE',        label: 'Mosje' },
			{ id: 'PIECIE',       label: 'Piecie' },
			{ id: 'SNELLE_PIECIE', label: 'Snelle Piecie' },
			{ id: 'PLACE',        label: 'Place' },
			{ id: 'QUEST',        label: 'Personal Quest' },
		];
		return showOptionSelect({ title, prompt, options, allowCancel, autoSelectSingle });
	}

	// Hidden card picker — shows N face-down cards from opponent's hand.
	// Resolves with the chosen hand index (0-based), or null if cancelled / hand empty.
	async function showOpponentHandCardSelect({
		title = 'Pick a Card',
		prompt = "Pick one of your opponent's face-down cards.",
		handSize = 0,
		allowCancel = false,
	} = {}) {
		const count = Math.max(0, Number(handSize) || 0);
		if (count === 0) return null;
		const options = Array.from({ length: count }, (_, i) => ({
			id: String(i),
			label: `Card ${i + 1}`,
			metaLabel: '?',
		}));
		const selected = await showOptionSelect({ title, prompt, options, allowCancel });
		if (selected == null) return null;
		const parsed = Number.parseInt(String(selected), 10);
		return Number.isFinite(parsed) ? parsed : null;
	}

	// Mosje selector — uses showOptionSelect; auto-selects when only one Mosje is on field.
	// questDef is optional: when provided, requires 20 MP to attempt quest.
	function showMosjeSelect(mosjeSlots, onSelected, questDef) {
		if (mosjeSlots.length <= 1) {
			onSelected(mosjeSlots[0]?.slotIndex ?? 0);
			return;
		}

		const isQuestAttempt = Boolean(questDef);
		const questCost = 20;

		function getMpLabel(mosjeSlot) {
			const hasEnoughMp = mosjeSlot.mp >= questCost;
			const color = hasEnoughMp ? '#4ade80' : '#ef4444';
			return `<span style="color: ${color};">${mosjeSlot.mp} MP</span>`;
		}

		const options = mosjeSlots.map(mosjeSlot => {
			const hasEnoughMp = mosjeSlot.mp >= questCost;
			return {
				id: String(mosjeSlot.slotIndex),
				label: mosjeSlot.name,
				metaLabel: isQuestAttempt ? getMpLabel(mosjeSlot) : undefined,
				disabled: isQuestAttempt && !hasEnoughMp,
				slotIndex: mosjeSlot.slotIndex,
				mp: mosjeSlot.mp,
			};
		});
		showOptionSelect({
			title: 'Choose Mosje for Quest',
			prompt: isQuestAttempt ? `Select Mosje to attempt quest (costs 20 MP).` : 'Select which Mosje will attempt the quest.',
			options,
			allowCancel: true,
		}).then(selected => {
			if (selected !== null) {
				onSelected(Number.parseInt(selected, 10));
			}
		});
	}

	// Shows a card from the deck briefly so the player can see it.
	// Resolves when the player clicks Continue.
	async function showRevealedCard(title, cardName, cardType) {
		return new Promise(resolve => {
			container.classList.add('modal-root--open');
			container.innerHTML = `
				<div class="modal-backdrop"></div>
				<section class="modal-card" role="dialog" aria-modal="true">
					<h3>${escapeHtml(title)}</h3>
					<div class="modal-revealed-card">
						<p class="modal-revealed-card__name">${escapeHtml(cardName)}</p>
						<p class="modal-revealed-card__type">${escapeHtml(cardType)}</p>
					</div>
					<button class="modal-btn" id="modal-continue" type="button">Continue</button>
				</section>
			`;
			container.querySelector('#modal-continue')?.addEventListener('click', () => {
				close();
				resolve();
			});
		});
	}

	// Discard viewer modal — shows cards in a player's discard pile.
	// isOwned — true if this is the current player's discard (allows recovery actions)
	function showDiscardViewerModal(player, isOwned) {
		container.classList.add('modal-root--open');
		const discardCards = player?.discard || [];
		const count = discardCards.length;

		if (count === 0) {
			container.innerHTML = `
				<div class="modal-backdrop"></div>
				<section class="modal-card" role="dialog" aria-modal="true">
					<h3>${escapeHtml(player?.name || 'Player')}'s Discard</h3>
					<p>Discard pile is empty.</p>
					<button class="modal-btn" id="modal-close-discard">Close</button>
				</section>
			`;
			container.querySelector('#modal-close-discard')?.addEventListener('click', close);
			return;
		}

		const cardRows = discardCards.map((cardId, idx) => {
			const card = { cardId };
			return `<li><span>${escapeHtml(cardId || 'Unknown')}</span></li>`;
		}).join('');

		container.innerHTML = `
			<div class="modal-backdrop"></div>
			<section class="modal-card" role="dialog" aria-modal="true">
				<h3>${escapeHtml(player?.name || 'Player')}'s Discard (${count} cards)</h3>
				<ul class="modal-card-list">${cardRows}</ul>
				<button class="modal-btn" id="modal-close-discard">Close</button>
			</section>
		`;
		container.querySelector('#modal-close-discard')?.addEventListener('click', close);
	}

	// Discard recovery modal — allows selecting cards to recover from discard.
	// config: { playerId, playerName, discardCards, requiredCount, filter?, onRecover(selectedCardIds) }
	// RECOVERY MODE: shows selectable cards, confirm button appears when right count selected
	// Returns a promise that resolves with selected card IDs
	async function showDiscardRecoveryModal(config = {}) {
		const {
			playerName = 'Player',
			discardCards = [],
			requiredCount = 1,
			filter = null,
			onRecover = null,
		} = config;

		return new Promise(resolve => {
			const cardCount = discardCards.length;
			const selectedIds = new Set();

			if (cardCount === 0) {
				container.classList.add('modal-root--open');
				container.innerHTML = `
					<div class="modal-backdrop"></div>
					<section class="modal-card" role="dialog" aria-modal="true">
						<h3>Recover from Discard</h3>
						<p>Discard pile is empty. No cards to recover.</p>
						<button class="modal-btn" id="modal-recovery-done">OK</button>
					</section>
				`;
				container.querySelector('#modal-recovery-done')?.addEventListener('click', () => {
					close();
					if (typeof onRecover === 'function') onRecover([]);
					resolve([]);
				});
				return;
			}

			const filteredCards = filter
				? discardCards.filter(id => {
					// Simple filter: check if card ID contains the filter keyword
					return String(id).toLowerCase().includes(String(filter).toLowerCase());
				})
				: discardCards;

			const cardRows = filteredCards.map((cardId) => {
				const displayName = String(cardId).replace(/_/g, ' ');
				return `<li class="recovery-card-option" data-card-id="${escapeHtml(String(cardId))}">
					<input type="checkbox" id="recovery-${escapeHtml(String(cardId))}" />
					<label for="recovery-${escapeHtml(String(cardId))}">${escapeHtml(displayName)}</label>
				</li>`;
			}).join('');

			const progressText = `(Select ${requiredCount}/${requiredCount})`;

			container.classList.add('modal-root--open');
			container.innerHTML = `
				<div class="modal-backdrop"></div>
				<section class="modal-card" role="dialog" aria-modal="true">
					<h3>Recover from Discard</h3>
					<p>Select ${requiredCount} card${requiredCount !== 1 ? 's' : ''} to recover from ${escapeHtml(playerName)}'s discard.</p>
					<div class="recovery-progress" id="recovery-progress">${progressText}</div>
					<ul class="recovery-card-list">${cardRows}</ul>
					<div class="modal-actions">
						<button class="modal-btn" id="modal-recovery-confirm" type="button" disabled>Confirm Selection</button>
						<button class="modal-btn modal-btn--ghost" id="modal-recovery-cancel" type="button">Cancel</button>
					</div>
				</section>
			`;

			const confirmBtn = container.querySelector('#modal-recovery-confirm');
			const progressEl = container.querySelector('#recovery-progress');
			const checkboxes = container.querySelectorAll('.recovery-card-option input');

			const updateProgress = () => {
				const count = selectedIds.size;
				const isComplete = count === requiredCount;
				if (confirmBtn) {
					confirmBtn.disabled = !isComplete;
				}
				if (progressEl) {
					progressEl.textContent = `(Select ${requiredCount - count}/${requiredCount})`;
					progressEl.classList.toggle('recovery-progress--complete', isComplete);
				}
			};

			checkboxes.forEach(checkbox => {
				const cardId = checkbox.closest('.recovery-card-option')?.dataset.cardId;
				checkbox.addEventListener('change', (e) => {
					if (e.target.checked) {
						if (selectedIds.size < requiredCount) {
							selectedIds.add(cardId);
						} else {
							e.target.checked = false;
						}
					} else {
						selectedIds.delete(cardId);
					}
					updateProgress();
				});
			});

			confirmBtn?.addEventListener('click', () => {
				close();
				const selected = Array.from(selectedIds);
				if (typeof onRecover === 'function') onRecover(selected);
				resolve(selected);
			});

			container.querySelector('#modal-recovery-cancel')?.addEventListener('click', () => {
				close();
				if (typeof onRecover === 'function') onRecover(null);
				resolve(null);
			});

			updateProgress();
		});
	}

	return {
		showInfo,
		showDiceRoll,
		showConfirm,
		showTextInput,
		showCardChoice,
		showTargetSelector,
		showOptionSelect,
		showCardTypeSelect,
		showOpponentHandCardSelect,
		showRevealedCard,
		showMosjeDetailModal,
		showQuestAttemptPreview,
		showPlaceDetailModal,
		showOpponentHandRevealModal,
		showMosjeSelect,
		showDiscardViewerModal,
		showDiscardRecoveryModal,
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
