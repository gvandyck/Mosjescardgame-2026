// bindLongPress.js - a long press on a touch screen (Phase 72.1-05, D-06): hold 500 ms with less than 10 px of movement and onLong(event)
// runs; the click that follows the release is swallowed once so the long press never also raises or plays.
// Touch events only: Android Chrome sends `pointercancel` about 15 ms into a drag (65-03b), so pointer events cannot be trusted and
// pointercancel is never listened for. touchmove beyond `tolerance`, touchend, touchcancel and a second finger cancel the press.
// filter(event) (optional): return false and the touch is ignored, so one binder on a container can serve only the cards inside it (72.1-06).
// Returns the unbind function.
export function bindLongPress(el, onLong, { ms = 500, tolerance = 10, filter } = {}) {
	if (!el || typeof onLong !== 'function') return () => {};
	let timer = null;
	let start = null;

	const cancel = () => { clearTimeout(timer); timer = null; start = null; };

	const swallowNextClick = () => {
		const eat = (event) => { event.stopPropagation(); event.preventDefault(); clear(); };
		const clear = () => { el.removeEventListener('click', eat, true); clearTimeout(expire); };
		const expire = setTimeout(clear, 800); // a release that produces no click must not leave the listener behind
		el.addEventListener('click', eat, true);
	};

	const onStart = (event) => {
		if (event.touches.length !== 1 || (filter && !filter(event))) { cancel(); return; }
		const t = event.touches[0];
		start = { x: t.clientX, y: t.clientY };
		clearTimeout(timer);
		timer = setTimeout(() => {
			timer = null;
			start = null;
			swallowNextClick();
			onLong(event);
		}, ms);
	};

	const onMove = (event) => {
		if (!start) return;
		const t = event.touches[0];
		if (Math.hypot(t.clientX - start.x, t.clientY - start.y) > tolerance) cancel();
	};

	const onContextMenu = (event) => event.preventDefault();

	el.addEventListener('touchstart', onStart, { passive: true });
	el.addEventListener('touchmove', onMove, { passive: true });
	el.addEventListener('touchend', cancel);
	el.addEventListener('touchcancel', cancel);
	el.addEventListener('contextmenu', onContextMenu);
	return () => {
		cancel();
		el.removeEventListener('touchstart', onStart);
		el.removeEventListener('touchmove', onMove);
		el.removeEventListener('touchend', cancel);
		el.removeEventListener('touchcancel', cancel);
		el.removeEventListener('contextmenu', onContextMenu);
	};
}
