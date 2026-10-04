import {
	animateCardDamage,
	animateCardPlay,
	animateLevelUp,
	showMPFloat,
} from './boardRenderer.js';
import { showCardSpotlight, addSpotlightEffects, isSpotlightActive } from './cardSpotlight.js';

export { isSpotlightActive };

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
		const effects = [...(options.extraEffects || []), ...collectEffects(beforeState, afterState, options)];
		animateMosjeDeltas(beforeState, afterState, options);
		animateNewFieldCards(beforeState, afterState, options);
		spotlightDelta(beforeState, afterState, effects, options);
	});
}

// Snelle flags → spotlight row. kind 'shield' = defensive, 'info' = buff/utility.
const FLAG_ROWS = {
	negateNextPiecie:      { text: '🛡 Shield up', sub: 'Next Piecie negated', kind: 'shield' },
	negateNextAttack:      { text: '🛡 Shield up', sub: 'Next attack negated', kind: 'shield' },
	negateNextSearch:      { text: '🛡 Shield up', sub: 'Next search negated', kind: 'shield' },
	negateNextElimination: { text: '🛡 Shield up', sub: 'Next elimination negated', kind: 'shield' },
	drainReversal:         { text: '🛡 Reversal set', sub: 'Next drain is reversed', kind: 'shield' },
	mpLossReduction:       { text: '🛡 Protected', sub: 'Next MP loss reduced', kind: 'shield' },
	counterChain:          { text: '⛓ Counter!', sub: 'Counter chain started', kind: 'info' },
	forceReroll:           { text: '🎲 Reroll', sub: 'Dice must be rerolled', kind: 'info' },
	questDiceBonus:        { text: '🎲 +1 Quest roll', sub: 'Next Quest roll', kind: 'info' },
	doubleNextPiecie:      { text: '✨ Double', sub: 'Next Piecie triggers twice', kind: 'info' },
	copyLastPiecie:        { text: '✨ Copy', sub: 'Copies last Piecie', kind: 'info' },
};

// A heart only means a heal; quest rewards and turn-start passives get their own label.
function gainIcon(actionLabel = '') {
	if (actionLabel.includes('quest')) return '★';
	if (actionLabel.startsWith('turn')) return '✦';
	return '♥';
}
function gainSub(actionLabel = '', name) {
	if (actionLabel.includes('quest')) return `Quest reward · ${name}`;
	if (actionLabel.startsWith('turn')) return `Passive · ${name}`;
	return name;
}

const ACTIVATION_LABELS = new Set(['activate-piecie', 'activate-place', 'mosje-ability', 'play-snelle', 'play-piecie', 'play-place']);

function shortName(slot) {
	return String(slot.name || slot.cardId).replace(/^\[[^\]]*\]\s*/, '');
}

function flagKeys(state) {
	const keys = new Set();
	for (const [flag, value] of Object.entries(state._snelleFlags || {})) {
		if (!FLAG_ROWS[flag] || !value) continue;
		if (typeof value === 'object') {
			for (const pid of Object.keys(value)) if (value[pid]) keys.add(`${flag}|${pid}`);
		} else {
			keys.add(`${flag}|${value}`);
		}
	}
	return keys;
}

// State changes across every Mosje as spotlight rows: damage (MP lost), heal
// (MP gained), shield (immunity / entry protection / prevented damage / negate flags).
function collectEffects(beforeState, afterState, options = {}) {
	const effects = [];
	for (const [playerId, afterPlayer] of Object.entries(afterState.players || {})) {
		const beforePlayer = beforeState.players?.[playerId];
		afterPlayer.activeSlots?.forEach((slot, i) => {
			const prev = beforePlayer?.activeSlots?.[i];
			if (!slot || !prev || slot.cardId !== prev.cardId) return;
			const sub = shortName(slot);
			const delta = Number(slot.mp || 0) - Number(prev.mp || 0);
			if (delta !== 0 && !(Number(slot.level || 0) > Number(prev.level || 0))) {
				effects.push(delta > 0
					? { text: `${gainIcon(options.actionLabel)} +${delta} MP`, kind: 'gain', sub: gainSub(options.actionLabel, sub) }
					: { text: `⚔ −${Math.abs(delta)} MP`, kind: 'loss', sub });
			}
			if (slot.immuneThisTurn && !prev.immuneThisTurn) effects.push({ text: '🛡 Immune', kind: 'shield', sub });
			if (slot.entryProtected && !prev.entryProtected) effects.push({ text: '🛡 Protected', kind: 'shield', sub });
			const blocked = Number(slot._coertsCaravanQuestShield?.used || 0) - Number(prev._coertsCaravanQuestShield?.used || 0);
			if (blocked > 0) effects.push({ text: `🛡 Blocked ${blocked}`, kind: 'shield', sub });
		});
	}
	const before = flagKeys(beforeState);
	const after = flagKeys(afterState);
	for (const key of after) {
		if (before.has(key)) continue;
		const row = FLAG_ROWS[key.split('|')[0]];
		effects.push({ text: row.text, kind: row.kind, sub: row.sub });
	}
	for (const key of before) {
		if (after.has(key)) continue;
		const flag = key.split('|')[0];
		if (FLAG_ROWS[flag].kind === 'shield') effects.push({ text: '🛡 Negated!', kind: 'shield', sub: FLAG_ROWS[flag].sub });
	}

	// Cards drawn / returned. A Snelle leaves the actor's hand, so add it back to the net change.
	for (const [playerId, afterPlayer] of Object.entries(afterState.players || {})) {
		const beforePlayer = beforeState.players?.[playerId];
		if (!beforePlayer || !Array.isArray(afterPlayer.hand)) continue;
		const playedFromHand = (options.actionLabel === 'play-snelle' && playerId === options.actorId) ? 1 : 0;
		const handGain = afterPlayer.hand.length - beforePlayer.hand.length + playedFromHand;
		const graveLoss = (beforePlayer.graveyard?.length || 0) - (afterPlayer.graveyard?.length || 0);
		if (handGain <= 0) continue;
		effects.push(graveLoss > 0
			? { text: '♻ Returned to hand', kind: 'info', sub: `${handGain} card${handGain > 1 ? 's' : ''} from graveyard` }
			: { text: `🃏 Draw ${handGain}`, kind: 'info', sub: playerId === options.localPlayerId ? 'You' : 'Opponent' });
	}
	return effects;
}

// A newly placed card gets its own spotlight; otherwise effects join the one an
// ability activation already opened.
function spotlightDelta(beforeState, afterState, effects, options = {}) {
	// Snelle instants leave no field card — spotlight the played card itself.
	if (!effects.length && ACTIVATION_LABELS.has(options.actionLabel)) {
		effects = [{ text: '✨ Activated', kind: 'info', sub: 'Effect resolved' }];
	}
	if (options.actionLabel === 'play-snelle' && options.placedCardId) {
		showCardSpotlight({ cardId: options.placedCardId, source: null, effects });
		return;
	}
	for (const [playerId, afterPlayer] of Object.entries(afterState.players || {})) {
		const beforePlayer = beforeState.players?.[playerId];
		if (!beforePlayer) continue;
		const placed = [];
		afterPlayer.activeSlots?.forEach((s, i) => {
			if (s && !beforePlayer.activeSlots?.[i]) placed.push({ cardId: s.cardId, zone: 'mosje', slotIndex: i });
		});
		afterPlayer.piecieSlots?.forEach((s, i) => {
			if (s && !beforePlayer.piecieSlots?.[i] && !s.faceDown) placed.push({ cardId: s.cardId, zone: 'piecie', slotIndex: i });
		});
		// Bot actions never go through animateFieldActivation, so spot reveals/activations
		// from the state diff (a face-down Piecie is only revealed once it activates).
		if (!placed.length && options.isBotStep) {
			afterPlayer.piecieSlots?.forEach((s, i) => {
				const prev = beforePlayer.piecieSlots?.[i];
				if (s && prev && s.activated && !prev.activated) placed.push({ cardId: s.cardId, zone: 'piecie', slotIndex: i });
			});
			afterPlayer.activeSlots?.forEach((s, i) => {
				const prev = beforePlayer.activeSlots?.[i];
				if (s && prev && s.abilityUsedThisTurn && !prev.abilityUsedThisTurn) placed.push({ cardId: s.cardId, zone: 'mosje', slotIndex: i });
			});
			if (afterState.activePlace && afterState.activePlace !== beforeState.activePlace
				&& (afterState.activePlacePlayedBy || playerId) === playerId) {
				placed.push({ cardId: afterState.activePlace, zone: 'place' });
			}
		}
		if (placed.length) {
			const p = placed[0];
			showCardSpotlight({ cardId: p.cardId, source: { zone: p.zone, playerId, slotIndex: p.slotIndex }, effects });
			return;
		}
	}
	if (effects.length) addSpotlightEffects(effects);
}

export function animateFieldActivation({ zone = 'piecie', playerId, slotIndex, cardId, colorCategory } = {}) {
	if (prefersReducedMotion()) return;
	const cardEl = selectFieldElement(zone, playerId, slotIndex) || selectByCardId(cardId, playerId);
	if (!cardEl) return;
	showCardSpotlight({ cardId, source: { el: cardEl, zone, playerId, slotIndex } });

	// Mosje ability → a distinct, type-coloured "cast" (border + glow + ring + chip).
	// Callers fire this BEFORE the board re-renders, which would wipe a class/child on
	// the card — so defer to the next frame and re-select the freshly rendered card.
	if (zone === 'mosje') {
		requestAnimationFrame(() => {
			const fresh = selectFieldElement('mosje', playerId, slotIndex) || selectByCardId(cardId, playerId);
			if (fresh) castAbilityEffect(fresh, cardId);
		});
		return;
	}

	cardEl.classList.add('card-activating');
	cardEl.addEventListener('animationend', () => cardEl.classList.remove('card-activating'), { once: true });
	showActivationBurst(cardEl, CATEGORY_GLOW[colorCategory || zone] || CATEGORY_GLOW.piecie);
}

// Activation effect colour matches the card's category frame colour.
const CATEGORY_GLOW = {
	piecie: 'rgba(61, 142, 245, 0.85)',   // blue
	snelle: 'rgba(125, 211, 252, 0.9)',   // light sky-blue — a piecie sub-shade (not red)
	place:  'rgba(61, 214, 140, 0.85)',   // green
	mosje:  'rgba(232, 185, 79, 0.85)',   // gold
	quest:  'rgba(168, 85, 247, 0.85)',   // purple
};

function castAbilityEffect(cardEl, cardId) {
	// Ability casts use the Mosje category colour (gold), matching the frame scheme.
	const type = 'mosje';
	const name = (abilityNameResolver && abilityNameResolver(cardId)) || 'Ability';

	// Recolour the card border to the type colour + add a soft glow halo as a child
	// overlay (not clipped), mirroring the quest effect.
	if (getComputedStyle(cardEl).position === 'static') cardEl.style.position = 'relative';
	cardEl.classList.add(`ability-casting--${type}`);
	const glow = document.createElement('div');
	glow.className = `cast-glow cast-glow--${type}`;
	cardEl.appendChild(glow);
	glow.addEventListener('animationend', () => {
		glow.remove();
		cardEl.classList.remove(`ability-casting--${type}`);
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

// Generic self-removing center banner. One place owns the append + animationend teardown;
// callers just supply a class and inner HTML. (showTurnTransition may later adopt this.)
function createCenterBanner(className, innerHTML) {
	const banner = document.createElement('div');
	banner.className = className;
	banner.innerHTML = innerHTML;
	document.body.appendChild(banner);
	banner.addEventListener('animationend', () => banner.remove(), { once: true });
	return banner;
}

// Deck-out "recycle" notice. Essential info, so it shows even under reduced motion
// (CSS gives a plain fade there). Highlights the affected discard pile via callback.
export function showDeckOutBanner({ playerName, onPileHighlight } = {}) {
	const name = playerName || 'Player';
	createCenterBanner(
		'deckout-banner',
		`<span class="deckout-banner__title">&#9851; DECK RECYCLED</span>
		 <span class="deckout-banner__body">${escapeText(name)}'s deck ran out — discard reshuffled into a new deck. Skips next turn (1-turn cooldown).</span>`
	);
	if (typeof onPileHighlight === 'function') onPileHighlight();
}

// Flash the recycled player's piles so the board change is obvious: the graveyard empties
// and the deck refills, so pulse BOTH (deck on top, discard under).
export function pulseDiscardPile(deckOutPlayerId, localPlayerId) {
	const suffix = deckOutPlayerId === localPlayerId ? 'player' : 'opponent';
	for (const sel of [`#discard-${suffix}`, `#deck-${suffix}`]) {
		const el = document.querySelector(sel);
		if (!el) continue;
		el.classList.add('discard-pile--recycling');
		el.addEventListener('animationend', () => el.classList.remove('discard-pile--recycling'), { once: true });
	}
}

// Minimal HTML-escape for the interpolated player name (names are user-set).
function escapeText(s) {
	return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Colour flash on the board tile itself (heal green / shield blue); damage keeps its shake.
function flashBoardCard(cardEl, kind) {
	if (!cardEl) return;
	const cls = `fx-flash--${kind}`;
	cardEl.classList.remove(cls);
	void cardEl.offsetWidth;
	cardEl.classList.add(cls);
	cardEl.addEventListener('animationend', () => cardEl.classList.remove(cls), { once: true });
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
				else flashBoardCard(cardEl, 'gain');
			}
			const gotShield = (afterSlot.immuneThisTurn && !beforeSlot.immuneThisTurn)
				|| (afterSlot.entryProtected && !beforeSlot.entryProtected)
				|| Number(afterSlot._coertsCaravanQuestShield?.used || 0) > Number(beforeSlot._coertsCaravanQuestShield?.used || 0);
			if (gotShield) flashBoardCard(cardEl, 'shield');

			if (levelIncreased) {
				animateLevelUp(cardEl);
			}
		});
	}
}

// Instant cards (Snelle Piecies) leave no field card — show a category-coloured
// burst centred on the play area instead.
export function showInstantEffect(category = 'snelle') {
	if (prefersReducedMotion()) return;
	const color = CATEGORY_GLOW[category] || CATEGORY_GLOW.snelle;
	const burst = document.createElement('div');
	burst.className = 'card-activation-burst';
	burst.style.setProperty('--burst', color);
	const zone = document.getElementById('zone-player') || document.body;
	const rect = zone.getBoundingClientRect();
	burst.style.left = `${rect.left + rect.width / 2}px`;
	burst.style.top = `${rect.top + rect.height / 2}px`;
	burst.style.width = '240px';
	burst.style.height = '320px';
	document.body.appendChild(burst);
	burst.addEventListener('animationend', () => burst.remove(), { once: true });
}

function showActivationBurst(cardEl, color = 'rgba(232, 185, 79, 0.85)') {
	const rect = cardEl.getBoundingClientRect();
	const burst = document.createElement('div');
	burst.className = 'card-activation-burst';
	burst.style.setProperty('--burst', color);
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
