import {
	animateCardDamage,
	animateCardPlay,
	animateLevelUp,
	showMPFloat,
} from './boardRenderer.js';

export function prefersReducedMotion() {
	return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true;
}

export function animateStateDelta(beforeState, afterState, options = {}) {
	if (prefersReducedMotion() || !beforeState || !afterState) return;

	requestAnimationFrame(() => {
		animateMosjeDeltas(beforeState, afterState, options);
		animateNewFieldCards(beforeState, afterState, options);
	});
}

export function animateFieldActivation({ zone = 'piecie', playerId, slotIndex, cardId } = {}) {
	if (prefersReducedMotion()) return;
	const cardEl = selectFieldElement(zone, playerId, slotIndex) || selectByCardId(cardId, playerId);
	if (!cardEl) return;

	cardEl.classList.add('card-activating');
	cardEl.addEventListener('animationend', () => cardEl.classList.remove('card-activating'), { once: true });
	showActivationBurst(cardEl);
}

export function showTurnTransition({ playerName, turnNumber, type } = {}) {
	if (prefersReducedMotion()) return;

	const banner = document.createElement('div');
	banner.className = `turn-transition turn-transition--${type || 'start'}`;
	const safeName = playerName || 'Player';
	banner.textContent = type === 'end'
		? `${safeName} ended turn`
		: `${safeName}'s turn${turnNumber ? ` - Turn ${turnNumber}` : ''}`;

	document.body.appendChild(banner);
	banner.addEventListener('animationend', () => banner.remove(), { once: true });
}

function animateMosjeDeltas(beforeState, afterState, options = {}) {
	const isQuestOutcome = String(options.actionLabel || '').includes('quest');
	for (const [playerId, afterPlayer] of Object.entries(afterState.players || {})) {
		const beforePlayer = beforeState.players?.[playerId];
		if (!beforePlayer || !Array.isArray(afterPlayer.activeSlots)) continue;

		afterPlayer.activeSlots.forEach((afterSlot, slotIndex) => {
			if (!afterSlot) return;
			const beforeSlot = beforePlayer.activeSlots?.[slotIndex];
			const cardEl = selectFieldElement('mosje', playerId, slotIndex);
			if (!cardEl) return;

			if (!beforeSlot) {
				animateCardPlay(cardEl);
				return;
			}

			const levelIncreased = Number(afterSlot.level || 0) > Number(beforeSlot.level || 0);
			const mpDelta = Number(afterSlot.mp || 0) - Number(beforeSlot.mp || 0);
			const isLevelReset = levelIncreased && mpDelta < 0;
			if (mpDelta !== 0 && !isLevelReset) {
				showMPFloat(cardEl, mpDelta, { emphasis: isQuestOutcome && mpDelta > 0 ? 'huge' : undefined });
				if (mpDelta < 0) animateCardDamage(cardEl);
			}

			if (levelIncreased) {
				animateLevelUp(cardEl);
			}
		});
	}
}

function showActivationBurst(cardEl) {
	const rect = cardEl.getBoundingClientRect();
	const burst = document.createElement('div');
	burst.className = 'card-activation-burst';
	burst.style.left = `${rect.left + rect.width / 2}px`;
	burst.style.top = `${rect.top + rect.height / 2}px`;
	burst.style.width = `${rect.width}px`;
	burst.style.height = `${rect.height}px`;
	document.body.appendChild(burst);
	burst.addEventListener('animationend', () => burst.remove(), { once: true });
}

function animateNewFieldCards(beforeState, afterState, options = {}) {
	for (const [playerId, afterPlayer] of Object.entries(afterState.players || {})) {
		const beforePlayer = beforeState.players?.[playerId];
		if (!beforePlayer) continue;

		afterPlayer.piecieSlots?.forEach((afterSlot, slotIndex) => {
			if (!afterSlot || beforePlayer.piecieSlots?.[slotIndex]) return;
			const target = selectFieldElement('piecie', playerId, slotIndex)
				|| selectByCardId(afterSlot.cardId, playerId);
			if (target) animateCardPlay(target);
		});
	}

	if (afterState.activePlace && afterState.activePlace !== beforeState.activePlace) {
		const placeOwner = afterState.activePlacePlayedBy || options.actorId || options.localPlayerId;
		const placeEl = selectFieldElement('place', placeOwner);
		if (placeEl) animateCardPlay(placeEl);
	}
}

function selectFieldElement(zone, playerId, slotIndex) {
	const parts = [`[data-zone="${cssEscape(zone)}"]`];
	if (playerId) parts.push(`[data-player-id="${cssEscape(playerId)}"]`);
	if (slotIndex !== undefined && slotIndex !== null) {
		parts.push(`[data-slot-index="${cssEscape(String(slotIndex))}"]`);
	}
	return document.querySelector(parts.join(''));
}

function selectByCardId(cardId, playerId) {
	if (!cardId) return null;
	const playerSelector = playerId ? `[data-player-id="${cssEscape(playerId)}"]` : '';
	return document.querySelector(`[data-card-id="${cssEscape(cardId)}"]${playerSelector}`);
}

function cssEscape(value) {
	return window.CSS?.escape ? window.CSS.escape(String(value)) : String(value).replaceAll('"', '\\"');
}
