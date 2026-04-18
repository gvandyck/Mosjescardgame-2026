// syncManager.js — Keeps both players' gameState in sync via Firestore.
//
// Strategy:
//   - After every local mutation: pushState(roomCode, gameState)
//   - Both players listen via onSnapshot on rooms/{roomCode}
//   - When a snapshot arrives from the opponent (i.e. activePlayerId changed
//     to a player_id we do NOT own), we call onRemoteUpdate(gameState)
//
// All Firestore calls are no-ops in LOCAL mode (firebaseAvailable = false).

import { isFirebaseReady, getDb } from '../firebase.js';
import { eventBus } from './eventBus.js';

console.log('[SYNC] syncManager.js loaded');

// ── Firestore imports (loaded lazily) ──────────────────────────────────────
async function getFirestoreAPI() {
	const { doc, updateDoc, onSnapshot } =
		await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js');
	return { doc, updateDoc, onSnapshot };
}

// ── Module state ──────────────────────────────────────────────────────────
let _unsubscribe = null;
let _localPlayerId = 'player_1';   // Which player this client controls

// ── pushState ─────────────────────────────────────────────────────────────
// Writes the full gameState object to Firestore.
// Called after every local mutation (play card, end turn, quest, etc.)
export async function pushState(roomCode, gameState) {
	const ready = await isFirebaseReady();
	if (!ready) return;

	const db = getDb();
	const { doc, updateDoc } = await getFirestoreAPI();
	const roomRef = doc(db, 'rooms', roomCode);

	try {
		// Firestore cannot store undefined values — strip them out
		const sanitized = JSON.parse(JSON.stringify(gameState));
		await updateDoc(roomRef, { gameState: sanitized, status: gameState.status === 'FINISHED' ? 'FINISHED' : 'PLAYING' });
		console.log('[SYNC] State pushed for room', roomCode);
	} catch (err) {
		console.error('[SYNC] pushState failed:', err);
	}
}

// ── listenToState ──────────────────────────────────────────────────────────
// Subscribes to real-time Firestore updates for the given room.
// When the opponent acts (activePlayerId !== _localPlayerId), emits
// eventBus 'mp:remote-state' with the new gameState.
//
// Also emits 'mp:player2-joined' once when player_2 first appears in the room.
export async function listenToState(roomCode, localPlayerId) {
	_localPlayerId = localPlayerId;

	const ready = await isFirebaseReady();
	if (!ready) {
		console.log('[SYNC] LOCAL mode — no Firestore listener started');
		return;
	}

	// Clean up any existing listener
	if (_unsubscribe) {
		_unsubscribe();
		_unsubscribe = null;
	}

	const db = getDb();
	const { doc, onSnapshot } = await getFirestoreAPI();
	const roomRef = doc(db, 'rooms', roomCode);

	_unsubscribe = onSnapshot(roomRef, snap => {
		if (!snap.exists()) return;
		const data = snap.data();

		// Notify when player 2 joins the waiting room
		if (data.players?.player_2 && data.status === 'PLAYING') {
			eventBus.emit('mp:player2-joined', data.players.player_2);
		}

		const gs = data.gameState;
		if (!gs) return;

		// Only act on opponent's writes to avoid re-applying our own pushes
		if (gs.activePlayerId !== _localPlayerId) {
			console.log('[SYNC] Remote state received from opponent. Active:', gs.activePlayerId);
			eventBus.emit('mp:remote-state', gs);
		}

		if (gs.status === 'FINISHED') {
			eventBus.emit('mp:game-finished', gs);
		}
	}, err => {
		console.error('[SYNC] Firestore snapshot error:', err);
	});

	console.log('[SYNC] Listening for room:', roomCode, '| local player:', localPlayerId);
}

// ── stopListening ──────────────────────────────────────────────────────────
// Unsubscribes the Firestore listener (call on page unload / game end).
export function stopListening() {
	if (_unsubscribe) {
		_unsubscribe();
		_unsubscribe = null;
		console.log('[SYNC] Listener stopped');
	}
}
