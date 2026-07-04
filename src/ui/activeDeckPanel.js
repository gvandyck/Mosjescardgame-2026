// activeDeckPanel.js — Renders the signed-in lobby's active-deck summary
// (deck name + its Mosjes) into a container. Pure DOM render, no Firebase.
// The 'Change deck' button already lives in the container's markup
// (index.html) — this function never touches it, only the name/Mosjes slots.

import { MOSJES } from '../data/mosjes.js';

const MOSJE_LOOKUP = Object.fromEntries(MOSJES.map(m => [m.id, m.name]));

// '[Gandoe] The Unpredictable Wizard' -> 'Gandoe'; falls back to a prettified
// id when the Mosje isn't found (defensive — should not happen for real decks).
function mosjeDisplayName(mosjeId) {
	const name = MOSJE_LOOKUP[mosjeId];
	if (!name) {
		return String(mosjeId).replace(/^mosje_/, '').split('_')
			.map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
	}
	const nick = name.match(/^\[(.+?)\]/);
	return nick ? nick[1] : name;
}

export function renderActiveDeckPanel(container, deck) {
	if (!container) return;
	const nameEl = container.querySelector('.active-deck-panel__name');
	const mosjesEl = container.querySelector('.active-deck-panel__mosjes');
	if (!deck) {
		if (nameEl) nameEl.textContent = 'No active deck';
		if (mosjesEl) mosjesEl.textContent = '';
		return;
	}
	if (nameEl) nameEl.textContent = deck.name || deck.id;
	if (mosjesEl) {
		const names = (deck.mosjes ?? []).map(mosjeDisplayName);
		mosjesEl.textContent = names.join(' & ');
	}
}
