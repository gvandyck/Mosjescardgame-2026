import {
	animateCardDamage,
	animateCardPlay,
	animateLevelUp,
	showMPFloat,
} from './boardRenderer.js';

export function prefersReducedMotion() {
	return window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true;
}

// main.js wires this once so the ability chip can show the real ability name
// (e.g. "Party Power") rather than a generic label.
let abilityNameResolver = null;
export function setAbilityNameResolver(fn) {
	abilityNameResolver = typeof fn === 'function' ? fn : null;
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

	// Mosje ability → a distinct, type-coloured "cast" (ring + glow + chip) so a
	// fired ability is instantly recognizable, not just a green +MP number.
	if (zone === 'mosje') {
		castAbilityEffect(cardEl, cardId);
		return;
	}

	cardEl.classList.add('card-activating');
	cardEl.addEventListener('animationend', () => cardEl.classList.remove('card-activating'), { once: true });
	showActivationBurst(cardEl);
}

// Fighting=red, Digital=blue, Artistic=purple — read from the card's subtype class.
function abilityTypeOf(cardEl) {
	for (const c of cardEl.classList) {
		if (c.startsWith('mosje-subtype-')) return c.slice('mosje-subtype-'.length);
	}
	return 'fighting';
}

function castAbilityEffect(cardEl, cardId) {
	const type = abilityTypeOf(cardEl);
	const name = (abilityNameResolver && abilityNameResolver(cardId)) || 'Ability';
	cardEl.classList.add('ability-casting', `ability-casting--${type}`);
	cardEl.addEventListener('animationend', () => {
		cardEl.classList.remove('ability-casting', `ability-casting--${type}`);
	}, { once: true });

	const rect = cardEl.getBoundingClientRect();
	const cx = rect.left + rect.width / 2;

	const ring = document.createElement('div');
	ring.className = `cast-ring cast-ring--${type}`;
	ring.style.left = `${cx}px`;
	ring.style.top = `${rect.top + rect.height / 2}px`;
	document.body.appendChild(ring);
	ring.addEventListener('animationend', () => ring.remove(), { once: true });

	const chip = document.createElement('div');
	chip.className = `cast-chip cast-chip--${type}`;
	chip.textContent = `⚡ ${name}`;
	chip.style.left = `${cx}px`;
	// Anchor BELOW the card so it doesn't collide with the +MP float (which rises
	// from the card's top-centre).
	chip.style.top = `${rect.bottom}px`;
	document.body.appendChild(chip);
	chip.addEventListener('animationend', () => chip.remove(), { once: true });
}

// Quest outcome on a Mosje: green flash + ✓ pop (success) or red shake + ✗ pop (fail).
// Distinct from the generic +MP float so success vs fail is unmistakable.
export function animateQuestResult({ playerId, slotIndex, success } = {}) {
	if (prefersReducedMotion()) return;
	const cardEl = selectFieldElement('mosje', playerId, slotIndex);
	if (!cardEl) return;

	// Border afterglow as a CHILD overlay of the card (inset: 0) so it inherits the
	// card's exact position + rotation — no coordinate maths, always aligned.
	if (getComputedStyle(cardEl).position === 'static') cardEl.style.position = 'relative';
	// Recolour the card's own border for the duration (it's the gold .card--mosje
	// border; a class override isn't clipped). The overlay below adds the soft halo.
	const borderCls = success ? 'quest-border-success' : 'quest-border-fail';
	cardEl.classList.add(borderCls);

	const glow = document.createElement('div');
	glow.className = `quest-glow quest-glow--${success ? 'success' : 'fail'}`;
	cardEl.appendChild(glow);
	glow.addEventListener('animationend', () => {
		glow.remove();
		cardEl.classList.remove(borderCls);
	}, { once: true });

	// Fail also gets a quick shake on the card (transform isn't clipped).
	if (!success) {
		cardEl.classList.add('quest-fail-shake');
		cardEl.addEventListener('animationend', (e) => {
			if (e.animationName === 'quest-fail-shake') cardEl.classList.remove('quest-fail-shake');
		});
	}

	const rect = cardEl.getBoundingClientRect();
	const badge = document.createElement('div');
	badge.className = `quest-badge quest-badge--${success ? 'success' : 'fail'}`;
	badge.textContent = success ? '✓' : '✗';
	badge.style.left = `${rect.left + rect.width / 2}px`;
	badge.style.top = `${rect.top + rect.height / 2}px`;
	document.body.appendChild(badge);
	badge.addEventListener('animationend', () => badge.remove(), { once: true });
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
