// handRenderer.js — Draws the row of cards in the active player's hand
// at the bottom of the screen. Updates when cards are drawn or played.
// Filled in Phase 5.

import { renderCard } from './cardRenderer.js';

console.log('[UI] handRenderer.js loaded');

// onPlay(cardId, cardType) — optional callback when a playable card is clicked.
// isLocalTurn — when false, regular cards are dimmed; Snelle Piecies stay active.
export function renderHand(container, cards, onPlay = null, isLocalTurn = true, activeQuest = null, localPlayerId = null, gameState = null) {
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
		const wrapEl = document.createElement('div');
		wrapEl.className = 'hand-card-wrap';

		const cardEl = renderCard(card, { compact: false });
		cardEl.classList.add('hand-card');

		if (card.returnedThisTurn) {
			cardEl.classList.add('hand-card--returned-mosje');
			cardEl.title = 'Returned this turn; can be replayed next turn';
		}

		const isSnelle = card.type === 'SNELLE_PIECIE';
		const isRegularPlayable = card.type === 'PIECIE' || card.type === 'MOSJE';
		const isPlace = card.type === 'PLACE';
		const isPersonalQuest = card.type === 'QUEST' && card.questType === 'PERSONAL';
    const isReturnedMosje = card.type === 'MOSJE' && !!card.returnedThisTurn;

		if (isReturnedMosje) {
			wrapEl.appendChild(cardEl);
			container.appendChild(wrapEl);
			continue;
		}

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
		// Regular Piecies, Mosjes and Places are only playable on your own turn
		else if ((isRegularPlayable || isPlace) && onPlay) {
			if (isLocalTurn) {
				cardEl.classList.add('hand-card--playable');
				if (isRegularPlayable) {
					const hasFreeActivation = Boolean(
						gameState?.players?.[localPlayerId]?.freePiecieActivationAvailable &&
						gameState?.activePlace === 'place_coerts_caravan'
					);
					if (hasFreeActivation) {
						cardEl.classList.add('free-activation');
						cardEl.title = '⭐ Free activation — Coert\'s Caravan';
					}
				}
				const btn = document.createElement('button');
				btn.className = 'hand-card__play-btn';
				btn.type = 'button';
				if (card.type === 'MOSJE') btn.textContent = 'Play Mosje';
				else btn.textContent = isRegularPlayable ? 'PLACE' : 'Play';
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

		wrapEl.appendChild(cardEl);
		container.appendChild(wrapEl);
	}

	const handCards = Array.from(container.querySelectorAll('.hand-card-wrap'));
	const total = handCards.length;
	const mid = (total - 1) / 2;
	handCards.forEach((cardEl, index) => {
		const offset = index - mid;
		const normalized = total > 1 ? offset / Math.max(1, mid) : 0;
		const rotation = normalized * 6;
		const lift = Math.round(Math.abs(normalized) * -6);
		cardEl.style.setProperty('--fan-rot', `${rotation.toFixed(2)}deg`);
		cardEl.style.setProperty('--fan-lift', `${lift}px`);
		cardEl.dataset.handIndex = String(index);
	});

	handCards.forEach((cardEl, index) => {
		cardEl.addEventListener('mouseenter', () => {
			handCards.forEach((other, otherIndex) => {
				if (otherIndex === index) return;
				other.classList.remove('nudge-left', 'nudge-right');
				if (otherIndex < index) other.classList.add('nudge-left');
				else other.classList.add('nudge-right');
			});
		});

		cardEl.addEventListener('mouseleave', () => {
			handCards.forEach((other) => {
				other.classList.remove('nudge-left', 'nudge-right');
			});
		});
	});
}
