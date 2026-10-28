// initPhoneHand.js — wires the phone hand: the bottom bar, the swipe-up drawer and its scrim (Phase 65-03, D-08, D-09), and the tap-raise
// model (65-06, D-10). Finds the markup in game.html (#phone-drawer, #phone-hand-toggle, #phone-drawer-scrim, #phone-bar and its
// [data-raise-dock]), creates the drawer, binds the touch swipes (up on the bar opens, ignored while a card is raised; down on the
// panel, which holds the handle, closes) and follows the phone breakpoint: crossing it closes the drawer, cancels the raise and calls
// onLayoutChange (main.js re-renders, so End Turn moves between the bar and the middle strip), and keeps the whole table fitting
// between the header and the bar on every resize (bindPhoneFit, 65-05). Raising a card closes the drawer and calls onRaise() (main.js
// cancels a selected field card) once per newly raised card. The dock's three buttons share ONE delegated click listener. On the
// desktop the bar, scrim and handle are display none, so none of this is ever seen.
// Returns { drawer, update(info), raise }; update writes the hand size and the Energy into the bar; raise is the createHandRaise
// object that handRenderer feeds and main.js refreshes after every render.
import { createPhoneDrawer } from './createPhoneDrawer.js';
import { bindDrawerSwipe } from './bindDrawerSwipe.js';
import { bindPhoneLayoutChange } from './bindPhoneLayoutChange.js';
import { renderPhoneBar } from './renderPhoneBar.js';
import { bindPhoneFit } from './bindPhoneFit.js';
import { createHandRaise } from './createHandRaise.js';
import { renderRaiseDock } from './renderRaiseDock.js';
import { bindRaiseDismiss } from './bindRaiseDismiss.js';
import { blockCardMenu } from './blockCardMenu.js';
import { showToast } from '../board/showToast.js';

export function initPhoneHand({ onLayoutChange, onRaise } = {}) {
	const panel = document.getElementById('phone-drawer');
	const bar = document.getElementById('phone-bar');
	const drawer = createPhoneDrawer({
		panel,
		toggle: document.getElementById('phone-hand-toggle'),
		scrim: document.getElementById('phone-drawer-scrim'),
	});

	let shownId = null; // the card the dock shows: the drawer and the board selection only react to a NEWLY raised card
	const raise = createHandRaise({
		effects: {
			onView: (view) => {
				renderRaiseDock(view, { bar, document });
				const fresh = !!view && view.cardId !== shownId;
				shownId = view ? view.cardId : null;
				if (fresh) {
					drawer.close();
					if (typeof onRaise === 'function') onRaise();
				}
			},
			onReject: (reason) => showToast(reason),
		},
	});

	bar?.querySelector('[data-raise-dock]')?.addEventListener('click', (event) => {
		const button = event.target.closest('[data-raise-play], [data-raise-details], [data-raise-cancel]');
		if (!button) return;
		if (button.hasAttribute('data-raise-play')) raise.play();
		else if (button.hasAttribute('data-raise-details')) raise.details();
		else raise.cancel();
	});
	bindRaiseDismiss(raise);
	blockCardMenu(document.querySelector('main.game-layout'));

	bindDrawerSwipe(bar, { onUp: () => { if (bar.dataset.mode !== 'raise') drawer.open(); } });
	bindDrawerSwipe(panel, { onDown: drawer.close }); // the handle is the panel's first child, so its swipes land here too

	bindPhoneFit(() => document.getElementById('board-root')); // the table re-fits on resize / turn / visual viewport (65-05)

	bindPhoneLayoutChange((isPhone) => {
		drawer.close();
		raise.cancel();
		if (typeof onLayoutChange === 'function') onLayoutChange(isPhone);
	});

	return { drawer, update: (info) => renderPhoneBar(bar, info), raise };
}
