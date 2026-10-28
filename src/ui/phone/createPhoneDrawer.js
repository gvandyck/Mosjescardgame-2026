// createPhoneDrawer.js — the open / closed state of the phone hand drawer (Phase 65-03, D-08). Closed by default. The state lives in
// panel.dataset.drawer ('open' | 'closed'; styles/phone-hand.css slides the panel from it), the Hand button's aria-expanded and the
// scrim's hidden flag. The drawer closes on a tap on the scrim and on Esc, so a stuck drawer can always be dismissed (T-65-05).
// Returns { open, close, toggle, isOpen }. onChange(isOpen) fires only when the state really changes.
export function createPhoneDrawer({ panel, toggle, scrim, onChange } = {}) {
	let opened = false;

	function apply(next) {
		const changed = next !== opened;
		opened = next;
		if (panel) panel.dataset.drawer = opened ? 'open' : 'closed';
		if (toggle) toggle.setAttribute('aria-expanded', String(opened));
		if (scrim) scrim.hidden = !opened;
		if (changed && typeof onChange === 'function') onChange(opened);
	}

	const open = () => apply(true);
	const close = () => apply(false);
	const flip = () => apply(!opened);

	if (toggle) toggle.addEventListener('click', flip);
	if (scrim) scrim.addEventListener('click', close);
	document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && opened) close(); });

	apply(false);
	return { open, close, toggle: flip, isOpen: () => opened };
}
