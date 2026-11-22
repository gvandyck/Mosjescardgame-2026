// bindTableLongPress.js - a long press (500 ms) on any face-up table card opens the phone card sheet (72.1-06, D-06). One delegated binder
// on the board container (it survives every re-render; innerHTML only replaces its children), so Mosje, Piecie, Place and Quest tiles
// all work without a binder each. Only on the phone layout, only on a face-up card: a face-down Piecie, an empty slot, or a button never starts a press. openFallback(def) opens the big detail view for a Quest stack,
// which has no opener of its own. Idempotent. Touch events only (see bindLongPress).
import { bindLongPress } from './bindLongPress.js';
import { isPhoneLayout } from './isPhoneLayout.js';
import { openCardSheet } from './openCardSheet.js';
import { getCardById } from '../../data/cardIndex.js';

const CARD = '.card[data-card-id], .quest-stack[data-quest]';

function pressedCard(event) {
	if (!isPhoneLayout()) return null;
	const target = event.target;
	if (!target?.closest || target.closest('button, .face-down-piecie')) return null;
	return target.closest(CARD);
}

export function bindTableLongPress(container, openFallback) {
	if (!container || container._tableLongPress) return;
	container._tableLongPress = true;
	bindLongPress(container, (event) => {
		const card = pressedCard(event);
		if (!card) return;
		const questId = card.dataset.quest;
		openCardSheet(card, { onFullCard: questId && openFallback ? () => openFallback(getCardById(questId)) : undefined });
	}, { filter: (event) => !!pressedCard(event) });
}
