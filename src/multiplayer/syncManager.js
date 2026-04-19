// syncManager.js — Keeps both players' gameState in sync via Realtime Database.
//
// Strategy:
//   - After every local mutation: pushState(roomCode, gameState)
//   - Both players subscribe with onValue on rooms/{roomCode}
//   - When a snapshot arrives from the opponent (i.e. activePlayerId changed
//     to a player_id we do NOT own), we call onRemoteUpdate(gameState)
//
// Why RTDB instead of Firestore snapshot listeners:
// Some privacy extensions block Firestore Listen/channel requests.
// RTDB uses a different transport path and works in more client setups.

// All RTDB calls are no-ops in LOCAL mode (firebaseAvailable = false).

import { isFirebaseReady, getRtdb } from '../firebase.js';
import { eventBus } from './eventBus.js';

console.log('[SYNC] syncManager.js loaded');

// ── RTDB imports (loaded lazily) ────────────────────────────────────────────
async function getRtdbAPI() {
	const { ref, get, update, onValue, off } =
		await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js');
	return { ref, get, update, onValue, off };
}

// ── Module state ──────────────────────────────────────────────────────────
let _localPlayerId = 'player_1';   // Which player this client controls
let _roomRef = null;
let _onValueHandler = null;
let _lastStateSignature = null;
let _lastPushedSignature = null;
let _hasSeenPlayer2 = false;

// ── pushState ─────────────────────────────────────────────────────────────
// Writes the full gameState object to Firestore.
// Called after every local mutation (play card, end turn, quest, etc.)
export async function pushState(roomCode, gameState) {
	const ready = await isFirebaseReady();
	if (!ready) return;

	const db = getRtdb();
	const { ref, update } = await getRtdbAPI();
	const roomRef = ref(db, `rooms/${roomCode}`);

	try {
		// Firestore cannot store undefined values — strip them out
		const sanitized = JSON.parse(JSON.stringify(gameState));
		_lastPushedSignature = JSON.stringify(sanitized);
		await update(roomRef, {
			gameState: sanitized,
			status: gameState.status === 'FINISHED' ? 'FINISHED' : 'PLAYING',
			updatedAt: Date.now(),
		});
		console.log('[SYNC] State pushed for room', roomCode);
	} catch (err) {
		console.error('[SYNC] pushState failed:', err);
	}
}

// ── listenToState ──────────────────────────────────────────────────────────
// Subscribes to RTDB room updates.
// When the opponent acts (activePlayerId !== _localPlayerId), emits
// eventBus 'mp:remote-state' with the new gameState.
//
// Also emits 'mp:player2-joined' once when player_2 first appears in the room.
export async function listenToState(roomCode, localPlayerId) {
	_localPlayerId = localPlayerId;

	const ready = await isFirebaseReady();
	if (!ready) {
		console.log('[SYNC] LOCAL mode — no RTDB sync started');
		return;
	}

	// Clean up any existing listener
	stopListening();
	_lastStateSignature = null;
	_lastPushedSignature = null;
	_hasSeenPlayer2 = false;

	const db = getRtdb();
	const { ref, onValue } = await getRtdbAPI();
	_roomRef = ref(db, `rooms/${roomCode}`);

	_onValueHandler = snap => {
		const data = snap.val();
		if (!data) return;

		// Notify once when player 2 joins the waiting room
		if (!_hasSeenPlayer2 && data.players?.player_2 && data.status === 'PLAYING') {
			_hasSeenPlayer2 = true;
			eventBus.emit('mp:player2-joined', data.players.player_2);
		}

		const gs = data.gameState;
		if (!gs) return;

		const signature = JSON.stringify(gs);
		if (signature === _lastStateSignature) return;
		_lastStateSignature = signature;

		// Ignore local RTDB echo of our own last push.
		// Do NOT use activePlayerId for filtering; that breaks turn handoff updates.
		if (signature === _lastPushedSignature) return;

		console.log('[SYNC] Remote state received. Active:', gs.activePlayerId);
		eventBus.emit('mp:remote-state', gs);

		if (gs.status === 'FINISHED') {
			eventBus.emit('mp:game-finished', gs);
		}
 	};

	onValue(_roomRef, _onValueHandler, err => {
		console.error('[SYNC] RTDB listener error:', err);
	});

	console.log('[SYNC] Listening to room (RTDB):', roomCode, '| local player:', localPlayerId);
}

// ── stopListening ──────────────────────────────────────────────────────────
// Stops RTDB listener (call on page unload / game end).
export function stopListening() {
	if (_roomRef && _onValueHandler) {
		import('https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js')
			.then(({ off }) => off(_roomRef, 'value', _onValueHandler))
			.catch(() => {});
		_roomRef = null;
		_onValueHandler = null;
		console.log('[SYNC] RTDB listener stopped');
	}
}
