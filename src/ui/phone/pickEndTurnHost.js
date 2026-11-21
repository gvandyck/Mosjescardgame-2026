// pickEndTurnHost.js — where the End Turn button lives right now (Phase 65-03, D-09). On the phone layout it sits in the bottom bar
// (#phone-bar-end-turn, always in reach of the thumb); everywhere else it sits in the board's middle strip (#board-end-turn).
// boardRenderer appends the one kept #btn-end-turn node into whatever this returns after every render, so a window resized across
// the phone breakpoint moves the button on the next render. Reads the DOM, never changes it. Returns null when there is no host.
import { isPhoneLayout } from './isPhoneLayout.js';

export function pickEndTurnHost(boardContainer) {
	if (isPhoneLayout()) {
		const barHost = document.getElementById('phone-bar-end-turn');
		if (barHost) return barHost;
	}
	return boardContainer?.querySelector('#board-end-turn') ?? null;
}
