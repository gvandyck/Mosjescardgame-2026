// handRenderer.js — Draws the row of cards in the active player's hand
// at the bottom of the screen. Updates when cards are drawn or played.
// Filled in Phase 5.

import { renderCard } from './cardRenderer.js';

console.log('[UI] handRenderer.js loaded');

// onPlay(cardId, cardType) — optional callback when a playable card is clicked.
// Pass null to render in view-only mode (opponent's turn, game over).
export function renderHand(container, cards, onPlay = null) {
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

		const isPlayable = onPlay && (card.type === 'PIECIE' || card.type === 'SNELLE_PIECIE');
		if (isPlayable) {
			cardEl.classList.add('hand-card--playable');
			const btn = document.createElement('button');
			btn.className = 'hand-card__play-btn';
			btn.type = 'button';
			btn.textContent = card.type === 'SNELLE_PIECIE' ? 'Play (Instant)' : 'Play';
			btn.addEventListener('click', (e) => {
				e.stopPropagation();
				onPlay(card.cardId, card.type);
			});
			cardEl.appendChild(btn);
		}

		container.appendChild(cardEl);
	}
}
