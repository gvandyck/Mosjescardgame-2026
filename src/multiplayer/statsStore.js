// statsStore.js — Reads and writes per-player win/loss/streak stats.
// Path: users/{uid}/stats/{ wins, losses, currentStreak, bestStreak }

import { isFirebaseReady, getRtdb } from '../firebase.js';

console.log('[STATS] statsStore.js loaded');

async function getRtdbAPI() {
	const { ref, get, runTransaction } =
		await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js');
	return { ref, get, runTransaction };
}

const DEFAULT_STATS = { wins: 0, losses: 0, currentStreak: 0, bestStreak: 0 };

export async function updateStats(uid, outcome) {
	if (!uid || (outcome !== 'win' && outcome !== 'loss')) return { success: false };
	const ready = await isFirebaseReady();
	if (!ready) return { success: false };
	const db = getRtdb();
	const { ref, runTransaction } = await getRtdbAPI();
	try {
		const statsRef = ref(db, `users/${uid}/stats`);
		await runTransaction(statsRef, (current) => {
			const s = current ?? { ...DEFAULT_STATS };
			if (outcome === 'win') {
				s.wins = (s.wins ?? 0) + 1;
				s.currentStreak = (s.currentStreak ?? 0) + 1;
				s.bestStreak = Math.max(s.bestStreak ?? 0, s.currentStreak);
			} else {
				s.losses = (s.losses ?? 0) + 1;
				s.currentStreak = 0;
			}
			return s;
		});
		return { success: true };
	} catch (err) {
		console.warn('[STATS] updateStats failed:', err?.code);
		return { success: false };
	}
}

export async function getStats(uid) {
	if (!uid) return { ...DEFAULT_STATS };
	const ready = await isFirebaseReady();
	if (!ready) return { ...DEFAULT_STATS };
	const db = getRtdb();
	const { ref, get } = await getRtdbAPI();
	try {
		const snap = await get(ref(db, `users/${uid}/stats`));
		if (!snap.exists()) return { ...DEFAULT_STATS };
		return { ...DEFAULT_STATS, ...snap.val() };
	} catch (err) {
		console.warn('[STATS] getStats failed:', err?.code);
		return { ...DEFAULT_STATS };
	}
}

// Returns full users node — leaderboard fetch should prefer fetchLeaderboard() in leaderboardStore.js
export async function getAllStats() {
	const ready = await isFirebaseReady();
	if (!ready) return {};
	const db = getRtdb();
	const { ref, get } = await getRtdbAPI();
	try {
		const snap = await get(ref(db, 'users'));
		return snap.val() ?? {};
	} catch (err) {
		console.warn('[STATS] getAllStats failed:', err?.code);
		return {};
	}
}
