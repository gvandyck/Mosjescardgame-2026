// bindDrawerSwipe.js — a one-finger vertical swipe on `el` (Phase 65-03, D-08). onUp() or onDown() fires ONCE, when the finger lifts
// after travelling at least `minDistance` px vertically AND at least 1.5x as far vertically as sideways (so a sideways card swipe or
// a diagonal slip is never a drawer swipe). A second finger, a touchcancel or a pointercancel (Chrome taking the gesture for a scroll
// or pull-to-refresh) ends the gesture WITHOUT action, so the drawer is never left half-moved. Listeners are passive and never call
// preventDefault: the page keeps scrolling and tapping normally (the CSS touch-action on the bar decides who owns the gesture).
// Returns the unbind function.
export function bindDrawerSwipe(el, { onUp, onDown, minDistance = 48 } = {}) {
	if (!el) return () => {};
	let from = null;    // { x, y } where the one finger went down, or null when no countable gesture is running
	let last = null;    // the finger's latest { x, y }
	let spoiled = false; // a second finger joined: ignore the rest of this gesture until every finger is up

	const point = (touch) => ({ x: touch.clientX, y: touch.clientY });
	const reset = () => { from = null; last = null; };

	const onStart = (e) => {
		if (e.touches.length > 1) { spoiled = true; reset(); return; }
		spoiled = false;
		from = point(e.touches[0]);
		last = from;
	};
	const onMove = (e) => {
		if (from && e.touches.length === 1) last = point(e.touches[0]);
	};
	const onEnd = (e) => {
		if (e.touches.length === 0 && spoiled) { spoiled = false; reset(); return; }
		if (!from || spoiled) return;
		const end = e.changedTouches?.length ? point(e.changedTouches[0]) : last;
		const dy = end.y - from.y;
		const dx = end.x - from.x;
		reset();
		if (Math.abs(dy) < minDistance || Math.abs(dy) < 1.5 * Math.abs(dx)) return;
		if (dy < 0) onUp?.();
		else onDown?.();
	};
	const onCancel = () => { spoiled = false; reset(); };

	const opts = { passive: true };
	el.addEventListener('touchstart', onStart, opts);
	el.addEventListener('touchmove', onMove, opts);
	el.addEventListener('touchend', onEnd, opts);
	el.addEventListener('touchcancel', onCancel, opts);
	el.addEventListener('pointercancel', onCancel, opts);
	return () => {
		el.removeEventListener('touchstart', onStart, opts);
		el.removeEventListener('touchmove', onMove, opts);
		el.removeEventListener('touchend', onEnd, opts);
		el.removeEventListener('touchcancel', onCancel, opts);
		el.removeEventListener('pointercancel', onCancel, opts);
	};
}
