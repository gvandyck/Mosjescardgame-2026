// boardRenderer.js — Draws the full game board (both players' zones,
// active Place card, quest zone) by generating HTML from the game state.
// Filled in Phase 5.

import { renderCard } from './cardRenderer.js';

console.log('[UI] boardRenderer.js loaded');

export function renderBoard(container, viewModel, onUseAbility = null) {
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
		</section>

		<section class="board-zone board-zone--player">
			<header class="board-zone__header">${escapeHtml(viewModel.players.bottom.name)}</header>
			<div class="board-zone__slots" id="zone-player"></div>
		</section>
	`;

	const topZone = container.querySelector('#zone-opponent');
	const bottomZone = container.querySelector('#zone-player');

	for (const mosje of viewModel.players.top.mosjes) {
		topZone?.appendChild(renderCard(mosje, { compact: true }));
	}

	for (const mosje of viewModel.players.bottom.mosjes) {
		const cardEl = renderCard(mosje, { compact: true });
		if (onUseAbility && !mosje.isDefeated && mosje.cardId) {
			const btn = document.createElement('button');
			btn.className = 'mosje-ability-btn' + (mosje.abilityUsedThisTurn ? ' mosje-ability-btn--used' : '');
			btn.textContent = mosje.abilityUsedThisTurn ? '⚡ Used' : '⚡ Ability';
			btn.disabled = mosje.abilityUsedThisTurn;
			btn.addEventListener('click', () => onUseAbility(mosje.cardId));
			cardEl.appendChild(btn);
		}
		bottomZone?.appendChild(cardEl);
	}
}

function escapeHtml(text) {
	return String(text)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}
