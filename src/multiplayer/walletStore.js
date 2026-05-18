// walletStore.js — Reads and writes the Munten wallet for a user.
// Path: users/{uid}/wallet/{ munten, lifetimeEarned, lastUpdated }

import { isFirebaseReady, getRtdb } from '../firebase.js';

console.log('[WALLET] walletStore.js loaded');

async function getRtdbAPI() {
	const { ref, get, update, runTransaction } =
		await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js');
	return { ref, get, update, runTransaction };
}

export async function getWallet(uid) {
	const ready = await isFirebaseReady();
	if (!ready || !uid) return { munten: 0, lifetimeEarned: 0 };
	const db = getRtdb();
	const { ref, get } = await getRtdbAPI();
	try {
		const snap = await get(ref(db, `users/${uid}/wallet`));
		if (!snap.exists()) return { munten: 0, lifetimeEarned: 0 };
		return snap.val();
	} catch (err) {
		console.warn('[WALLET] getWallet failed:', err?.code);
		return { munten: 0, lifetimeEarned: 0 };
	}
}

export async function addMunten(uid, amount) {
	if (!uid || amount <= 0) return { success: false };
	const ready = await isFirebaseReady();
	if (!ready) return { success: false };
	const db = getRtdb();
	const { ref, runTransaction } = await getRtdbAPI();
	try {
		const walletRef = ref(db, `users/${uid}/wallet`);
		await runTransaction(walletRef, (current) => {
			const wallet = current ?? { munten: 0, lifetimeEarned: 0 };
			return {
				munten: (wallet.munten ?? 0) + amount,
				lifetimeEarned: (wallet.lifetimeEarned ?? 0) + amount,
				lastUpdated: Date.now(),
			};
		});
		return { success: true };
	} catch (err) {
		console.warn('[WALLET] addMunten failed:', err?.code);
		return { success: false };
	}
}

// Returns { success: true, newBalance } or { success: false, error }
// Uses read-then-write. Safe for single-user spend (one browser at a time).
export async function spendMunten(uid, amount) {
	if (!uid || amount <= 0) return { success: false, error: 'Invalid amount.' };
	const ready = await isFirebaseReady();
	if (!ready) return { success: false, error: 'Firebase unavailable.' };
	const db = getRtdb();
	const { ref, get, update } = await getRtdbAPI();
	try {
		const snap = await get(ref(db, `users/${uid}/wallet`));
		const wallet = snap.val() ?? { munten: 0 };
		const balance = wallet.munten ?? 0;
		if (balance < amount) {
			return { success: false, error: 'Not enough Munten.' };
		}
		const newBalance = balance - amount;
		await update(ref(db, `users/${uid}/wallet`), {
			munten: newBalance,
			lastUpdated: Date.now(),
		});
		return { success: true, newBalance };
	} catch (err) {
		console.warn('[WALLET] spendMunten failed:', err?.code);
		return { success: false, error: 'Transaction failed. Try again.' };
	}
}
