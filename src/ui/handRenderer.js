// handRenderer.js — Draws the row of cards in the active player's hand
// at the bottom of the screen. Updates when cards are drawn or played.
// Filled in Phase 5.

import { renderCard } from './cardRenderer.js';

console.log('[UI] handRenderer.js loaded');

export function renderHand(container, cards) {
	if (!container) return;
	console.log('[UI] Rendering hand with', cards.length, 'cards');
	container.innerHTML = '';

	if (cards.length === 0) {
		const empty = document.createElement('p');
		empty.className = 'hand-empty';
		empty.textContent = 'No cards in hand.';
		container.appendChild(empty);
		return;
	}

	for (const card of cards) {
		const cardEl = renderCard(card, { compact: false });
		cardEl.classList.add('hand-card');
		container.appendChild(cardEl);
	}
}
