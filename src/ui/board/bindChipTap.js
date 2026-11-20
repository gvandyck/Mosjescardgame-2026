// bindChipTap.js — chips on a tile: a click, Enter or Space on a .chip opens that attached card's detail (72-05, CC-19).
// The event never reaches the tile, so a chip tap does not open the Mosje detail. Hover / focus only show the title.
export function bindChipTap(cardEl, openDetail) {
	for (const chip of cardEl.querySelectorAll('.tile-chips .chip[data-card-id]')) {
		const open = (event) => {
			event.stopPropagation();
			if (typeof openDetail === 'function') openDetail(chip.dataset.cardId);
		};
		chip.addEventListener('click', open);
		chip.addEventListener('keydown', (event) => {
			if (event.key !== 'Enter' && event.key !== ' ') return;
			event.preventDefault();
			open(event);
		});
	}
}
