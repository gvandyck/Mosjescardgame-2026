// updateRaiseDock.js — refreshes the texts and the Play state of the dock IN PLACE for the card it already shows (Phase 65-06).
// A board re-render (a bot move, an Energy change) must never replace the buttons between a finger going down and the click, or the
// tap is swallowed; so the same nodes stay and only their text and aria-disabled change. textContent only (T-65-08).
import { describeRaiseView } from './describeRaiseView.js';

export function updateRaiseDock(dock, view) {
	const { name, line, disabled } = describeRaiseView(view);
	const set = (selector, text) => {
		const el = dock.querySelector(selector);
		if (el && el.textContent !== text) el.textContent = text;
	};
	set('.raise__name', name);
	set('.raise__line', line);
	dock.querySelector('[data-raise-play]')?.setAttribute('aria-disabled', String(disabled));
}
