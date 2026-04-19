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

export function renderBoard(container, viewModel, onUseAbility = null, onReturnToHand = null) {
	if (!container) return;
	console.log('[UI] Rendering board view');

	container.innerHTML = `
		<section class="board-zone board-zone--opponent">
			<header class="board-zone__header">${escapeHtml(viewModel.players.top.name)}</header>
			<div class="board-zone__slots" id="zone-opponent"></div>
			<div class="board-zone__piecies" id="piecies-opponent"></div>
		</section>

		<section class="board-zone board-zone--center" id="shared-zone">
			<div class="board-place">Active Place: <strong>${escapeHtml(viewModel.activePlaceName || 'None')}</strong></div>
			<div class="board-quest">Quest Flow: <strong>${escapeHtml(viewModel.turnPhase)}</strong></div>
			<div class="board-place-turns">⏱ ${Number(viewModel.activePlaceTurns || 0)} turn${Number(viewModel.activePlaceTurns || 0) === 1 ? '' : 's'} active</div>
			<div id="active-quest-display" class="active-quest-panel active-quest-panel--hidden"></div>
		</section>

		<section class="board-zone board-zone--player">
			<header class="board-zone__header">${escapeHtml(viewModel.players.bottom.name)}</header>
			<div class="board-zone__slots" id="zone-player"></div>
			<div class="board-zone__piecies" id="piecies-player"></div>
		</section>
	`;

	const topZone = container.querySelector('#zone-opponent');
	const bottomZone = container.querySelector('#zone-player');
	const topPiecies = container.querySelector('#piecies-opponent');
	const bottomPiecies = container.querySelector('#piecies-player');

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
			const btn = document.createElement('button');
			btn.className = 'mosje-ability-btn' + (mosje.abilityUsedThisTurn ? ' mosje-ability-btn--used' : '');
			btn.textContent = mosje.abilityUsedThisTurn ? '⚡ Used' : '⚡ Ability';
			btn.disabled = mosje.abilityUsedThisTurn;
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

	for (const piecie of viewModel.players.top.piecies || []) {
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

	for (const piecie of viewModel.players.bottom.piecies || []) {
		if (piecie.faceDown) {
			const slot = document.createElement('div');
			slot.className = 'piecie-slot face-down-piecie has-card';
			bottomPiecies?.appendChild(slot);
			continue;
		}
		const piecieEl = renderCard(piecie, { compact: true });
		piecieEl.classList.add('field-piecie-card');
		bottomPiecies?.appendChild(piecieEl);
	}

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
	if (levelEl) levelEl.textContent = `LV.${Number.isFinite(level) ? level : 0}`;
}

export function showPlaceEffectBanner(placeName, effectSummary, phase) {
	const sharedZone = document.getElementById('shared-zone');
	if (!sharedZone) return;

	const existing = sharedZone.querySelector('.place-effect-banner');
	if (existing) existing.remove();

	const banner = document.createElement('div');
	banner.className = 'place-effect-banner';
	banner.innerHTML = `
		<span class="place-banner-name">📍 ${escapeHtml(placeName || 'Active Place')}</span>
		<span class="place-banner-effect">${escapeHtml(effectSummary || `Effect triggered (${phase || 'phase'})`)}</span>
	`;

	sharedZone.appendChild(banner);
	setTimeout(() => {
		banner.classList.add('place-banner-fade');
		banner.addEventListener('transitionend', () => banner.remove(), { once: true });
	}, 2000);
}

function escapeHtml(text) {
	return String(text)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}
