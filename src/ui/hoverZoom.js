import { renderCard } from './cardRenderer.js';
import { getCardById } from '../data/cardIndex.js';

const FIELD_SELECTOR = '#board-root .card[data-card-id]';
const POPUP_W = 300;
const POPUP_H = POPUP_W * 1.46;
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
		if (lvl) merged.level = Number(lvl[0]) - 1;
	}
	return renderCard(merged, { compact: false });
}

function position(e) {
	if (!popup) return;
	const margin = 18;
	let x = e.clientX + margin;
	if (x + POPUP_W > window.innerWidth - 8) x = e.clientX - margin - POPUP_W;
	const y = Math.min(Math.max(8, e.clientY - POPUP_H / 2), window.innerHeight - POPUP_H - 8);
	popup.style.left = `${Math.max(8, x)}px`;
	popup.style.top = `${y}px`;
}

/** Hover any face-up field card (yours or the opponent's) → full-size card popup. */
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
		popup.className = 'hover-zoom';
		popup.appendChild(card);
		document.body.appendChild(popup);
		position(e);
	});
	document.addEventListener('mousemove', position);
	document.addEventListener('mouseout', (e) => {
		if (currentTarget && !currentTarget.contains(e.relatedTarget)) removePopup();
	});
	// Board re-renders replace the hovered node without a mouseout.
	new MutationObserver(() => {
		if (currentTarget && !currentTarget.isConnected) removePopup();
	}).observe(document.body, { childList: true, subtree: true });
}
