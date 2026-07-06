// activeDeckPanel.js — Renders the signed-in lobby's active-deck summary
// (deck name only) into a container. Pure DOM render, no Firebase.
// The 'Change deck' button already lives in the container's markup
// (index.html) — this function never touches it, only the name slot.

export function renderActiveDeckPanel(container, deck) {
	if (!container) return;
	const nameEl = container.querySelector('.active-deck-panel__name');
	if (!nameEl) return;
	nameEl.textContent = deck ? (deck.name || deck.id) : 'No active deck';
}
