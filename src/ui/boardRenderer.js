// boardRenderer.js — Draws the full game board (both players' zones,
// active Place card, quest zone) by generating HTML from the game state.
// Filled in Phase 5.

import { renderCard } from './cardRenderer.js';
import { getCardById } from '../data/cardIndex.js';
import { initModalManager } from './modalManager.js';

console.log('[UI] boardRenderer.js loaded');

let _boardModal = null;

function getBoardModal() {
	if (_boardModal) return _boardModal;
	let root = document.querySelector('#modal-root');
	if (!root) {
		root = document.createElement('div');
		root.id = 'modal-root';
		root.className = 'modal-root';
		document.body.appendChild(root);
	}
	_boardModal = initModalManager(root);
	return _boardModal;
}

export function renderBoard(container, viewModel, onUseAbility = null, onReturnToHand = null, onActivatePiecie = null, onOpenDiscard = null) {
	if (!container) return;
	console.log('[UI] Rendering board view');

	container.innerHTML = `
		<section class="board-zone board-zone--opponent">
			<header class="board-zone__header">
				${escapeHtml(viewModel.players.top.name)}
				<div class="snelle-modifier-bar" id="modifier-bar-opponent"></div>
			</header>
			<div class="board-zone__row">
				<div class="board-zone__slots" id="zone-opponent"></div>
				<div class="board-zone__piecies" id="piecies-opponent"></div>
				<div class="discard-pile-container" id="discard-opponent"></div>
			</div>
		</section>

		<section class="board-zone board-zone--player">
			<header class="board-zone__header">
				${escapeHtml(viewModel.players.bottom.name)}
				<div class="snelle-modifier-bar" id="modifier-bar-player"></div>
			</header>
			<div class="board-zone__row">
				<div class="board-zone__slots" id="zone-player"></div>
				<div class="board-zone__piecies" id="piecies-player"></div>
				<div class="discard-pile-container" id="discard-player"></div>
			</div>
		</section>
	`;

	renderModifierBar(container.querySelector('#modifier-bar-opponent'), viewModel.players.top.activeModifiers);
	renderModifierBar(container.querySelector('#modifier-bar-player'), viewModel.players.bottom.activeModifiers);

	const topZone = container.querySelector('#zone-opponent');
	const bottomZone = container.querySelector('#zone-player');
	const topPiecies = container.querySelector('#piecies-opponent');
	const bottomPiecies = container.querySelector('#piecies-player');
	const topDiscard = container.querySelector('#discard-opponent');
	const bottomDiscard = container.querySelector('#discard-player');

	for (const mosje of viewModel.players.top.mosjes) {
		const cardEl = renderCard(mosje, { compact: true });
		const fullCard = getCardById(mosje.cardId) || mosje;
		cardEl.classList.add('mosje-clickable', 'mosje-card--opponent');
		cardEl.addEventListener('click', () => getBoardModal().showMosjeDetailModal({ ...fullCard, ...mosje }));
		topZone?.appendChild(cardEl);
	}

	for (const mosje of viewModel.players.bottom.mosjes) {
		const cardEl = renderCard(mosje, {
			compact: true,
			gameState: viewModel.gameState || null,
			viewingPlayerId: viewModel.myPlayerId || null,
		});
		const fullCard = getCardById(mosje.cardId) || mosje;
		cardEl.classList.add('mosje-clickable', 'mosje-card--owned');
		cardEl.addEventListener('click', () => getBoardModal().showMosjeDetailModal({ ...fullCard, ...mosje }));

		if (onUseAbility && !mosje.isDefeated && mosje.cardId) {
			const isUsed = mosje.abilityUsedThisTurn;
			const costLabel = mosje.abilityCost > 0 ? ` ${mosje.abilityCost} MP` : '';
			let tooltip;
			if (!isUsed && mosje.cantAffordAbility) tooltip = `Not enough MP (need ${mosje.abilityCost})`;
			else if (isUsed) tooltip = 'Ability already used this turn';
			else tooltip = `Use ability${costLabel ? ` (costs ${mosje.abilityCost} MP)` : ''}`;

			const btn = document.createElement('button');
			btn.className = 'mosje-ability-btn' + (isUsed ? ' mosje-ability-btn--used' : '');
			btn.textContent = `⚡${costLabel}`;
			btn.title = tooltip;
			btn.setAttribute('aria-label', tooltip);
			btn.disabled = isUsed || (mosje.cantAffordAbility ?? false);
			btn.addEventListener('click', (event) => {
				event.stopPropagation();
				onUseAbility(mosje.cardId);
			});
			cardEl.appendChild(btn);
		}

		if (
			onReturnToHand &&
			viewModel.currentPhase === 'MAIN' &&
			viewModel.activePlayerId === viewModel.myPlayerId &&
			!mosje.isDefeated
		) {
			const returnBtn = document.createElement('button');
			returnBtn.className = 'mosje-return-btn';
			returnBtn.type = 'button';
			returnBtn.textContent = 'Return To Hand';
			returnBtn.addEventListener('click', (event) => {
				event.stopPropagation();
				onReturnToHand(mosje.cardId);
			});
			cardEl.appendChild(returnBtn);
		}
		bottomZone?.appendChild(cardEl);
	}

	// Render active Place card in Piecie slot (only on the field that played it)
	if (viewModel.activePlace && viewModel.activePlacePlayedBy) {
		const opponentId = Object.keys(viewModel.gameState.players).find(id => id !== viewModel.myPlayerId);

		if (viewModel.activePlacePlayedBy === opponentId) {
			const placeOpponent = renderCard(viewModel.activePlace, { compact: true });
			placeOpponent.classList.add('field-piecie-card', 'place-card-in-slot');
			topPiecies?.appendChild(placeOpponent);
		} else if (viewModel.activePlacePlayedBy === viewModel.myPlayerId) {
			const placePlayer = renderCard(viewModel.activePlace, { compact: true });
			placePlayer.classList.add('field-piecie-card', 'place-card-in-slot');
			bottomPiecies?.appendChild(placePlayer);
		}
	}

	for (const piecie of (viewModel.players.top.piecies || []).slice(0, 4)) {
		if (piecie.faceDown) {
			const slot = document.createElement('div');
			slot.className = 'piecie-slot face-down-piecie has-card';
			topPiecies?.appendChild(slot);
			continue;
		}
		const piecieEl = renderCard(piecie, { compact: true });
		piecieEl.classList.add('field-piecie-card');
		topPiecies?.appendChild(piecieEl);
	}

	for (const piecie of (viewModel.players.bottom.piecies || []).slice(0, 4)) {
		if (piecie.faceDown) {
			const slot = document.createElement('div');
			slot.className = 'piecie-slot face-down-piecie has-card';
			bottomPiecies?.appendChild(slot);
			continue;
		}
		const piecieEl = renderCard(piecie, { compact: true });
		piecieEl.classList.add('field-piecie-card');
		if (onActivatePiecie && piecie.canActivate) {
			const btn = document.createElement('button');
			btn.className = 'hand-card__play-btn';
			btn.type = 'button';
			btn.textContent = 'Activate';
			btn.addEventListener('click', (event) => {
				event.stopPropagation();
				onActivatePiecie(piecie.slotIndex);
			});
			piecieEl.appendChild(btn);
		}
		bottomPiecies?.appendChild(piecieEl);
	}

	// Render discard piles for both players
	const opponentPlayerId = Object.keys(viewModel.gameState?.players || {}).find(id => id !== viewModel.myPlayerId);
	const topPlayer = viewModel.players.top;
	const bottomPlayer = viewModel.players.bottom;

	renderDiscardPile(topDiscard, topPlayer, viewModel.myPlayerId === opponentPlayerId, onOpenDiscard);
	renderDiscardPile(bottomDiscard, bottomPlayer, viewModel.myPlayerId === bottomPlayer.id, onOpenDiscard);

	// Render active quest panel (Phase 8 Rule 3 — shared quest visibility)
	if (viewModel.activeQuest) {
		renderActiveQuestInto(
			container.querySelector('#active-quest-display'),
			viewModel.activeQuest,
			viewModel.myPlayerId
		);
	}

	if (viewModel.activeQuest?.revealOpponentHand && Array.isArray(viewModel.activeQuest?.revealedOpponentHandNames)) {
		getBoardModal().showOpponentHandRevealModal(viewModel.activeQuest.revealedOpponentHandNames);
		if (typeof viewModel.onClearRevealFlag === 'function') {
			viewModel.onClearRevealFlag();
		}
	}

	// Initialize drag-to-scroll handlers for horizontal overflow areas
	const rows = container.querySelectorAll('.board-zone__row');
	rows.forEach(initDragScroll);
}

function initDragScroll(element) {
	let isDown = false;
	let startX = 0;
	let scrollLeft = 0;

	element.addEventListener('mousedown', (e) => {
		isDown = true;
		startX = e.pageX - element.offsetLeft;
		scrollLeft = element.scrollLeft;
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
		const x = e.pageX - element.offsetLeft;
		const walk = (x - startX) * 1.5;
		element.scrollLeft = scrollLeft - walk;
	});
}

// Populates the active-quest-display panel with the current quest details.
// questData — { questName, questType, cardName, attacker, mpRequired, currentMp, msjPower, rolledValue }
// myPlayerId — used to label whose quest attempt it is
function renderActiveQuestInto(panel, questData, myPlayerId) {
	if (!panel || !questData) return;
	panel.classList.remove('active-quest-panel--hidden');

	const isMyQuest = questData.attacker === myPlayerId;
	const role = isMyQuest ? 'YOUR' : "OPPONENT'S";
	const mosjeInfo = questData.currentMp != null
		? `Mosje at ${questData.currentMp} MP`
		: '';
	const stakes = questData.successMP != null
		? `Win: +${questData.successMP} MP  |  Fail: ${questData.failMP} MP`
		: '';
	const diceInfo = questData.rolledValue != null
		? `<span class="quest-dice">🎲 Rolled: ${questData.rolledValue}</span>`
		: '';

	panel.innerHTML = `
		<div class="quest-badge">${escapeHtml(role)} QUEST</div>
		<div class="quest-name">${escapeHtml(questData.questName || questData.cardName || 'Quest')}</div>
		${questData.questType ? `<div class="quest-type">${escapeHtml(questData.questType)}</div>` : ''}
		${mosjeInfo ? `<div class="quest-progress">${escapeHtml(mosjeInfo)}</div>` : ''}
		${stakes ? `<div class="quest-type">${escapeHtml(stakes)}</div>` : ''}
		${diceInfo}
	`;
}

// Build a quest viewModel snippet from raw gameState for use in renderBoard viewModel.
// Returns null when no quest is active.
export function buildActiveQuestViewModel(gameState, myPlayerId) {
	if (!gameState?.activeQuest) return null;
	return { ...gameState.activeQuest, attacker: gameState.activeQuest.attacker ?? gameState.activePlayerId };
}

// Shows a floating MP number above a card.
export function showMPFloat(cardEl, amount) {
	if (!cardEl || !Number.isFinite(amount) || amount === 0) return;
	const float = document.createElement('div');
	float.className = `mp-float ${amount > 0 ? 'gain' : 'loss'}`;
	float.textContent = amount > 0 ? `+${amount}` : `${amount}`;

	const rect = cardEl.getBoundingClientRect();
	float.style.left = `${rect.left + rect.width / 2}px`;
	float.style.top = `${rect.top}px`;

	document.body.appendChild(float);
	float.addEventListener('animationend', () => float.remove(), { once: true });
}

// Triggers entry animation for a card newly placed on field.
export function animateCardPlay(cardEl) {
	if (!cardEl) return;
	cardEl.classList.add('just-played');
	cardEl.addEventListener('animationend', () => cardEl.classList.remove('just-played'), { once: true });
}

// Triggers damage shake animation on a Mosje card.
export function animateCardDamage(cardEl) {
	if (!cardEl) return;
	cardEl.classList.add('taking-damage');
	cardEl.addEventListener('animationend', () => cardEl.classList.remove('taking-damage'), { once: true });
}

// Triggers level up burst and center text effect.
export function animateLevelUp(cardEl) {
	if (!cardEl) return;
	cardEl.classList.add('level-up');
	cardEl.addEventListener('animationend', () => cardEl.classList.remove('level-up'), { once: true });

	const text = document.createElement('div');
	text.className = 'level-up-text';
	text.textContent = 'LEVEL UP!';
	text.style.left = '50%';
	text.style.top = '50%';
	document.body.appendChild(text);
	text.addEventListener('animationend', () => text.remove(), { once: true });
}

// Updates MP bar fill width, classes, and labels for a Mosje card by data-mosje-id.
export function updateMPBar(mosjeInstanceId, mp, level) {
	if (!mosjeInstanceId) return;
	const root = document.querySelector(`[data-mosje-id="${String(mosjeInstanceId)}"]`);
	const bar = root?.querySelector('.mp-bar-fill');
	if (!bar) return;

	const safeMp = Number.isFinite(mp) ? mp : 0;
	const pct = Math.max(0, Math.min(100, safeMp));
	bar.style.width = `${pct}%`;

	bar.classList.remove('mp-low', 'mp-mid', 'mp-high');
	if (pct < 30) bar.classList.add('mp-low');
	else if (pct < 70) bar.classList.add('mp-mid');
	else bar.classList.add('mp-high');

	const valueEl = bar.closest('.mp-bar-container')?.querySelector('.mp-bar-values');
	if (valueEl) valueEl.textContent = `${safeMp} / 100`;

	const levelEl = bar.closest('.mp-bar-container')?.querySelector('.mp-bar-level');
	if (levelEl) {
		const displayLevel = (Number.isFinite(level) ? Number(level) : 0) + 1;
		levelEl.textContent = `LV.${displayLevel}`;
	}
}

export function showPlaceEffectBanner(placeName, effectSummary, phase) {
	const topbarFlow = document.getElementById('topbar-flow');
	if (!topbarFlow) return;

	const existing = topbarFlow.querySelector('.place-effect-banner');
	if (existing) existing.remove();

	const banner = document.createElement('div');
	banner.className = 'place-effect-banner';
	banner.innerHTML = `
		<span class="place-banner-name">📍 ${escapeHtml(placeName || 'Active Place')}</span>
		<span class="place-banner-effect">${escapeHtml(effectSummary || `Effect triggered (${phase || 'phase'})`)}</span>
	`;

	topbarFlow.appendChild(banner);
	setTimeout(() => {
		banner.classList.add('place-banner-fade');
		banner.addEventListener('transitionend', () => banner.remove(), { once: true });
	}, 2000);
}

// Renders modifier pill badges into a .snelle-modifier-bar container.
// pills — array of { label: string, color: 'gold'|'teal'|'blue'|'purple'|'orange' }
function renderModifierBar(bar, pills) {
	if (!bar) return;
	bar.innerHTML = '';
	if (!Array.isArray(pills) || pills.length === 0) return;
	for (const pill of pills) {
		const span = document.createElement('span');
		span.className = `snelle-pill snelle-pill--${pill.color}`;
		span.textContent = pill.label;
		span.title = pill.label;
		bar.appendChild(span);
	}
}

// Renders a discard pile (Welloe) into a container.
// Shows top card face-up, count badge at 2+ cards, stacked visual effect.
// Empty state shows a faint placeholder.
function renderDiscardPile(container, player, isOwned, onOpenDiscard) {
	if (!container || !player) return;
	container.innerHTML = '';

	const discardCards = player.discard || [];
	const count = discardCards.length;

	if (count === 0) {
		// Empty state: faint outlined placeholder
		const emptyPile = document.createElement('div');
		emptyPile.className = 'discard-pile discard-pile--empty';
		emptyPile.innerHTML = `
			<div class="discard-pile__placeholder"></div>
			<div class="discard-pile__label">Empty</div>
		`;
		container.appendChild(emptyPile);
		return;
	}

	// Build stacked pile visual
	const pile = document.createElement('div');
	pile.className = 'discard-pile discard-pile--has-cards';
	pile.setAttribute('data-card-count', count);

	// Render top card (with slight offset for stack visual)
	const topCardId = discardCards[count - 1];
	const topCardData = getCardById(topCardId);
	if (topCardData) {
		const topCardEl = renderCard(topCardData, { compact: true });
		topCardEl.className = 'discard-pile__top-card';
		pile.appendChild(topCardEl);
	}

	// Count badge for 2+ cards
	if (count >= 2) {
		const badge = document.createElement('div');
		badge.className = 'discard-pile__count-badge';
		badge.textContent = `x${count}`;
		pile.appendChild(badge);
	}

	// Add label
	const label = document.createElement('div');
	label.className = 'discard-pile__label';
	label.textContent = 'Discard';
	pile.appendChild(label);

	// Click to open discard viewer
	pile.addEventListener('click', () => {
		if (typeof onOpenDiscard === 'function') {
			onOpenDiscard(player.id, isOwned);
		} else {
			// Fallback: show modal with discard contents
			getBoardModal().showDiscardViewerModal(player, isOwned);
		}
	});

	container.appendChild(pile);
}

function escapeHtml(text) {
	return String(text)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}
