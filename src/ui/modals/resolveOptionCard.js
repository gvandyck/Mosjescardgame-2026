// resolveOptionCard.js — turn a modal option into a card object for the face builder, or null.
// Option shapes: { card }, { cardId }, { cardId, live: { level, mp, ... } }. Live fields win over the definition
// (same precedence as hydrateCard in cardRenderer.js).
import { getCardById } from '../../data/cardIndex.js';

export function resolveOptionCard(option) {
	if (!option || typeof option !== 'object') return null;
	if (option.card && typeof option.card === 'object') return option.card;
	if (!option.cardId) return null;
	const definition = getCardById(option.cardId);
	if (!definition) return null;
	return option.live ? { ...definition, ...option.live } : definition;
}
