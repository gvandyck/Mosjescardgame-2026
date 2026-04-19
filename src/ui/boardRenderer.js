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
		</section>

		<section class="board-zone board-zone--center">
			<div class="board-place">Active Place: <strong>${escapeHtml(viewModel.activePlaceName || 'None')}</strong></div>
			<div class="board-quest">Quest Flow: <strong>${escapeHtml(viewModel.turnPhase)}</strong></div>
			<div id="active-quest-display" class="active-quest-panel active-quest-panel--hidden"></div>
		</section>

		<section class="board-zone board-zone--player">
			<header class="board-zone__header">${escapeHtml(viewModel.players.bottom.name)}</header>
			<div class="board-zone__slots" id="zone-player"></div>
		</section>
	`;

	const topZone = container.querySelector('#zone-opponent');
	const bottomZone = container.querySelector('#zone-player');

	for (const mosje of viewModel.players.top.mosjes) {
		const cardEl = renderCard(mosje, { compact: true });
		const fullCard = getCardById(mosje.cardId) || mosje;
		cardEl.classList.add('mosje-clickable');
		cardEl.addEventListener('click', () => getBoardModal().showMosjeDetailModal({ ...fullCard, ...mosje }));
		topZone?.appendChild(cardEl);
	}

	for (const mosje of viewModel.players.bottom.mosjes) {
		const cardEl = renderCard(mosje, { compact: true });
		const fullCard = getCardById(mosje.cardId) || mosje;
		cardEl.classList.add('mosje-clickable');
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

function escapeHtml(text) {
	return String(text)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}
