// handRenderer.js — Draws the row of cards in the active player's hand
// at the bottom of the screen. Updates when cards are drawn or played.
// Filled in Phase 5.

import { renderCard } from './cardRenderer.js';

console.log('[UI] handRenderer.js loaded');

// onPlay(cardId, cardType) — optional callback when a playable card is clicked.
// isLocalTurn — when false, regular cards are dimmed; Snelle Piecies stay active.
export function renderHand(container, cards, onPlay = null, isLocalTurn = true, activeQuest = null, localPlayerId = null) {
	if (!container) return;
	console.log('[UI] Rendering hand with', cards.length, 'cards');
	container.innerHTML = '';

	const questActive = !!activeQuest;
	const questByOpponent = questActive && activeQuest.attacker && activeQuest.attacker !== localPlayerId;

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

		const isSnelle = card.type === 'SNELLE_PIECIE';
		const isRegularPlayable = card.type === 'PIECIE';
		const isPersonalQuest = card.type === 'QUEST' && card.questType === 'PERSONAL';

		// Snelle Piecies are always interactive (can be played as interrupt any turn)
		if (isSnelle && onPlay) {
			cardEl.classList.add('hand-card--playable');
			if (questByOpponent) {
				cardEl.classList.add('playable-now');
				cardEl.title = 'Play now during opponent quest';
			}
			const btn = document.createElement('button');
			btn.className = 'hand-card__play-btn';
			btn.type = 'button';
			btn.textContent = 'Play (Instant)';
			btn.addEventListener('click', (e) => {
				e.stopPropagation();
				onPlay(card.cardId, card.type);
			});
			cardEl.appendChild(btn);
		}
		// Regular Piecies only playable on your own turn
		else if (isRegularPlayable && onPlay) {
			if (isLocalTurn) {
				cardEl.classList.add('hand-card--playable');
				const btn = document.createElement('button');
				btn.className = 'hand-card__play-btn';
				btn.type = 'button';
				btn.textContent = 'Play';
				btn.addEventListener('click', (e) => {
					e.stopPropagation();
					onPlay(card.cardId, card.type);
				});
				cardEl.appendChild(btn);
			} else {
				cardEl.classList.add('hand-card--not-playable');
				cardEl.title = 'Not your turn';
			}
		}
		else if (isPersonalQuest && onPlay) {
			if (isLocalTurn) {
				cardEl.classList.add('hand-card--playable');
				const btn = document.createElement('button');
				btn.className = 'hand-card__play-btn';
				btn.type = 'button';
				btn.textContent = 'Attempt Quest';
				btn.addEventListener('click', (e) => {
					e.stopPropagation();
					onPlay(card.cardId, card.type);
				});
				cardEl.appendChild(btn);
			} else {
				cardEl.classList.add('hand-card--not-playable');
				cardEl.title = 'Not your turn';
			}
		}

		container.appendChild(cardEl);
	}
}
