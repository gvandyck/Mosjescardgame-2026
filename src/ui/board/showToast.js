// showToast.js — the board toast (63-UI-SPEC "Toast", D-06): the full reason behind a badge or a greyed control.
// ONE #board-toast at a time (role=status), at the bottom of the status-strip area; a new toast replaces the old one,
// it dismisses itself after 3 s and a tap dismisses it at once. The text goes in with textContent (T-63-06).
const TOAST_ID = 'board-toast';
const TOAST_MS = 3000;
let dismissTimer = null;

function dismissToast() {
	clearTimeout(dismissTimer);
	dismissTimer = null;
	document.getElementById(TOAST_ID)?.remove();
}

export function showToast(text) {
	if (typeof document === 'undefined' || !text) return;
	dismissToast();
	const toast = document.createElement('div');
	toast.id = TOAST_ID;
	toast.className = 'board-toast';
	toast.setAttribute('role', 'status');
	toast.setAttribute('aria-live', 'polite');
	toast.textContent = String(text);
	toast.addEventListener('click', dismissToast);
	document.body.appendChild(toast);
	dismissTimer = setTimeout(dismissToast, TOAST_MS);
}
