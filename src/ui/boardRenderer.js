// boardRenderer.js — Draws the full game board (both players' zones,
// the middle strip with the active Place and the Quest stacks) by generating HTML from the game state.
// Filled in Phase 5.

import { renderCard } from './cardRenderer.js';
import { markEnteringCards } from './markEnteringCards.js';
import { getCardById } from '../data/cardIndex.js';
import { initModalManager } from './modalManager.js';
import { renderQuestStacks } from './renderQuestStacks.js';
import { MOSJE_ABILITY_RULES } from '../rules/mosjeAbilityRules.js';
import { buildBoardSkeleton } from './board/buildBoardSkeleton.js';
import { fillSlotOutlines } from './board/fillSlotOutlines.js';
import { getFieldSlots } from './board/getFieldSlots.js';
import { buildEnergyCrystals } from './board/buildEnergyCrystals.js';
import { buildWelloePile } from './board/buildWelloePile.js';
import { renderPlaceTile } from './board/renderPlaceTile.js';
import { getTileBadges } from './board/getTileBadges.js';
import { buildTileBadges } from './board/buildTileBadges.js';
import { showToast } from './board/showToast.js';
import { bindTileTap } from './board/bindTileTap.js';

const PIECIE_SLOTS = 3; // 2.0: 3 Piecie slots per player (mirrors tableRules)
const MOSJE_SLOTS = 2; // 2.0: 2 Mosje slots per player

console.log('[UI] boardRenderer.js loaded');

let _boardModal = null;
// Last Energy drawn per player id: buildEnergyCrystals compares against it to animate gained / spent gems (D-12).
const _lastEnergy = new Map();

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

// extras.endTurnButton: the #btn-end-turn node (kept by main.js so its listener survives every re-render); it is
// moved into the middle strip of the board (D-07, D-08).
export function renderBoard(container, viewModel, onUseAbility = null, onReturnToHand = null, onActivatePiecie = null, onOpenDiscard = null, onPlayFromHand = null, extras = {}) {
	if (!container) return;
	console.log('[UI] Rendering board view');

	const endTurnHadFocus = !!extras.endTurnButton && document.activeElement === extras.endTurnButton;
	container.setAttribute('data-board', 'obby-2');
	container.innerHTML = buildBoardSkeleton({
		topName: viewModel.players.top.name,
		bottomName: viewModel.players.bottom.name,
	});

	renderModifierBar(container.querySelector('#modifier-bar-opponent'), viewModel.players.top.activeModifiers);
	renderModifierBar(container.querySelector('#modifier-bar-player'), viewModel.players.bottom.activeModifiers);

	const topZone = container.querySelector('#zone-opponent');
	const bottomZone = container.querySelector('#zone-player');
	const topPiecies = container.querySelector('#piecies-opponent');
	const bottomPiecies = container.querySelector('#piecies-player');
	const topDiscard = container.querySelector('#discard-opponent');
	const bottomDiscard = container.querySelector('#discard-player');
	const topDeck = container.querySelector('#deck-opponent');
	const bottomDeck = container.querySelector('#deck-player');

	for (const mosje of viewModel.players.top.mosjes) {
		const cardEl = renderCard(mosje, { compact: true, fieldMode: true });
		const fullCard = getCardById(mosje.cardId) || mosje;
		cardEl.classList.add('mosje-clickable', 'mosje-card--opponent');
		if (mosje.summonedByPiecie === 'piecie_call_of_welloes') cardEl.classList.add('mosje--welloe-bound');
		appendTileState(cardEl, mosje);
		tagBoardElement(cardEl, {
			zone: 'mosje',
			playerId: viewModel.players.top.id,
			slotIndex: mosje.slotIndex,
			cardId: mosje.cardId,
		});
		bindTileTap(cardEl, { kind: 'mosje', owner: 'opponent', playerId: viewModel.players.top.id, slotIndex: mosje.slotIndex, cardId: mosje.cardId },
			() => getBoardModal().showMosjeDetailModal({ ...fullCard, ...mosje }), extras.onTileTap);
		topZone?.appendChild(cardEl);
	}

	for (const mosje of viewModel.players.bottom.mosjes) {
		const cardEl = renderCard(mosje, {
			compact: true,
			fieldMode: true,
			owned: true,
			gameState: viewModel.gameState || null,
			viewingPlayerId: viewModel.myPlayerId || null,
		});
		const fullCard = getCardById(mosje.cardId) || mosje;
		cardEl.classList.add('mosje-clickable', 'mosje-card--owned');
		if (mosje.summonedByPiecie === 'piecie_call_of_welloes') cardEl.classList.add('mosje--welloe-bound');
		appendTileState(cardEl, mosje);
		tagBoardElement(cardEl, {
			zone: 'mosje',
			playerId: viewModel.players.bottom.id,
			slotIndex: mosje.slotIndex,
			cardId: mosje.cardId,
		});
		bindTileTap(cardEl, { kind: 'mosje', owner: 'own', playerId: viewModel.players.bottom.id, slotIndex: mosje.slotIndex, cardId: mosje.cardId },
			() => getBoardModal().showMosjeDetailModal({ ...fullCard, ...mosje }), extras.onTileTap);

		// 2.0: the button comes from the ability rules (activated, not a draw-step one); hidden V4 Mosjes keep the old rule.
		const abilityRule = MOSJE_ABILITY_RULES[fullCard.abilityId];
		const showAbilityBtn = abilityRule ? (abilityRule.kind === 'activated' && !abilityRule.drawStep && !abilityRule.reactive) : !fullCard.autoAbility;
		if (onUseAbility && !mosje.isDefeated && mosje.cardId && showAbilityBtn) {
			const wrongTurn = abilityRule?.ownTurnOnly !== false && viewModel.gameState?.activePlayerId !== viewModel.myPlayerId;
			const isUsed = mosje.abilityUsedThisTurn || (abilityRule?.per === 'game' && mosje.abilityUsedThisGame);
			const costLabel = mosje.abilityCost > 0 ? ` ${mosje.abilityCost} Energy` : '';
			let tooltip;
			if (wrongTurn) tooltip = 'You can only use this on your own turn';
			else if (!isUsed && mosje.cantAffordAbility) tooltip = `Not enough Energy (need ${mosje.abilityCost})`;
			else if (isUsed) tooltip = 'Ability already used this turn';
			else tooltip = `Use ability${costLabel ? ` (costs ${mosje.abilityCost} Energy)` : ''}`;

			const btn = document.createElement('button');
			btn.className = 'mosje-ability-btn' + (isUsed ? ' mosje-ability-btn--used' : '');
			btn.textContent = `⚡ Activate${costLabel ? ` · ${mosje.abilityCost} Energy` : ''}`;
			btn.title = tooltip;
			btn.setAttribute('aria-label', tooltip);
			btn.disabled = wrongTurn || isUsed || (mosje.cantAffordAbility ?? false);
			btn.addEventListener('click', (event) => {
				event.stopPropagation();
				onUseAbility(mosje.cardId);
			});
			// Own Mosjes: place the full-width ability button BELOW the description
			// meta block (inside the card foot) so description sits on top and the
			// button bottom-anchors, with breathing space between them.
			const foot = cardEl.querySelector('.uc-foot');
			if (foot) foot.appendChild(btn);
			else cardEl.appendChild(btn);
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

	for (const piecie of (viewModel.players.top.piecies || []).slice(0, PIECIE_SLOTS)) {
		if (piecie.faceDown) {
			const slot = document.createElement('div');
			slot.className = 'piecie-slot face-down-piecie has-card';
			tagBoardElement(slot, {
				zone: 'piecie',
				playerId: viewModel.players.top.id,
				slotIndex: piecie.slotIndex,
				faceDown: true,
			});
			topPiecies?.appendChild(slot);
			continue;
		}
		const piecieEl = renderCard(piecie, { compact: true, fieldMode: true });
		piecieEl.classList.add('field-piecie-card', 'card--previewable');
		if (piecie.linkedMosjeCardId) piecieEl.classList.add('piecie--welloe-anchor');
		tagBoardElement(piecieEl, {
			zone: 'piecie',
			playerId: viewModel.players.top.id,
			slotIndex: piecie.slotIndex,
			cardId: piecie.cardId,
		});
		const fullPiecie = getCardById(piecie.cardId) || piecie;
		const mergedPiecie = { ...fullPiecie, ...piecie };
		bindTileTap(piecieEl, { kind: 'piecie', owner: 'opponent', playerId: viewModel.players.top.id, slotIndex: piecie.slotIndex, cardId: piecie.cardId },
			() => getBoardModal().showDeckBuilderCardPreview(mergedPiecie), extras.onTileTap);
		topPiecies?.appendChild(piecieEl);
	}

	for (const piecie of (viewModel.players.bottom.piecies || []).slice(0, PIECIE_SLOTS)) {
		if (piecie.faceDown) {
			const slot = document.createElement('div');
			slot.className = 'piecie-slot face-down-piecie has-card';
			tagBoardElement(slot, {
				zone: 'piecie',
				playerId: viewModel.players.bottom.id,
				slotIndex: piecie.slotIndex,
				cardId: piecie.cardId,
				faceDown: true,
			});
			const fullFaceDown = getCardById(piecie.cardId) || piecie;
			slot.addEventListener('click', () => getBoardModal().showDeckBuilderCardPreview({ ...fullFaceDown, ...piecie }));
			bottomPiecies?.appendChild(slot);
			continue;
		}
		const piecieEl = renderCard(piecie, { compact: true, fieldMode: true });
		piecieEl.classList.add('field-piecie-card', 'card--previewable');
		if (piecie.linkedMosjeCardId) piecieEl.classList.add('piecie--welloe-anchor');
		tagBoardElement(piecieEl, {
			zone: 'piecie',
			playerId: viewModel.players.bottom.id,
			slotIndex: piecie.slotIndex,
			cardId: piecie.cardId,
		});
		const fullPiecieBottom = getCardById(piecie.cardId) || piecie;
		const mergedPiecieBottom = { ...fullPiecieBottom, ...piecie };
		bindTileTap(piecieEl, { kind: 'piecie', owner: 'own', playerId: viewModel.players.bottom.id, slotIndex: piecie.slotIndex, cardId: piecie.cardId },
			() => getBoardModal().showDeckBuilderCardPreview(mergedPiecieBottom), extras.onTileTap);

		// Add activate button for Piecies
		if (onActivatePiecie && piecie.canActivate && piecie.type === 'PIECIE') {
			const btn = document.createElement('button');
			btn.className = 'hand-card__play-btn';
			btn.type = 'button';
			btn.textContent = 'Activate';
			btn.addEventListener('click', (event) => {
				event.stopPropagation();
				onActivatePiecie(piecie.slotIndex);
			});
			piecieEl.appendChild(btn);
		}

		bottomPiecies?.appendChild(piecieEl);
	}

	// Render discard piles for both players
	const opponentPlayerId = Object.keys(viewModel.gameState?.players || {}).find(id => id !== viewModel.myPlayerId);
	const topPlayer = viewModel.players.top;
	const bottomPlayer = viewModel.players.bottom;

	// Draw piles (deck) sit ABOVE each player's graveyard in the pile column.
	// Only the local player (bottom) sees their own deck count; the opponent's is hidden.
	renderDeckPile(topDeck, topPlayer, false);
	renderDeckPile(bottomDeck, bottomPlayer, true);

	renderDiscardPile(topDiscard, topPlayer, viewModel.myPlayerId === opponentPlayerId, onOpenDiscard);
	renderDiscardPile(bottomDiscard, bottomPlayer, viewModel.myPlayerId === bottomPlayer.id, onOpenDiscard);

	// 2.0: Energy crystals at the left end of each row, the Welloe pile at the right end (only while it has cards).
	renderEnergy(container.querySelector('#energy-opponent'), topPlayer);
	renderEnergy(container.querySelector('#energy-player'), bottomPlayer);
	renderWelloe(container.querySelector('#welloe-opponent'), topPlayer, viewModel.myPlayerId === topPlayer.id);
	renderWelloe(container.querySelector('#welloe-player'), bottomPlayer, viewModel.myPlayerId === bottomPlayer.id);

	// 2.0 middle strip: the Place tile (left) and the 3 face-up Quests on their stacks (centre). A Quest tap goes to the
	// Quest-choosing flow when one is active (extras.onQuestTap returns true), otherwise it opens the Quest's detail view.
	// A Place tap goes through the controller too (the owner's tray is just Details); without one it opens the detail view.
	const openPlaceDetails = (place) => getBoardModal().showPlaceDetailModal(place);
	renderPlaceTile(container.querySelector('#board-place'), viewModel, (place) => {
		if (typeof extras.onTileTap !== 'function') return openPlaceDetails(place);
		const ownerId = viewModel.activePlacePlayedBy || null;
		extras.onTileTap({
			kind: 'place', owner: ownerId && ownerId === viewModel.myPlayerId ? 'own' : 'opponent', playerId: ownerId, slotIndex: null,
			cardId: place.cardId || place.id, el: container.querySelector('#board-place [data-zone="place"]'), openDetails: () => openPlaceDetails(place),
		});
	}, openPlaceDetails);
	renderQuestStacks(container.querySelector('#quest-stacks'), {
		questStacks: viewModel.questStacks,
		onTap: (stackId, questId) => extras.onQuestTap?.(stackId) || getBoardModal().showDeckBuilderCardPreview(getCardById(questId)),
	});

	if (viewModel.activeQuest?.revealOpponentHand && Array.isArray(viewModel.activeQuest?.revealedOpponentHandNames)) {
		getBoardModal().showOpponentHandRevealModal(viewModel.activeQuest.revealedOpponentHandNames);
		if (typeof viewModel.onClearRevealFlag === 'function') {
			viewModel.onClearRevealFlag();
		}
	}

	// Every row always shows its full 2 Mosje + 3 Piecie slots: dashed outlines fill the empty ones.
	for (const side of ['opponent', 'player']) {
		fillSlotOutlines(container.querySelector(`#zone-${side}`), 'mosje', MOSJE_SLOTS);
		fillSlotOutlines(container.querySelector(`#piecies-${side}`), 'piecie', PIECIE_SLOTS);
	}

	// End Turn lives in the middle strip now; the node (and its click listener) comes from main.js.
	if (extras.endTurnButton) {
		container.querySelector('#board-end-turn')?.appendChild(extras.endTurnButton);
		if (endTurnHadFocus) extras.endTurnButton.focus({ preventScroll: true }); // re-parenting drops focus; keep it for keyboard play
	}

	// Initialize drag-to-play drop zones (hand → field)
	initBoardDropZones(container, onPlayFromHand);

	// Initialize drag-to-scroll handlers for horizontal overflow areas
	const rows = container.querySelectorAll('.board-zone__row');
	rows.forEach(initDragScroll);
	markEnteringCards(container);
	// board-2-0.css sizes every tile from --field-slots: 7 columns, or 8 while either Welloe pile has cards (D-13).
	container.style.setProperty('--field-slots', String(getFieldSlots([viewModel.players.top, viewModel.players.bottom])));
}

function initBoardDropZones(container, onPlayFromHand) {
	if (!onPlayFromHand) return;

	const mosjeZone = container.querySelector('#zone-player');
	const piecieZone = container.querySelector('#piecies-player');

	for (const zone of [mosjeZone, piecieZone]) {
		if (!zone) continue;

		zone.addEventListener('dragover', (e) => {
			if (!document.body.dataset.draggingCardType) return;
			e.preventDefault();
			e.dataTransfer.dropEffect = 'move';
			zone.classList.add('drop-target--active');
		});

		zone.addEventListener('dragleave', (e) => {
			if (!zone.contains(e.relatedTarget)) {
				zone.classList.remove('drop-target--active');
			}
		});

		zone.addEventListener('drop', (e) => {
			e.preventDefault();
			zone.classList.remove('drop-target--active');
			let cardId, cardType;
			try {
				({ cardId, cardType } = JSON.parse(e.dataTransfer.getData('application/mosjes-card')));
			} catch {
				return;
			}
			if (cardId && cardType) onPlayFromHand(cardId, cardType);
		});
	}
}

function tagBoardElement(element, { zone, playerId, slotIndex, cardId, faceDown = false } = {}) {
	if (!element) return;
	if (zone) element.dataset.zone = zone;
	if (zone === 'mosje' || zone === 'piecie') element.dataset.slotKind = zone; // 63-01: the slot-outline fill and U12 read this
	if (playerId) element.dataset.playerId = playerId;
	if (slotIndex !== undefined && slotIndex !== null) element.dataset.slotIndex = String(slotIndex);
	if (cardId) element.dataset.cardId = cardId;
	if (faceDown) element.dataset.faceDown = 'true';
}

function initDragScroll(element) {
	let isDown = false;
	let startX = 0;
	let scrollLeft = 0;

	element.addEventListener('mousedown', (e) => {
		isDown = true;
		startX = e.pageX - element.offsetLeft;
		scrollLeft = element.scrollLeft;
		element.style.cursor = 'grabbing';
	});

	element.addEventListener('mouseleave', () => {
		isDown = false;
		element.style.cursor = 'grab';
	});

	element.addEventListener('mouseup', () => {
		isDown = false;
		element.style.cursor = 'grab';
	});

	element.addEventListener('mousemove', (e) => {
		if (!isDown) return;
		e.preventDefault();
		const x = e.pageX - element.offsetLeft;
		const walk = (x - startX) * 1.5;
		element.scrollLeft = scrollLeft - walk;
	});
}

// Shows a floating MP number above a card.
export function showMPFloat(cardEl, amount, options = {}) {
	if (!cardEl || !Number.isFinite(amount) || amount === 0) return;
	const float = document.createElement('div');
	float.className = `mp-float ${amount > 0 ? 'gain' : 'loss'}`;
	if (options.emphasis === 'big' || Math.abs(amount) >= 40) {
		float.classList.add('mp-float--big');
	}
	if (options.emphasis === 'huge' || Math.abs(amount) >= 60) {
		float.classList.add('mp-float--huge');
	}
	float.textContent = amount > 0 ? `+${amount}` : `${amount}`;

	const rect = cardEl.getBoundingClientRect();
	float.style.left = `${rect.left + rect.width / 2}px`;
	float.style.top = `${rect.top}px`;

	document.body.appendChild(float);
	float.addEventListener('animationend', () => float.remove(), { once: true });
}

// Triggers entry animation for a card newly placed on field.
export function animateCardPlay(cardEl) {
	if (!cardEl) return;
	cardEl.classList.add('just-played');
	cardEl.addEventListener('animationend', () => cardEl.classList.remove('just-played'), { once: true });
}

// Triggers damage shake animation on a Mosje card.
export function animateCardDamage(cardEl) {
	if (!cardEl) return;
	cardEl.classList.add('taking-damage');
	cardEl.addEventListener('animationend', () => cardEl.classList.remove('taking-damage'), { once: true });
}

// Triggers level up burst and center text effect.
export function animateLevelUp(cardEl) {
	if (!cardEl) return;
	cardEl.classList.add('level-up');
	cardEl.addEventListener('animationend', () => cardEl.classList.remove('level-up'), { once: true });

	const text = document.createElement('div');
	text.className = 'level-up-text';
	text.textContent = 'LEVEL UP!';
	text.style.left = '50%';
	text.style.top = '50%';
	document.body.appendChild(text);
	text.addEventListener('animationend', () => text.remove(), { once: true });
}

// Updates MP bar fill width, classes, and labels for a Mosje card by data-mosje-id.
export function updateMPBar(mosjeInstanceId, mp, level) {
	if (!mosjeInstanceId) return;
	const root = document.querySelector(`[data-mosje-id="${String(mosjeInstanceId)}"]`);
	const bar = root?.querySelector('.mp-bar-fill');
	if (!bar) return;

	const safeMp = Number.isFinite(mp) ? mp : 0;
	const pct = Math.max(0, Math.min(100, safeMp));
	bar.style.width = `${pct}%`;

	bar.classList.remove('mp-low', 'mp-mid', 'mp-high');
	if (pct < 30) bar.classList.add('mp-low');
	else if (pct < 70) bar.classList.add('mp-mid');
	else bar.classList.add('mp-high');

	const valueEl = bar.closest('.mp-bar-container')?.querySelector('.mp-bar-values');
	if (valueEl) valueEl.textContent = `${safeMp} / 100`;

	const levelEl = bar.closest('.mp-bar-container')?.querySelector('.mp-bar-level');
	if (levelEl) {
		const displayLevel = Math.max(1, Math.min(3, Number.isFinite(level) ? Number(level) : 1));
		levelEl.textContent = `LV.${displayLevel}`;
	}
}

export function showPlaceEffectBanner(placeName, effectSummary, phase) {
	const topbarFlow = document.getElementById('topbar-flow');
	if (!topbarFlow) return;

	const existing = topbarFlow.querySelector('.place-effect-banner');
	if (existing) existing.remove();

	const banner = document.createElement('div');
	banner.className = 'place-effect-banner';
	banner.innerHTML = `
		<span class="place-banner-name">📍 ${escapeHtml(placeName || 'Active Place')}</span>
		<span class="place-banner-effect">${escapeHtml(effectSummary || `Effect triggered (${phase || 'phase'})`)}</span>
	`;

	topbarFlow.appendChild(banner);
	setTimeout(() => {
		banner.classList.add('place-banner-fade');
		banner.addEventListener('transitionend', () => banner.remove(), { once: true });
	}, 2000);
}

// 63-04 tile states (D-15..D-17, UI-03): the sideways pose, the Level 3 hold glow and the badge pills (Fresh, Protected,
// SKIPS TURN, ACTED) on a Mosje tile. A pill is read by tap, Enter / Space or hover (title): the full reason in a toast, so
// hover is never the only way. The click stops here so it does not also open the detail view.
function appendTileState(cardEl, tile) {
	if (tile.isDefeated) return;
	if (tile.sideways) cardEl.classList.add('mosje-card--sideways');
	if (tile.level === 3) cardEl.classList.add('mosje-card--hold');
	const html = buildTileBadges(getTileBadges(tile));
	if (!html) return;
	cardEl.insertAdjacentHTML('beforeend', html);
	for (const badge of cardEl.querySelectorAll('.tile-badge')) {
		const read = (event) => { event.stopPropagation(); showToast(badge.dataset.reason); };
		badge.addEventListener('click', read);
		badge.addEventListener('keydown', (event) => {
			if (event.key !== 'Enter' && event.key !== ' ') return;
			event.preventDefault();
			read(event);
		});
	}
}

// Renders modifier pill badges into a .snelle-modifier-bar container.
// pills — array of { label: string, color: 'gold'|'teal'|'blue'|'purple'|'orange' }
function renderModifierBar(bar, pills) {
	if (!bar) return;
	bar.innerHTML = '';
	if (!Array.isArray(pills) || pills.length === 0) return;
	for (const pill of pills) {
		const span = document.createElement('span');
		span.className = `snelle-pill snelle-pill--${pill.color}`;
		span.textContent = pill.label;
		span.title = pill.label;
		bar.appendChild(span);
	}
}

// Renders a player's DRAW deck as a face-down stack.
// Mirrors renderDiscardPile's stacked visual but is not clickable (the deck is hidden)
// and sits above the graveyard in the pile column. Empty state = faint placeholder.
// isOwned=false (opponent) HIDES the count and uses a fixed stack height, so you can't
// tell or count how many cards they have left — deck-out stays a scary surprise.
function renderDeckPile(container, player, isOwned = false) {
	if (!container || !player) return;
	container.innerHTML = '';

	const deckCards = player.deck || [];
	const count = deckCards.length;
	// D-13 pile hooks. The opponent's deck size stays hidden, so it gets no data-count.
	container.setAttribute('data-pile', 'deck');
	container.setAttribute('data-slot-kind', 'pile');
	if (isOwned) container.setAttribute('data-count', String(count));

	if (count === 0) {
		const emptyPile = document.createElement('div');
		emptyPile.className = 'discard-pile deck-pile discard-pile--empty';
		emptyPile.innerHTML = `
			<div class="discard-pile__placeholder"></div>
			<div class="discard-pile__label">Deck</div>
		`;
		container.appendChild(emptyPile);
		return;
	}

	const pile = document.createElement('div');
	pile.className = 'discard-pile deck-pile discard-pile--has-cards';
	if (isOwned) pile.setAttribute('data-card-count', count);

	const pileStack = document.createElement('div');
	pileStack.className = 'discard-pile__stack';

	// Own deck: stack height hints at how many cards remain. Opponent deck: fixed height so
	// its size isn't inferable from the layer count either.
	const layerCount = isOwned ? Math.min(count, 5) : 4;
	const maxOffset = isOwned ? Math.min(count * 2, 8) : 6;

	for (let i = 0; i < layerCount; i++) {
		const cardLayer = document.createElement('div');
		cardLayer.className = 'discard-pile__card-layer';
		const offsetMultiplier = (i / Math.max(1, layerCount - 1)) * maxOffset;
		const rotation = (Math.random() - 0.5) * 8;
		cardLayer.style.transform = `translateY(${offsetMultiplier}px) translateX(${(Math.random() - 0.5) * 2}px) rotateZ(${rotation}deg)`;
		cardLayer.style.zIndex = i;
		pileStack.appendChild(cardLayer);
	}
	pile.appendChild(pileStack);

	// Count badge — OWN deck only. The opponent's remaining-card count stays hidden so you
	// can't count down to their deck-out.
	if (isOwned) {
		const badge = document.createElement('div');
		badge.className = 'discard-pile__count-badge';
		badge.textContent = `${count}`;
		pile.appendChild(badge);
	}

	const label = document.createElement('div');
	label.className = 'discard-pile__label';
	label.textContent = 'Deck';
	pile.appendChild(label);

	container.appendChild(pile);
}

// Renders a discard pile (Welloe) into a container.
// Shows top card face-up, count badge at 2+ cards, stacked visual effect.
// Empty state shows a faint placeholder.
function renderDiscardPile(container, player, isOwned, onOpenDiscard) {
	console.log('[UI] renderDiscardPile called for player:', player?.id, 'graveyard count:', player?.graveyard?.length);
	if (!container || !player) {
		console.warn('[UI] renderDiscardPile: container or player missing', !!container, !!player);
		return;
	}
	container.innerHTML = '';

	const discardCards = player.graveyard || [];
	const count = discardCards.length;
	container.setAttribute('data-pile', 'discard'); // D-13 pile hooks
	container.setAttribute('data-slot-kind', 'pile');
	container.setAttribute('data-count', String(count));

	if (count === 0) {
		// Empty state: faint outlined placeholder
		const emptyPile = document.createElement('div');
		emptyPile.className = 'discard-pile discard-pile--empty';
		emptyPile.innerHTML = `
			<div class="discard-pile__placeholder"></div>
		`;
		container.appendChild(emptyPile);
		return;
	}

	// Build stacked pile visual
	const pile = document.createElement('div');
	pile.className = 'discard-pile discard-pile--has-cards';
	pile.setAttribute('data-card-count', count);

	// Create pile stack container for layered cards
	const pileStack = document.createElement('div');
	pileStack.className = 'discard-pile__stack';

	// Generate card layers (show up to 5 layers, more cards = more offset)
	const layerCount = Math.min(count, 5);
	const maxOffset = Math.min(count * 2, 8); // Cap offset at 8px even if many cards

	for (let i = 0; i < layerCount; i++) {
		const cardLayer = document.createElement('div');
		cardLayer.className = 'discard-pile__card-layer';

		// Calculate position in pile (0 = bottom, layerCount-1 = top)
		const positionFromTop = i;
		const offsetMultiplier = (positionFromTop / Math.max(1, layerCount - 1)) * maxOffset;
		const rotation = (Math.random() - 0.5) * 8; // More extreme rotation ±4 degrees

		cardLayer.style.transform = `translateY(${offsetMultiplier}px) translateX(${(Math.random() - 0.5) * 2}px) rotateZ(${rotation}deg)`;
		cardLayer.style.zIndex = i;

		pileStack.appendChild(cardLayer);
	}

	pile.appendChild(pileStack);

	// Count badge for 2+ cards
	if (count >= 2) {
		const badge = document.createElement('div');
		badge.className = 'discard-pile__count-badge';
		badge.textContent = `${count}`;
		pile.appendChild(badge);
	}

	// Add label
	const label = document.createElement('div');
	label.className = 'discard-pile__label';
	label.textContent = 'Graveyard';
	pile.appendChild(label);

	// Click to open discard viewer
	pile.addEventListener('click', () => {
		console.log('[UI] Discard pile clicked for player:', player.id, 'isOwned:', isOwned);
		if (typeof onOpenDiscard === 'function') {
			console.log('[UI] Calling onOpenDiscard callback');
			onOpenDiscard(player.id, isOwned);
		} else {
			console.log('[UI] Using fallback showDiscardViewerModal');
			getBoardModal().showGraveyardModal(player, isOwned);
		}
	});

	container.appendChild(pile);
}

// Draws one player's Energy crystal column. The container mirrors data-energy / data-energy-max so a test can read either.
function renderEnergy(container, player) {
	if (!container || !player) return;
	const prevEnergy = _lastEnergy.get(player.id);
	container.innerHTML = buildEnergyCrystals({ energy: player.energy, prevEnergy });
	const root = container.querySelector('.energy-crystals');
	if (root) {
		container.dataset.energy = root.dataset.energy;
		container.dataset.energyMax = root.dataset.energyMax;
		_lastEnergy.set(player.id, Number(root.dataset.energy));
	}
}

// Draws the Welloe pile button (nothing while the pile is empty); a tap opens the list, like the discard pile.
function renderWelloe(container, player, isOwned) {
	if (!container || !player) return;
	const cards = player.welloePile || [];
	container.innerHTML = buildWelloePile({ count: cards.length });
	container.querySelector('[data-pile="welloe"]')?.addEventListener('click', () => {
		getBoardModal().showGraveyardModal(player, isOwned, { title: `${player.name || 'Player'}'s Welloe pile`, cards });
	});
}

function escapeHtml(text) {
	return String(text)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}
