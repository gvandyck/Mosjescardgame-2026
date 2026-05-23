// matchRewards.js — Awards Munten after a match and records match history.
//
// Uses a claimed flag at rooms/{roomCode}/rewards/{uid} to prevent double-awarding
// if the FINISHED handler fires more than once (page re-render, reconnect, etc).

import { isFirebaseReady, getRtdb } from '../firebase.js';
import { addMunten } from './walletStore.js';
import { updateStats } from './statsStore.js';

console.log('[REWARDS] matchRewards.js loaded');

const MUNTEN_WIN  = 50;
const MUNTEN_LOSS = 15;

async function getRtdbAPI() {
	const { ref, get, set, update } =
		await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js');
	return { ref, get, set, update };
}

/**
 * Claim the post-match Munten reward for one player.
 * Safe to call multiple times — subsequent calls are no-ops.
 *
 * @param {string} roomCode
 * @param {string} uid         Firebase Auth UID of the claiming player
 * @param {'win'|'loss'} outcome
 * @param {string} opponentName display name of the other player
 * @returns {{ muntenAwarded: number, alreadyClaimed: boolean }}
 */
export async function claimMatchReward(roomCode, uid, outcome, opponentName = 'Opponent') {
	if (!uid || !roomCode || roomCode === 'LOCAL') {
		return { muntenAwarded: 0, alreadyClaimed: false };
	}

	const ready = await isFirebaseReady();
	if (!ready) return { muntenAwarded: 0, alreadyClaimed: false };

	const db = getRtdb();
	const { ref, get, set, update } = await getRtdbAPI();

	// Deduplication check
	const claimRef = ref(db, `rooms/${roomCode}/rewards/${uid}`);
	try {
		const snap = await get(claimRef);
		if (snap.val()?.claimed === true) {
			console.log('[REWARDS] Already claimed for uid:', uid);
			return { muntenAwarded: snap.val().muntenAwarded ?? 0, alreadyClaimed: true };
		}
	} catch (err) {
		console.warn('[REWARDS] Could not read claim flag:', err?.code);
		return { muntenAwarded: 0, alreadyClaimed: false };
	}

	const muntenAwarded = outcome === 'win' ? MUNTEN_WIN : MUNTEN_LOSS;

	// Award Munten
	const walletResult = await addMunten(uid, muntenAwarded);
	if (!walletResult.success) {
		console.warn('[REWARDS] addMunten failed — reward not recorded');
		return { muntenAwarded: 0, alreadyClaimed: false };
	}

	// Update win/loss stats
	await updateStats(uid, outcome);

	// Write match history
	try {
		await set(ref(db, `users/${uid}/matchHistory/${roomCode}`), {
			outcome,
			muntenEarned: muntenAwarded,
			opponentName,
			timestamp: Date.now(),
		});
	} catch (err) {
		console.warn('[REWARDS] Could not write match history:', err?.code);
	}

	// Mark as claimed
	try {
		await set(claimRef, {
			claimed: true,
			outcome,
			muntenAwarded,
			claimedAt: Date.now(),
		});
	} catch (err) {
		console.warn('[REWARDS] Could not set claim flag:', err?.code);
	}

	console.log(`[REWARDS] Claimed ${muntenAwarded} Munten (${outcome}) for uid: ${uid}`);
	return { muntenAwarded, alreadyClaimed: false };
}
