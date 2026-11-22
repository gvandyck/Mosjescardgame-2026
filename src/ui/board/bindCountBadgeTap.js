// bindCountBadgeTap.js - a click, Enter or Space on the tile's count badge calls open() and never reaches the tile tap (72.1-04, D-04).
// open is read when the tap happens: the tile's detail opener is bound after the tile state is drawn.
export function bindCountBadgeTap(cardEl, open) {
	const badge = cardEl.querySelector('.tile-count-badge');
	if (!badge) return;
	const run = (event) => {
		event.stopPropagation();
		if (typeof open === 'function') open();
	};
	badge.addEventListener('click', run);
	badge.addEventListener('keydown', (event) => {
		if (event.key !== 'Enter' && event.key !== ' ') return;
		event.preventDefault();
		run(event);
	});
}
