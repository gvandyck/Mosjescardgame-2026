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
				else if (card.type === 'PLACE') btn.textContent = 'Play Place';
				else btn.textContent = 'Play';
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
	applyFanLayout(container);

	handCards.forEach((cardEl, index) => {
		cardEl.addEventListener('mouseenter', () => {
			const current = Array.from(container.querySelectorAll('.hand-card-wrap'));
			const idx = current.indexOf(cardEl);
			current.forEach((other, otherIndex) => {
				if (otherIndex === idx) return;
				other.classList.remove('nudge-left', 'nudge-right');
				if (otherIndex < idx) other.classList.add('nudge-left');
				else other.classList.add('nudge-right');
			});
		});

		cardEl.addEventListener('mouseleave', () => {
			Array.from(container.querySelectorAll('.hand-card-wrap')).forEach((other) => {
				other.classList.remove('nudge-left', 'nudge-right');
			});
		});
	});

	initHandDragDrop(container);
}

/** Recalculate and apply --fan-rot / --fan-lift on all .hand-card-wrap children. */
function applyFanLayout(container) {
	const wraps = Array.from(container.querySelectorAll('.hand-card-wrap'));
	const total = wraps.length;
	const mid = (total - 1) / 2;
	wraps.forEach((wrap, index) => {
		wrap.dataset.handIndex = String(index);
		const offset = index - mid;
		const normalized = total > 1 ? offset / Math.max(1, mid) : 0;
		const rotation = normalized * 6;
		const lift = Math.round(Math.abs(normalized) * -6);
		wrap.style.setProperty('--fan-rot', `${rotation.toFixed(2)}deg`);
		wrap.style.setProperty('--fan-lift', `${lift}px`);
	});
}

/** Attach HTML5 drag-and-drop reordering to hand card wrappers. */
function initHandDragDrop(container) {
	let dragSrcIndex = null;

	function getWraps() {
		return Array.from(container.querySelectorAll('.hand-card-wrap'));
	}

	function attachTo(wrap) {
		wrap.setAttribute('draggable', 'true');
		// Prevent buttons inside cards from accidentally triggering drag
		wrap.querySelectorAll('button').forEach(btn => btn.setAttribute('draggable', 'false'));

		wrap.addEventListener('dragstart', onDragStart);
		wrap.addEventListener('dragover', onDragOver);
		wrap.addEventListener('dragleave', onDragLeave);
		wrap.addEventListener('drop', onDrop);
		wrap.addEventListener('dragend', onDragEnd);
	}

	function onDragStart(e) {
		dragSrcIndex = parseInt(this.dataset.handIndex, 10);
		this.classList.add('hand-card--dragging');
		e.dataTransfer.effectAllowed = 'move';
		e.dataTransfer.setData('text/plain', String(dragSrcIndex));
	}

	function onDragOver(e) {
		e.preventDefault();
		e.dataTransfer.dropEffect = 'move';
		const targetIndex = parseInt(this.dataset.handIndex, 10);
		if (dragSrcIndex === null || targetIndex === dragSrcIndex) return;

		getWraps().forEach(w => w.classList.remove('hand-card--drop-left', 'hand-card--drop-right'));
		const rect = this.getBoundingClientRect();
		if (e.clientX < rect.left + rect.width / 2) {
			this.classList.add('hand-card--drop-left');
		} else {
			this.classList.add('hand-card--drop-right');
		}
	}

	function onDragLeave(e) {
		if (!this.contains(e.relatedTarget)) {
			this.classList.remove('hand-card--drop-left', 'hand-card--drop-right');
		}
	}

	function onDrop(e) {
		e.preventDefault();
		const targetIndex = parseInt(this.dataset.handIndex, 10);
		if (dragSrcIndex === null || targetIndex === dragSrcIndex) return;

		const dragged = container.querySelector(`[data-hand-index="${dragSrcIndex}"]`);
		const rect = this.getBoundingClientRect();
		const insertBefore = e.clientX < rect.left + rect.width / 2;

		if (insertBefore) {
			container.insertBefore(dragged, this);
		} else {
			container.insertBefore(dragged, this.nextSibling);
		}

		getWraps().forEach(w => w.classList.remove('hand-card--drop-left', 'hand-card--drop-right'));
		applyFanLayout(container);
	}

	function onDragEnd() {
		this.classList.remove('hand-card--dragging');
		getWraps().forEach(w => w.classList.remove('hand-card--drop-left', 'hand-card--drop-right'));
		dragSrcIndex = null;
	}

	getWraps().forEach(attachTo);
}
