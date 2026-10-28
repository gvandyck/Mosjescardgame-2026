// bindSlotHint.js — shows "Place here" on the slot a hand card will go into (64.1 D-02 / D-06).
// There is no selected-hand-card state (a tap plays the card at once), so "holds or has selected" = the RAISED card (pointer
// enter or keyboard focus, the same trigger as the 63 D-12 Energy preview) and an HTML5 drag (the non-hover path).
// Touch play stays one tap (Phase 65). Only a Mosje or a Piecie takes a field slot; the slot is the one the engine fills.
import { getHandPlayCost } from './getHandPlayCost.js';
import { getNextFreeSlot } from './getNextFreeSlot.js';
import { setSlotHint } from './setSlotHint.js';

const KIND_BY_TYPE = { MOSJE: 'mosje', PIECIE: 'piecie' };

export function bindSlotHint(wrap, card, gameState, localPlayerId) {
	const kind = KIND_BY_TYPE[card?.type];
	if (!wrap || !kind) return;
	const clear = () => setSlotHint(document, null);
	const show = () => {
		const face = wrap.querySelector('.hand-card');
		if (!face?.classList.contains('hand-card--playable') || face.classList.contains('hand-card--not-playable')) return;
		const player = gameState?.players?.[localPlayerId];
		if (!player) { clear(); return; }
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
