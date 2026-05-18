// collectionStore.js — Tracks which cards a player owns.
// Path: users/{uid}/collection/{ [cardId]: count }
//
// count = how many copies obtained from booster packs.
// Owning at least 1 copy means the card is "unlocked" in the deck builder.
// There is no copy cap — players can accumulate unlimited copies.

import { isFirebaseReady, getRtdb } from '../firebase.js';

console.log('[COLLECTION] collectionStore.js loaded');

async function getRtdbAPI() {
	const { ref, get, update, runTransaction } =
		await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js');
	return { ref, get, update, runTransaction };
}

// Returns { [cardId]: count } or {} on failure.
export async function getCollection(uid) {
	const ready = await isFirebaseReady();
	if (!ready || !uid) return {};
	const db = getRtdb();
	const { ref, get } = await getRtdbAPI();
	try {
		const snap = await get(ref(db, `users/${uid}/collection`));
		return snap.exists() ? snap.val() : {};
	} catch (err) {
		console.warn('[COLLECTION] getCollection failed:', err?.code);
		return {};
	}
}

// Returns a Set of cardIds the player owns at least 1 copy of.
export async function getOwnedCardIds(uid) {
	const collection = await getCollection(uid);
	return new Set(Object.keys(collection).filter(id => (collection[id] ?? 0) >= 1));
}

// Adds one copy of each cardId in the array to the player's collection.
// Uses a single batched update (not per-card transactions) — acceptable since
// booster opens are not concurrent with other collection writes.
export async function addCardsToCollection(uid, cardIds) {
	if (!uid || !cardIds?.length) return { success: false };
	const ready = await isFirebaseReady();
	if (!ready) return { success: false };
	const db = getRtdb();
	const { ref, get, update } = await getRtdbAPI();
	try {
		// Read current counts first so we can increment correctly
		const snap = await get(ref(db, `users/${uid}/collection`));
		const current = snap.exists() ? snap.val() : {};
		const patch = {};
		for (const cardId of cardIds) {
			patch[cardId] = (current[cardId] ?? 0) + 1;
		}
		await update(ref(db, `users/${uid}/collection`), patch);
		return { success: true };
	} catch (err) {
		console.warn('[COLLECTION] addCardsToCollection failed:', err?.code);
		return { success: false };
	}
}

// Seeds a player's collection with exactly 1 copy of each unique cardId.
// Only writes cards not already in the collection (safe to call multiple times).
export async function seedCollection(uid, cardIds) {
	if (!uid || !cardIds?.length) return;
	const ready = await isFirebaseReady();
	if (!ready) return;
	const db = getRtdb();
	const { ref, get, update } = await getRtdbAPI();
	try {
		const snap = await get(ref(db, `users/${uid}/collection`));
		const current = snap.exists() ? snap.val() : {};
		const patch = {};
		for (const cardId of cardIds) {
			if (!(cardId in current)) patch[cardId] = 1;
		}
		if (Object.keys(patch).length > 0) {
			await update(ref(db, `users/${uid}/collection`), patch);
		}
	} catch (err) {
		console.warn('[COLLECTION] seedCollection failed:', err?.code);
	}
}
