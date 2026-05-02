// userStore.js — Reads and writes per-user data in Firebase RTDB.
// Path layout:
//   users/{uid}/profile   — { displayName, isAnonymous, lastSeen }
//   users/{uid}/decks     — { [deckId]: { name, mosjes, piecies, ... } }

import { isFirebaseReady, getRtdb } from '../firebase.js';

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
	await update(ref(db, `users/${uid}/profile`), {
		...profile,
		lastSeen: Date.now(),
	});
}

export async function getUserProfile(uid) {
	const ready = await isFirebaseReady();
	if (!ready || !uid) return null;
	const db = getRtdb();
	const { ref, get } = await getRtdbAPI();
	const snap = await get(ref(db, `users/${uid}/profile`));
	return snap.exists() ? snap.val() : null;
}

// ── Decks ─────────────────────────────────────────────────────────────────────
// deck shape matches STARTER_DECKS entries:
// { id, name, mosjes[], piecies[], snellePiecies[], places[], quests[] }

export async function loadUserDecks(uid) {
	const ready = await isFirebaseReady();
	if (!ready || !uid) return [];
	const db = getRtdb();
	const { ref, get } = await getRtdbAPI();
	const snap = await get(ref(db, `users/${uid}/decks`));
	if (!snap.exists()) return [];
	return Object.values(snap.val());
}

export async function saveDeck(uid, deck) {
	const ready = await isFirebaseReady();
	if (!ready || !uid || !deck?.id) return { success: false };
	const db = getRtdb();
	const { ref, set } = await getRtdbAPI();
	await set(ref(db, `users/${uid}/decks/${deck.id}`), deck);
	return { success: true };
}

export async function deleteDeck(uid, deckId) {
	const ready = await isFirebaseReady();
	if (!ready || !uid || !deckId) return;
	const db = getRtdb();
	const { ref, remove } = await getRtdbAPI();
	await remove(ref(db, `users/${uid}/decks/${deckId}`));
}
