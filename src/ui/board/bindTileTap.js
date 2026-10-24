// bindTileTap.js — wires a table tile's click to the board controller (63-05, D-03).
// info = { kind: 'mosje' | 'piecie' | 'place', owner: 'own' | 'opponent', playerId, slotIndex, cardId }. A tap calls
// onTileTap({ ...info, el, openDetails }); without a controller it opens the detail view as before. The opener is also kept on
// the element so the controller can reach the CURRENT render's details after a re-render. Clicks on a button inside the tile
// (ability, return to hand, badge) are theirs, not a tile tap.
export function bindTileTap(el, info, openDetails, onTileTap) {
	if (!el) return;
	el._boardOpenDetails = openDetails;
	el.addEventListener('click', (event) => {
		if (event.target.closest?.('button')) return;
		if (typeof onTileTap === 'function') onTileTap({ ...info, el, openDetails });
		else openDetails();
	});
}
