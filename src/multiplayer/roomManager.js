// roomManager.js — Creates and joins game rooms using 4-digit codes.
// Player 1 creates → writes room record to Realtime Database → gets back the code.
// Player 2 enters the code → reads the room → joins as player_2.
//
// RTDB path: rooms/{roomCode}
// Record shape:
//   {
//     roomCode: "4827",
//     status: "WAITING" | "PLAYING" | "FINISHED",
//     createdAt: number,
//     players: {
//       player_1: { name, deckId, uid },
//       player_2: { name, deckId, uid } | null
//     },
//     gameState: { ...full engine state } | null
//   }

import { isFirebaseReady, getRtdb } from '../firebase.js';

console.log('[SYNC] roomManager.js loaded');

// ── RTDB imports (loaded lazily) ────────────────────────────────────────────
async function getRtdbAPI() {
	const { ref, get, set, update } =
		await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js');
	return { ref, get, set, update };
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function generateRoomCode() {
	return String(Math.floor(1000 + Math.random() * 9000));
}

function buildPlayerRecord(name, deckId, uid) {
	const player = { name, deckId };
	if (uid) player.uid = uid;
	return player;
}

// ── createRoom ───────────────────────────────────────────────────────────────
// Creates a new room record in RTDB.
// Returns { roomCode, success, error? }
export async function createRoom(playerName, deckId, uid) {
	const ready = await isFirebaseReady();
	if (!ready) {
		const code = generateRoomCode();
		console.log('[SYNC] LOCAL mode — room code (not synced):', code);
		return { roomCode: code, success: true, local: true };
	}

	const db = getRtdb();
	const { ref, get, set } = await getRtdbAPI();

	// Try up to 5 codes to avoid collisions
	for (let attempt = 0; attempt < 5; attempt++) {
		const roomCode = generateRoomCode();
		const roomRef = ref(db, `rooms/${roomCode}`);
		const snap = await get(roomRef);

		if (!snap.exists()) {
			await set(roomRef, {
				roomCode,
				status: 'WAITING',
				createdAt: Date.now(),
				players: {
					player_1: buildPlayerRecord(playerName, deckId, uid),
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

	const db = getRtdb();
	const { ref, get, update } = await getRtdbAPI();
	const roomRef = ref(db, `rooms/${roomCode}`);
	const snap = await get(roomRef);

	if (!snap.exists()) {
		return { success: false, error: `Room ${roomCode} not found.` };
	}

	const data = snap.val();
	if (data.status !== 'WAITING') {
		return { success: false, error: `Room ${roomCode} is already in progress or finished.` };
	}
	if (data.players?.player_2) {
		return { success: false, error: `Room ${roomCode} is already full.` };
	}

	const joiningPlayer = buildPlayerRecord(playerName, deckId, uid);
	await update(roomRef, {
		players: {
			...(data.players || {}),
			player_2: joiningPlayer,
		},
		status: 'PLAYING',
		updatedAt: Date.now(),
	});

	console.log('[SYNC] Joined room:', roomCode);
	return {
		success: true,
		roomDoc: {
			...data,
			players: {
				...data.players,
				player_2: joiningPlayer,
			},
		},
	};
}

// ── getRoomRef ────────────────────────────────────────────────────────────────
// Returns the RTDB reference for a room, or null in LOCAL mode.
export async function getRoomRef(roomCode) {
	const ready = await isFirebaseReady();
	if (!ready) return null;

	const db = getRtdb();
	const { ref } = await getRtdbAPI();
	return ref(db, `rooms/${roomCode}`);
}
