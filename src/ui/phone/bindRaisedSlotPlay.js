// bindRaisedSlotPlay.js — tap the gold "Place here" slot to play the raised card (Phase 65-07, D-10). While a hand card is raised on a
// phone the engine's next free slot is marked (setSlotHint) and, inside the phone query only, takes touch (styles/phone-raise.css);
// a click on it is the second way to play, next to the dock's Play button. The tap goes to raise.play(), which re-checks
// getHandCardState and then runs the same handlePlayCard path as Play; an unplayable card marks no slot, so nothing can be tapped then.
// The engine fills the FIRST free slot, so this is a confirm target, not a slot chooser. Every other slot stays inert, and a tap on
// one of them reaches bindRaiseDismiss, which cancels the raise (T-65-10). `click` only, never a pointer event (a pointercancel from
// Chrome mid-gesture must not matter). Returns the unbind function.
import { isPhoneLayout } from './isPhoneLayout.js';

export function bindRaisedSlotPlay(raise, doc = document) {
	const onClick = (event) => {
		if (!isPhoneLayout() || raise.current() === null) return;
		const target = event.target;
		if (!(target instanceof Element) || !target.closest('[data-place-here]')) return;
		raise.play();
	};
	doc.addEventListener('click', onClick);
	return () => doc.removeEventListener('click', onClick);
}
