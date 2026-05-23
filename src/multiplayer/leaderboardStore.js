// leaderboardStore.js — Fetches and ranks all players by win/loss stats.

import { isFirebaseReady, getRtdb } from '../firebase.js';

console.log('[LEADERBOARD] leaderboardStore.js loaded');

async function getRtdbAPI() {
	const { ref, get } =
		await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js');
	return { ref, get };
}

/**
 * Fetches ranked leaderboard data from RTDB.
 * Returns array sorted descending by wins, ties broken by winRate.
 * Excludes players with no stats or no displayName.
 *
 * @returns {Promise<Array<{uid, displayName, wins, losses, winRate, currentStreak, bestStreak}>>}
 */
export async function fetchLeaderboard() {
	const ready = await isFirebaseReady();
	if (!ready) return [];
	const db = getRtdb();
	const { ref, get } = await getRtdbAPI();
	try {
		const snap = await get(ref(db, 'users'));
		if (!snap.exists()) return [];
		const usersData = snap.val();
		const players = [];
		for (const [uid, userData] of Object.entries(usersData)) {
			if (!userData?.stats) continue;
			const displayName = userData?.profile?.displayName;
			if (!displayName) continue;
			const { wins = 0, losses = 0, currentStreak = 0, bestStreak = 0 } = userData.stats;
			const total = wins + losses;
			const winRate = total === 0 ? 0 : Math.round((wins / total) * 1000) / 10;
			players.push({ uid, displayName, wins, losses, winRate, currentStreak, bestStreak });
		}
		players.sort((a, b) => b.wins - a.wins || b.winRate - a.winRate);
		return players;
	} catch (err) {
		console.warn('[LEADERBOARD] fetchLeaderboard failed:', err?.code);
		return [];
	}
}
