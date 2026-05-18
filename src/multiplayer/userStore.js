// userStore.js — Reads and writes per-user data in Firebase RTDB.
// Path layout:
//   users/{uid}/profile   — { displayName, isAnonymous, lastSeen }
//   users/{uid}/decks     — { [deckId]: { name, mosjes, piecies, ... } }

import { isFirebaseReady, getRtdb } from '../firebase.js';

let lastUserStoreError = null;

async function getRtdbAPI() {
	const { ref, get, set, update, remove } =
		await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js');
	return { ref, get, set, update, remove };
}

// ── Profile ──────────────────────────────────────────────────────────────────

export async function saveUserProfile(uid, profile) {
	const ready = await isFirebaseReady();
	if (!ready || !uid) return;
	const db = getRtdb();
	const { ref, update } = await getRtdbAPI();
	try {
		await update(ref(db, `users/${uid}/profile`), {
			...profile,
			lastSeen: Date.now(),
		});
	} catch (err) {
		logUserStoreError('save profile failed', err);
	}
}

export async function getUserProfile(uid) {
	const ready = await isFirebaseReady();
	if (!ready || !uid) return null;
	const db = getRtdb();
	const { ref, get } = await getRtdbAPI();
	try {
		const snap = await get(ref(db, `users/${uid}/profile`));
		return snap.exists() ? snap.val() : null;
	} catch (err) {
		logUserStoreError('load profile failed', err);
		return null;
	}
}

// ── Decks ─────────────────────────────────────────────────────────────────────
// deck shape matches STARTER_DECKS entries:
// { id, name, mosjes[], piecies[], snellePiecies[], places[], quests[] }

export async function loadUserDecks(uid) {
	const ready = await isFirebaseReady();
	if (!ready || !uid) return [];
	const db = getRtdb();
	const { ref, get } = await getRtdbAPI();
	try {
		const snap = await get(ref(db, `users/${uid}/decks`));
		lastUserStoreError = null;
		if (!snap.exists()) return [];
		return Object.values(snap.val());
	} catch (err) {
		lastUserStoreError = err;
		logUserStoreError('load decks failed', err);
		return [];
	}
}

export async function saveDeck(uid, deck) {
	const ready = await isFirebaseReady();
	if (!ready || !uid || !deck?.id) return { success: false, error: userStoreErrorMessage() };
	const db = getRtdb();
	const { ref, set } = await getRtdbAPI();
	try {
		await set(ref(db, `users/${uid}/decks/${deck.id}`), deck);
		return { success: true };
	} catch (err) {
		logUserStoreError('save deck failed', err);
		return { success: false, error: userStoreErrorMessage(err) };
	}
}

export async function deleteDeck(uid, deckId) {
	const ready = await isFirebaseReady();
	if (!ready || !uid || !deckId) return { success: false, error: userStoreErrorMessage() };
	const db = getRtdb();
	const { ref, remove } = await getRtdbAPI();
	try {
		await remove(ref(db, `users/${uid}/decks/${deckId}`));
		return { success: true };
	} catch (err) {
		logUserStoreError('delete deck failed', err);
		return { success: false, error: userStoreErrorMessage(err) };
	}
}

export async function deleteUserData(uid) {
	const ready = await isFirebaseReady();
	if (!ready || !uid) return { success: false, error: userStoreErrorMessage() };
	const db = getRtdb();
	const { ref, remove } = await getRtdbAPI();
	try {
		await remove(ref(db, `users/${uid}`));
		return { success: true };
	} catch (err) {
		logUserStoreError('delete user data failed', err);
		return { success: false, error: userStoreErrorMessage(err) };
	}
}

function userStoreErrorMessage(err) {
	const code = err?.code || '';
	if (code === 'PERMISSION_DENIED' || code === 'permission-denied') {
		return 'Deck storage is blocked by Firebase Database rules.';
	}
	return 'Deck storage is unavailable right now.';
}

function logUserStoreError(context, err) {
	console.warn(`[USER] ${context}:`, {
		code: err?.code,
		message: err?.message,
	});
}

export function getLastUserStoreError() {
	return lastUserStoreError;
}
