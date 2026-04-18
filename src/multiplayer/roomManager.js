// roomManager.js — Creates and joins game rooms using 4-digit codes.
// Player 1 creates → writes room doc to Firestore → gets back the code.
// Player 2 enters the code → reads the room → joins as player_2.
//
// Firestore document path:  rooms/{roomCode}
// Document shape:
//   {
//     roomCode: "4827",
//     status: "WAITING" | "PLAYING" | "FINISHED",
//     createdAt: timestamp,
//     players: {
//       player_1: { name, deckId, uid },
//       player_2: { name, deckId, uid } | null
//     },
//     gameState: { ...full engine state } | null
//   }

import { isFirebaseReady, getDb } from '../firebase.js';

console.log('[SYNC] roomManager.js loaded');

// ── Firestore imports (loaded lazily) ──────────────────────────────────────
async function getFirestoreAPI() {
	const { doc, getDoc, setDoc, updateDoc, serverTimestamp } =
		await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
	return { doc, getDoc, setDoc, updateDoc, serverTimestamp };
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function generateRoomCode() {
	return String(Math.floor(1000 + Math.random() * 9000));
}

// ── createRoom ───────────────────────────────────────────────────────────────
// Creates a new room document in Firestore.
// Returns { roomCode, success, error? }
export async function createRoom(playerName, deckId, uid) {
	const ready = await isFirebaseReady();
	if (!ready) {
		const code = generateRoomCode();
		console.log('[SYNC] LOCAL mode — room code (not synced):', code);
		return { roomCode: code, success: true, local: true };
	}

	const db = getDb();
	const { doc, getDoc, setDoc, serverTimestamp } = await getFirestoreAPI();

	// Try up to 5 codes to avoid collisions
	for (let attempt = 0; attempt < 5; attempt++) {
		const roomCode = generateRoomCode();
		const roomRef = doc(db, 'rooms', roomCode);
		const snap = await getDoc(roomRef);

		if (!snap.exists()) {
			await setDoc(roomRef, {
				roomCode,
				status: 'WAITING',
				createdAt: serverTimestamp(),
				players: {
					player_1: { name: playerName, deckId, uid },
					player_2: null,
				},
				gameState: null,
			});
			console.log('[SYNC] Room created:', roomCode);
			return { roomCode, success: true };
		}
	}

	return { roomCode: null, success: false, error: 'Could not generate a unique room code.' };
}

// ── joinRoom ─────────────────────────────────────────────────────────────────
// Joins an existing room as player_2.
// Returns { roomDoc, success, error? }
export async function joinRoom(roomCode, playerName, deckId, uid) {
	const ready = await isFirebaseReady();
	if (!ready) {
		console.log('[SYNC] LOCAL mode — join skipped');
		return { success: true, local: true, roomDoc: null };
	}

	const db = getDb();
	const { doc, getDoc, updateDoc } = await getFirestoreAPI();
	const roomRef = doc(db, 'rooms', roomCode);
	const snap = await getDoc(roomRef);

	if (!snap.exists()) {
		return { success: false, error: `Room ${roomCode} not found.` };
	}

	const data = snap.data();
	if (data.status !== 'WAITING') {
		return { success: false, error: `Room ${roomCode} is already in progress or finished.` };
	}
	if (data.players?.player_2) {
		return { success: false, error: `Room ${roomCode} is already full.` };
	}

	await updateDoc(roomRef, {
		'players.player_2': { name: playerName, deckId, uid },
		status: 'PLAYING',
	});

	console.log('[SYNC] Joined room:', roomCode);
	return { success: true, roomDoc: { ...data, players: { ...data.players, player_2: { name: playerName, deckId, uid } } } };
}

// ── getRoomRef ────────────────────────────────────────────────────────────────
// Returns the Firestore DocumentReference for a room, or null in LOCAL mode.
export async function getRoomRef(roomCode) {
	const ready = await isFirebaseReady();
	if (!ready) return null;

	const db = getDb();
	const { doc } = await getFirestoreAPI();
	return doc(db, 'rooms', roomCode);
}
