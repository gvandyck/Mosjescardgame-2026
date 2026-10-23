import { renderCard } from './cardRenderer.js';
import { getCardById } from '../data/cardIndex.js';

// Field cards (yours and the opponent's) and hand cards both preview in the dock.
const FIELD_SELECTOR = '#board-root .card[data-card-id], .game-hand-panel .hand-card-wrap[data-card-id]';
let popup = null;
let currentTarget = null;

function removePopup() {
	popup?.remove();
	popup = null;
	currentTarget = null;
}

// Rebuild a field card from its full definition + live MP/level so the popup
// shows the ability text the art-first field card hides.
function buildPopupCard(srcEl) {
	const cardId = srcEl.dataset.cardId;
	const def = getCardById(cardId);
	if (!def) return null;
	const merged = { ...def, description: def.abilityDescription || def.description || def.flavourText || '' };
	const mpEl = srcEl.querySelector('.uc-mp');
	if (mpEl) {
		merged.mp = Number(mpEl.dataset.mp);
		const lvl = mpEl.querySelector('.uc-mp-lvl')?.textContent.match(/\d+/);
		if (lvl) merged.level = Number(lvl[0]);
	}
	// Card frame v1 field tile: live MP + level come from its badge and L<n> pill.
	const v1Mp = srcEl.querySelector('[data-cv1-mp]');
	if (v1Mp) {
		merged.mp = Number(v1Mp.textContent);
		const lvl = srcEl.querySelector('.cv1-pill')?.textContent.match(/\d+/);
		if (lvl) merged.level = Number(lvl[0]);
	}
	return renderCard(merged, { compact: false });
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
		const card = buildPopupCard(target);
		if (!card) return;
		currentTarget = target;
		popup = document.createElement('div');
		// Hand previews use the same dock and size as field previews and the spotlight (hover-zoom--hand is only a marker).
		popup.className = target.classList.contains('hand-card-wrap') ? 'hover-zoom hover-zoom--hand' : 'hover-zoom';
		popup.appendChild(card);
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
