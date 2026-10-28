// bindPhoneLayoutChange.js — call onChange(isPhone) whenever the viewport crosses the phone breakpoint (Phase 65, D-02), e.g. a
// window resized across 700 px or a phone turned upright. Returns the unsubscribe function. A no-op without matchMedia.
import { PHONE_QUERY } from './phoneQuery.js';

export function bindPhoneLayoutChange(onChange) {
	if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {};
	const query = window.matchMedia(PHONE_QUERY);
	const listener = (event) => onChange(event.matches);
	query.addEventListener('change', listener);
	return () => query.removeEventListener('change', listener);
}
