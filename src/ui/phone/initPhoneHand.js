// initPhoneHand.js — wires the phone hand: the bottom bar, the swipe-up drawer and its scrim (Phase 65-03, D-08, D-09). Finds the
// markup in game.html (#phone-drawer, #phone-hand-toggle, #phone-drawer-scrim, #phone-bar), creates the drawer, binds the touch
// swipes (up on the bar opens; down on the panel, which holds the handle, closes) and follows the phone breakpoint: crossing it closes
// the drawer and calls onLayoutChange (main.js re-renders, so End Turn moves between the bar and the middle strip). On the desktop
// the bar, scrim and handle are display none, so none of this is ever seen. Returns { drawer, update(info) }; update writes the
// hand size and the Energy into the bar.
import { createPhoneDrawer } from './createPhoneDrawer.js';
import { bindDrawerSwipe } from './bindDrawerSwipe.js';
import { bindPhoneLayoutChange } from './bindPhoneLayoutChange.js';
import { renderPhoneBar } from './renderPhoneBar.js';

export function initPhoneHand({ onLayoutChange } = {}) {
	const panel = document.getElementById('phone-drawer');
	const bar = document.getElementById('phone-bar');
	const drawer = createPhoneDrawer({
		panel,
		toggle: document.getElementById('phone-hand-toggle'),
		scrim: document.getElementById('phone-drawer-scrim'),
	});

	bindDrawerSwipe(bar, { onUp: drawer.open });
	bindDrawerSwipe(panel, { onDown: drawer.close }); // the handle is the panel's first child, so its swipes land here too

	bindPhoneLayoutChange((isPhone) => {
		drawer.close();
		if (typeof onLayoutChange === 'function') onLayoutChange(isPhone);
	});

	return { drawer, update: (info) => renderPhoneBar(bar, info) };
}
