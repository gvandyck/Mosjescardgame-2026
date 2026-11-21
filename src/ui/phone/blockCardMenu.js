// blockCardMenu.js — no browser menu on the phone table (Phase 65-06, D-12). Android Chrome opens its "save / share image" menu on a
// long press of a card picture (the browser sends a `contextmenu` event first); iOS starts a drag. There is no long-press feature on
// the phone, so on the phone layout every contextmenu inside `root` is default-prevented. The desktop right-click is untouched (the
// check reads the phone layout at the moment of the event). Returns the unbind function.
import { isPhoneLayout } from './isPhoneLayout.js';

export function blockCardMenu(root) {
	if (!root) return () => {};
	const onMenu = (event) => { if (isPhoneLayout()) event.preventDefault(); };
	root.addEventListener('contextmenu', onMenu);
	return () => root.removeEventListener('contextmenu', onMenu);
}
