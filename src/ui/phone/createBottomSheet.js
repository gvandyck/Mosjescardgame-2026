// createBottomSheet.js - the ONE generic phone bottom sheet (72.1-06, D-06, D-13): a handle, a title row with a Close button, a scrolling
// body (the content element) and optional action buttons, in #phone-sheet-root (a root of its own, outside #modal-root, above the bar and
// the drawer). It closes by a tap on the backdrop, a swipe down on the top (handle and title), Escape or Close; focus goes back to what
// opened it. Only one sheet exists at a time (opening a second replaces the first). It plays and pays nothing: its only buttons are the
// ones the caller hands in. Opening announces itself with a `phone-sheet:open` event on the document (initPhoneHand cancels a raised card,
// so the sheet never sits over a marked "Place here" slot).
// createBottomSheet({ root, title, content, actions: [{ label, onClick }], onClose }) -> { open, close, el }.
import { bindSheetSwipeDown } from './bindSheetSwipeDown.js';

const IGNORE_BACKDROP_MS = 350; // the click that ends the long press must not close the sheet it just opened
let current = null;

function node(tag, className, text) {
	const n = document.createElement(tag);
	n.className = className;
	if (text !== undefined) n.textContent = text;
	return n;
}

export function createBottomSheet({ root, title, content, actions = [], onClose } = {}) {
	const host = root || document.getElementById('phone-sheet-root');
	const wrap = node('div', 'phone-sheet-wrap');
	const backdrop = node('div', 'phone-sheet-backdrop');
	const sheet = node('div', 'phone-sheet');
	sheet.setAttribute('role', 'dialog');
	sheet.setAttribute('aria-modal', 'true');
	sheet.setAttribute('aria-label', title || 'Card');

	const top = node('div', 'phone-sheet__top');
	top.appendChild(node('div', 'phone-sheet__handle'));
	const head = node('div', 'phone-sheet__head');
	head.appendChild(node('h2', 'phone-sheet__title', title || ''));
	const closeBtn = node('button', 'phone-sheet__close', 'Close');
	closeBtn.type = 'button';
	head.appendChild(closeBtn);
	top.appendChild(head);
	sheet.appendChild(top);

	const body = node('div', 'phone-sheet__body');
	if (content) body.appendChild(content);
	sheet.appendChild(body);

	if (actions.length) {
		const foot = node('div', 'phone-sheet__foot');
		for (const action of actions) {
			const btn = node('button', 'phone-sheet__action', action.label);
			btn.type = 'button';
			btn.addEventListener('click', () => { close(); action.onClick?.(); });
			foot.appendChild(btn);
		}
		sheet.appendChild(foot);
	}
	wrap.append(backdrop, sheet);

	let openedAt = 0;
	let opener = null;
	let isOpen = false;

	const onKey = (event) => { if (event.key === 'Escape') close(); };
	backdrop.addEventListener('click', () => { if (performance.now() - openedAt > IGNORE_BACKDROP_MS) close(); });
	closeBtn.addEventListener('click', () => close());
	bindSheetSwipeDown(top, () => close());

	function close() {
		if (!isOpen) return;
		isOpen = false;
		document.removeEventListener('keydown', onKey);
		wrap.remove();
		if (current === api) current = null;
		host?.removeAttribute('data-open');
		if (opener && opener.isConnected && typeof opener.focus === 'function') opener.focus({ preventScroll: true });
		opener = null;
		onClose?.();
	}

	function open() {
		if (!host || isOpen) return;
		current?.close();
		document.dispatchEvent(new CustomEvent('phone-sheet:open'));
		opener = document.activeElement;
		host.appendChild(wrap);
		host.setAttribute('data-open', '');
		openedAt = performance.now();
		isOpen = true;
		current = api;
		document.addEventListener('keydown', onKey);
		closeBtn.focus({ preventScroll: true });
	}

	const api = { open, close, el: sheet };
	return api;
}
