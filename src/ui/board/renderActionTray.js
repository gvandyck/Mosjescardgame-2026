// renderActionTray.js — draws the action tray above one tapped own tile (63-UI-SPEC "Action tray", D-03, D-06).
// actions = getTrayActions(...) chips. Returns the div[data-action-tray], or null. Each chip is a button[data-action] with
// aria-disabled (NEVER the disabled attribute: a dimmed chip stays tappable and its tap shows the reason in a toast).
// Hovering or focusing a chip that costs Energy previews the spend on the crystals. The tray sits centred above the tile,
// clamped to the board edges; it flips below only when there is no room above (the Place tile sits right under the opponent's
// row, so its tray asks for { below: true } from the start). position: fixed, so no row clips it.
import { showToast } from './showToast.js';
import { setEnergyPreview } from './setEnergyPreview.js';

const GAP = 6;
const EDGE = 4;

function buildChip(chip, board, onChoose) {
	const btn = document.createElement('button');
	btn.type = 'button';
	btn.className = 'action-tray__chip';
	btn.dataset.action = chip.action;
	btn.setAttribute('aria-disabled', chip.disabled ? 'true' : 'false');
	if (chip.reason) btn.dataset.reason = chip.reason;
	btn.textContent = chip.label;
	btn.addEventListener('click', (event) => {
		event.stopPropagation();
		if (chip.disabled) showToast(chip.reason);
		else onChoose?.(chip.action);
	});
	if (chip.cost > 0) {
		const preview = (cost) => () => setEnergyPreview(board, cost);
		for (const on of ['mouseenter', 'focus']) btn.addEventListener(on, preview(chip.cost));
		for (const off of ['mouseleave', 'blur']) btn.addEventListener(off, preview(0));
	}
	return btn;
}

function placeTray(tray, board, anchor, below) {
	const a = anchor.getBoundingClientRect();
	const b = board.getBoundingClientRect();
	const w = tray.offsetWidth;
	const h = tray.offsetHeight;
	const left = Math.max(b.left + EDGE, Math.min(a.left + a.width / 2 - w / 2, b.right - w - EDGE));
	const under = Math.min(a.bottom + GAP, window.innerHeight - h - EDGE);
	let top = below ? under : a.top - h - GAP;
	if (!below && top < b.top) top = under;
	tray.style.left = `${Math.round(left)}px`;
	tray.style.top = `${Math.round(top)}px`;
}

export function renderActionTray(board, anchorEl, actions, onChoose, { below = false } = {}) {
	for (const old of document.querySelectorAll('[data-action-tray]')) old.remove();
	if (!board || !anchorEl || !actions?.length) return null;
	const tray = document.createElement('div');
	tray.className = 'action-tray';
	tray.setAttribute('data-action-tray', '');
	tray.setAttribute('role', 'toolbar');
	tray.setAttribute('aria-label', 'Card actions');
	for (const chip of actions) tray.appendChild(buildChip(chip, board, onChoose));
	document.body.appendChild(tray);
	placeTray(tray, board, anchorEl, below);
	return tray;
}
