// bindSheetSwipeDown.js - a one-finger swipe DOWN on `el` (the sheet's handle and title row) calls onDown() once, when the finger lifts after
// at least 60 px of travel that is mostly vertical (72.1-06, D-06). It is bindDrawerSwipe with the sheet's distance: a second finger and a
// touchcancel end the gesture without action, and no pointercancel listener exists (Android Chrome sends one mid-drag, 65-03b).
// Returns the unbind function.
import { bindDrawerSwipe } from './bindDrawerSwipe.js';

export function bindSheetSwipeDown(el, onDown) {
	return bindDrawerSwipe(el, { onDown, minDistance: 60 });
}
