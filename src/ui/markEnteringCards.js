// markEnteringCards.js — only cards that are NEW since the previous render play the enter
// animation. The hand and board are rebuilt from scratch on every game-state change, so an
// animation on every .card replayed on ALL cards for any event (even +10 MP on one Mosje):
// the whole table flickered. Cards are matched by cardId (and how many of that id are present).
const seenByContainer = new WeakMap();

export function markEnteringCards(container) {
	if (!container) return;
	const previous = seenByContainer.get(container) || new Map();
	const current = new Map();
	for (const card of container.querySelectorAll('.card')) {
		const id = card.dataset.cardId || card.className;
		const nth = (current.get(id) || 0) + 1;
		current.set(id, nth);
		if (nth > (previous.get(id) || 0)) card.classList.add('card--enter');
	}
	seenByContainer.set(container, current);
}
