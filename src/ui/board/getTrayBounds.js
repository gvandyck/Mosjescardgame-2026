// getTrayBounds.js — the area an action tray may occupy, as { left, right, top, bottom } in viewport px (Phase 65-09, D-13).
// Off the phone these are exactly the numbers renderActionTray always used: the board edges less a 4 px margin sideways and above
// the window bottom, so the desktop tray does not move by a pixel. On the phone the free band is narrower: inside the window, under
// the status strip and 4 px above the top of the bottom bar (#phone-bar), so a tray can never slide under the strip or the bar.
import { isPhoneLayout } from '../phone/isPhoneLayout.js';

const EDGE = 4;

export function getTrayBounds(board) {
	const b = board.getBoundingClientRect();
	if (!isPhoneLayout()) return { left: b.left + EDGE, right: b.right - EDGE, top: b.top, bottom: window.innerHeight - EDGE };
	const strip = document.getElementById('status-strip');
	const bar = document.getElementById('phone-bar');
	return {
		left: Math.max(b.left, 0) + EDGE,
		right: Math.min(b.right, window.innerWidth) - EDGE,
		top: strip ? strip.getBoundingClientRect().bottom : b.top,
		bottom: (bar ? bar.getBoundingClientRect().top : window.innerHeight) - EDGE,
	};
}
