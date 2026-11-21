// buildShowCardsToggle.js - Phase 72.1-03 (D-07): the one "Show cards" button of the lobby deck tiles.
// A deck tile is a button[role=radio], so no control can live inside it: ONE toggle sits under the tiles and opens or closes the
// Mosje and Personal Quest lists of all of them (data-cards-open on the tiles element, read by styles/phone-lobby.css).
// Shown on a phone only (display: none elsewhere). Text goes in through textContent only, never innerHTML.
export function buildShowCardsToggle(tilesEl, doc = document) {
	const button = doc.createElement('button');
	button.type = 'button';
	button.className = 'deck-tiles__toggle';
	button.setAttribute('aria-expanded', 'false');
	button.textContent = 'Show cards';
	button.addEventListener('click', () => {
		const open = button.getAttribute('aria-expanded') !== 'true';
		if (open) tilesEl.setAttribute('data-cards-open', 'true');
		else tilesEl.removeAttribute('data-cards-open');
		button.setAttribute('aria-expanded', open ? 'true' : 'false');
		button.textContent = open ? 'Hide cards' : 'Show cards';
	});
	return button;
}
