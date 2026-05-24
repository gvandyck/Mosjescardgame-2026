// main.js — Entry point for the app.
// Detects the current page and starts the matching UI flow.

import { renderBoard, showPlaceEffectBanner } from './ui/boardRenderer.js';
import { createLogRenderer } from './ui/logRenderer.js';
import { renderHand } from './ui/handRenderer.js';
import { initModalManager } from './ui/modalManager.js';
import { createInitialGameState, getOpponentMosjes, getPlayerMosjes } from './engine/gameState.js';
import { startTurn, endTurn, attemptGeneralQuest, attemptPersonalQuest, playPiecie, activatePiecie, playSnellie, playPlace, activatePlace, playMosje, useMosjeAbility, canPlayerActNow, playPersonalQuest, activatePersonalQuest } from './engine/turnManager.js';
import { resolveQuest, canAttemptGeneralQuest, canAttemptPersonalQuest, getQuestDiceThreshold } from './abilities/questLogic.js';
import { loseMP, gainMP } from './engine/mpManager.js';
import { MOSJES } from './data/mosjes.js';
import { PIECIES } from './data/piecies.js';
import { SNELLE_PIECIES } from './data/snellePiecies.js';
import { PLACES } from './data/places.js';
import { QUESTS } from './data/quests.js';
import { createRoom, joinRoom } from './multiplayer/roomManager.js';
import { pushState, listenToState, stopListening, registerDisconnectLoss, cancelDisconnectHooks } from './multiplayer/syncManager.js';
import { eventBus } from './multiplayer/eventBus.js';
import { APP_VERSION } from './version.js';
import {
	onAuthStateChanged,
	signOut,
	getCurrentUser,
	reauthenticateCurrentUser,
	deleteCurrentAccount,
} from './multiplayer/authManager.js';
import { loadUserDecks, getLastUserStoreError, deleteUserData } from './multiplayer/userStore.js';
import { initNewAccount } from './multiplayer/accountSetup.js';
import { claimMatchReward } from './multiplayer/matchRewards.js';
import { showRewardOverlay } from './ui/rewardOverlay.js';

console.log('[UI] App bootstrapping...');

const CARD_LOOKUP = buildCardLookup();
let _customDecksCache = [];

const path = window.location.pathname.toLowerCase();

if (path.endsWith('/index.html') || path.endsWith('/')) {
	initLobbyPage();
}

if (path.endsWith('/game.html')) {
	initGamePage();
}

function initLobbyPage() {
	console.log('[UI] Initializing lobby page');
	setVersionLabel();
	const form = document.getElementById('lobby-form');
	if (!form) return;

	// Auth gate: redirect to account page if not signed in.
	// Also pre-fills name and shows user badge once auth resolves.
	onAuthStateChanged(async user => {
		if (!user) {
			window.location.href = './account.html';
			return;
		}
		// Pre-fill player name from account
		const nameInput = document.getElementById('player-name');
		if (nameInput && !nameInput.value && user.displayName) {
			nameInput.value = user.displayName;
		}
		// Show user badge
		const badge = document.getElementById('user-badge');
		const badgeName = document.getElementById('user-badge-name');
		const deleteAccountBtn = document.getElementById('btn-delete-account');
		if (badge && badgeName) {
			badgeName.textContent = user.isAnonymous ? 'Playing as Guest' : user.displayName || user.email;
			badge.hidden = false;
		}
		if (deleteAccountBtn) deleteAccountBtn.hidden = user.isAnonymous;
		// One-time account setup (wallet + starter collection) for registered users
		if (!user.isAnonymous) {
			initNewAccount(user.uid, user.displayName || '');
		}
		// Load custom decks into deck selector (registered users only)
		if (!user.isAnonymous) {
			const customDecks = await loadUserDecks(user.uid);
			if (getLastUserStoreError()) {
				console.warn('[UI] Custom decks could not load. Check Firebase Database rules.');
			}
			_customDecksCache = customDecks;
			if (customDecks.length > 0) {
				const deckSelect = document.getElementById('deck-select');
				const divider = document.createElement('option');
				divider.disabled = true;
				divider.textContent = '── My Decks ──';
				deckSelect.appendChild(divider);
				for (const d of customDecks) {
					const opt = document.createElement('option');
					opt.value = d.id;
					opt.textContent = d.name;
					deckSelect.appendChild(opt);
				}
			}
		}
	});

	// Sign out button
	document.getElementById('btn-signout')?.addEventListener('click', async () => {
		await signOut();
		window.location.href = './account.html';
	});

	document.getElementById('btn-delete-account')?.addEventListener('click', deleteSignedInAccount);

	form.addEventListener('submit', async event => {
		event.preventDefault();
		const name = String(document.getElementById('player-name')?.value || '').trim();
		const deckId = String(document.getElementById('deck-select')?.value || 'DIGITAL_CONTROL');
		const mode = String(document.querySelector('input[name="lobby-mode"]:checked')?.value || 'create');
		const roomCodeInput = String(document.getElementById('room-code')?.value || '').trim();

		if (!name) {
			window.alert('Please enter your player name.');
			return;
		}

		if (mode === 'join' && roomCodeInput.length !== 4) {
			window.alert('Please enter a 4-digit room code to join.');
			return;
		}

		const submitBtn = form.querySelector('button[type="submit"]');
		if (submitBtn) submitBtn.disabled = true;

		// Persist custom deck def to sessionStorage so game page can reconstruct it
		if (deckId.startsWith('custom_')) {
			const customDef = _customDecksCache.find(d => d.id === deckId);
			if (customDef) sessionStorage.setItem(`mosjes:customDeck:${deckId}`, JSON.stringify(customDef));
		}

		const lobbyUser = getCurrentUser();
		const lobbyUid = lobbyUser && !lobbyUser.isAnonymous ? lobbyUser.uid : null;

		if (mode === 'create') {
			const result = await createRoom(name, deckId, lobbyUid);
			if (!result.success) {
				window.alert(result.error || 'Could not create a room. Please try again.');
				if (submitBtn) submitBtn.disabled = false;
				return;
			}
			const code = result.roomCode;
			// Show room code to player so they can share it
			const display = document.getElementById('room-code-display');
			const codeEl = document.getElementById('room-code-value');
			if (display && codeEl) {
				codeEl.textContent = code;
				display.hidden = false;
				form.hidden = true;
			}
			sessionStorage.setItem('mosjes:lobby', JSON.stringify({ name, deckId, mode: 'create', roomCode: code, playerId: 'player_1' }));
			console.log('[UI] Room created:', code);
			setTimeout(() => {
				window.location.href = `./game.html?room=${encodeURIComponent(code)}&player=player_1`;
			}, 2000);
		} else {
			const result = await joinRoom(roomCodeInput, name, deckId, lobbyUid);
			if (!result.success) {
				window.alert(result.error || 'Could not join room. Please check the code and try again.');
				if (submitBtn) submitBtn.disabled = false;
				return;
			}
			// Store opponent (player_1) data if available from room doc
			const opponentData = result.roomDoc?.players?.player_1 || {};
			sessionStorage.setItem('mosjes:lobby', JSON.stringify({
				name,
				deckId,
				mode: 'join',
				roomCode: roomCodeInput,
				playerId: 'player_2',
				opponentName: opponentData.name || 'Opponent',
				opponentDeckId: opponentData.deckId || 'PHYSICAL_FORCE',
				opponentUid: opponentData.uid || null,
			}));
			console.log('[UI] Joined room:', roomCodeInput);
			window.location.href = `./game.html?room=${encodeURIComponent(roomCodeInput)}&player=player_2`;
		}
	});
}

async function deleteSignedInAccount() {
	const user = getCurrentUser();
	if (!user || user.isAnonymous) return;

	const confirmed = confirm(
		'Delete your MOSJES account permanently?\n\nThis removes your saved decks and account login. This cannot be undone.'
	);
	if (!confirmed) return;

	const providerIds = user.providerData?.map(provider => provider.providerId) || [];
	const password = providerIds.includes('password')
		? prompt('Enter your password to confirm account deletion:')
		: null;
	if (providerIds.includes('password') && !password) return;

	const deleteBtn = document.getElementById('btn-delete-account');
	if (deleteBtn) deleteBtn.disabled = true;

	const reauth = await reauthenticateCurrentUser(password);
	if (!reauth.success) {
		alert(reauth.error || 'Could not confirm your account. Please sign in again and try once more.');
		if (deleteBtn) deleteBtn.disabled = false;
		return;
	}

	const dataResult = await deleteUserData(user.uid);
	if (!dataResult.success) {
		alert(dataResult.error || 'Could not delete saved account data. Please try again.');
		if (deleteBtn) deleteBtn.disabled = false;
		return;
	}

	const authResult = await deleteCurrentAccount();
	if (!authResult.success) {
		alert(authResult.error || 'Could not delete account. Please sign in again and try once more.');
		if (deleteBtn) deleteBtn.disabled = false;
		return;
	}

	window.location.href = './account.html?msg=account-deleted';
}

function initGamePage() {
	console.log('[UI] Initializing game page');
	setVersionLabel();

	const boardRoot = document.getElementById('board-root');
	const handRoot = document.getElementById('hand-root');
	const logRoot = document.getElementById('log-root');
	const modalRoot = document.getElementById('modal-root');
	const turnLabel = document.getElementById('turn-label');
	const logToggleBtn = document.getElementById('btn-toggle-log');
	const logPopover = document.getElementById('topbar-log-popover');
	const copyLogBtn = document.getElementById('btn-copy-log');
	const logCopyBuffer = document.getElementById('log-copy-buffer');
	const topbarPlaceLabel = document.getElementById('topbar-place');

	if (!boardRoot || !handRoot || !logRoot || !modalRoot) {
		console.log('[UI] Game containers missing — page not fully ready');
		return;
	}

	if (logToggleBtn && logPopover) {
		const setLogOpen = (open) => {
			logPopover.classList.toggle('is-visible', open);
			logToggleBtn.setAttribute('aria-expanded', String(open));
			logToggleBtn.classList.toggle('is-open', open);
		};

		setLogOpen(false);

		logToggleBtn.addEventListener('click', () => {
			const isOpen = logPopover.classList.contains('is-visible');
			setLogOpen(!isOpen);
		});

		document.addEventListener('click', (event) => {
			if (!logPopover.classList.contains('is-visible')) return;
			const target = event.target;
			if (!(target instanceof Node)) return;
			if (logPopover.contains(target) || logToggleBtn.contains(target)) return;
			setLogOpen(false);
		});

		document.addEventListener('keydown', (event) => {
			if (event.key === 'Escape' && logPopover.classList.contains('is-visible')) setLogOpen(false);
		});
	}

	const urlParams = new URLSearchParams(window.location.search);
	const lobbyData = readLobbyData();
	const log = createLogRenderer(logRoot);

	const roomCodeBadge = document.getElementById('topbar-room-code');
	const roomCodeValue = document.getElementById('topbar-room-code-value');
	if (roomCodeBadge && roomCodeValue && lobbyData.roomCode) {
		roomCodeValue.textContent = lobbyData.roomCode;
		roomCodeBadge.hidden = false;
	}
	const modal = initModalManager(modalRoot);
	if (logCopyBuffer) log.attachBuffer(logCopyBuffer);

	if (topbarPlaceLabel) {
		topbarPlaceLabel.style.cursor = 'pointer';
		topbarPlaceLabel.title = 'Show active Place details';
		topbarPlaceLabel.addEventListener('click', () => {
			if (!gameState?.activePlace) {
				modal.showInfo('No Active Place', 'There is currently no active Place card.');
				return;
			}
			const placeDef = CARD_LOOKUP[gameState.activePlace] || PLACES.find(p => p.id === gameState.activePlace);
			if (!placeDef) {
				modal.showInfo('Active Place', gameState.activePlace);
				return;
			}
			modal.showPlaceDetailModal(placeDef);
		});
	}

	if (copyLogBtn) {
		copyLogBtn.addEventListener('click', async () => {
			const plain = log.asText();
			if (logCopyBuffer) logCopyBuffer.value = plain;
			try {
				if (navigator?.clipboard?.writeText) {
					await navigator.clipboard.writeText(plain);
					copyLogBtn.textContent = 'Copied';
					window.setTimeout(() => { copyLogBtn.textContent = 'Copy Log'; }, 1200);
					return;
				}
			} catch {
				// Fallback to selectable textarea below.
			}
			if (logCopyBuffer) {
				logCopyBuffer.focus();
				logCopyBuffer.select();
			}
		});
	}

	// Determine which player this client controls
	const localPlayerId = urlParams.get('player') || lobbyData.playerId || 'player_1';
	const opponentId = localPlayerId === 'player_1' ? 'player_2' : 'player_1';
	const roomCode = urlParams.get('room') || lobbyData.roomCode || 'LOCAL';

	const localPlayerName = lobbyData.name || 'Player 1';
	const localDeckId = lobbyData.deckId || 'DIGITAL_CONTROL';
	const opponentName = lobbyData.opponentName || 'Opponent';
	const opponentDeckId = lobbyData.opponentDeckId || pickOpponentDeck(localDeckId);
	const opponentUid = lobbyData.opponentUid || null;

	const isOnline = roomCode !== 'LOCAL';

	let gameState = null;

	// ── Sync helpers ──────────────────────────────────────────────────────
	function syncPush() {
		if (isOnline && gameState) pushState(roomCode, gameState);
	}

	// ── Post-match reward flow ────────────────────────────────────────────
	async function handleGameOver(gs) {
		await cancelDisconnectHooks();
		stopListening();
		const winnerName = gs.players[gs.winnerId]?.name || 'Unknown';
		const opponentName = gs.players[localPlayerId === 'player_1' ? 'player_2' : 'player_1']?.name || 'Opponent';
		const outcome = gs.winnerId === localPlayerId ? 'win' : 'loss';

		log.add('win', `${winnerName} won by ${gs.winReason}.`);

		let muntenAwarded = 0;
		const user = getCurrentUser();
		if (isOnline && user && !user.isAnonymous) {
			const result = await claimMatchReward(roomCode, user.uid, outcome, opponentName);
			muntenAwarded = result.muntenAwarded;
		}

		showRewardOverlay({ outcome, winnerName, winReason: gs.winReason, muntenAwarded, isOnline });
	}

	// ── Shared remote-state handler — registered after game init ─────────
	function onRemoteState(remoteState) {
		for (const [pid, p] of Object.entries(remoteState.players || {})) {
			const slots = p.piecieSlots;
			const slotsSummary = Array.isArray(slots)
				? slots.map((s, i) => s ? `[${i}] ${s.cardId} (${s.type})` : `[${i}] null`).join(' | ')
				: JSON.stringify(slots);
			console.log(`[UI] onRemoteState ${pid} piecieSlots:`, slotsSummary);
		}
		const { state: sanitizedState, changed } = sanitizeQuestCardsInPlayerZones(remoteState);
		gameState = sanitizedState;
		renderFromState(gameState);
		// Persist one-time migration so all clients stop seeing legacy GENERAL quests in player zones.
		if (changed && isOnline && localPlayerId === 'player_1') {
			syncPush();
		}
		const activeName = gameState.players[gameState.activePlayerId]?.name;
		log.add('quest', `Opponent acted — now ${activeName}'s turn.`);
		if (gameState.status === 'FINISHED') {
			handleGameOver(gameState);
		}
	}

	// ── Initialize game ──────────────────────────────────────────────────
	function resolveCustomDeckDef(deckId) {
		if (!deckId.startsWith('custom_')) return undefined;
		return _customDecksCache.find(d => d.id === deckId) || readCustomDeckFromSession(deckId);
	}

	function startGame(p1Name, p1Deck, p2Name, p2Deck) {
		const players = [
			{ playerId: 'player_1', name: p1Name, deckId: p1Deck, deckDef: resolveCustomDeckDef(p1Deck) },
			{ playerId: 'player_2', name: p2Name, deckId: p2Deck, deckDef: resolveCustomDeckDef(p2Deck) },
		];
		gameState = createInitialGameState(players, roomCode);
		gameState = startTurn(gameState);
		renderFromState(gameState);
		log.add('quest', `${localPlayerName} entered room ${roomCode}.`);
		log.add('gain', `Turn ${gameState.turnNumber} started for ${gameState.players[gameState.activePlayerId].name}.`);
		// Register ongoing remote handler for when opponent acts
		eventBus.on('mp:remote-state', onRemoteState);
		if (isOnline && localPlayerId === 'player_1') syncPush();
	}

	if (localPlayerId === 'player_1') {
		if (isOnline) {
			// Wait for player_2 to join, then start game
			if (turnLabel) turnLabel.textContent = 'Waiting for opponent to join...';
			log.add('quest', `Room code: ${roomCode}`);
			listenToState(roomCode, localPlayerId);
			eventBus.once('mp:player2-joined', p2Data => {
				console.log('[UI] mp:player2-joined received, p2Data:', p2Data);
				log.add('gain', `${p2Data.name} joined the room!`);
				const user = getCurrentUser();
				const uid = user && !user.isAnonymous ? user.uid : null;
				registerDisconnectLoss(roomCode, uid, p2Data.uid || null);
				try {
					startGame(localPlayerName, localDeckId, p2Data.name, p2Data.deckId || pickOpponentDeck(localDeckId));
				} catch (err) {
					console.error('[UI] startGame failed:', err);
					if (turnLabel) turnLabel.textContent = `Error starting game: ${err.message}`;
				}
			});
		} else {
			// LOCAL mode — start immediately
			startGame(localPlayerName, localDeckId, opponentName, opponentDeckId);
		}
	} else {
		// player_2: wait for player_1 to push initial state via onSnapshot
		if (turnLabel) turnLabel.textContent = 'Connecting to game...';
		log.add('quest', `Joining room ${roomCode} as ${localPlayerName}...`);
		listenToState(roomCode, localPlayerId);
		// First remote state initialises the game for player_2, then ongoing handler takes over
		eventBus.once('mp:remote-state', initialState => {
			console.log('[UI] mp:remote-state received (initial) for player_2');
			const user = getCurrentUser();
			const uid = user && !user.isAnonymous ? user.uid : null;
			registerDisconnectLoss(roomCode, uid, opponentUid);
			try {
				const { state: sanitizedState, changed } = sanitizeQuestCardsInPlayerZones(initialState);
				gameState = sanitizedState;
				renderFromState(gameState);
				if (changed && isOnline && localPlayerId === 'player_1') {
					syncPush();
				}
				log.add('gain', `Game started! Waiting for opponent's first turn.`);
				eventBus.on('mp:remote-state', onRemoteState);
			} catch (err) {
				console.error('[UI] renderFromState failed (player_2 init):', err);
				if (turnLabel) turnLabel.textContent = `Error loading game: ${err.message}`;
			}
		});
		// For LOCAL testing as player_2, fall back to starting immediately
		if (!isOnline) {
			startGame(opponentName, opponentDeckId, localPlayerName, localDeckId);
		}
	}

	// When opponent disconnects mid-game, auto-end the game and award a win
	if (isOnline) {
		eventBus.once('mp:opponent-abandoned', () => {
			if (!gameState || gameState.status === 'FINISHED') return;
			handleGameOver({
				...gameState,
				status: 'FINISHED',
				winnerId: localPlayerId,
				winReason: 'opponent disconnected',
			});
		});
	}

	// Stop Firestore listener on page unload
	window.addEventListener('beforeunload', stopListening);

	document.getElementById('btn-end-turn')?.addEventListener('click', () => {
		if (!gameState) return;
		if (gameState.activePlayerId !== localPlayerId) {
			modal.showInfo('Not Your Turn', 'Wait for your opponent to end their turn.');
			return;
		}
		const previousPlayerName = gameState.players[gameState.activePlayerId].name;
		gameState = endTurn(gameState);
		if (gameState.status !== 'FINISHED') {
			gameState = startTurn(gameState);
		}

		renderFromState(gameState);
		syncPush();
		log.add('quest', `${previousPlayerName} ended their turn.`);

		if (gameState.status === 'FINISHED') {
			handleGameOver(gameState);
			return;
		}

		const activeName = gameState.players[gameState.activePlayerId].name;
		log.add('gain', `Now active: ${activeName}. Turn ${gameState.turnNumber}.`);
	});

	document.getElementById('btn-general-quest')?.addEventListener('click', async () => {
		if (!gameState) return;
		if (gameState.activePlayerId !== localPlayerId) {
			modal.showInfo('Not Your Turn', 'You can only attempt quests on your own turn.');
			return;
		}
		const maxQGAttempts = gameState.activePlace === 'place_quest_haven' ? 2 : 1;
		if ((gameState.players[localPlayerId].questsAttemptedThisTurn || 0) >= maxQGAttempts) {
			modal.showInfo('Already Attempted', 'You have already attempted a quest this turn.');
			return;
		}

		const { state: newState, questCard: questRef } = attemptGeneralQuest(gameState);
		gameState = newState;


		if (!questRef) {
			log.add('quest', 'General Quest deck is empty!');
			renderFromState(gameState);
			return;
		}

		const questDef = CARD_LOOKUP[questRef.cardId];
		if (!questDef) {
			log.add('quest', `Unknown quest card: ${questRef.cardId}`);
			renderFromState(gameState);
			return;
		}

		const activeMosje = gameState.players[localPlayerId].activeSlots.find(s => s && !s.isDefeated);
		if (!canAttemptGeneralQuest(questDef, gameState, localPlayerId)) {
			log.add('quest', `Cannot attempt ${questDef.name} — active Mosje has negative MP.`);
			gameState.sharedGeneralQuestDiscard.push(questRef);
			renderFromState(gameState);
			return;
		}

		const threshold = getQuestDiceThreshold(questDef, activeMosje);
		// BUG-01 diagnostic: log computed threshold vs requirement description.
		// If the modal ever shows a wrong threshold, compare this log output to the
		// actual roll result. A mismatch means activeMosje here is stale (different
		// object than the one received by the requirement function).
		console.log(`[QUEST-DEBUG] ${questDef.name}: computed threshold=${threshold}, requirementDesc="${questDef.requirementDescription}", mosje=${activeMosje?.name}, mental=${activeMosje?.traits?.mental}`);
		log.add('quest', `${localPlayerName} is attempting General Quest: ${questDef.name}`);
		if (questDef.description) log.add('info', `Effect: ${questDef.description}`);

		const diceBonus = gameState._snelleFlags?.questDiceBonus || 0;
		const questPrepBonus = gameState.players[localPlayerId]?.questPrepBonus || 0;
		const placeDiceBonus = gameState.activePlace === 'place_synergy_chamber' ? 1 : 0;
		const skiffaRerolls = getSkiffaRerolls(gameState, localPlayerId);
		const forceReroll = gameState._snelleFlags?.forceReroll?.[localPlayerId] ?? false;

		// Phase 8 Rule 3: broadcast active quest so opponent can see it
		gameState.activeQuest = {
			questName: questDef.name,
			cardName: questDef.name,
			questType: questDef.questType || 'GENERAL',
			attacker: localPlayerId,
			successMP: questDef.successMP,
			failMP: questDef.failMP,
			currentMp: activeMosje?.mp ?? null,
		};
		// Render BEFORE consuming flags so modifier pills (e.g. +2 Quest Roll) stay visible
		renderFromState(gameState);
		// Consume the flags after rendering so the pill shows during quest prep
		if (diceBonus) delete gameState._snelleFlags.questDiceBonus;
		if (questPrepBonus) gameState.players[localPlayerId].questPrepBonus = 0;
		if (forceReroll) delete gameState._snelleFlags.forceReroll[localPlayerId];
		syncPush();

		// Geen Raad Vraag Aad — no dice; interactive card-type guess against opponent's hand
		if (questDef.id === 'quest_geen_raad_vraag_aad') {
			const opponentPlayer = gameState.players[opponentId];
			const opponentHand = opponentPlayer?.hand ?? [];
			const firstSlotIndex = gameState.players[localPlayerId].activeSlots
				.findIndex(s => s && !s.isDefeated);

			if (opponentHand.length === 0) {
				log.add('quest', 'Geen Raad: opponent hand is empty — quest cannot resolve.');
				gameState.activeQuest = null;
				if (!Array.isArray(gameState.sharedGeneralQuestDiscard)) gameState.sharedGeneralQuestDiscard = [];
				gameState.sharedGeneralQuestDiscard.push(questRef);
				renderFromState(gameState);
				syncPush();
				return;
			}

			const pickedIndex = await modal.showOpponentHandCardSelect({
				title: 'Geen Raad? Vraag Aad! — Pick a card',
				prompt: "Pick one of your opponent's face-down cards.",
				handSize: opponentHand.length,
				allowCancel: true,
			});
			if (pickedIndex === null) {
				gameState.activeQuest = null;
				gameState.sharedGeneralQuestDiscard.push(questRef);
				renderFromState(gameState);
				syncPush();
				return;
			}

			const guess = await modal.showCardTypeSelect({ title: 'Geen Raad: What type is this card?' });
			if (!guess) {
				gameState.activeQuest = null;
				gameState.sharedGeneralQuestDiscard.push(questRef);
				renderFromState(gameState);
				syncPush();
				return;
			}

			const actualCard = opponentHand[pickedIndex];
			const actualCardDef = CARD_LOOKUP[actualCard?.cardId];
			const actualCardType = actualCard?.type || actualCardDef?.type || 'UNKNOWN';
			const actualCardName = actualCardDef?.name || actualCard?.cardId || '???';

			await modal.showRevealedCard('Geen Raad — Card Revealed', actualCardName, actualCardType);

			const didSucceed = guess === actualCardType;
			const beforeResolve = gameState;
			gameState = resolveQuest(gameState, localPlayerId, questDef, didSucceed, firstSlotIndex);
			gameState.activeQuest = null;
			if (!Array.isArray(gameState.sharedGeneralQuestDiscard)) gameState.sharedGeneralQuestDiscard = [];
			gameState.sharedGeneralQuestDiscard.push(questRef);

			renderFromState(gameState);
			syncPush();

			log.add(didSucceed ? 'gain' : 'loss',
				`Geen Raad: guessed ${guess}, was ${actualCardType} → ${didSucceed ? '+50 MP' : '-25 MP'}`
			);
			logStateOutcome(log, beforeResolve, gameState, localPlayerId, 'Geen Raad? Vraag Aad! resolution');

			// Aad Recovery — each player who lost MP from this quest may discard 1 card to regain 40 MP
			let recoveryHappened = false;
			for (const pid of [localPlayerId, opponentId]) {
				const beforeSlot = beforeResolve.players[pid]?.activeSlots?.find(s => s && !s.isDefeated);
				const afterSlot = gameState.players[pid]?.activeSlots?.find(s => s && !s.isDefeated);
				if (!beforeSlot || !afterSlot || afterSlot.mp >= beforeSlot.mp) continue;

				const hand = gameState.players[pid]?.hand ?? [];
				if (hand.length === 0) continue;

				const pName = gameState.players[pid]?.name ?? pid;
				const mpLost = beforeSlot.mp - afterSlot.mp;
				const wantsRecovery = await modal.showConfirm(
					`${pName} — Aad Recovery`,
					`You lost ${mpLost} MP from Geen Raad. Discard 1 card to regain 40 MP?`
				);
				if (!wantsRecovery) continue;

				const handCards = hand.map(c => ({
					cardId: c.cardId,
					name: CARD_LOOKUP[c.cardId]?.name || c.cardId,
					description: c.type || CARD_LOOKUP[c.cardId]?.type || '',
				}));
				const discarded = await modal.showCardChoice(`${pName} — Pick a card to discard`, handCards);
				if (!discarded) continue;

				const cardIdx = gameState.players[pid].hand.findIndex(c => c.cardId === discarded.cardId);
				if (cardIdx !== -1) {
					const [removed] = gameState.players[pid].hand.splice(cardIdx, 1);
					if (!Array.isArray(gameState.players[pid].discard)) gameState.players[pid].discard = [];
					gameState.players[pid].discard.unshift(removed);
				}
				const slotIdx = gameState.players[pid].activeSlots.findIndex(s => s && !s.isDefeated);
				if (slotIdx >= 0) {
					gameState.players[pid].activeSlots[slotIdx].mp += 40;
				}
				log.add('gain', `${pName} — Aad Recovery: discarded ${discarded.name}, regained 40 MP`);
				recoveryHappened = true;
			}
			if (recoveryHappened) {
				renderFromState(gameState);
				syncPush();
			}
			return;
		}

		const gqSlots = gameState.players[localPlayerId].activeSlots
			.map((slot, index) => ({ slot, index }))
			.filter(({ slot }) => slot && !slot.isDefeated)
			.map(({ slot, index }) => ({
				slotIndex: index,
				name: slot.name || CARD_LOOKUP[slot.cardId]?.name || slot.cardId || 'Mosje',
				mp: slot.mp,
				traits: slot.traits || CARD_LOOKUP[slot.cardId]?.traits || {},
			}));

		// Check if player wants to pay 20 MP to attempt the quest
		const confirmPayment = await modal.showConfirm(
			`Attempt ${questDef.name}?`,
			'Pay 20 MP to attempt this quest?'
		);
		if (!confirmPayment) {
			// Player declined — return quest to discard and exit
			gameState.activeQuest = null;
			if (!Array.isArray(gameState.sharedGeneralQuestDiscard)) gameState.sharedGeneralQuestDiscard = [];
			gameState.sharedGeneralQuestDiscard.push(questRef);
			renderFromState(gameState);
			syncPush();
			return;
		}

		function runGeneralQuestDiceRoll(targetSlotIndex) {
			modal.showDiceRoll(questDef, threshold, (didSucceed) => {
				const beforeResolve = gameState;
				gameState = resolveQuest(gameState, localPlayerId, questDef, didSucceed, targetSlotIndex);
				gameState.activeQuest = null;
				if (!Array.isArray(gameState.sharedGeneralQuestDiscard)) {
					gameState.sharedGeneralQuestDiscard = [];
				}
				gameState.sharedGeneralQuestDiscard.push(questRef);
				renderFromState(gameState);
				syncPush();

				const mpDelta = didSucceed ? questDef.successMP : questDef.failMP;
				const sign = mpDelta >= 0 ? '+' : '';
				log.add(didSucceed ? 'gain' : 'loss',
					`${questDef.name}: ${didSucceed ? 'Success' : 'Failed'} → ${sign}${mpDelta} MP`
				);
				logStateOutcome(log, beforeResolve, gameState, localPlayerId, `${questDef.name} resolution`);
			}, { diceBonus: diceBonus + questPrepBonus + placeDiceBonus, forceReroll, skiffaRerolls });
		}

		function showQuestPreviewThenRoll(targetSlotIndex) {
			const targetMosje = gameState.players[localPlayerId].activeSlots[targetSlotIndex];
			if (targetMosje) {
				// Deduct 20 MP quest cost immediately upon selection
				const costState = loseMP(gameState, localPlayerId, targetSlotIndex, 20, 'QUEST_COST');
				gameState = costState;
				log.add('loss', `Quest attempt cost: -20 MP`);

				const updatedMosje = gameState.players[localPlayerId].activeSlots[targetSlotIndex];
				const thresholdForMosje = getQuestDiceThreshold(questDef, updatedMosje);
				modal.showQuestAttemptPreview(updatedMosje, questDef, thresholdForMosje, () => {
					runGeneralQuestDiceRoll(targetSlotIndex);
				}, { diceBonus: diceBonus + questPrepBonus + placeDiceBonus });
			} else {
				runGeneralQuestDiceRoll(targetSlotIndex);
			}
		}

		if (gqSlots.length > 1) {
			modal.showMosjeSelect(gqSlots, showQuestPreviewThenRoll, questDef);
		} else {
			showQuestPreviewThenRoll(gqSlots[0]?.slotIndex ?? 0);
		}
	});

	document.getElementById('btn-personal-quest')?.addEventListener('click', () => {
		if (!gameState) return;
		if (gameState.activePlayerId !== localPlayerId) {
			modal.showInfo('Not Your Turn', 'You can only place quests on your own turn.');
			return;
		}

		const personalQuestsInHand = gameState.players[localPlayerId].hand.filter(
			c => CARD_LOOKUP[c.cardId]?.questType === 'PERSONAL'
		);

		if (personalQuestsInHand.length === 0) {
			modal.showInfo('No Personal Quests', 'You have no Personal Quest cards in your hand.');
			return;
		}

		const handCard = personalQuestsInHand[0];
		const questDef = CARD_LOOKUP[handCard.cardId];

		const { state: newState, success, error } = playPersonalQuest(gameState, localPlayerId, handCard);
		if (!success) {
			modal.showInfo('Cannot Place', error || 'Cannot place this Quest right now.');
			return;
		}
		gameState = newState;
		log.add('quest', `Placed ${questDef?.name || 'Personal Quest'} face-down. Activate it next turn.`);
		syncPush();
		renderFromState(gameState);
	});

	function renderFromState(state) {
		const uiState = toBoardViewModel(state, localPlayerId);

		const isLocalTurn = state.activePlayerId === localPlayerId;
		const maxQuestAttempts = state.activePlace === 'place_quest_haven' ? 2 : 1;
		const alreadyAttempted = (state.players[localPlayerId].questsAttemptedThisTurn || 0) >= maxQuestAttempts;
		const gameOver = state.status === 'FINISHED';

		// Regular cards only on local turn; Snelle Piecies always available
		// Pass onPlay always so Snelle Piecies show their interrupt button
		const onPlay = !gameOver ? handlePlayCard : null;
		renderHand(
			handRoot,
			toHandViewModel(state.players[localPlayerId].hand),
			onPlay,
			isLocalTurn,
			state.activeQuest,
			localPlayerId,
			state
		);

		const onUseAbility = (isLocalTurn && !gameOver) ? handleUseAbility : null;
		const onActivatePiecie = (isLocalTurn && !gameOver) ? handleActivatePiecie : null;
		const onActivatePlace = (isLocalTurn && !gameOver) ? handleActivatePlace : null;
		const onOpenDiscard = handleOpenDiscard;
		const onPlayFromHand = (isLocalTurn && !gameOver) ? handlePlayCard : null;
		renderBoard(boardRoot, uiState, onUseAbility, null, onActivatePiecie, onActivatePlace, onOpenDiscard, onPlayFromHand);
		if (state._lastPlaceEffect?.placeName) {
			showPlaceEffectBanner(state._lastPlaceEffect.placeName, state._lastPlaceEffect.description, state._lastPlaceEffect.phase);
			delete state._lastPlaceEffect;
		}

		const questBtnsEnabled = isLocalTurn && !alreadyAttempted && !gameOver;
		const questsUsed = state.players[localPlayerId].questsAttemptedThisTurn || 0;
		const questHavenActive = state.activePlace === 'place_quest_haven';

		const phaseLabel = gameOver
			? 'Game Over'
			: isLocalTurn
				? (alreadyAttempted
					? 'MAIN Phase'
					: questHavenActive
						? `MAIN / QUEST Phase (${questsUsed}/2 quests used)`
						: 'MAIN / QUEST Phase')
				: `${uiState.activePlayerName}'s Turn`;

		if (turnLabel) {
			turnLabel.textContent = `${isLocalTurn ? 'You' : uiState.activePlayerName} • ${phaseLabel}`;
		}

		const topbarPlace = document.getElementById('topbar-place');
		const topbarPlaceTurns = document.getElementById('topbar-place-turns');
		if (topbarPlace) topbarPlace.textContent = uiState.activePlaceName || 'None';
		if (topbarPlaceTurns) {
			const turns = Number(uiState.activePlaceTurns || 0);
			topbarPlaceTurns.textContent = `${turns} turn${turns === 1 ? '' : 's'} active`;
		}

		// Toggle Place active visual indicator
		const pageBody = document.querySelector('.page--game');
		if (pageBody) {
			if (state.activePlace) {
				pageBody.classList.add('place-active');
			} else {
				pageBody.classList.remove('place-active');
			}
		}

		const btnGeneral = document.getElementById('btn-general-quest');
		const btnPersonal = document.getElementById('btn-personal-quest');
		const btnEndTurn = document.getElementById('btn-end-turn');

		const questBtnLabel = questHavenActive && questsUsed === 1 ? ' (2nd)' : '';
		if (btnGeneral) {
			btnGeneral.disabled = !questBtnsEnabled;
			btnGeneral.textContent = `General Quest 🎯${questBtnLabel}`;
		}
		if (btnPersonal) {
			btnPersonal.disabled = !questBtnsEnabled;
			btnPersonal.textContent = `Personal Quest ⭐${questBtnLabel}`;
		}
		if (btnEndTurn) btnEndTurn.disabled = !isLocalTurn || gameOver;
	}

	const WEST_CALCULATED_GUESS_IDS = new Set(['mosje_martin_senor_west']);

	async function handleUseAbility(mosjeId) {
		if (!gameState || gameState.status === 'FINISHED') return;

		const beforeAbility = gameState;

		// West — Tactical Calculated Guess: pick card type → reveal top of deck → resolve
		if (WEST_CALCULATED_GUESS_IDS.has(mosjeId)) {
			const deck = gameState.players[localPlayerId]?.deck ?? [];
			if (deck.length === 0) {
				modal.showInfo('Cannot Use Ability', 'Your deck is empty — Calculated Guess cannot be used.');
				return;
			}

			const guess = await modal.showCardTypeSelect({ title: 'West: Name a card type' });
			if (!guess) return;

			const topCard = deck[0];
			const topCardDef = CARD_LOOKUP[topCard?.cardId];
			const topCardType = topCard?.type || topCardDef?.type || 'UNKNOWN';
			const topCardName = topCardDef?.name || topCard?.cardId || '???';

			await modal.showRevealedCard('Revealed: Top of Your Deck', topCardName, topCardType);

			const stateForAbility = JSON.parse(JSON.stringify(gameState));
			stateForAbility._pendingTargets = {
				...(stateForAbility._pendingTargets || {}),
				west_guess: guess,
				west_top_card_type: topCardType,
			};

			const { state: newState, success, error } = useMosjeAbility(stateForAbility, localPlayerId, mosjeId);
			if (!success) {
				modal.showInfo('Cannot Use Ability', error || 'This ability cannot be used right now.');
				return;
			}
			gameState = newState;

			const slot = gameState.players[localPlayerId].activeSlots.find(s => s?.cardId === mosjeId);
			const isCorrect = guess === topCardType;
			log.add(isCorrect ? 'gain' : 'loss',
				`West Calculated Guess: guessed ${guess}, was ${topCardType} → ${isCorrect ? '+10 MP + draw 2' : '-10 MP'}`
			);
			logStateOutcome(log, beforeAbility, gameState, localPlayerId, `${slot?.name || mosjeId} ability`);
			syncPush();
			if (gameState.status === 'FINISHED') {
				stopListening();
				const winnerName = gameState.players[gameState.winnerId]?.name || 'Unknown';
				log.add('win', `${winnerName} won by ${gameState.winReason}.`);
				modal.showInfo('Match Finished', `${winnerName} wins by ${gameState.winReason}.`);
			}
			renderFromState(gameState);
			return;
		}

		const { state: newState, success, error } = useMosjeAbility(gameState, localPlayerId, mosjeId);
		if (!success) {
			modal.showInfo('Cannot Use Ability', error || 'This ability cannot be used right now.');
			return;
		}
		gameState = newState;

		const slot = gameState.players[localPlayerId].activeSlots.find(s => s?.cardId === mosjeId);
		log.add('gain', `Used ability: ${slot?.name || mosjeId}.`);
		const abilityDef = CARD_LOOKUP[mosjeId];
		if (abilityDef?.abilityDescription) log.add('info', `Effect: ${abilityDef.abilityDescription}`);
		logStateOutcome(log, beforeAbility, gameState, localPlayerId, `${slot?.name || mosjeId} ability`);
		syncPush();

		if (gameState.status === 'FINISHED') {
			stopListening();
			const winnerName = gameState.players[gameState.winnerId]?.name || 'Unknown';
			log.add('win', `${winnerName} won by ${gameState.winReason}.`);
			modal.showInfo('Match Finished', `${winnerName} wins by ${gameState.winReason}.`);
		}
		renderFromState(gameState);
	}

	async function handleActivatePersonalQuestFromField(slotIndex) {
		if (!gameState || gameState.status === 'FINISHED') return;

		const piecieSlot = gameState.players[localPlayerId]?.piecieSlots?.[slotIndex];
		const questDef = piecieSlot?.cardId ? CARD_LOOKUP[piecieSlot.cardId] : null;
		if (!questDef) { modal.showInfo('Error', 'Quest card not found.'); return; }

		if (!canAttemptPersonalQuest(questDef, gameState, localPlayerId)) {
			modal.showInfo('Cannot Activate', `${questDef.name} requires its Mosje to be on the field.`);
			return;
		}

		// Read-only guard checks (mirrors activatePersonalQuest) before showing any modal.
		const player = gameState.players[localPlayerId];
		const questSlotData = player?.piecieSlots?.[slotIndex];
		const canActivateOnTurn = Number.isFinite(questSlotData?.canActivateOnTurn) ? questSlotData.canActivateOnTurn : 0;
		if (gameState.turnNumber < canActivateOnTurn) {
			modal.showInfo('Cannot Activate', 'This Quest can be activated starting next turn.');
			return;
		}
		const questHavenActive = gameState.activePlace === 'place_quest_haven';
		const maxQuestsThisTurn = questHavenActive ? 2 : 1;
		if ((player.questsAttemptedThisTurn ?? 0) >= maxQuestsThisTurn) {
			modal.showInfo('Cannot Activate', 'You have already attempted a quest this turn.');
			return;
		}

		// Capture bonuses before any state mutation.
		const diceBonus = gameState._snelleFlags?.questDiceBonus || 0;
		const questPrepBonus = gameState.players[localPlayerId]?.questPrepBonus || 0;
		const placeDiceBonus = gameState.activePlace === 'place_synergy_chamber' ? 1 : 0;
		const skiffaRerolls = getSkiffaRerolls(gameState, localPlayerId);
		const forceReroll = gameState._snelleFlags?.forceReroll?.[localPlayerId] ?? false;

		// Build Mosje options from current state (quest card still on field at this point).
		const questSlots = gameState.players[localPlayerId].activeSlots
			.map((slot, index) => ({ slot, index }))
			.filter(({ slot }) => slot && !slot.isDefeated)
			.map(({ slot, index }) => ({
				slotIndex: index,
				name: slot.name || CARD_LOOKUP[slot.cardId]?.name || slot.cardId || 'Mosje',
				mp: slot.mp,
				traits: slot.traits || CARD_LOOKUP[slot.cardId]?.traits || {},
			}));

		// Fires only after the player confirms a Mosje in the selection modal.
		function onMosjeSelected(targetSlotIndex) {
			// Commit: remove quest from field, discard, increment attempt counter.
			const { state: activatedState, success, error } = activatePersonalQuest(gameState, localPlayerId, slotIndex);
			if (!success) { modal.showInfo('Cannot Activate', error || 'Quest cannot be activated now.'); return; }
			gameState = activatedState;

			// Deduct 20 MP from the chosen Mosje.
			gameState = loseMP(gameState, localPlayerId, targetSlotIndex, 20, 'QUEST_COST');
			log.add('loss', 'Quest attempt cost: -20 MP');

			const chosenMosje = gameState.players[localPlayerId].activeSlots[targetSlotIndex];
			gameState.activeQuest = {
				questName: questDef.name, cardName: questDef.name,
				questType: questDef.questType || 'PERSONAL', attacker: localPlayerId,
				successMP: questDef.successMP, failMP: questDef.failMP,
				currentMp: chosenMosje?.mp ?? null,
			};
			renderFromState(gameState);
			if (diceBonus) delete gameState._snelleFlags.questDiceBonus;
			if (questPrepBonus) gameState.players[localPlayerId].questPrepBonus = 0;
			if (forceReroll) delete gameState._snelleFlags.forceReroll[localPlayerId];
			syncPush();

			// Show quest detail preview (modal-card--mosje-detail).
			// "Attempt Quest" → dice roll. "Cancel" → close with no MP refund.
			const updatedMosje = gameState.players[localPlayerId].activeSlots[targetSlotIndex];
			modal.showQuestAttemptPreview(updatedMosje, questDef, getQuestDiceThreshold(questDef, updatedMosje), () => {
				runQuestDiceRoll(targetSlotIndex);
			}, { diceBonus: diceBonus + questPrepBonus + placeDiceBonus });
		}

		function runQuestDiceRoll(targetSlotIndex) {
			const liveMosje = gameState.players[localPlayerId].activeSlots[targetSlotIndex];
			const threshold = getQuestDiceThreshold(questDef, liveMosje);
			modal.showDiceRoll(questDef, threshold, (didSucceed) => {
				const beforeResolve = gameState;
				gameState = resolveQuest(gameState, localPlayerId, questDef, didSucceed, targetSlotIndex);
				gameState.activeQuest = null;

				// Perfect Sync: show opponent hand, then let player pick mosje for +70 MP.
				if (questDef.id === 'quest_personal_perfect_sync' && didSucceed) {
					const opponentId = Object.keys(gameState.players).find(pid => pid !== localPlayerId);
					const opponent = gameState.players[opponentId];
					const handCardIds = (opponent?.hand || []).map(c => c.cardId || c.id || 'Unknown');
					const opponentName = opponent?.name || 'Opponent';
					renderFromState(gameState);
					syncPush();
					modal.showHandViewerModal(handCardIds, opponentName, CARD_LOOKUP, () => {
						const liveMosjeSlots = gameState.players[localPlayerId].activeSlots
							.map((slot, index) => ({ slot, index }))
							.filter(({ slot }) => slot && !slot.isDefeated)
							.map(({ slot, index }) => ({
								slotIndex: index,
								name: slot.name || CARD_LOOKUP[slot.cardId]?.name || slot.cardId || 'Mosje',
								mp: slot.mp,
								traits: slot.traits || CARD_LOOKUP[slot.cardId]?.traits || {},
							}));
						modal.showMosjeSelect(liveMosjeSlots, (selectedSlotIndex) => {
							gameState = gainMP(gameState, localPlayerId, selectedSlotIndex, 70);
							renderFromState(gameState);
							syncPush();
							log.add('gain', `Perfect Sync: Success → +70 MP`);
							logStateOutcome(log, beforeResolve, gameState, localPlayerId, 'Perfect Sync resolution');
						}, null, { title: 'Perfect Sync', prompt: 'Select Mosje to receive +70 MP.' });
					});
					return;
				}

				renderFromState(gameState);
				syncPush();
				const mpDelta = didSucceed ? questDef.successMP : questDef.failMP;
				const sign = mpDelta >= 0 ? '+' : '';
				log.add(didSucceed ? 'gain' : 'loss', `${questDef.name}: ${didSucceed ? 'Success' : 'Failed'} → ${sign}${mpDelta} MP`);
				logStateOutcome(log, beforeResolve, gameState, localPlayerId, `${questDef.name} resolution`);
			}, { diceBonus: diceBonus + questPrepBonus + placeDiceBonus, forceReroll, skiffaRerolls });
		}

		log.add('quest', `Activating Personal Quest: ${questDef.name}`);
		modal.showMosjeSelect(questSlots, onMosjeSelected, questDef);
	}

	async function handleActivatePiecie(slotIndex) {
		if (!gameState || gameState.status === 'FINISHED') return;
		const beforeActivate = gameState;

		const slots = gameState.players[localPlayerId]?.piecieSlots;
		console.log(`[UI] handleActivatePiecie: slotIndex=${slotIndex}`);
		console.log(`[UI] piecieSlots at activation:`, Array.isArray(slots)
			? slots.map((s, i) => s ? `[${i}] ${s.cardId} (${s.type})` : `[${i}] null`).join(' | ')
			: String(slots));
		const piecieSlot = slots?.[slotIndex];
		const piecieCardDef = piecieSlot?.cardId ? CARD_LOOKUP[piecieSlot.cardId] : null;

		// Route Personal Quest activation to its own handler
		if (piecieSlot?.type === 'QUEST') {
			await handleActivatePersonalQuestFromField(slotIndex);
			return;
		}

		let stateForActivation = gameState;
		if (piecieCardDef?.effectId === 'effect_affoe') {
			const oppTargets = getOpponentMosjes(gameState, localPlayerId);
			const ownTargets = getPlayerMosjes(gameState, localPlayerId);
			if (oppTargets.length === 0) {
				modal.showInfo('No Targets', 'No valid opponent targets.');
				return;
			}
			const drainId = await modal.showTargetSelector(oppTargets, 'Choose an opponent Mosje to drain:');
			if (!drainId) return;
			let gainId = null;
			if (ownTargets.length > 0) {
				gainId = await modal.showTargetSelector(ownTargets, 'Choose your Mosje to receive MP:');
			}
			stateForActivation = JSON.parse(JSON.stringify(gameState));
			stateForActivation._pendingTargets = { affoe_drain: drainId, affoe_gain: gainId };
		} else if (piecieCardDef?.effectId === 'effect_kannetje_melk') {
			const ownTargets = getPlayerMosjes(gameState, localPlayerId);
			if (ownTargets.length > 1) {
				const selectedId = await modal.showTargetSelector(ownTargets, 'Choose your Mosje to receive MP:');
				if (!selectedId) return;
				const mosjeSlotIndex = parseInt(selectedId.split('_slot_')[1], 10);
				if (!Number.isNaN(mosjeSlotIndex)) {
					stateForActivation = JSON.parse(JSON.stringify(gameState));
					stateForActivation._pendingTargets = { own_slot_index: mosjeSlotIndex };
				}
			}
		}

		const { state: newState, success, error, cardDef, negated } = activatePiecie(stateForActivation, localPlayerId, slotIndex);
		if (!success) {
			modal.showInfo('Cannot Activate', error || 'That Piecie cannot be activated right now.');
			return;
		}
		gameState = newState;

		const activatedName = cardDef?.name || 'Piecie';
		if (negated) {
			log.add('loss', `Activated ${activatedName}, but it was negated.`);
		} else {
			log.add('gain', `Activated ${activatedName}.`);
			if (cardDef?.description) log.add('info', cardDef.description);
		}
		logStateOutcome(log, beforeActivate, gameState, localPlayerId, `${activatedName} activation`);
		syncPush();
		renderFromState(gameState);
	}

	function handleActivatePlace(slotIndex) {
		if (!gameState || gameState.status === 'FINISHED') return;
		const beforeActivate = gameState;

		const slots = gameState.players[localPlayerId]?.piecieSlots;
		console.log(`[UI] handleActivatePlace: slotIndex=${slotIndex}`);
		console.log(`[UI] piecieSlots at place activation:`, Array.isArray(slots)
			? slots.map((s, i) => s ? `[${i}] ${s.cardId} (${s.type})` : `[${i}] null`).join(' | ')
			: String(slots));
		const { state: newState, success, error, cardDef } = activatePlace(gameState, localPlayerId, slotIndex);
		if (!success) {
			modal.showInfo('Cannot Activate', error || 'That Place cannot be activated right now.');
			return;
		}
		gameState = newState;

		const activatedName = cardDef?.name || 'Place';
		log.add('gain', `Activated ${activatedName}.`);
		if (cardDef?.description) log.add('info', cardDef.description);
		logStateOutcome(log, beforeActivate, gameState, localPlayerId, `${activatedName} activation`);
		syncPush();
		renderFromState(gameState);
	}

	function handleOpenDiscard(playerId, isOwned) {
		try {
			console.log('[UI] handleOpenDiscard called for player:', playerId, 'isOwned:', isOwned);
			console.log('[UI] gameState exists?', !!gameState, 'gameState.players?', !!gameState?.players);
			if (!gameState) {
				console.error('[UI] No gameState available');
				return;
			}
			console.log('[UI] About to find player in gameState.players');
			console.log('[UI] gameState.players is array?', Array.isArray(gameState.players), 'length:', gameState.players?.length);
			// gameState.players is an object, not an array
			const player = gameState.players[playerId];
			console.log('[UI] Found player?', !!player, 'player:', player?.name || playerId);
			if (!player) {
				console.error('[UI] Player not found:', playerId, 'available players:', gameState.players.map(p => p.id));
				return;
			}
			console.log('[UI] Opening discard modal for player:', player.name || playerId, 'with', player.discard?.length || 0, 'cards');
			console.log('[UI] modal exists?', !!modal, 'modal.showDiscardViewerModal?', !!modal?.showDiscardViewerModal);
			modal.showDiscardViewerModal(player, isOwned);
			console.log('[UI] Modal should be open now');
		} catch (error) {
			console.error('[UI] Error in handleOpenDiscard:', error.message, error);
		}
	}

	async function handlePlayCard(cardId, cardType) {
		if (!gameState || gameState.status === 'FINISHED') return;

		// Enforce turn ownership — Snelle Piecies always allowed
		if (!canPlayerActNow(gameState, localPlayerId, cardType)) {
			modal.showInfo('Not Your Turn', 'You can only play regular cards on your own turn.');
			return;
		}

		// Targeting cards: show selector, then dispatch with resolved targets
		async function resolveTargetingCard(def, ref) {
			const beforePlay = gameState;
			const oppTargets = getOpponentMosjes(gameState, localPlayerId);
			const ownTargets = getPlayerMosjes(gameState, localPlayerId);

			if (oppTargets.length === 0) {
				modal.showInfo('No Targets', 'No valid opponent targets.');
				return;
			}

			const drainId = await modal.showTargetSelector(
				oppTargets,
				'Choose an opponent Mosje to drain:'
			);
			if (!drainId) return;

			let gainId = null;
			if (ownTargets.length > 0) {
				gainId = await modal.showTargetSelector(
					ownTargets,
					'Choose your Mosje to receive MP:'
				);
			}

			// Store targets on state for the effect to read
			const stateWithTargets = JSON.parse(JSON.stringify(gameState));
			stateWithTargets._pendingTargets = {
				affoe_drain: drainId,
				affoe_gain: gainId,
			};

			const { state: newState, success, error } = playPiecie(stateWithTargets, localPlayerId, ref, def);
			if (!success) {
				modal.showInfo('Cannot Play', error || 'That card cannot be played right now.');
				return;
			}
			gameState = newState;
			log.add('gain', `Played ${def.name}.`);
			if (def.description) log.add('info', `Effect: ${def.description}`);
			logStateOutcome(log, beforePlay, gameState, localPlayerId, `${def.name} activation`);
			syncPush();
			if (gameState.status === 'FINISHED') {
				stopListening();
				const winnerName = gameState.players[gameState.winnerId]?.name || 'Unknown';
				log.add('win', `${winnerName} won by ${gameState.winReason}.`);
				modal.showInfo('Match Finished', `${winnerName} wins by ${gameState.winReason}.`);
			}
			renderFromState(gameState);
		}

		// Some cards target one of your own active Mosjes (e.g. Kannetje Melk, Jensen)
		async function resolveOwnMosjeTarget(promptText) {
			const ownTargets = getPlayerMosjes(gameState, localPlayerId);
			if (ownTargets.length === 0) {
				modal.showInfo('No Active Mosje', 'You need at least one active Mosje for this card.');
				return null;
			}
			const selectedId = await modal.showTargetSelector(ownTargets, promptText);
			if (!selectedId) return null;

			const selectedParts = selectedId.split('_slot_');
			const selectedSlotIndex = parseInt(selectedParts[1], 10);
			if (Number.isNaN(selectedSlotIndex)) return null;

			const stateWithTargets = JSON.parse(JSON.stringify(gameState));
			stateWithTargets._pendingTargets = {
				...(stateWithTargets._pendingTargets || {}),
				own_slot_index: selectedSlotIndex,
			};
			return stateWithTargets;
		}

		const cardRef = gameState.players[localPlayerId].hand.find(c => c.cardId === cardId);
		const cardDef = CARD_LOOKUP[cardId];
		if (!cardRef || !cardDef) {
			console.warn('[UI] Unknown card played:', cardId);
			return;
		}

		if (cardType === 'PIECIE') {
			const beforePlay = gameState;
			const { state: newState, success, error } = playPiecie(gameState, localPlayerId, cardRef, cardDef);
			if (!success) {
				modal.showInfo('Cannot Play', error || 'That card cannot be played right now.');
				return;
			}
			gameState = newState;
			log.add('gain', `Placed ${cardDef.name} face-down.`);
			log.add('info', 'It can be activated from the field on a later turn.');
			logStateOutcome(log, beforePlay, gameState, localPlayerId, `${cardDef.name} placement`);
			syncPush();
			if (gameState.status === 'FINISHED') {
				stopListening();
				const winnerName = gameState.players[gameState.winnerId]?.name || 'Unknown';
				log.add('win', `${winnerName} won by ${gameState.winReason}.`);
				modal.showInfo('Match Finished', `${winnerName} wins by ${gameState.winReason}.`);
			}
			renderFromState(gameState);
			return;
		}

		if (cardType === 'MOSJE') {
			const beforePlay = gameState;
			const { state: newState, success, error } = playMosje(gameState, localPlayerId, cardRef);
			if (!success) {
				modal.showInfo('Cannot Play', error || 'That Mosje cannot be played right now.');
				return;
			}
			gameState = newState;
			log.add('gain', `Played Mosje: ${cardDef.name}.`);
			if (cardDef.abilityDescription) log.add('info', `Ability: ${cardDef.abilityDescription}`);
			logStateOutcome(log, beforePlay, gameState, localPlayerId, `${cardDef.name} deployment`);
			syncPush();
			renderFromState(gameState);
			return;
		}

		if (cardType === 'SNELLE_PIECIE') {
			const beforePlay = gameState;
			let snelleStateForPlay = gameState;
			let resultLog = null; // set inside effect-specific branches to log outcome details
			if (cardDef.effectId === 'effect_snelle_jensen') {
				const ownTargets = getPlayerMosjes(gameState, localPlayerId);
				snelleStateForPlay = JSON.parse(JSON.stringify(gameState));
				if (!snelleStateForPlay._pendingTargets) snelleStateForPlay._pendingTargets = {};
				if (ownTargets.length > 1) {
					const selectedId = await modal.showTargetSelector(ownTargets, 'Choose your Mosje to receive Jensen MP:');
					if (!selectedId) return;
					const parts = selectedId.split('_slot_');
					const idx = parseInt(parts[1], 10);
					if (!Number.isNaN(idx)) snelleStateForPlay._pendingTargets.jensen_slot_index = idx;
				} else if (ownTargets.length === 1) {
					snelleStateForPlay._pendingTargets.jensen_slot_index = ownTargets[0].slotIndex;
				}
			} else if (cardDef.effectId === 'effect_snelle_lucky_coin') {
				const isHeads = Math.random() < 0.5;
				snelleStateForPlay = JSON.parse(JSON.stringify(gameState));
				if (!snelleStateForPlay._pendingTargets) snelleStateForPlay._pendingTargets = {};
				if (isHeads) {
					snelleStateForPlay._pendingTargets.lucky_coin_result = 'heads';
					resultLog = { type: 'info', msg: 'Lucky Coin: Heads — reroll token granted!' };
				} else {
					const ownTargets = getPlayerMosjes(gameState, localPlayerId);
					if (ownTargets.length > 0) {
						const selectedId = await modal.showTargetSelector(ownTargets, 'Lucky Coin — Tails! Choose your Mosje to take 10 MP damage:');
						if (!selectedId) return;
						const slotIndex = parseInt(selectedId.split('_slot_')[1], 10);
						snelleStateForPlay._pendingTargets.lucky_coin_result = 'tails';
						if (!Number.isNaN(slotIndex)) snelleStateForPlay._pendingTargets.lucky_coin_tails_slot = slotIndex;
					} else {
						snelleStateForPlay._pendingTargets.lucky_coin_result = 'tails';
					}
					resultLog = { type: 'loss', msg: 'Lucky Coin: Tails — −10 MP to your Mosje.' };
				}
			}

			const { state: newState, success, error } = playSnellie(snelleStateForPlay, localPlayerId, cardRef, cardDef);
			if (!success) {
				modal.showInfo('Cannot Play', error || 'That card cannot be played right now.');
				return;
			}
			gameState = newState;
			log.add('gain', `Played ${cardDef.name} (instant).`);
			if (resultLog) log.add(resultLog.type, resultLog.msg);
			if (cardDef.description) log.add('info', `Effect: ${cardDef.description}`);
			logStateOutcome(log, beforePlay, gameState, localPlayerId, `${cardDef.name} instant activation`);
			syncPush();
			renderFromState(gameState);
			return;
		}

		if (cardType === 'QUEST') {
			if (gameState.activePlayerId !== localPlayerId) {
				modal.showInfo('Not Your Turn', 'You can only place quests on your own turn.');
				return;
			}
			if (cardDef.questType !== 'PERSONAL') {
				modal.showInfo('Cannot Play', 'Only Personal Quests can be placed from your hand.');
				return;
			}

			const { state: newState, success, error } = playPersonalQuest(gameState, localPlayerId, cardRef);
			if (!success) {
				modal.showInfo('Cannot Place', error || 'Cannot place this Quest right now.');
				return;
			}
			gameState = newState;
			log.add('quest', `Placed ${cardDef.name} face-down. Activate it next turn.`);
			syncPush();
			renderFromState(gameState);
			return;
		}

		if (cardType === 'PLACE') {
			const beforePlay = gameState;
			const { state: newState, success, error } = playPlace(gameState, localPlayerId, cardRef, cardDef);
			if (!success) {
				modal.showInfo('Cannot Play', error || 'That card cannot be played right now.');
				return;
			}
			gameState = newState;
			log.add('gain', `Played Place: ${cardDef.name}.`);
			if (cardDef.description) log.add('info', cardDef.description);
			logStateOutcome(log, beforePlay, gameState, localPlayerId, `${cardDef.name} placement`);
			syncPush();
			if (gameState.status === 'FINISHED') {
				stopListening();
				const winnerName = gameState.players[gameState.winnerId]?.name || 'Unknown';
				log.add('win', `${winnerName} won by ${gameState.winReason}.`);
				modal.showInfo('Match Finished', `${winnerName} wins by ${gameState.winReason}.`);
			}
			renderFromState(gameState);
		}
	}
}

function readLobbyData() {
	try {
		const raw = sessionStorage.getItem('mosjes:lobby');
		if (!raw) return {};
		return JSON.parse(raw);
	} catch {
		return {};
	}
}

function readCustomDeckFromSession(deckId) {
	try {
		const raw = sessionStorage.getItem(`mosjes:customDeck:${deckId}`);
		if (!raw) return undefined;
		return JSON.parse(raw);
	} catch {
		return undefined;
	}
}

function buildCardLookup() {
	const allCards = [...MOSJES, ...PIECIES, ...SNELLE_PIECIES, ...PLACES, ...QUESTS];
	const map = {};
	for (const card of allCards) map[card.id] = card;
	return map;
}

function toBoardViewModel(gameState, localPlayerId) {
	const localPlayer = gameState.players[localPlayerId];
	const opponentId = Object.keys(gameState.players).find(id => id !== localPlayerId);
	const opponent = gameState.players[opponentId];
	const isLocalTurn = gameState.activePlayerId === localPlayerId;

	const activePlaceCard = gameState.activePlace ? PLACES.find(p => p.id === gameState.activePlace) : null;

	return {
		activePlayerName: gameState.players[gameState.activePlayerId].name,
		turnPhase: 'DRAW',
		activePlaceName: activePlaceCard?.name || 'None',
		activePlace: activePlaceCard,
		activePlacePlayedBy: gameState.activePlacePlayedBy || null,
		activeQuest: gameState.activeQuest ?? null,
		activePlaceTurns: gameState.activePlaceTurnsActive || 0,
		gameState,
		myPlayerId: localPlayerId,
		players: {
			top: {
				id: opponentId,
				name: opponent.name,
				mosjes: toMosjeCards(opponent.activeSlots),
				activeModifiers: buildActiveModifiers(gameState, opponentId, false),
				piecies: toPiecieCards(opponent.piecieSlots, {
					ownerId: opponentId,
					localPlayerId,
					turnNumber: gameState.turnNumber,
					isLocalTurn,
					viewerOwns: false,
				}),
				discard: opponent.discard || [],
			},
			bottom: {
				id: localPlayerId,
				name: localPlayer.name,
				mosjes: toMosjeCards(localPlayer.activeSlots),
				activeModifiers: buildActiveModifiers(gameState, localPlayerId, true),
				piecies: toPiecieCards(localPlayer.piecieSlots, {
					ownerId: localPlayerId,
					localPlayerId,
					turnNumber: gameState.turnNumber,
					isLocalTurn,
					viewerOwns: true,
				}),
				discard: localPlayer.discard || [],
			},
		},
	};
}

function buildActiveModifiers(gameState, playerId, isLocalPlayer = false) {
	const flags = gameState._snelleFlags || {};
	const player = gameState.players[playerId];
	const pills = [];

	// Quest dice bonuses — only show on the local player's zone (they're the ones questing)
	if (isLocalPlayer) {
		const questBonus = (flags.questDiceBonus || 0) + (player?.questPrepBonus || 0);
		if (questBonus > 0) pills.push({ label: `+${questBonus} Quest Roll`, color: 'gold' });
	}

	if (flags.forceReroll?.[playerId])         pills.push({ label: '🎲 Reroll Ready', color: 'gold' });
	if (flags.negateNextPiecie?.[playerId])     pills.push({ label: '🛡 Negate Piecie', color: 'blue' });
	if (flags.negateNextAttack?.[playerId])     pills.push({ label: '⚡ Dodge Active', color: 'teal' });
	if (flags.negateNextElimination?.[playerId]) pills.push({ label: '💀 Not Today!', color: 'blue' });
	if (flags.doubleNextPiecie?.[playerId])     pills.push({ label: '×2 Double Trigger', color: 'purple' });
	if (flags.negateNextSearch?.[playerId])     pills.push({ label: '🚫 Anti-Search', color: 'orange' });
	if (flags.drainReversal?.[playerId])        pills.push({ label: '↩ Drain Reflect', color: 'orange' });
	const mpRed = flags.mpLossReduction?.[playerId];
	if (Number.isInteger(mpRed) && mpRed > 0)  pills.push({ label: `🛡 -${mpRed} Damage`, color: 'blue' });
	if (flags.copyLastPiecie?.forPlayer === playerId) pills.push({ label: '📋 Copy Ready', color: 'purple' });

	return pills;
}

function getSkiffaRerolls(gameState, playerId) {
	if (gameState?.activePlace !== 'place_skiffa') return 0;
	const activeMosje = gameState?.players?.[playerId]?.activeSlots?.find(s => s && !s.isDefeated);
	if (!activeMosje) return 0;
	const card = CARD_LOOKUP[activeMosje.cardId];
	if (card?.subtype !== 'ARTISTIC') return 0;
	const creative = Number(activeMosje?.traits?.creative || 0);
	return creative >= 3 ? 2 : 1;
}

function toMosjeCards(activeSlots) {
	return activeSlots
		.filter(slot => slot !== null)
		.map(slot => {
			const mosjeDef = MOSJES.find(m => m.id === slot.cardId);
			const cost = mosjeDef?.abilityCost ?? null;
			return {
				cardId: slot.cardId,
				name: slot.name,
				type: 'MOSJE',
				mp: slot.mp,
				level: slot.level,
				isDefeated: slot.isDefeated,
				traits: slot.traits ?? {},
				abilityUsedThisTurn: slot.abilityUsedThisTurn,
				abilityCost: cost,
				cantAffordAbility: cost != null && cost > 0 && slot.mp < cost,
				description: slot.isDefeated ? 'Defeated' : 'Active on field',
			};
		});
}

function toPiecieCards(piecieSlots, options = {}) {
	if (!Array.isArray(piecieSlots)) {
		console.log('[UI] toPiecieCards: piecieSlots is not an array:', typeof piecieSlots, JSON.stringify(piecieSlots));
		return [];
	}
	const {
		ownerId = null,
		localPlayerId = null,
		turnNumber = 1,
		isLocalTurn = false,
		viewerOwns = false,
	} = options;
	const canActivateForViewer = viewerOwns && ownerId === localPlayerId && isLocalTurn;

	const result = piecieSlots
		.map((slot, slotIndex) => ({ slot, slotIndex }))
		.filter(({ slot }) => slot !== null)
		.map(({ slot, slotIndex }) => {
			const isPlacedFaceDown = slot.faceDown !== false;
			const canActivateOnTurn = Number.isFinite(slot.canActivateOnTurn)
				? slot.canActivateOnTurn
				: ((Number.isFinite(slot.playedOnTurn) ? slot.playedOnTurn : turnNumber) + 1);
			const canActivateNow = canActivateForViewer && !slot.activated && turnNumber >= canActivateOnTurn;

			if (!viewerOwns && isPlacedFaceDown) {
				return {
					cardId: slot.cardId,
					name: 'Face-down Piecie',
					type: 'PIECIE',
					description: '',
					faceDown: true,
					slotIndex,
					canActivate: false,
				};
			}

			const def = CARD_LOOKUP[slot.cardId] || { id: slot.cardId, name: slot.cardId, type: 'PIECIE' };
			return {
				cardId: slot.cardId,
				name: def.name,
				type: def.type || 'PIECIE',
				subtype: def.subtype,
				description: def.description || '',
				faceDown: viewerOwns ? false : slot.faceDown === true,
				slotIndex,
				canActivate: canActivateNow,
			};
		});
	console.log('[UI] toPiecieCards result (owner=%s):', ownerId,
		result.map(c => `[${c.slotIndex}] ${c.cardId} (${c.type}) canActivate=${c.canActivate}`).join(' | ') || '(empty)');
	return result;
}

function toHandViewModel(hand) {
	return hand.map(cardRef => {
		const def = CARD_LOOKUP[cardRef.cardId];
		if (!def) {
			return {
				name: cardRef.cardId,
				type: cardRef.type || 'UNKNOWN',
				description: 'Unknown card definition',
			};
		}

		return {
			cardId: cardRef.cardId,
			name: def.name,
			type: def.type,
			description: def.description || def.requirementDescription || def.flavourText || '',
			questType: def.questType,
			requiredMosjeId: def.requiredMosjeId,
			difficulty: def.difficulty,
		};
	});
}

function pickOpponentDeck(localDeckId) {
	// Only Digital Control is available in starter selection (Phase 11+)
	return 'DIGITAL_CONTROL';
}

function logStateOutcome(log, beforeState, afterState, actorId, label = 'Action') {
	const lines = summarizeStateOutcome(beforeState, afterState, actorId);
	if (!lines.length) {
		log.add('info', `${label}: no visible stat changes.`);
		return;
	}
	log.add('info', `${label}:`);
	for (const line of lines.slice(0, 6)) {
		log.add('info', `- ${line}`);
	}
}

function summarizeStateOutcome(beforeState, afterState, actorId) {
	if (!beforeState || !afterState) return [];
	const lines = [];

	const beforePlace = beforeState.activePlace || 'None';
	const afterPlace = afterState.activePlace || 'None';
	if (beforePlace !== afterPlace) {
		const beforeName = beforePlace === 'None' ? 'None' : (CARD_LOOKUP[beforePlace]?.name || beforePlace);
		const afterName = afterPlace === 'None' ? 'None' : (CARD_LOOKUP[afterPlace]?.name || afterPlace);
		lines.push(`Place changed: ${beforeName} -> ${afterName}`);
	}

	for (const pid of Object.keys(afterState.players || {})) {
		const beforePlayer = beforeState.players?.[pid];
		const afterPlayer = afterState.players?.[pid];
		if (!afterPlayer) continue;
		const prefix = pid === actorId ? 'You' : (afterPlayer.name || pid);

		for (let i = 0; i < 2; i++) {
			const b = beforePlayer?.activeSlots?.[i] || null;
			const a = afterPlayer?.activeSlots?.[i] || null;
			if (!a && !b) continue;

			if (!b && a) {
				lines.push(`${prefix} fielded ${a.name || a.cardId} (MP ${a.mp ?? 0}).`);
				continue;
			}
			if (b && !a) {
				lines.push(`${prefix} lost ${b.name || b.cardId} from field.`);
				continue;
			}
			if (!a || !b) continue;

			const beforeMp = Number(b.mp || 0);
			const afterMp = Number(a.mp || 0);
			const delta = afterMp - beforeMp;
			if (delta !== 0) {
				const sign = delta > 0 ? '+' : '';
				lines.push(`${prefix} ${a.name || a.cardId}: ${sign}${delta} MP (now ${afterMp}).`);
			}

			if ((b.level || 0) !== (a.level || 0)) {
				const beforeLevel = (b.level || 0) + 1;
				const afterLevel = (a.level || 0) + 1;
				lines.push(`${prefix} ${a.name || a.cardId}: level ${beforeLevel} -> ${afterLevel}.`);
			}
			if (!b.isDefeated && a.isDefeated) {
				lines.push(`${prefix} ${a.name || a.cardId} was defeated.`);
			}
		}

		const zones = [
			['hand', 'cards in hand'],
			['deck', 'cards in deck'],
			['discard', 'cards in discard'],
			['welloe', 'cards in welloe'],
		];
		for (const [zoneKey, labelText] of zones) {
			const beforeCount = Array.isArray(beforePlayer?.[zoneKey]) ? beforePlayer[zoneKey].length : 0;
			const afterCount = Array.isArray(afterPlayer?.[zoneKey]) ? afterPlayer[zoneKey].length : 0;
			const zoneDelta = afterCount - beforeCount;
			if (zoneDelta !== 0) {
				const sign = zoneDelta > 0 ? '+' : '';
				lines.push(`${prefix}: ${labelText} ${sign}${zoneDelta} (now ${afterCount}).`);
			}
		}
	}

	return lines;
}

function setVersionLabel() {
	const label = document.getElementById('app-version');
	if (!label) return;
	label.textContent = `Version ${APP_VERSION}`;
}

function sanitizeQuestCardsInPlayerZones(rawState) {
	const state = JSON.parse(JSON.stringify(rawState));
	const generalQuestIds = new Set(
		QUESTS.filter(q => q.questType === 'GENERAL').map(q => q.id)
	);

	let changed = false;
	const movedToSharedDiscard = [];

	for (const player of Object.values(state.players || {})) {
		// Firebase RTDB strips null array values, converting piecieSlots to an object
		// with integer keys. Re-hydrate to a proper 4-element array before any engine
		// function touches it, so no cards are silently lost from the field.
		if (player.piecieSlots && !Array.isArray(player.piecieSlots)) {
			player.piecieSlots = Array.from({ length: 4 }, (_, i) => player.piecieSlots[i] ?? null);
		} else if (!player.piecieSlots) {
			player.piecieSlots = [null, null, null, null];
		}

		for (const zoneName of ['hand', 'deck', 'discard']) {
			const zone = Array.isArray(player[zoneName]) ? player[zoneName] : [];
			const kept = [];

			for (const cardRef of zone) {
				const cardId = cardRef?.cardId;
				const isQuest = cardRef?.type === 'QUEST';
				if (isQuest && cardId && generalQuestIds.has(cardId)) {
					movedToSharedDiscard.push({ cardId, type: 'QUEST' });
					changed = true;
					continue;
				}
				kept.push(cardRef);
			}

			player[zoneName] = kept;
		}
	}

	if (movedToSharedDiscard.length > 0) {
		if (!Array.isArray(state.sharedGeneralQuestDiscard)) state.sharedGeneralQuestDiscard = [];
		state.sharedGeneralQuestDiscard.unshift(...movedToSharedDiscard);
		console.log(`[UI] Sanitized ${movedToSharedDiscard.length} legacy GENERAL quest card(s) from player zones`);
	}

	return { state, changed };
}
