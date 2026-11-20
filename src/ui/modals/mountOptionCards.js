// mountOptionCards.js — put real card faces into the card slots of the option modal (faces are elements, so they are
// mounted after the modal's innerHTML is set). `render` is injectable for tests; it defaults to renderCard.
import { renderCard } from '../cardRenderer.js';
import { resolveOptionCard } from './resolveOptionCard.js';

export function mountOptionCards(container, options, render = renderCard) {
	container.querySelectorAll('[data-option-card]').forEach(slot => {
		const card = resolveOptionCard(options[Number(slot.dataset.optionCard)]);
		if (card) slot.appendChild(render(card, { compact: true }));
	});
}
