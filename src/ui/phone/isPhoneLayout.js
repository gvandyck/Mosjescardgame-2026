// isPhoneLayout.js — is the phone layout on right now (Phase 65, D-02)? True while the viewport matches PHONE_QUERY. False when
// the browser has no matchMedia (a unit-test or server environment), so desktop code paths stay the default. Reads, never changes.
import { PHONE_QUERY } from './phoneQuery.js';

export function isPhoneLayout() {
	if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
	return window.matchMedia(PHONE_QUERY).matches;
}
