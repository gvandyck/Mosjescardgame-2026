// accountSetup.js — One-time initialisation for new accounts.
// Called after every sign-in; the setupComplete flag prevents it running twice.
//
// On first login a player receives a wallet seeded at 0 Munten; cards are
// granted only when they pick a starter deck (see claimStarterDeck.js).

import { isFirebaseReady, getRtdb } from '../firebase.js';

console.log('[SETUP] accountSetup.js loaded');

async function getRtdbAPI() {
	const { ref, get, set } =
		await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js');
	return { ref, get, set };
}

// Call this after every successful sign-in.
// Resolves immediately if setup has already been completed for this account.
export async function initNewAccount(uid, displayName = '') {
	if (!uid) return;
	const ready = await isFirebaseReady();
	if (!ready) return;
	const db = getRtdb();
	const { ref, get, set } = await getRtdbAPI();

	// Seed / refresh display name in profile (runs on every login, not just first setup)
	if (displayName) {
		try {
			await set(ref(db, `users/${uid}/profile/displayName`), displayName);
		} catch (err) {
			console.warn('[SETUP] Could not write displayName:', err?.code);
		}
	}

	// Check if already set up
	const flagRef = ref(db, `users/${uid}/setup/complete`);
	try {
		const snap = await get(flagRef);
		if (snap.val() === true) return;
	} catch (err) {
		console.warn('[SETUP] Could not check setup flag:', err?.code);
		return;
	}

	// Seed wallet (only if it doesn't exist yet)
	try {
		const walletSnap = await get(ref(db, `users/${uid}/wallet`));
		if (!walletSnap.exists()) {
			await set(ref(db, `users/${uid}/wallet`), {
				munten: 0,
				lifetimeEarned: 0,
				lastUpdated: Date.now(),
			});
		}
	} catch (err) {
		console.warn('[SETUP] Could not seed wallet:', err?.code);
	}

	// Mark setup complete
	try {
		await set(flagRef, true);
		console.log('[SETUP] New account initialised for:', uid);
	} catch (err) {
		console.warn('[SETUP] Could not set setup flag:', err?.code);
	}
}
