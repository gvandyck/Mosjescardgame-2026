// bindSlotHint.js — shows "Place here" on the slot a hand card will go into (64.1 D-02 / D-06).
// There is no selected-hand-card state (a tap plays the card at once), so "holds or has selected" = the RAISED card (pointer
// enter or keyboard focus, the same trigger as the 63 D-12 Energy preview) and an HTML5 drag (the non-hover path).
// Touch play stays one tap (Phase 65). A Mosje takes a Mosje slot; a Piecie and a Snelle both take a Piecie slot (playSnellie
// fills the first free one, like playPiecie); the slot is the one the engine fills.
import { getHandPlayCost } from './getHandPlayCost.js';
import { getNextFreeSlot } from './getNextFreeSlot.js';
import { setSlotHint } from './setSlotHint.js';
import { SNELLE_PIECIES } from '../../data/snellePiecies.js';
import { snelleConditionMet } from '../../rules/snelleConditions.js';

const KIND_BY_TYPE = { MOSJE: 'mosje', PIECIE: 'piecie', SNELLE_PIECIE: 'piecie' };

// playSnellie refuses a Snelle (nothing paid, nothing placed) when Those Eyelashes blocks it or its "Needs / Only if" fails.
// A card played from the hand has no reaction window, so the condition is read with reaction = null, as the play does.
function snelleRefused(gameState, localPlayerId, card) {
	if (card.type !== 'SNELLE_PIECIE') return false;
	if (gameState._snelleBlocked === localPlayerId) return true;
	return snelleConditionMet(gameState, localPlayerId, SNELLE_PIECIES.find((def) => def.id === card.cardId), null) !== true;
}

export function bindSlotHint(wrap, card, gameState, localPlayerId) {
	const kind = KIND_BY_TYPE[card?.type];
	if (!wrap || !kind) return;
	const clear = () => setSlotHint(document, null);
	const show = () => {
		const face = wrap.querySelector('.hand-card');
		if (!face?.classList.contains('hand-card--playable') || face.classList.contains('hand-card--not-playable')) return;
		const player = gameState?.players?.[localPlayerId];
		if (!player || snelleRefused(gameState, localPlayerId, card)) { clear(); return; }
		// A card that cannot be paid goes nowhere (a Piecie from the hand is free).
		const cost = getHandPlayCost(gameState, localPlayerId, { cardId: card.cardId, type: card.type });
		if (cost > (Number(player.energy) || 0)) { clear(); return; }
		setSlotHint(document, kind, getNextFreeSlot(player, kind));
	};
	wrap.addEventListener('mouseenter', show);
	wrap.addEventListener('mouseleave', clear);
	wrap.addEventListener('focusin', show);
	wrap.addEventListener('focusout', (event) => { if (!wrap.contains(event.relatedTarget)) clear(); });
	wrap.addEventListener('dragstart', show);
	wrap.addEventListener('dragend', clear);
}
