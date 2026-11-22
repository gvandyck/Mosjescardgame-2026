import { buildPopupCard } from './hover/buildPopupCard.js';

// Field cards (yours and the opponent's) and hand cards both preview in the dock.
const FIELD_SELECTOR = '#board-root .card[data-card-id], .game-hand-panel .hand-card-wrap[data-card-id]';
let popup = null;
let currentTarget = null;

function removePopup() {
	popup?.remove();
	popup = null;
	currentTarget = null;
}

/** Hover any face-up field card (yours or the opponent's) → full-size card popup, docked on the right of the
 *  screen in the same place and at the same size as the action spotlight (arena.css .hover-zoom / .card-spotlight). */
export function initHoverZoom() {
	if (!window.matchMedia?.('(hover: hover)').matches) return;
	document.addEventListener('mouseover', (e) => {
		const target = e.target.closest?.(FIELD_SELECTOR);
		if (!target || target.closest('.face-down-piecie')) {
			if (currentTarget) removePopup();
			return;
		}
		if (target === currentTarget) return;
		removePopup();
		const built = buildPopupCard(target);
		if (!built) return;
		currentTarget = target;
		popup = document.createElement('div');
		// Hand previews use the same dock and size as field previews and the spotlight (hover-zoom--hand is only a marker).
		popup.className = target.classList.contains('hand-card-wrap') ? 'hover-zoom hover-zoom--hand' : 'hover-zoom';
		popup.appendChild(built.card);
		if (built.panelHtml) {
			const panel = document.createElement('div');
			panel.className = 'hover-zoom__panel';
			panel.innerHTML = built.panelHtml;
			popup.appendChild(panel);
		}
		document.body.appendChild(popup);
	});
	document.addEventListener('mouseout', (e) => {
		if (currentTarget && !currentTarget.contains(e.relatedTarget)) removePopup();
	});
	// Board re-renders replace the hovered node without a mouseout.
	new MutationObserver(() => {
		if (currentTarget && !currentTarget.isConnected) removePopup();
	}).observe(document.body, { childList: true, subtree: true });
}
