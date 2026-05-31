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
let _hasSeenAbandoned = false;
let _disconnectHooks = [];  // onDisconnect refs to cancel when game ends normally

function showToast(message) {
	if (typeof document === 'undefined') return;
	const toast = document.createElement('div');
	toast.className = 'sync-toast';
	toast.textContent = String(message || '');
	document.body.appendChild(toast);
	setTimeout(() => toast.remove(), 3350);
}

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
		// Firebase RTDB strips null values from arrays, converting piecieSlots to an object
		// with integer string keys (e.g. [null, A, B, null] → {"1":A,"2":B}).
		// Pre-apply this transformation so that the echo signature matches _lastPushedSignature
		// and we correctly skip our own echoes instead of treating them as opponent actions.
		const forSig = JSON.parse(JSON.stringify(sanitized));
		for (const player of Object.values(forSig.players || {})) {
			if (Array.isArray(player.piecieSlots)) {
				const obj = {};
				player.piecieSlots.forEach((slot, i) => { if (slot !== null && slot !== undefined) obj[String(i)] = slot; });
				player.piecieSlots = obj;
			}
		}
		_lastPushedSignature = JSON.stringify(forSig);
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
	_hasSeenAbandoned = false;

	const db = getRtdb();
	const { ref, onValue } = await getRtdbAPI();
	_roomRef = ref(db, `rooms/${roomCode}`);

	_onValueHandler = snap => {
		const data = snap.val();
		console.log('[SYNC] onValue fired. data:', data ? `status=${data.status} hasP2=${!!data.players?.player_2} hasGameState=${!!data.gameState}` : 'null');
		if (!data) return;

		// Notify once when opponent abandons (disconnects mid-game)
		if (!_hasSeenAbandoned && data.status === 'ABANDONED') {
			_hasSeenAbandoned = true;
			console.log('[SYNC] Room abandoned — emitting mp:opponent-abandoned');
			eventBus.emit('mp:opponent-abandoned');
			return;
		}

		// Notify once when player 2 joins the waiting room
		if (!_hasSeenPlayer2) {
			console.log('[SYNC] player2-joined check: hasP2=', !!data.players?.player_2, 'status=', data.status);
		}
		if (!_hasSeenPlayer2 && data.players?.player_2 && data.status === 'PLAYING') {
			_hasSeenPlayer2 = true;
			console.log('[SYNC] Emitting mp:player2-joined for', data.players.player_2?.name);
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
		const quest = gs?.activeQuest;
		if (quest?.revealOpponentHand && Array.isArray(quest?.revealedOpponentHandNames)) {
			eventBus.emit('ui:show-opponent-hand-modal', quest.revealedOpponentHandNames);
			showToast('Your hand has been revealed by Perfect Sync!');
		}
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

// ── registerDisconnectLoss ────────────────────────────────────────────────
// Registers RTDB onDisconnect hooks so that if this client disconnects
// mid-match, the server automatically records a loss for them.
// Opponent win hook (opponentUid) is attempted but will be rejected by RTDB
// rules (T-07-08) — accepted limitation; future Cloud Function enhancement.
// Call cancelDisconnectHooks() when the game ends normally.
export async function registerDisconnectLoss(roomCode, uid, opponentUid) {
	// uid is optional — anonymous players still need the room ABANDONED hook
	if (!roomCode || roomCode === 'LOCAL') return;
	const ready = await isFirebaseReady();
	if (!ready) return;

	const db = getRtdb();
	const { ref, onDisconnect: getOnDisconnect, increment } =
		await import('https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js');

	_disconnectHooks = [];
	try {
		// Mark room as abandoned — any auth user can write to rooms/{roomCode}
		// so this onDisconnect write succeeds. The surviving player's onValue
		// listener detects status === 'ABANDONED' and ends the game for them.
		// This runs for ALL players, including anonymous guests.
		const roomHook = getOnDisconnect(ref(db, `rooms/${roomCode}`));
		await roomHook.update({ status: 'ABANDONED', abandonedAt: Date.now() });
		_disconnectHooks.push(roomHook);

		// Stats hooks require a real uid (anonymous players have no stats node)
		if (uid) {
			const myStatsRef = ref(db, `users/${uid}/stats`);
			const myHook = getOnDisconnect(myStatsRef);
			await myHook.update({ losses: increment(1), currentStreak: 0 });
			_disconnectHooks.push(myHook);

			if (opponentUid) {
				const oppStatsRef = ref(db, `users/${opponentUid}/stats`);
				const oppHook = getOnDisconnect(oppStatsRef);
				await oppHook.update({ wins: increment(1), currentStreak: increment(1) });
				_disconnectHooks.push(oppHook);
			}
		}
		console.log('[SYNC] Disconnect hooks registered. uid:', uid ?? 'anonymous');
	} catch (err) {
		console.warn('[SYNC] Could not register disconnect hooks:', err?.code);
	}
}

// ── cancelDisconnectHooks ─────────────────────────────────────────────────
// Cancels all onDisconnect hooks registered for this match.
// Must be called BEFORE stopListening() so the cancel reaches Firebase.
export async function cancelDisconnectHooks() {
	for (const hook of _disconnectHooks) {
		try { await hook.cancel(); } catch (_) {}
	}
	_disconnectHooks = [];
	console.log('[SYNC] Disconnect hooks cancelled');
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
