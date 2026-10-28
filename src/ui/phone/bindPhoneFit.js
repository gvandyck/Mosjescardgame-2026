// bindPhoneFit.js — re-fits the phone table whenever the screen changes shape (Phase 65-05, D-05): a window resize, a phone turned
// (orientationchange) and the visual viewport resizing (Chrome's address bar sliding away, the keyboard). Each burst of events
// schedules ONE requestAnimationFrame that calls applyPhoneFit(getBoard()); applyPhoneFit changes tile sizes inside the board only,
// never the board's own height, so it cannot fire another resize (T-65-07). Returns the unbind function.
import { applyPhoneFit } from './applyPhoneFit.js';

export function bindPhoneFit(getBoard) {
	if (typeof window === 'undefined') return () => {};
	let frame = 0;

	function schedule() {
		if (frame) return;
		frame = window.requestAnimationFrame(() => {
			frame = 0;
			applyPhoneFit(getBoard());
		});
	}

	const viewport = window.visualViewport || null;
	window.addEventListener('resize', schedule);
	window.addEventListener('orientationchange', schedule);
	if (viewport) viewport.addEventListener('resize', schedule);

	return () => {
		window.removeEventListener('resize', schedule);
		window.removeEventListener('orientationchange', schedule);
		if (viewport) viewport.removeEventListener('resize', schedule);
		if (frame) window.cancelAnimationFrame(frame);
		frame = 0;
	};
}
