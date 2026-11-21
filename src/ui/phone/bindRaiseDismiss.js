// bindRaiseDismiss.js — the ways out of a raised hand card (Phase 65-06, D-10): a tap anywhere else cancels, and so does Esc.
// A tap that belongs to the raise itself is left alone: the bar (the dock's own buttons), the marked slot, a hand card (its own tap
// raises / un-raises), the drawer, any modal (the Details view, a prompt) and the toast. Esc leaves a modal open for the modal.
// The click target is read from event.composedPath(), which is fixed when the click starts: the Details close button empties its modal
// and a toast removes itself before this document listener runs, and a detached target would look like "elsewhere" and cancel the
// raise that the very same tap was only meant to close a view of. Only `click` is used (a tap is a click); no pointer events, so a
// pointercancel Chrome sends mid-gesture can never leave the raise in a half state. Returns the unbind function.
const OWN = '#phone-bar, [data-place-here], .hand-card-wrap, #phone-drawer, .modal-root, .board-toast';

export function bindRaiseDismiss(raise, doc = document) {
	const onClick = (event) => {
		const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
		if (path.some((node) => node.matches && node.matches(OWN))) return;
		raise.cancel();
	};
	const onKey = (event) => {
		if (event.key !== 'Escape') return;
		if (doc.querySelector('.modal-root--open')) return;
		raise.cancel();
	};
	doc.addEventListener('click', onClick);
	doc.addEventListener('keydown', onKey);
	return () => {
		doc.removeEventListener('click', onClick);
		doc.removeEventListener('keydown', onKey);
	};
}
